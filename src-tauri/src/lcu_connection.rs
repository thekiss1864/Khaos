//! Connection layer for the two local APIs Khaos talks to:
//!
//! * **League Client (LCU)** – `LeagueClientUx`, the API behind `/lol-*` endpoints.
//! * **Riot Client** – `RiotClientServices`, the API behind `/chat/*`, `/riotclient/*`
//!   endpoints such as `/chat/v1/suspend`. These are *not* served by the LCU port.
//!
//! Credentials are discovered in this order:
//! 1. The running `LeagueClientUx` process command line (`--app-port`,
//!    `--remoting-auth-token`, `--riotclient-app-port`, `--riotclient-auth-token`,
//!    `--install-directory`). This works no matter which drive League is installed on.
//! 2. The `lockfile` in the League install directory (found from the process path,
//!    Riot's product metadata, the registry, or common install paths).
//! 3. For the Riot Client, its own lockfile under the user's local app data.
//!
//! Credentials are cached and re-discovered automatically when the client restarts.

use base64::{engine::general_purpose, Engine as _};
use lazy_static::lazy_static;
use serde::{Deserialize, Serialize};
use serde_json::Value;
use std::path::{Path, PathBuf};
use std::sync::Mutex;
use std::time::Duration;
use sysinfo::{ProcessRefreshKind, ProcessesToUpdate, System, UpdateKind};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct LcuCredentials {
    pub port: u16,
    pub token: String,
}

impl LcuCredentials {
    pub fn base_url(&self) -> String {
        format!("https://127.0.0.1:{}", self.port)
    }

    pub fn auth_header(&self) -> String {
        let credentials = format!("riot:{}", self.token);
        format!(
            "Basic {}",
            general_purpose::STANDARD.encode(credentials.as_bytes())
        )
    }
}

/// Which local API a request goes to.
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum Target {
    League,
    RiotClient,
}

impl Target {
    pub fn from_str(value: Option<&str>) -> Target {
        match value.map(|v| v.to_ascii_lowercase()) {
            Some(v) if v == "riot" || v == "riotclient" || v == "riot-client" => Target::RiotClient,
            _ => Target::League,
        }
    }
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct LcuResponse {
    pub success: bool,
    pub message: String,
    pub data: Option<Value>,
    /// HTTP status code returned by the client, when a request was made.
    #[serde(skip_serializing_if = "Option::is_none")]
    pub status: Option<u16>,
}

impl LcuResponse {
    pub fn ok(message: impl Into<String>, data: Option<Value>) -> Self {
        LcuResponse {
            success: true,
            message: message.into(),
            data,
            status: None,
        }
    }

    pub fn fail(message: impl Into<String>) -> Self {
        LcuResponse {
            success: false,
            message: message.into(),
            data: None,
            status: None,
        }
    }
}

#[derive(Debug, Clone, Default)]
struct ClientInfo {
    league: Option<LcuCredentials>,
    riot: Option<LcuCredentials>,
    install_dir: Option<PathBuf>,
    /// A `LeagueClientUx` process is running.
    ux_running: bool,
    /// Its command line could be read (fails when League runs with higher privileges).
    ux_args_read: bool,
    /// Existing folders that were checked for a lockfile, for error messages.
    checked_dirs: Vec<PathBuf>,
}

lazy_static! {
    static ref CLIENT_CACHE: Mutex<Option<ClientInfo>> = Mutex::new(None);
    static ref HTTP: reqwest::Client = reqwest::Client::builder()
        // Both local APIs use a self-signed certificate. Requests only ever go to 127.0.0.1.
        .danger_accept_invalid_certs(true)
        .timeout(Duration::from_secs(15))
        .build()
        .expect("failed to build HTTP client");
}

const LEAGUE_UX_PROCESS_NAMES: &[&str] = &["leagueclientux.exe", "leagueclientux"];
const LEAGUE_PROCESS_NAMES: &[&str] = &["leagueclient.exe", "leagueclient"];

fn arg_value(args: &[String], key: &str) -> Option<String> {
    let prefix = format!("{}=", key);
    args.iter()
        .find_map(|a| a.trim_matches('"').strip_prefix(&prefix).map(|v| v.trim_matches('"').to_string()))
        .filter(|v| !v.is_empty())
}

/// Reads `--key=value` from a raw Windows command line string.
fn arg_from_cmdline(cmdline: &str, key: &str) -> Option<String> {
    let needle = format!("{}=", key);
    let start = cmdline.find(&needle)?;
    let quoted = start > 0 && cmdline.as_bytes()[start - 1] == b'"';
    let rest = &cmdline[start + needle.len()..];
    let end = if quoted {
        rest.find('"').unwrap_or(rest.len())
    } else {
        rest.find(|c: char| c.is_whitespace() || c == '"').unwrap_or(rest.len())
    };
    let value = rest[..end].trim();
    if value.is_empty() {
        None
    } else {
        Some(value.to_string())
    }
}

/// Fallback for when the process can't be inspected directly: ask WMI for the
/// League client's command line. Only runs when a client is known to be running.
#[cfg(windows)]
fn league_cmdline_from_wmi() -> Option<(String, Option<String>)> {
    use std::os::windows::process::CommandExt;
    const CREATE_NO_WINDOW: u32 = 0x0800_0000;
    let output = std::process::Command::new("powershell")
        .args([
            "-NoProfile",
            "-NonInteractive",
            "-Command",
            "Get-CimInstance Win32_Process -Filter \"Name='LeagueClientUx.exe'\" | Select-Object CommandLine,ExecutablePath | ConvertTo-Json -Compress",
        ])
        .creation_flags(CREATE_NO_WINDOW)
        .output()
        .ok()?;
    let json: Value = serde_json::from_slice(&output.stdout).ok()?;
    let entries = match json {
        Value::Array(list) => list,
        other => vec![other],
    };
    entries.into_iter().find_map(|e| {
        let cmdline = e["CommandLine"].as_str()?.to_string();
        Some((cmdline, e["ExecutablePath"].as_str().map(str::to_string)))
    })
}

#[cfg(not(windows))]
fn league_cmdline_from_wmi() -> Option<(String, Option<String>)> {
    None
}

/// League install folders known to the Riot Client (`associated_client` in RiotClientInstalls.json).
fn install_dirs_from_riot_client_installs() -> Vec<PathBuf> {
    let mut files: Vec<PathBuf> = Vec::new();
    if let Ok(program_data) = std::env::var("PROGRAMDATA") {
        files.push(PathBuf::from(program_data).join("Riot Games/RiotClientInstalls.json"));
    }
    files.push(PathBuf::from("/Users/Shared/Riot Games/RiotClientInstalls.json"));

    let mut dirs = Vec::new();
    for file in files {
        let Ok(content) = std::fs::read_to_string(&file) else {
            continue;
        };
        let Ok(json) = serde_json::from_str::<Value>(&content) else {
            continue;
        };
        if let Some(map) = json["associated_client"].as_object() {
            for key in map.keys() {
                let lower = key.to_ascii_lowercase();
                if lower.contains("league") {
                    dirs.push(PathBuf::from(key.trim_end_matches(['/', '\\'])));
                }
            }
        }
    }
    dirs
}

fn parse_lockfile(path: &Path) -> Option<LcuCredentials> {
    // Format: <name>:<pid>:<port>:<password>:<protocol>
    let content = std::fs::read_to_string(path).ok()?;
    let parts: Vec<&str> = content.trim().split(':').collect();
    if parts.len() < 5 {
        return None;
    }
    let port = parts[2].parse::<u16>().ok()?;
    Some(LcuCredentials {
        port,
        token: parts[3].to_string(),
    })
}

/// Reads `product_install_full_path` from Riot's product metadata (Windows and macOS).
fn install_dir_from_product_settings() -> Option<PathBuf> {
    let mut candidates: Vec<PathBuf> = Vec::new();
    if let Ok(program_data) = std::env::var("PROGRAMDATA") {
        candidates.push(
            PathBuf::from(program_data)
                .join("Riot Games/Metadata/league_of_legends.live/league_of_legends.live.product_settings.yaml"),
        );
    }
    candidates.push(PathBuf::from(
        "/Users/Shared/Riot Games/Metadata/league_of_legends.live/league_of_legends.live.product_settings.yaml",
    ));

    for file in candidates {
        let Ok(content) = std::fs::read_to_string(&file) else {
            continue;
        };
        for line in content.lines() {
            let line = line.trim();
            if let Some(rest) = line.strip_prefix("product_install_full_path:") {
                let dir = PathBuf::from(rest.trim().trim_matches('"').trim_matches('\''));
                if dir.exists() {
                    return Some(dir);
                }
            }
        }
    }
    None
}

#[cfg(windows)]
fn install_dir_from_registry() -> Option<PathBuf> {
    use winreg::enums::{HKEY_CURRENT_USER, HKEY_LOCAL_MACHINE};
    use winreg::RegKey;

    let keys = [
        (HKEY_CURRENT_USER, r"Software\Microsoft\Windows\CurrentVersion\Uninstall\Riot Game league_of_legends.live", "InstallLocation"),
        (HKEY_LOCAL_MACHINE, r"SOFTWARE\Riot Games, Inc\League of Legends", "InstallPath"),
        (HKEY_CURRENT_USER, r"SOFTWARE\Riot Games, Inc\League of Legends", "InstallPath"),
        (HKEY_LOCAL_MACHINE, r"SOFTWARE\WOW6432Node\Riot Games, Inc\League of Legends", "InstallPath"),
    ];
    for (root, path, value) in keys {
        if let Ok(key) = RegKey::predef(root).open_subkey(path) {
            if let Ok(dir) = key.get_value::<String, _>(value) {
                let dir = PathBuf::from(dir);
                if dir.exists() {
                    return Some(dir);
                }
            }
        }
    }
    None
}

#[cfg(not(windows))]
fn install_dir_from_registry() -> Option<PathBuf> {
    None
}

fn common_install_dirs() -> Vec<PathBuf> {
    let mut dirs: Vec<PathBuf> = Vec::new();
    if cfg!(windows) {
        for drive in ["C", "D", "E", "F"] {
            dirs.push(PathBuf::from(format!("{}:\\Riot Games\\League of Legends", drive)));
        }
        dirs.push(PathBuf::from("C:\\Program Files\\Riot Games\\League of Legends"));
        dirs.push(PathBuf::from("C:\\Program Files (x86)\\Riot Games\\League of Legends"));
    } else {
        dirs.push(PathBuf::from("/Applications/League of Legends.app/Contents/LoL"));
        if let Ok(home) = std::env::var("HOME") {
            dirs.push(PathBuf::from(home).join("Applications/League of Legends.app/Contents/LoL"));
        }
    }
    dirs
}

fn riot_client_lockfile() -> Option<PathBuf> {
    if let Ok(local) = std::env::var("LOCALAPPDATA") {
        return Some(PathBuf::from(local).join("Riot Games/Riot Client/Config/lockfile"));
    }
    if let Ok(home) = std::env::var("HOME") {
        return Some(
            PathBuf::from(home).join("Library/Application Support/Riot Games/Riot Client/Config/lockfile"),
        );
    }
    None
}

fn discover() -> ClientInfo {
    let mut info = ClientInfo::default();

    let mut system = System::new();
    system.refresh_processes_specifics(
        ProcessesToUpdate::All,
        true,
        ProcessRefreshKind::nothing()
            .with_cmd(UpdateKind::OnlyIfNotSet)
            .with_exe(UpdateKind::OnlyIfNotSet),
    );

    let mut process_dir: Option<PathBuf> = None;
    for process in system.processes().values() {
        let name = process.name().to_string_lossy().to_ascii_lowercase();
        let is_ux = LEAGUE_UX_PROCESS_NAMES.contains(&name.as_str());
        let is_launcher = LEAGUE_PROCESS_NAMES.contains(&name.as_str());
        if !is_ux && !is_launcher {
            continue;
        }

        if is_ux {
            info.ux_running = true;
            let args: Vec<String> = process
                .cmd()
                .iter()
                .map(|a| a.to_string_lossy().into_owned())
                .collect();

            if args.len() > 1 {
                info.ux_args_read = true;
            }
            if info.league.is_none() {
                if let (Some(port), Some(token)) = (
                    arg_value(&args, "--app-port").and_then(|p| p.parse::<u16>().ok()),
                    arg_value(&args, "--remoting-auth-token"),
                ) {
                    info.league = Some(LcuCredentials { port, token });
                }
            }
            if info.riot.is_none() {
                if let (Some(port), Some(token)) = (
                    arg_value(&args, "--riotclient-app-port").and_then(|p| p.parse::<u16>().ok()),
                    arg_value(&args, "--riotclient-auth-token"),
                ) {
                    info.riot = Some(LcuCredentials { port, token });
                }
            }
            if info.install_dir.is_none() {
                info.install_dir = arg_value(&args, "--install-directory").map(PathBuf::from);
            }
        }

        if process_dir.is_none() {
            process_dir = process.exe().and_then(|p| p.parent()).map(Path::to_path_buf);
        }
    }

    // The process exists but couldn't be inspected: try WMI before falling back to files.
    if info.ux_running && info.league.is_none() {
        if let Some((cmdline, exe)) = league_cmdline_from_wmi() {
            info.ux_args_read = true;
            if let (Some(port), Some(token)) = (
                arg_from_cmdline(&cmdline, "--app-port").and_then(|p| p.parse::<u16>().ok()),
                arg_from_cmdline(&cmdline, "--remoting-auth-token"),
            ) {
                info.league = Some(LcuCredentials { port, token });
            }
            if info.riot.is_none() {
                if let (Some(port), Some(token)) = (
                    arg_from_cmdline(&cmdline, "--riotclient-app-port").and_then(|p| p.parse::<u16>().ok()),
                    arg_from_cmdline(&cmdline, "--riotclient-auth-token"),
                ) {
                    info.riot = Some(LcuCredentials { port, token });
                }
            }
            if info.install_dir.is_none() {
                info.install_dir = arg_from_cmdline(&cmdline, "--install-directory").map(PathBuf::from);
            }
            if process_dir.is_none() {
                process_dir = exe.as_deref().map(Path::new).and_then(Path::parent).map(Path::to_path_buf);
            }
        }
    }

    // Install directory: process args > process path > Riot metadata > registry > common paths.
    if info.install_dir.is_none() {
        let mut candidates: Vec<PathBuf> = Vec::new();
        if let Some(dir) = process_dir {
            // On macOS the UX binary lives inside nested .app bundles; walk up to find the lockfile.
            let mut current = Some(dir.as_path());
            while let Some(d) = current {
                candidates.push(d.to_path_buf());
                current = d.parent();
            }
        }
        candidates.extend(install_dir_from_product_settings());
        candidates.extend(install_dirs_from_riot_client_installs());
        candidates.extend(install_dir_from_registry());
        candidates.extend(common_install_dirs());

        let mut seen: Vec<PathBuf> = Vec::new();
        for d in &candidates {
            if d.is_dir() && !seen.contains(d) && d.parent().is_some() {
                seen.push(d.clone());
            }
        }
        info.checked_dirs = seen;

        info.install_dir = candidates
            .iter()
            .find(|d| d.join("lockfile").exists())
            .or_else(|| {
                candidates
                    .iter()
                    .find(|d| d.join("LeagueClient.exe").exists() || d.join("Config").exists())
            })
            .cloned();
    }

    if info.league.is_none() {
        info.league = info
            .install_dir
            .as_ref()
            .and_then(|dir| parse_lockfile(&dir.join("lockfile")));
    }

    if info.riot.is_none() {
        info.riot = riot_client_lockfile().and_then(|p| parse_lockfile(&p));
    }

    info
}

fn cached_info(force_refresh: bool) -> ClientInfo {
    let mut cache = CLIENT_CACHE.lock().unwrap_or_else(|e| e.into_inner());
    let needs_refresh = force_refresh
        || cache
            .as_ref()
            .map(|c| c.league.is_none())
            .unwrap_or(true);
    if needs_refresh {
        *cache = Some(discover());
    }
    cache.clone().unwrap_or_default()
}

fn invalidate_cache() {
    let mut cache = CLIENT_CACHE.lock().unwrap_or_else(|e| e.into_inner());
    *cache = None;
}

fn credentials_for(target: Target, force_refresh: bool) -> Result<LcuCredentials, String> {
    let info = cached_info(force_refresh);
    match target {
        Target::League => info.league.clone().ok_or_else(|| league_not_found_message(&info)),
        Target::RiotClient => info.riot.ok_or_else(|| {
            "Riot Client not found. Start League of Legends through the Riot Client, then try again."
                .to_string()
        }),
    }
}

fn league_not_found_message(info: &ClientInfo) -> String {
    let checked = if info.checked_dirs.is_empty() {
        "no League folder found".to_string()
    } else {
        info.checked_dirs
            .iter()
            .map(|d| d.to_string_lossy().into_owned())
            .collect::<Vec<_>>()
            .join("; ")
    };
    if !info.ux_running {
        format!(
            "League client is not running. Start League of Legends and log in, then try again. (No LeagueClientUx process found; looked for a lockfile in: {})",
            checked
        )
    } else if !info.ux_args_read {
        format!(
            "League is running, but Windows won't let Khaos read its connection details. This happens when League or the Riot Client runs as administrator: close Khaos and start it with \"Run as administrator\". (Looked for a lockfile in: {})",
            checked
        )
    } else {
        format!(
            "League is running but hasn't opened its API yet. Wait until you're fully logged in, then try again. (Looked for a lockfile in: {})",
            checked
        )
    }
}

/// League install directory (the folder that contains `LeagueClient.exe` and `Config/`).
pub fn league_install_dir() -> Option<PathBuf> {
    let info = cached_info(false);
    info.install_dir.or_else(|| {
        install_dir_from_product_settings()
            .or_else(install_dir_from_registry)
            .or_else(|| {
                common_install_dirs()
                    .into_iter()
                    .find(|d| d.join("Config").exists())
            })
    })
}

/// Path to `Config/PersistedSettings.json` in the League install directory.
pub fn persisted_settings_path() -> Option<PathBuf> {
    league_install_dir().map(|dir| dir.join("Config").join("PersistedSettings.json"))
}

/// Path to `RiotClientServices` from Riot's `RiotClientInstalls.json`.
pub fn riot_client_services_path() -> Option<PathBuf> {
    let mut files: Vec<PathBuf> = Vec::new();
    if let Ok(program_data) = std::env::var("PROGRAMDATA") {
        files.push(PathBuf::from(program_data).join("Riot Games/RiotClientInstalls.json"));
    }
    files.push(PathBuf::from("/Users/Shared/Riot Games/RiotClientInstalls.json"));

    for file in files {
        let Ok(content) = std::fs::read_to_string(&file) else {
            continue;
        };
        let Ok(json) = serde_json::from_str::<Value>(&content) else {
            continue;
        };
        for key in ["rc_default", "rc_live"] {
            if let Some(path) = json[key].as_str() {
                let mut path = PathBuf::from(path);
                // On macOS this points at "Riot Client.app".
                if path.extension().map(|e| e == "app").unwrap_or(false) {
                    path = path.join("Contents/MacOS/RiotClientServices");
                }
                if path.exists() {
                    return Some(path);
                }
            }
        }
    }

    if cfg!(windows) {
        for drive in ["C", "D", "E", "F"] {
            let p = PathBuf::from(format!("{}:\\Riot Games\\Riot Client\\RiotClientServices.exe", drive));
            if p.exists() {
                return Some(p);
            }
        }
    }
    None
}

async fn send(
    credentials: &LcuCredentials,
    method: &str,
    endpoint: &str,
    body: Option<&Value>,
) -> Result<reqwest::Response, reqwest::Error> {
    let endpoint = if endpoint.starts_with('/') {
        endpoint.to_string()
    } else {
        format!("/{}", endpoint)
    };
    let url = format!("{}{}", credentials.base_url(), endpoint);
    let method = reqwest::Method::from_bytes(method.to_uppercase().as_bytes())
        .unwrap_or(reqwest::Method::GET);

    let mut request = HTTP
        .request(method, &url)
        .header("Authorization", credentials.auth_header())
        .header("Accept", "application/json");

    if let Some(json_body) = body {
        request = request.json(json_body);
    }

    request.send().await
}

/// Make a request to the League Client or Riot Client API.
///
/// Returns `Err` only when the client cannot be reached. HTTP errors come back as
/// `Ok(LcuResponse { success: false, status: Some(code), .. })`.
pub async fn request(
    target: Target,
    method: &str,
    endpoint: &str,
    body: Option<Value>,
) -> Result<LcuResponse, String> {
    let mut credentials = credentials_for(target, false)?;

    let mut response = send(&credentials, method, endpoint, body.as_ref()).await;

    // Client restarted (new port) or token rotated: re-discover once and retry.
    let stale = match &response {
        Err(e) => e.is_connect() || e.is_timeout(),
        Ok(r) => r.status() == reqwest::StatusCode::UNAUTHORIZED,
    };
    if stale {
        invalidate_cache();
        credentials = credentials_for(target, true)?;
        response = send(&credentials, method, endpoint, body.as_ref()).await;
    }

    let response = response.map_err(|e| {
        invalidate_cache();
        format!("Could not reach the client: {}", e)
    })?;

    let status = response.status();
    let text = response.text().await.unwrap_or_default();
    let data = if text.is_empty() {
        None
    } else {
        serde_json::from_str::<Value>(&text).ok()
    };

    if status.is_success() {
        Ok(LcuResponse {
            success: true,
            message: "Request successful".to_string(),
            data,
            status: Some(status.as_u16()),
        })
    } else {
        let detail = data
            .as_ref()
            .and_then(|d| d["message"].as_str())
            .map(str::to_string)
            .unwrap_or(text);
        Ok(LcuResponse {
            success: false,
            message: format!("Request failed with status {}: {}", status, detail),
            data,
            status: Some(status.as_u16()),
        })
    }
}

/// League Client request.
pub async fn lcu(method: &str, endpoint: &str, body: Option<Value>) -> Result<LcuResponse, String> {
    request(Target::League, method, endpoint, body).await
}

/// League Client request that turns HTTP errors into `Err`, for chaining steps.
pub async fn lcu_ok(method: &str, endpoint: &str, body: Option<Value>) -> Result<Value, String> {
    let response = lcu(method, endpoint, body).await?;
    if response.success {
        Ok(response.data.unwrap_or(Value::Null))
    } else {
        Err(response.message)
    }
}

/// Riot Client request.
pub async fn riot(method: &str, endpoint: &str, body: Option<Value>) -> Result<LcuResponse, String> {
    request(Target::RiotClient, method, endpoint, body).await
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn parses_process_arguments() {
        let args = vec![
            "LeagueClientUx.exe".to_string(),
            "--riotclient-auth-token=abc-123".to_string(),
            "--riotclient-app-port=50123".to_string(),
            "--remoting-auth-token=XyZ_9".to_string(),
            "--app-port=61234".to_string(),
            "\"--install-directory=D:\\Games\\League of Legends\"".to_string(),
        ];
        assert_eq!(arg_value(&args, "--app-port").as_deref(), Some("61234"));
        assert_eq!(arg_value(&args, "--remoting-auth-token").as_deref(), Some("XyZ_9"));
        assert_eq!(arg_value(&args, "--riotclient-app-port").as_deref(), Some("50123"));
        assert_eq!(arg_value(&args, "--riotclient-auth-token").as_deref(), Some("abc-123"));
        assert_eq!(
            arg_value(&args, "--install-directory").as_deref(),
            Some("D:\\Games\\League of Legends")
        );
        assert_eq!(arg_value(&args, "--missing"), None);
    }

    #[test]
    fn parses_lockfile() {
        let dir = std::env::temp_dir().join(format!("khaos-lockfile-test-{}", std::process::id()));
        std::fs::create_dir_all(&dir).unwrap();
        let file = dir.join("lockfile");
        std::fs::write(&file, "LeagueClient:1234:61234:s3cr3t:https").unwrap();
        let creds = parse_lockfile(&file).unwrap();
        assert_eq!(creds.port, 61234);
        assert_eq!(creds.token, "s3cr3t");
        assert_eq!(creds.auth_header(), format!("Basic {}", general_purpose::STANDARD.encode("riot:s3cr3t")));
        std::fs::remove_dir_all(&dir).ok();
    }

    #[test]
    fn parses_raw_command_line() {
        let cmdline = r#""C:/Riot Games/League of Legends/LeagueClientUx.exe" "--riotclient-auth-token=abc-123" "--riotclient-app-port=50123" "--remoting-auth-token=XyZ_9" "--app-port=61234" "--install-directory=D:/Games/League of Legends" --no-rads"#;
        assert_eq!(arg_from_cmdline(cmdline, "--app-port").as_deref(), Some("61234"));
        assert_eq!(arg_from_cmdline(cmdline, "--remoting-auth-token").as_deref(), Some("XyZ_9"));
        assert_eq!(arg_from_cmdline(cmdline, "--riotclient-app-port").as_deref(), Some("50123"));
        assert_eq!(
            arg_from_cmdline(cmdline, "--install-directory").as_deref(),
            Some("D:/Games/League of Legends")
        );
        let unquoted = "LeagueClientUx.exe --app-port=5000 --remoting-auth-token=t0k";
        assert_eq!(arg_from_cmdline(unquoted, "--app-port").as_deref(), Some("5000"));
        assert_eq!(arg_from_cmdline(unquoted, "--remoting-auth-token").as_deref(), Some("t0k"));
        assert_eq!(arg_from_cmdline(unquoted, "--missing"), None);
    }

    #[test]
    fn not_found_message_explains_cause() {
        let info = ClientInfo { ux_running: true, ux_args_read: false, ..Default::default() };
        assert!(league_not_found_message(&info).contains("administrator"));
        let info = ClientInfo::default();
        assert!(league_not_found_message(&info).contains("not running"));
    }

    #[test]
    fn target_parsing() {
        assert_eq!(Target::from_str(Some("riot")), Target::RiotClient);
        assert_eq!(Target::from_str(Some("League")), Target::League);
        assert_eq!(Target::from_str(None), Target::League);
    }
}
