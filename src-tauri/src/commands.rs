use crate::lcu_connection::{
    lcu, lcu_ok, league_install_dir, persisted_settings_path, riot, riot_client_services_path,
    LcuResponse,
};
use serde_json::{json, Value};

/// Example Tauri command that greets a user
#[tauri::command]
pub fn greet(name: &str) -> String {
    format!("Hello, {}! Welcome to Khaos.", name)
}

/// Check if LCU is connected
#[tauri::command]
pub async fn check_lcu_connection() -> Result<LcuResponse, String> {
    lcu("GET", "/lol-summoner/v1/current-summoner", None).await
}

/// Set custom status message
#[tauri::command]
pub async fn set_status_message(message: String) -> Result<LcuResponse, String> {
    lcu("PUT", "/lol-chat/v1/me", Some(json!({ "statusMessage": message }))).await
}

/// Set profile background by skin ID
#[tauri::command]
pub async fn set_profile_background(skin_id: i64) -> Result<LcuResponse, String> {
    lcu(
        "POST",
        "/lol-summoner/v1/current-summoner/summoner-profile",
        Some(json!({ "key": "backgroundSkinId", "value": skin_id })),
    )
    .await
}

/// Show any icon in chat / friends list (visual only, works for icons you don't own)
#[tauri::command]
pub async fn set_summoner_icon(icon_id: i64) -> Result<LcuResponse, String> {
    lcu("PUT", "/lol-chat/v1/me", Some(json!({ "icon": icon_id }))).await
}

/// Set chat rank display
#[tauri::command]
pub async fn set_chat_rank(
    queue: String,
    tier: String,
    division: String,
) -> Result<LcuResponse, String> {
    lcu(
        "PUT",
        "/lol-chat/v1/me",
        Some(json!({
            "lol": {
                "rankedLeagueQueue": queue,
                "rankedLeagueTier": tier,
                "rankedLeagueDivision": division,
            }
        })),
    )
    .await
}

/// Set the real profile icon (the "chibi" icons). Uses the summoner icon endpoint,
/// so the icon must be one the account can equip.
#[tauri::command]
pub async fn set_chibi_icon(profile_icon_id: i64) -> Result<LcuResponse, String> {
    lcu(
        "PUT",
        "/lol-summoner/v1/current-summoner/icon",
        Some(json!({ "profileIconId": profile_icon_id })),
    )
    .await
}

/// Create practice tool lobby
#[tauri::command]
pub async fn create_practice_lobby(lobby_name: String) -> Result<LcuResponse, String> {
    let name = if lobby_name.trim().is_empty() {
        "Practice Tool".to_string()
    } else {
        lobby_name
    };

    lcu(
        "POST",
        "/lol-lobby/v2/lobby",
        Some(json!({
            "customGameLobby": {
                "configuration": {
                    "gameMode": "PRACTICETOOL",
                    "gameMutator": "",
                    "gameServerRegion": "",
                    "mapId": 11,
                    "mutators": { "id": 1 },
                    "spectatorPolicy": "AllAllowed",
                    "teamSize": 5
                },
                "lobbyName": name,
                "lobbyPassword": ""
            },
            "isCustom": true
        })),
    )
    .await
}

/// Make a custom request. `target` is "league" (default) or "riot" for the Riot Client API.
#[tauri::command]
pub async fn custom_lcu_request(
    method: String,
    endpoint: String,
    body: Option<Value>,
    target: Option<String>,
) -> Result<LcuResponse, String> {
    let target = crate::lcu_connection::Target::from_str(target.as_deref());
    crate::lcu_connection::request(target, &method, &endpoint, body).await
}

/// Make a request to the Riot Client API (`/chat/*`, `/riotclient/*`, ...)
#[tauri::command]
pub async fn riot_client_request(
    method: String,
    endpoint: String,
    body: Option<Value>,
) -> Result<LcuResponse, String> {
    riot(&method, &endpoint, body).await
}

/// Set availability status
#[tauri::command]
pub async fn set_availability_status(status: String) -> Result<LcuResponse, String> {
    lcu("PUT", "/lol-chat/v1/me", Some(json!({ "availability": status }))).await
}

/// Appear offline
#[tauri::command]
pub async fn appear_offline() -> Result<LcuResponse, String> {
    set_availability_status("offline".to_string()).await
}

/// Appear online
#[tauri::command]
pub async fn appear_online() -> Result<LcuResponse, String> {
    set_availability_status("chat".to_string()).await
}

/// Disconnect from chat. This is a Riot Client endpoint, not an LCU one.
#[tauri::command]
pub async fn disconnect_chat() -> Result<LcuResponse, String> {
    riot("POST", "/chat/v1/suspend", Some(json!({ "config": "disable" }))).await
}

/// Reconnect to chat. This is a Riot Client endpoint, not an LCU one.
#[tauri::command]
pub async fn reconnect_chat() -> Result<LcuResponse, String> {
    riot("POST", "/chat/v1/resume", Some(json!({ "config": "enable" }))).await
}

/// Accept or decline the ready check
#[tauri::command]
pub async fn auto_accept(accept: bool) -> Result<LcuResponse, String> {
    let endpoint = if accept {
        "/lol-matchmaking/v1/ready-check/accept"
    } else {
        "/lol-matchmaking/v1/ready-check/decline"
    };
    lcu("POST", endpoint, None).await
}

fn local_action(session: &Value, action_type: &str) -> Option<Value> {
    let local_cell = session["localPlayerCellId"].as_i64()?;
    session["actions"]
        .as_array()?
        .iter()
        .filter_map(|group| group.as_array())
        .flatten()
        .find(|a| {
            a["actorCellId"].as_i64() == Some(local_cell)
                && a["type"].as_str() == Some(action_type)
                && a["completed"].as_bool() == Some(false)
                && a["isInProgress"].as_bool().unwrap_or(true)
        })
        .cloned()
}

async fn complete_action(action_type: &str, champion_id: i64) -> Result<LcuResponse, String> {
    let session = lcu_ok("GET", "/lol-champ-select/v1/session", None).await?;
    let action = local_action(&session, action_type).ok_or_else(|| {
        format!("It's not your {} turn yet", action_type)
    })?;
    let action_id = action["id"]
        .as_i64()
        .ok_or("Champion select action has no id")?;

    // Hover the champion, then lock it in.
    lcu_ok(
        "PATCH",
        &format!("/lol-champ-select/v1/session/actions/{}", action_id),
        Some(json!({ "championId": champion_id })),
    )
    .await?;

    let complete = lcu(
        "POST",
        &format!("/lol-champ-select/v1/session/actions/{}/complete", action_id),
        None,
    )
    .await?;
    if complete.success {
        return Ok(complete);
    }

    // Fallback used by older clients
    lcu(
        "PATCH",
        &format!("/lol-champ-select/v1/session/actions/{}", action_id),
        Some(json!({ "championId": champion_id, "completed": true })),
    )
    .await
}

/// Instalock a specific champion (only acts when it's your pick turn)
#[tauri::command]
pub async fn instalock(champion_id: i64) -> Result<LcuResponse, String> {
    complete_action("pick", champion_id).await
}

/// Ban a champion (only acts when it's your ban turn)
#[tauri::command]
pub async fn auto_ban_champion(champion_id: i64) -> Result<LcuResponse, String> {
    complete_action("ban", champion_id).await
}

/// Send a message to the champ select chat
#[tauri::command]
pub async fn send_instant_message(
    message: String,
    times: Option<i64>,
    delay: Option<i64>,
) -> Result<LcuResponse, String> {
    let times = times.unwrap_or(1).clamp(1, 10);
    let delay = delay.unwrap_or(0).max(0) as u64;

    // The champ select room shows up as a conversation of type "championSelect".
    let mut conversation_id: Option<String> = None;
    for _ in 0..10 {
        let conversations = lcu_ok("GET", "/lol-chat/v1/conversations", None).await?;
        conversation_id = conversations.as_array().and_then(|list| {
            list.iter()
                .find(|c| c["type"].as_str() == Some("championSelect"))
                .and_then(|c| c["id"].as_str())
                .map(str::to_string)
        });
        if conversation_id.is_some() {
            break;
        }
        // The chat room can take a moment to join after champ select starts.
        tokio::time::sleep(std::time::Duration::from_millis(500)).await;
    }
    let conversation_id = conversation_id.ok_or("Champion select chat not found")?;
    let endpoint = format!(
        "/lol-chat/v1/conversations/{}/messages",
        urlencoding_component(&conversation_id)
    );

    for i in 0..times {
        if i > 0 && delay > 0 {
            tokio::time::sleep(std::time::Duration::from_millis(delay)).await;
        }
        lcu_ok("POST", &endpoint, Some(json!({ "type": "chat", "body": message }))).await?;
    }

    Ok(LcuResponse::ok(format!("Sent message {} time(s)", times), None))
}

/// Mute all teammates in champ select (skips players who are already muted)
#[tauri::command]
pub async fn instant_mute_all() -> Result<LcuResponse, String> {
    let session = lcu_ok("GET", "/lol-champ-select/v1/session", None).await?;
    let local_cell = session["localPlayerCellId"].as_i64();
    let team = session["myTeam"].as_array().ok_or("No team data found")?;

    let already_muted: Vec<Value> = lcu_ok("GET", "/lol-champ-select/v1/muted-players", None)
        .await
        .ok()
        .and_then(|v| v.as_array().cloned())
        .unwrap_or_default();
    let is_muted = |player: &Value| {
        already_muted.iter().any(|m| {
            (!player["puuid"].as_str().unwrap_or("").is_empty() && m["puuid"] == player["puuid"])
                || (player["obfuscatedPuuid"].as_str().map(|s| !s.is_empty()).unwrap_or(false)
                    && m["obfuscatedPuuid"] == player["obfuscatedPuuid"])
        })
    };

    let mut muted = 0;
    for player in team {
        if player["cellId"].as_i64() == local_cell || is_muted(player) {
            continue;
        }
        let body = json!({
            "puuid": player["puuid"],
            "summonerId": player["summonerId"],
            "obfuscatedPuuid": player["obfuscatedPuuid"],
            "obfuscatedSummonerId": player["obfuscatedSummonerId"],
        });
        if lcu("POST", "/lol-champ-select/v1/toggle-player-muted", Some(body))
            .await
            .map(|r| r.success)
            .unwrap_or(false)
        {
            muted += 1;
        }
    }

    Ok(LcuResponse::ok(format!("Muted {} players", muted), None))
}

fn urlencoding_component(value: &str) -> String {
    let mut out = String::with_capacity(value.len());
    for b in value.bytes() {
        match b {
            b'A'..=b'Z' | b'a'..=b'z' | b'0'..=b'9' | b'-' | b'_' | b'.' | b'~' => {
                out.push(b as char)
            }
            _ => out.push_str(&format!("%{:02X}", b)),
        }
    }
    out
}

/// Build a multi-search link for teammates whose Riot IDs the client shows.
/// Players hidden by ranked anonymity are left out on purpose.
#[tauri::command]
pub async fn multi_search(website: String) -> Result<LcuResponse, String> {
    let session = lcu_ok("GET", "/lol-champ-select/v1/session", None).await?;
    let team = session["myTeam"].as_array().ok_or("No team data found")?;

    let mut riot_ids: Vec<String> = Vec::new();
    let mut hidden = 0;
    for player in team {
        let game_name = player["gameName"].as_str().unwrap_or("");
        let tag_line = player["tagLine"].as_str().unwrap_or("");
        if !game_name.is_empty() && !tag_line.is_empty() {
            riot_ids.push(format!("{}#{}", game_name, tag_line));
            continue;
        }
        // Older session payloads: resolve via summoner id when the name is visible.
        let visible = player["nameVisibilityType"].as_str() != Some("HIDDEN");
        if let Some(summoner_id) = player["summonerId"].as_i64().filter(|id| *id > 0) {
            if visible {
                if let Ok(summoner) =
                    lcu_ok("GET", &format!("/lol-summoner/v1/summoners/{}", summoner_id), None).await
                {
                    if let (Some(n), Some(t)) =
                        (summoner["gameName"].as_str(), summoner["tagLine"].as_str())
                    {
                        riot_ids.push(format!("{}#{}", n, t));
                        continue;
                    }
                }
            }
        }
        hidden += 1;
    }

    if riot_ids.is_empty() {
        return Err("No visible Riot IDs in this champ select".to_string());
    }

    let names = riot_ids
        .iter()
        .map(|id| urlencoding_component(id))
        .collect::<Vec<_>>()
        .join(",");

    let url = match website.to_lowercase().as_str() {
        "opgg" | "op.gg" => {
            let region_data = lcu_ok("GET", "/riotclient/region-locale", None).await?;
            let region = region_data["webRegion"]
                .as_str()
                .or_else(|| region_data["region"].as_str())
                .ok_or("Failed to get region")?
                .to_lowercase();
            format!("https://op.gg/lol/multisearch/{}?summoners={}", region, names)
        }
        "ugg" | "u.gg" => {
            let auth = lcu_ok("GET", "/lol-rso-auth/v1/authorization", None).await?;
            let platform = auth["currentPlatformId"]
                .as_str()
                .ok_or("Failed to get region")?
                .to_lowercase();
            format!(
                "https://u.gg/lol/multisearch?summoners={}&region={}",
                names, platform
            )
        }
        _ => return Err("Unsupported website".to_string()),
    };

    let message = if hidden > 0 {
        format!("{} players found ({} hidden by the client)", riot_ids.len(), hidden)
    } else {
        format!("{} players found", riot_ids.len())
    };
    Ok(LcuResponse::ok(message, Some(json!({ "url": url }))))
}

/// Import the client's own recommended rune page for the champion you are playing.
/// Replaces a previous Khaos page if there is one; otherwise only replaces the current
/// page when the page limit is reached.
#[tauri::command]
pub async fn auto_import_runes() -> Result<LcuResponse, String> {
    let session = lcu_ok("GET", "/lol-champ-select/v1/session", None).await?;
    let local_cell = session["localPlayerCellId"].as_i64();
    let me = session["myTeam"]
        .as_array()
        .and_then(|team| team.iter().find(|p| p["cellId"].as_i64() == local_cell))
        .cloned()
        .ok_or("Could not find you in champion select")?;

    let champion_id = me["championId"]
        .as_i64()
        .filter(|id| *id > 0)
        .or_else(|| me["championPickIntent"].as_i64().filter(|id| *id > 0))
        .ok_or("Pick or hover a champion first")?;

    let position = match me["assignedPosition"].as_str().unwrap_or("").to_uppercase() {
        p if p.is_empty() => "NONE".to_string(),
        p => p,
    };

    let map_id = lcu_ok("GET", "/lol-gameflow/v1/session", None)
        .await
        .ok()
        .and_then(|g| g["gameData"]["queue"]["mapId"].as_i64())
        .unwrap_or(11);

    let mut pages = lcu_ok(
        "GET",
        &format!(
            "/lol-perks/v1/recommended-pages/champion/{}/position/{}/map/{}",
            champion_id, position, map_id
        ),
        None,
    )
    .await
    .ok()
    .and_then(|v| v.as_array().cloned())
    .unwrap_or_default();

    if pages.is_empty() && position != "NONE" {
        pages = lcu_ok(
            "GET",
            &format!(
                "/lol-perks/v1/recommended-pages/champion/{}/position/NONE/map/{}",
                champion_id, map_id
            ),
            None,
        )
        .await
        .ok()
        .and_then(|v| v.as_array().cloned())
        .unwrap_or_default();
    }

    let recommended = pages
        .iter()
        .find(|p| p["isDefaultPosition"].as_bool() == Some(true))
        .or_else(|| pages.first())
        .cloned()
        .ok_or("The client has no recommended runes for this champion")?;

    let perk_ids: Vec<i64> = recommended["perks"]
        .as_array()
        .map(|perks| perks.iter().filter_map(|p| p["id"].as_i64()).collect())
        .unwrap_or_default();
    if perk_ids.is_empty() {
        return Err("Recommended page has no runes".to_string());
    }

    let champion_name = me["championName"]
        .as_str()
        .filter(|s| !s.is_empty())
        .map(str::to_string)
        .unwrap_or_else(|| format!("Champion {}", champion_id));

    let new_page = json!({
        "name": format!("Khaos: {}", champion_name),
        "primaryStyleId": recommended["primaryPerkStyleId"],
        "subStyleId": recommended["secondaryPerkStyleId"],
        "selectedPerkIds": perk_ids,
        "current": true,
    });

    // Remove an older Khaos page first so pages don't pile up.
    if let Ok(existing) = lcu_ok("GET", "/lol-perks/v1/pages", None).await {
        if let Some(list) = existing.as_array() {
            for page in list {
                let is_khaos = page["name"]
                    .as_str()
                    .map(|n| n.starts_with("Khaos:"))
                    .unwrap_or(false);
                if is_khaos && page["isDeletable"].as_bool().unwrap_or(true) {
                    if let Some(id) = page["id"].as_i64() {
                        let _ = lcu("DELETE", &format!("/lol-perks/v1/pages/{}", id), None).await;
                    }
                }
            }
        }
    }

    let created = lcu("POST", "/lol-perks/v1/pages", Some(new_page.clone())).await?;
    if created.success {
        return Ok(LcuResponse::ok(
            format!("Imported recommended runes for {}", champion_name),
            created.data,
        ));
    }

    // Probably at the page limit: replace the current editable page.
    let current = lcu_ok("GET", "/lol-perks/v1/currentpage", None).await?;
    let deletable = current["isDeletable"].as_bool().unwrap_or(false);
    let current_id = current["id"].as_i64();
    match (deletable, current_id) {
        (true, Some(id)) => {
            lcu_ok("DELETE", &format!("/lol-perks/v1/pages/{}", id), None).await?;
            lcu_ok("POST", "/lol-perks/v1/pages", Some(new_page)).await?;
            Ok(LcuResponse::ok(
                format!(
                    "Imported recommended runes for {} (replaced page \"{}\")",
                    champion_name,
                    current["name"].as_str().unwrap_or("")
                ),
                None,
            ))
        }
        _ => Err(format!(
            "Could not create a rune page: {}",
            created.message
        )),
    }
}

/// Launch another League client (multi-client). Goes through the Riot Client, which is
/// required since League moved under the Riot Client.
#[tauri::command]
pub fn launch_new_client() -> Result<LcuResponse, String> {
    use std::process::Command;

    if let Some(rcs) = riot_client_services_path() {
        return match Command::new(&rcs)
            .args([
                "--launch-product=league_of_legends",
                "--launch-patchline=live",
                "--allow-multiple-clients",
            ])
            .spawn()
        {
            Ok(_) => Ok(LcuResponse::ok(
                "New League client launching through the Riot Client",
                Some(json!({ "path": rcs.to_string_lossy() })),
            )),
            Err(e) => Ok(LcuResponse::fail(format!(
                "Failed to start {}: {}",
                rcs.to_string_lossy(),
                e
            ))),
        };
    }

    // Fallback: start LeagueClient directly.
    let client = league_install_dir()
        .map(|dir| dir.join(if cfg!(windows) { "LeagueClient.exe" } else { "LeagueClient.app/Contents/MacOS/LeagueClient" }))
        .filter(|p| p.exists())
        .ok_or("Riot Client and League client not found. Check your installation.")?;

    match Command::new(&client).arg("--allow-multiple-clients").spawn() {
        Ok(_) => Ok(LcuResponse::ok(
            "New League client instance launched",
            Some(json!({ "path": client.to_string_lossy() })),
        )),
        Err(e) => Ok(LcuResponse::fail(format!(
            "Failed to launch {}: {}",
            client.to_string_lossy(),
            e
        ))),
    }
}

/// Get all champions
#[tauri::command]
pub async fn get_all_champions() -> Result<LcuResponse, String> {
    lcu("GET", "/lol-champions/v1/owned-champions-minimal", None).await
}

/// Get champion mastery for a specific champion
#[tauri::command]
pub async fn get_champion_mastery(champion_id: i64) -> Result<LcuResponse, String> {
    let all = lcu_ok("GET", "/lol-champion-mastery/v1/local-player/champion-mastery", None).await?;
    let entry = all
        .as_array()
        .and_then(|list| list.iter().find(|m| m["championId"].as_i64() == Some(champion_id)))
        .cloned();
    Ok(LcuResponse::ok(
        if entry.is_some() { "Mastery found" } else { "No mastery for this champion" },
        entry,
    ))
}

/// Get all champion masteries
#[tauri::command]
pub async fn get_all_champion_masteries() -> Result<LcuResponse, String> {
    lcu("GET", "/lol-champion-mastery/v1/local-player/champion-mastery", None).await
}

/// Get owned skins
#[tauri::command]
pub async fn get_owned_skins() -> Result<LcuResponse, String> {
    lcu("GET", "/lol-inventory/v2/inventory/CHAMPION_SKIN", None).await
}

/// Get the queue of the current lobby / game
#[tauri::command]
pub async fn get_current_queue_type() -> Result<LcuResponse, String> {
    let session = lcu_ok("GET", "/lol-gameflow/v1/session", None).await?;
    let queue = session["gameData"]["queue"].clone();
    Ok(LcuResponse::ok(
        queue["description"].as_str().unwrap_or("Unknown queue").to_string(),
        Some(json!({
            "phase": session["phase"],
            "queueId": queue["id"],
            "mapId": queue["mapId"],
            "gameMode": queue["gameMode"],
            "description": queue["description"],
        })),
    ))
}

/// Check if a specific queue is available
#[tauri::command]
pub async fn is_queue_available(queue_id: i64) -> Result<LcuResponse, String> {
    let queues = lcu_ok("GET", "/lol-game-queues/v1/queues", None).await?;
    let available = queues
        .as_array()
        .map(|list| {
            list.iter().any(|q| {
                q["id"].as_i64() == Some(queue_id)
                    && q["queueAvailability"].as_str().unwrap_or("Available") == "Available"
            })
        })
        .unwrap_or(false);

    Ok(LcuResponse::ok(
        if available { "Queue is available" } else { "Queue is not available" },
        Some(json!(available)),
    ))
}

/// Flush DNS cache to fix unknown player issues
#[tauri::command]
pub fn flush_dns() -> Result<LcuResponse, String> {
    #[cfg(target_os = "windows")]
    {
        use std::process::Command;

        // Runs ipconfig /flushdns elevated (shows a UAC prompt, no console window).
        let output = Command::new("powershell")
            .args([
                "-NoProfile",
                "-Command",
                "Start-Process",
                "ipconfig",
                "-ArgumentList",
                "/flushdns",
                "-Verb",
                "RunAs",
                "-WindowStyle",
                "Hidden",
                "-Wait",
            ])
            .output()
            .map_err(|e| format!("Failed to execute DNS flush command: {}", e))?;

        if output.status.success() {
            Ok(LcuResponse::ok(
                "DNS cache flushed successfully. This should fix unknown player issues.",
                None,
            ))
        } else {
            let stderr = String::from_utf8_lossy(&output.stderr);
            Ok(LcuResponse::fail(format!("Failed to flush DNS cache: {}", stderr)))
        }
    }

    #[cfg(not(target_os = "windows"))]
    {
        use std::process::Command;

        let commands: Vec<Vec<&str>> = vec![
            vec!["dscacheutil", "-flushcache"],               // macOS
            vec!["killall", "-HUP", "mDNSResponder"],         // macOS
            vec!["resolvectl", "flush-caches"],               // systemd
        ];

        let mut last_error = String::new();
        for cmd in commands {
            if let Ok(output) = Command::new(cmd[0]).args(&cmd[1..]).output() {
                if output.status.success() {
                    return Ok(LcuResponse::ok("DNS cache flushed successfully.", None));
                }
                last_error = String::from_utf8_lossy(&output.stderr).to_string();
            }
        }

        Ok(LcuResponse::fail(format!(
            "Failed to flush DNS cache on this system: {}",
            last_error
        )))
    }
}

fn settings_file() -> Result<std::path::PathBuf, LcuResponse> {
    let path = persisted_settings_path().ok_or_else(|| {
        LcuResponse::fail(
            "Could not find the League of Legends install folder. Start the client once and try again.",
        )
    })?;
    if !path.exists() {
        return Err(LcuResponse::fail(format!(
            "PersistedSettings.json not found at {}",
            path.to_string_lossy()
        )));
    }
    Ok(path)
}

/// Check if PersistedSettings.json is read-only
#[tauri::command]
pub fn check_settings_readonly() -> Result<LcuResponse, String> {
    let path = match settings_file() {
        Ok(p) => p,
        Err(response) => return Ok(response),
    };

    match std::fs::metadata(&path) {
        Ok(metadata) => {
            let is_readonly = metadata.permissions().readonly();
            Ok(LcuResponse::ok(
                if is_readonly { "File is read-only" } else { "File is writable" },
                Some(json!(is_readonly)),
            ))
        }
        Err(e) => Ok(LcuResponse::fail(format!(
            "Failed to check file permissions: {}",
            e
        ))),
    }
}

/// Toggle read-only status of PersistedSettings.json
#[tauri::command]
pub fn toggle_settings_readonly(set_readonly: bool) -> Result<LcuResponse, String> {
    let path = match settings_file() {
        Ok(p) => p,
        Err(response) => return Ok(response),
    };

    let mut perms = std::fs::metadata(&path)
        .map_err(|e| format!("Failed to get file metadata: {}", e))?
        .permissions();

    #[allow(clippy::permissions_set_readonly_false)]
    perms.set_readonly(set_readonly);

    std::fs::set_permissions(&path, perms)
        .map_err(|e| format!("Failed to set file permissions: {}", e))?;

    Ok(LcuResponse::ok(
        if set_readonly {
            "PersistedSettings.json is now read-only. Your settings are protected."
        } else {
            "PersistedSettings.json is now writable. Settings can be modified."
        },
        Some(json!(set_readonly)),
    ))
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn finds_only_in_progress_local_action() {
        let session = json!({
            "localPlayerCellId": 2,
            "actions": [
                [ { "id": 1, "actorCellId": 2, "type": "ban", "completed": true, "isInProgress": false } ],
                [ { "id": 7, "actorCellId": 2, "type": "pick", "completed": false, "isInProgress": false } ],
            ]
        });
        assert!(local_action(&session, "pick").is_none());

        let session = json!({
            "localPlayerCellId": 2,
            "actions": [
                [ { "id": 7, "actorCellId": 2, "type": "pick", "completed": false, "isInProgress": true },
                  { "id": 8, "actorCellId": 3, "type": "pick", "completed": false, "isInProgress": true } ],
            ]
        });
        assert_eq!(local_action(&session, "pick").unwrap()["id"], 7);
        assert!(local_action(&session, "ban").is_none());
    }

    #[test]
    fn encodes_riot_ids() {
        assert_eq!(urlencoding_component("Faker#KR1"), "Faker%23KR1");
        assert_eq!(urlencoding_component("Álex G#EUW"), "%C3%81lex%20G%23EUW");
    }
}
