use base64::{engine::general_purpose, Engine as _};
use serde::{Deserialize, Serialize};
use std::env;
use std::fs;
use std::path::Path;
use winreg::enums::*;
use winreg::RegKey;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct LcuCredentials {
    pub port: u16,
    pub token: String,
    pub protocol: String,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct LcuResponse {
    pub success: bool,
    pub message: String,
    pub data: Option<serde_json::Value>,
}

impl LcuCredentials {
    /// Find and parse LCU credentials from the lockfile
    pub fn from_lockfile() -> Result<Self, String> {
        // Try to find the lockfile in common locations
        let lockfile_paths = vec![
            "C:\\Riot Games\\League of Legends\\lockfile",
            "C:\\Program Files\\Riot Games\\League of Legends\\lockfile",
            "C:\\Program Files (x86)\\Riot Games\\League of Legends\\lockfile",
        ];

        for path in lockfile_paths {
            if Path::new(path).exists() {
                return Self::parse_lockfile(path);
            }
        }

        Err("League of Legends lockfile not found. Make sure the client is running.".to_string())
    }

    /// Parse the lockfile to extract credentials
    fn parse_lockfile(path: &str) -> Result<Self, String> {
        let content =
            fs::read_to_string(path).map_err(|e| format!("Failed to read lockfile: {}", e))?;

        // Lockfile format: LeagueClient:PID:PORT:TOKEN:PROTOCOL
        let parts: Vec<&str> = content.split(':').collect();

        if parts.len() != 5 {
            return Err("Invalid lockfile format".to_string());
        }

        let port = parts[2]
            .parse::<u16>()
            .map_err(|_| "Invalid port in lockfile".to_string())?;

        Ok(LcuCredentials {
            port,
            token: parts[3].to_string(),
            protocol: parts[4].to_string(),
        })
    }

    /// Get the base URL for LCU API
    pub fn base_url(&self) -> String {
        format!("https://127.0.0.1:{}", self.port)
    }

    /// Get the authorization header value
    pub fn auth_header(&self) -> String {
        let credentials = format!("riot:{}", self.token);
        format!(
            "Basic {}",
            general_purpose::STANDARD.encode(credentials.as_bytes())
        )
    }

    /// Discover LCU credentials.
    ///
    /// Since the 2025 client, Riot no longer writes the `lockfile` to the
    /// install directory; credentials are only exposed as command-line
    /// arguments of `LeagueClientUx.exe`. Try those first, then fall back to
    /// the legacy lockfile for older clients.
    pub fn discover() -> Result<Self, String> {
        match Self::from_ux_process() {
            Ok(creds) => Ok(creds),
            Err(ux_err) => match Self::from_lockfile() {
                Ok(creds) => Ok(creds),
                Err(lockfile_err) => Err(format!(
                    "Could not find the League client ({}; legacy lockfile lookup: {})",
                    ux_err, lockfile_err
                )),
            },
        }
    }

    /// Read LCU credentials from the command line of the running
    /// `LeagueClientUx.exe` process (works even when the client runs elevated,
    /// because WMI serves the data, not the calling process).
    fn from_ux_process() -> Result<Self, String> {
        #[derive(Deserialize)]
        struct UxProcess {
            #[serde(rename = "CommandLine")]
            command_line: Option<String>,
        }

        let conn = wmi::WMIConnection::new()
            .map_err(|e| format!("WMI connection failed: {}", e))?;
        let procs: Vec<UxProcess> = conn
            .raw_query(
                "SELECT CommandLine FROM Win32_Process WHERE Name = 'LeagueClientUx.exe'",
            )
            .map_err(|e| format!("WMI query failed: {}", e))?;

        for proc in procs {
            if let Some(cmd) = proc.command_line {
                if let (Some(port), Some(token)) = (
                    extract_arg_value(&cmd, "app-port"),
                    extract_arg_value(&cmd, "remoting-auth-token"),
                ) {
                    if let Ok(port) = port.parse::<u16>() {
                        if !token.is_empty() {
                            return Ok(LcuCredentials {
                                port,
                                token,
                                protocol: "https".to_string(),
                            });
                        }
                    }
                }
            }
        }

        Err(
            "LeagueClientUx.exe with --app-port/--remoting-auth-token not found. Make sure the League client is running"
                .to_string(),
        )
    }
}

/// Extract the value of `--<arg_name>=<value>` from a Windows command line.
/// Values end at the next quote or whitespace (args arrive quoted by WMI).
fn extract_arg_value(cmd: &str, arg_name: &str) -> Option<String> {
    let needle = format!("--{}=", arg_name);
    let pos = cmd.find(&needle)?;
    let value = &cmd[pos + needle.len()..];
    let end = value
        .find(['"', ' ', '\t'])
        .unwrap_or(value.len());
    Some(value[..end].to_string())
}

/// Dynamically find the League of Legends client executable path
pub fn find_league_client_path() -> Option<String> {
    if let Some(install_dir) = find_league_install_dir() {
        let client_path = format!("{}LeagueClient.exe", install_dir);
        if std::path::Path::new(&client_path).exists() {
            return Some(client_path);
        }
    }

    // Additional manual path checks
    let possible_paths = vec![
        "C:\\Riot Games\\League of Legends\\LeagueClient.exe",
        "C:\\Program Files\\Riot Games\\League of Legends\\LeagueClient.exe",
        "C:\\Program Files (x86)\\Riot Games\\League of Legends\\LeagueClient.exe",
        "D:\\Riot Games\\League of Legends\\LeagueClient.exe",
    ];

    for path in possible_paths {
        if std::path::Path::new(path).exists() {
            return Some(path.to_string());
        }
    }

    // Check user profile directory for potential custom installations
    if let Ok(user_profile) = env::var("USERPROFILE") {
        let custom_paths = vec![
            format!(
                "{}\\Games\\Riot Games\\League of Legends\\LeagueClient.exe",
                user_profile
            ),
            format!(
                "{}\\Documents\\League of Legends\\LeagueClient.exe",
                user_profile
            ),
        ];

        for path in custom_paths {
            if std::path::Path::new(&path).exists() {
                return Some(path);
            }
        }
    }

    None
}

/// Dynamically find the League of Legends installation directory
pub fn find_league_install_dir() -> Option<String> {
    // Check potential registry locations
    let registry_paths = vec![
        (
            HKEY_LOCAL_MACHINE,
            r"SOFTWARE\Riot Games, Inc\League of Legends",
        ),
        (
            HKEY_CURRENT_USER,
            r"SOFTWARE\Riot Games, Inc\League of Legends",
        ),
        (
            HKEY_LOCAL_MACHINE,
            r"SOFTWARE\WOW6432Node\Riot Games, Inc\League of Legends",
        ),
    ];

    for (root, path) in registry_paths {
        if let Ok(key) = RegKey::predef(root).open_subkey(path) {
            if let Ok(install_path) = key.get_value::<String, _>("InstallPath") {
                if std::path::Path::new(&install_path).exists() {
                    return Some(install_path);
                }
            }
        }
    }

    // Additional manual path checks for the directory
    let possible_dirs = vec![
        "C:\\Riot Games\\League of Legends\\",
        "C:\\Program Files\\Riot Games\\League of Legends\\",
        "C:\\Program Files (x86)\\Riot Games\\League of Legends\\",
        "D:\\Riot Games\\League of Legends\\",
    ];

    for dir in possible_dirs {
        if std::path::Path::new(dir).exists() {
            return Some(dir.to_string());
        }
    }

    // Check user profile directory for potential custom installations
    if let Ok(user_profile) = env::var("USERPROFILE") {
        let custom_dirs = vec![
            format!("{}\\Games\\Riot Games\\League of Legends\\", user_profile),
            format!("{}\\Documents\\League of Legends\\", user_profile),
        ];

        for dir in custom_dirs {
            if std::path::Path::new(&dir).exists() {
                return Some(dir);
            }
        }
    }

    None
}

/// Get the path to PersistedSettings.json
pub fn get_persisted_settings_path() -> Option<String> {
    find_league_install_dir()
        .map(|install_dir| format!("{}Config\\PersistedSettings.json", install_dir))
}

/// Make a request to the LCU API
pub async fn make_lcu_request(
    credentials: &LcuCredentials,
    method: &str,
    endpoint: &str,
    body: Option<serde_json::Value>,
) -> Result<LcuResponse, String> {
    // Build the client with TLS certificate verification disabled (LCU uses self-signed certs)
    let client = reqwest::Client::builder()
        .danger_accept_invalid_certs(true)
        .build()
        .map_err(|e| format!("Failed to create HTTP client: {}", e))?;

    let url = format!("{}{}", credentials.base_url(), endpoint);

    let mut request = match method.to_uppercase().as_str() {
        "GET" => client.get(&url),
        "POST" => client.post(&url),
        "PUT" => client.put(&url),
        "PATCH" => client.patch(&url),
        "DELETE" => client.delete(&url),
        _ => return Err(format!("Unsupported HTTP method: {}", method)),
    };

    request = request.header("Authorization", credentials.auth_header());

    if let Some(json_body) = body {
        request = request.json(&json_body);
    }

    let response = request
        .send()
        .await
        .map_err(|e| format!("Request failed: {}", e))?;

    let status = response.status();
    let response_text = response.text().await.unwrap_or_default();

    if status.is_success() {
        let data = if !response_text.is_empty() {
            serde_json::from_str(&response_text).ok()
        } else {
            None
        };

        Ok(LcuResponse {
            success: true,
            message: "Request successful".to_string(),
            data,
        })
    } else {
        Ok(LcuResponse {
            success: false,
            message: format!("Request failed with status {}: {}", status, response_text),
            data: None,
        })
    }
}

/// Get LCU endpoints mapping
pub fn get_endpoint(name: &str) -> Result<String, String> {
    match name {
        "lolChat" => Ok("/lol-chat/v1/me".to_string()),
        "profile" => Ok("/lol-summoner/v1/current-summoner/summoner-profile".to_string()),
        "chibiIcon" => Ok("/lol-chat/v1/me".to_string()),
        "lobby" => Ok("/lol-lobby/v2/lobby".to_string()),
        "summonerIcon" => Ok("/lol-summoner/v1/current-summoner/icon".to_string()),
        _ => Err(format!("Unknown endpoint: {}", name)),
    }
}
