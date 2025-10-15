use crate::lcu_connection::{
    find_league_client_path, get_endpoint, get_persisted_settings_path, make_lcu_request,
    LcuCredentials, LcuResponse,
};
use serde_json::json;

/// Example Tauri command that greets a user
#[tauri::command]
pub fn greet(name: &str) -> String {
    format!("Hello, {}! Welcome to Khaos.", name)
}

/// Check if LCU is connected
#[tauri::command]
pub async fn check_lcu_connection() -> Result<LcuResponse, String> {
    let credentials = LcuCredentials::from_lockfile()?;
    make_lcu_request(
        &credentials,
        "GET",
        "/lol-summoner/v1/current-summoner",
        None,
    )
    .await
}

/// Set custom status message
#[tauri::command]
pub async fn set_status_message(message: String) -> Result<LcuResponse, String> {
    let credentials = LcuCredentials::from_lockfile()?;
    let endpoint = get_endpoint("lolChat")?;
    let body = json!({
        "statusMessage": message
    });
    make_lcu_request(&credentials, "PUT", &endpoint, Some(body)).await
}

/// Set profile background by skin ID
#[tauri::command]
pub async fn set_profile_background(skin_id: i64) -> Result<LcuResponse, String> {
    let credentials = LcuCredentials::from_lockfile()?;
    let endpoint = get_endpoint("profile")?;
    let body = json!({
        "key": "backgroundSkinId",
        "value": skin_id
    });
    make_lcu_request(&credentials, "POST", &endpoint, Some(body)).await
}

/// Set summoner icon
#[tauri::command]
pub async fn set_summoner_icon(icon_id: i64) -> Result<LcuResponse, String> {
    let credentials = LcuCredentials::from_lockfile()?;
    let endpoint = get_endpoint("lolChat")?;
    let body = json!({
        "icon": icon_id
    });
    make_lcu_request(&credentials, "PUT", &endpoint, Some(body)).await
}

/// Set chat rank display
#[tauri::command]
pub async fn set_chat_rank(
    queue: String,
    tier: String,
    division: String,
) -> Result<LcuResponse, String> {
    let credentials = LcuCredentials::from_lockfile()?;
    let endpoint = get_endpoint("lolChat")?;
    let body = json!({
        "lol": {
            "rankedLeagueQueue": queue,
            "rankedLeagueTier": tier,
            "rankedLeagueDivision": division,
        }
    });
    make_lcu_request(&credentials, "PUT", &endpoint, Some(body)).await
}

/// Set chibi icon (TFT companion)
#[tauri::command]
pub async fn set_chibi_icon(profile_icon_id: i64) -> Result<LcuResponse, String> {
    let credentials = LcuCredentials::from_lockfile()?;
    let endpoint = get_endpoint("chibiIcon")?;
    let body = json!({
        "profileIconId": profile_icon_id
    });
    make_lcu_request(&credentials, "PUT", &endpoint, Some(body)).await
}

/// Create practice tool lobby
#[tauri::command]
pub async fn create_practice_lobby(lobby_name: String) -> Result<LcuResponse, String> {
    let credentials = LcuCredentials::from_lockfile()?;
    let endpoint = get_endpoint("lobby")?;

    let name = if lobby_name.is_empty() {
        "Practice Tool".to_string()
    } else {
        lobby_name
    };

    let body = json!({
        "customGameLobby": {
            "configuration": {
                "gameMode": "PRACTICETOOL",
                "gameMutator": "",
                "gameServerRegion": "",
                "mapId": 11,
                "mutators": {
                    "id": 1
                },
                "spectatorPolicy": "NotAllowed",
                "teamSize": 5
            },
            "lobbyName": name,
            "lobbyPassword": ""
        },
        "isCustom": true
    });
    make_lcu_request(&credentials, "POST", &endpoint, Some(body)).await
}

/// Make a custom LCU API request
#[tauri::command]
pub async fn custom_lcu_request(
    method: String,
    endpoint: String,
    body: Option<serde_json::Value>,
) -> Result<LcuResponse, String> {
    let credentials = LcuCredentials::from_lockfile()?;
    make_lcu_request(&credentials, &method, &endpoint, body).await
}

/// Set availability status
#[tauri::command]
pub async fn set_availability_status(status: String) -> Result<LcuResponse, String> {
    let credentials = LcuCredentials::from_lockfile()?;
    let endpoint = "/lol-chat/v1/me".to_string();
    let body = json!({
        "availability": status
    });
    make_lcu_request(&credentials, "PUT", &endpoint, Some(body)).await
}

/// Appear offline
#[tauri::command]
pub async fn appear_offline() -> Result<LcuResponse, String> {
    set_availability_status("offline".to_string()).await
}

/// Appear online
#[tauri::command]
pub async fn appear_online() -> Result<LcuResponse, String> {
    set_availability_status("online".to_string()).await
}

/// Disconnect from chat
#[tauri::command]
pub async fn disconnect_chat() -> Result<LcuResponse, String> {
    let credentials = LcuCredentials::from_lockfile()?;
    let endpoint = "/chat/v1/suspend".to_string();
    let body = json!({
        "config": "disable"
    });
    make_lcu_request(&credentials, "POST", &endpoint, Some(body)).await
}

/// Reconnect to chat
#[tauri::command]
pub async fn reconnect_chat() -> Result<LcuResponse, String> {
    let credentials = LcuCredentials::from_lockfile()?;
    let endpoint = "/chat/v1/resume".to_string();
    make_lcu_request(&credentials, "POST", &endpoint, None).await
}

/// Auto-accept matchmaking
#[tauri::command]
pub async fn auto_accept(accept: bool) -> Result<LcuResponse, String> {
    let credentials = LcuCredentials::from_lockfile()?;
    let endpoint = "/lol-matchmaking/v1/ready-check/accept".to_string();
    let body = json!({
        "acceptMatch": accept
    });
    make_lcu_request(&credentials, "POST", &endpoint, Some(body)).await
}

/// Instalock a specific champion
#[tauri::command]
pub async fn instalock(champion_id: i64) -> Result<LcuResponse, String> {
    println!(
        "Instalock: Starting instalock for champion ID {}",
        champion_id
    );
    let credentials = LcuCredentials::from_lockfile()?;

    // Get the current champ select session
    let session_response =
        make_lcu_request(&credentials, "GET", "/lol-champ-select/v1/session", None).await?;
    let session_data = session_response.data.ok_or("No session data found")?;
    println!("Instalock: Got session data successfully");

    // Find the local player cell ID
    let local_player_cell_id = session_data["localPlayerCellId"]
        .as_i64()
        .ok_or("Could not find local player cell ID")?;
    println!("Instalock: Local player cell ID: {}", local_player_cell_id);

    // Find the pick action for this player
    let actions = session_data["actions"]
        .as_array()
        .ok_or("No actions found in session")?;
    println!("Instalock: Found {} action groups", actions.len());

    for (group_idx, action_group) in actions.iter().enumerate() {
        if let Some(actions_array) = action_group.as_array() {
            println!(
                "Instalock: Action group {} has {} actions",
                group_idx,
                actions_array.len()
            );
            for (action_idx, action) in actions_array.iter().enumerate() {
                if let (Some(actor_cell_id), Some(action_type), Some(completed)) = (
                    action["actorCellId"].as_i64(),
                    action["type"].as_str(),
                    action["completed"].as_bool(),
                ) {
                    println!(
                        "Instalock: Action {}-{}: type={}, actor={}, completed={}",
                        group_idx, action_idx, action_type, actor_cell_id, completed
                    );

                    // Check if this is a pick action for the local player and not completed
                    if actor_cell_id == local_player_cell_id && action_type == "pick" && !completed
                    {
                        if let Some(action_id) = action["id"].as_i64() {
                            println!("Instalock: Found valid pick action with ID {}", action_id);

                            // Try the newer API first (direct action completion with champion)
                            let complete_body = json!({
                                "completed": true,
                                "championId": champion_id
                            });

                            let result = make_lcu_request(
                                &credentials,
                                "PATCH",
                                &format!("/lol-champ-select/v1/session/actions/{}", action_id),
                                Some(complete_body),
                            )
                            .await;

                            match result {
                                Ok(response) => {
                                    println!("Instalock: Successfully completed action");
                                    return Ok(response);
                                }
                                Err(e) => {
                                    println!("Instalock: Direct action completion failed: {}", e);
                                    // Fallback to the old method: select champion first, then complete action
                                    println!("Instalock: Trying fallback method...");

                                    let select_body = json!({
                                        "championId": champion_id,
                                        "selectedSkinId": 0,
                                        "spell1Id": 0,
                                        "spell2Id": 0,
                                        "wardSkinId": 0
                                    });

                                    if make_lcu_request(
                                        &credentials,
                                        "POST",
                                        "/lol-champ-select/v1/session/my-selection",
                                        Some(select_body),
                                    )
                                    .await
                                    .is_ok()
                                    {
                                        println!("Instalock: Champion selection successful, completing action");
                                        return make_lcu_request(
                                            &credentials,
                                            "PATCH",
                                            &format!(
                                                "/lol-champ-select/v1/session/actions/{}",
                                                action_id
                                            ),
                                            Some(json!({
                                                "completed": true,
                                                "championId": champion_id
                                            })),
                                        )
                                        .await;
                                    } else {
                                        println!("Instalock: Fallback method also failed");
                                        return Err(format!(
                                            "Both instalock methods failed: {}",
                                            e
                                        ));
                                    }
                                }
                            }
                        }
                    }
                }
            }
        }
    }

    println!("Instalock: Could not find a valid pick action");
    Err("Could not find a valid pick action".to_string())
}

/// Auto ban champion in champ select
#[tauri::command]
pub async fn auto_ban_champion(champion_id: i64) -> Result<LcuResponse, String> {
    let credentials = LcuCredentials::from_lockfile()?;

    // Get the current champ select session
    let session_response =
        make_lcu_request(&credentials, "GET", "/lol-champ-select/v1/session", None).await?;
    let session_data = session_response.data.ok_or("No session data found")?;

    // Find the local player cell ID
    let local_player_cell_id = session_data["localPlayerCellId"]
        .as_i64()
        .ok_or("Could not find local player cell ID")?;

    // Find the ban action for this player
    let actions = session_data["actions"]
        .as_array()
        .ok_or("No actions found in session")?;

    for action_group in actions {
        if let Some(actions_array) = action_group.as_array() {
            for action in actions_array {
                if let (Some(actor_cell_id), Some(action_type), Some(completed)) = (
                    action["actorCellId"].as_i64(),
                    action["type"].as_str(),
                    action["completed"].as_bool(),
                ) {
                    // Check if this is a ban action for the local player and not completed
                    if actor_cell_id == local_player_cell_id && action_type == "ban" && !completed {
                        if let Some(action_id) = action["id"].as_i64() {
                            // Complete the ban action with the champion
                            let action_endpoint =
                                format!("/lol-champ-select/v1/session/actions/{}", action_id);
                            let action_body = json!({
                                "completed": true,
                                "championId": champion_id
                            });

                            return make_lcu_request(
                                &credentials,
                                "PATCH",
                                &action_endpoint,
                                Some(action_body),
                            )
                            .await;
                        }
                    }
                }
            }
        }
    }

    Err("No available ban action found for local player".to_string())
}

/// Send instant message in champ select
#[tauri::command]
pub async fn send_instant_message(
    message: String,
    times: Option<i64>,
    delay: Option<i64>,
) -> Result<LcuResponse, String> {
    let credentials = LcuCredentials::from_lockfile()?;
    let times = times.unwrap_or(1);
    let delay = delay.unwrap_or(0);

    // Get the current champ select conversation
    let participants_response =
        make_lcu_request(&credentials, "GET", "/chat/v5/participants", None).await?;
    let participants_data = participants_response
        .data
        .ok_or("No participants data found")?;

    let participants = participants_data["participants"]
        .as_array()
        .ok_or("No participants found")?;

    let mut cid = String::new();
    for participant in participants {
        if let Some(cid_value) = participant["cid"].as_str() {
            if cid_value.contains("champ-select") {
                cid = cid_value.to_string();
                break;
            }
        }
    }

    if cid.is_empty() {
        return Err("No champ-select conversation found".to_string());
    }

    let conversation_endpoint = format!("/chat/v1/conversations/{}/messages", cid);
    let message_body = json!({
        "type": "chat",
        "body": message
    });

    // Send the message multiple times with delay
    for i in 0..times {
        if i > 0 && delay > 0 {
            std::thread::sleep(std::time::Duration::from_millis(delay as u64));
        }
        make_lcu_request(
            &credentials,
            "POST",
            &conversation_endpoint,
            Some(message_body.clone()),
        )
        .await?;
    }

    Ok(LcuResponse {
        success: true,
        message: format!("Sent message {} times", times),
        data: None,
    })
}

/// Instantly mute all players in champ select
#[tauri::command]
pub async fn instant_mute_all() -> Result<LcuResponse, String> {
    let credentials = LcuCredentials::from_lockfile()?;

    // Get the current champ select session
    let session_response =
        make_lcu_request(&credentials, "GET", "/lol-champ-select/v1/session", None).await?;
    let session_data = session_response.data.ok_or("No session data found")?;

    let local_player_cell_id = session_data["localPlayerCellId"]
        .as_i64()
        .ok_or("Could not find local player cell ID")?;

    let my_team = session_data["myTeam"]
        .as_array()
        .ok_or("No team data found")?;

    let mut muted_count = 0;
    for player in my_team {
        if let Some(cell_id) = player["cellId"].as_i64() {
            if cell_id != local_player_cell_id {
                let mute_body = json!({
                    "summonerId": player["summonerId"],
                    "puuid": player["puuid"],
                    "obfuscatedSummonerId": player["obfuscatedSummonerId"],
                    "obfuscatedPuuid": player["obfuscatedPuuid"]
                });

                let _ = make_lcu_request(
                    &credentials,
                    "POST",
                    "/lol-champ-select/v1/toggle-player-muted",
                    Some(mute_body),
                )
                .await;
                muted_count += 1;
            }
        }
    }

    Ok(LcuResponse {
        success: true,
        message: format!("Muted {} players", muted_count),
        data: None,
    })
}

/// Multi-search players in champ select
#[tauri::command]
pub async fn multi_search(website: String) -> Result<LcuResponse, String> {
    let credentials = LcuCredentials::from_lockfile()?;

    // Get the current champ select session
    let session_response =
        make_lcu_request(&credentials, "GET", "/lol-champ-select/v1/session", None).await?;
    let session_data = session_response.data.ok_or("No session data found")?;

    let my_team = session_data["myTeam"]
        .as_array()
        .ok_or("No team data found")?;

    let mut summoner_names = String::new();

    for player in my_team {
        if let (Some(summoner_id), Some(name_visibility)) = (
            player["summonerId"].as_str(),
            player["nameVisibilityType"].as_str(),
        ) {
            if name_visibility == "HIDDEN" {
                // Ranked lobby - get names from chat participants instead
                let participants_response =
                    make_lcu_request(&credentials, "GET", "/chat/v5/participants", None).await?;
                if let Some(participants_data) = participants_response.data {
                    if let Some(participants) = participants_data["participants"].as_array() {
                        for participant in participants {
                            if let (Some(cid), Some(game_name), Some(game_tag)) = (
                                participant["cid"].as_str(),
                                participant["game_name"].as_str(),
                                participant["game_tag"].as_str(),
                            ) {
                                if cid.contains("champ-select") {
                                    summoner_names
                                        .push_str(&format!("{}%23{},", game_name, game_tag));
                                }
                            }
                        }
                    }
                }
                break; // Only need to do this once for ranked
            } else if !summoner_id.is_empty() && summoner_id != "0" {
                // Normal lobby - get summoner info
                let summoner_endpoint = format!("/lol-summoner/v1/summoners/{}", summoner_id);
                if let Ok(summoner_response) =
                    make_lcu_request(&credentials, "GET", &summoner_endpoint, None).await
                {
                    if let Some(summoner_data) = summoner_response.data {
                        if let (Some(game_name), Some(game_tag)) = (
                            summoner_data["gameName"].as_str(),
                            summoner_data["tagLine"].as_str(),
                        ) {
                            summoner_names.push_str(&format!("{}%23{},", game_name, game_tag));
                        }
                    }
                }
            }
        }
    }

    if summoner_names.is_empty() {
        return Err("Failed to get summoner names".to_string());
    }

    // Remove trailing comma
    summoner_names.pop();

    // Get region
    let mut region = String::new();
    if website == "ugg" || website == "U.GG" {
        let auth_response =
            make_lcu_request(&credentials, "GET", "/lol-rso-auth/v1/authorization", None).await?;
        if let Some(auth_data) = auth_response.data {
            if let Some(platform_id) = auth_data["currentPlatformId"].as_str() {
                region = platform_id.to_string();
            }
        }
    } else {
        let region_response =
            make_lcu_request(&credentials, "GET", "/riotclient/region-locale", None).await?;
        if let Some(region_data) = region_response.data {
            if let Some(web_region) = region_data["webRegion"].as_str() {
                region = web_region.to_string();
            }
        }
    }

    if region.is_empty() {
        return Err("Failed to get region".to_string());
    }

    let url = match website.as_str() {
        "opgg" | "OP.GG" => format!("https://{}.op.gg/multi/query={}", region, summoner_names),
        "ugg" | "U.GG" => format!(
            "https://u.gg/multisearch?summoners={}&region={}",
            summoner_names,
            region.to_lowercase()
        ),
        "porogg" | "PORO.GG" => format!(
            "https://poro.gg/multi?region={}&q={}",
            region.to_uppercase(),
            summoner_names
        ),
        "porofessor" | "Porofessor.gg" => {
            format!("https://porofessor.gg/pregame/{}/soloqueue/season", region)
        }
        _ => return Err("Unsupported website".to_string()),
    };

    // Open URL (this would need to be handled by the frontend)
    Ok(LcuResponse {
        success: true,
        message: format!("Opening {} multi-search", website),
        data: Some(json!({ "url": url })),
    })
}

/// Auto import runes from OP.GG
#[tauri::command]
pub async fn auto_import_runes() -> Result<LcuResponse, String> {
    let credentials = LcuCredentials::from_lockfile()?;

    // Get current champion
    let current_champ_response = make_lcu_request(
        &credentials,
        "GET",
        "/lol-champ-select/v1/current-champion",
        None,
    )
    .await?;
    let current_champion = current_champ_response
        .data
        .and_then(|d| d.as_i64())
        .filter(|&id| id != 0)
        .ok_or("Champion not picked yet")?;

    // Get champion name (this would need a mapping or additional API call)
    // For now, we'll use a simple approach
    let _champion_name = format!("Champion{}", current_champion); // Placeholder

    // Get current rune page
    let current_page_response =
        make_lcu_request(&credentials, "GET", "/lol-perks/v1/currentpage", None).await?;
    let current_page_data = current_page_response
        .data
        .ok_or("No current rune page found")?;
    let current_page_id = current_page_data["id"]
        .as_i64()
        .ok_or("No current page ID found")?;

    // Delete current page
    let delete_endpoint = format!("/lol-perks/v1/pages/{}", current_page_id);
    make_lcu_request(&credentials, "DELETE", &delete_endpoint, None).await?;

    // Scrape OP.GG (this would require HTTP client, for now return placeholder)
    Ok(LcuResponse {
        success: false,
        message: "Rune import requires HTTP client implementation".to_string(),
        data: None,
    })
}

/// Set backup pick champion
#[tauri::command]
pub async fn set_backup_pick(champion_id: i64) -> Result<LcuResponse, String> {
    let credentials = LcuCredentials::from_lockfile()?;
    let endpoint = "/lol-champ-select/v1/session/my-backup-selection".to_string();
    let body = json!({
        "championId": champion_id,
        "selectedSkinId": 0,
        "spell1Id": 0,
        "spell2Id": 0,
        "wardSkinId": 0
    });
    make_lcu_request(&credentials, "PUT", &endpoint, Some(body)).await
}

/// Launch a new League of Legends client instance
#[tauri::command]
pub fn launch_new_client() -> Result<LcuResponse, String> {
    // Use the new dynamic path detection method
    let client_path = find_league_client_path().ok_or_else(|| {
        "League of Legends client not found. Please check your installation.".to_string()
    })?;

    // Launch the client using ShellExecute to match KBotExt behavior
    #[cfg(target_os = "windows")]
    {
        use std::ffi::CString;
        use winapi::um::shellapi::ShellExecuteA;
        use winapi::um::winuser::SW_SHOWNORMAL;

        let client_path_cstr =
            CString::new(client_path.clone()).map_err(|e| format!("Invalid client path: {}", e))?;
        let args_cstr = CString::new("--allow-multiple-clients")
            .map_err(|e| format!("Invalid arguments: {}", e))?;

        let open_cstr = CString::new("open").map_err(|e| format!("Invalid open command: {}", e))?;

        let result = unsafe {
            ShellExecuteA(
                std::ptr::null_mut(),
                open_cstr.as_ptr(),
                client_path_cstr.as_ptr(),
                args_cstr.as_ptr(),
                std::ptr::null(),
                SW_SHOWNORMAL,
            )
        };

        // ShellExecute returns a value > 32 on success
        if (result as usize) > 32 {
            Ok(LcuResponse {
                success: true,
                message: format!("New League client instance launched from {}", client_path),
                data: Some(serde_json::json!({ "path": client_path })),
            })
        } else {
            Ok(LcuResponse {
                success: false,
                message: format!(
                    "Failed to launch new client from {}: ShellExecute failed with code {}",
                    client_path, result as usize
                ),
                data: None,
            })
        }
    }

    #[cfg(not(target_os = "windows"))]
    {
        // Fallback for non-Windows systems (though this is primarily for Windows)
        match std::process::Command::new(&client_path)
            .arg("--allow-multiple-clients")
            .spawn()
        {
            Ok(_) => Ok(LcuResponse {
                success: true,
                message: format!("New League client instance launched from {}", client_path),
                data: Some(serde_json::json!({ "path": client_path })),
            }),
            Err(e) => Ok(LcuResponse {
                success: false,
                message: format!("Failed to launch new client from {}: {}", client_path, e),
                data: None,
            }),
        }
    }
}

/// Get all champions
#[tauri::command]
pub async fn get_all_champions() -> Result<LcuResponse, String> {
    let credentials = LcuCredentials::from_lockfile()?;
    make_lcu_request(
        &credentials,
        "GET",
        "/lol-champions/v1/owned-champions-minimal",
        None,
    )
    .await
}

/// Get champion mastery for a specific champion
#[tauri::command]
pub async fn get_champion_mastery(champion_id: i64) -> Result<LcuResponse, String> {
    let credentials = LcuCredentials::from_lockfile()?;
    make_lcu_request(
        &credentials,
        "GET",
        &format!("/lol-champions/v1/champions/{}/mastery", champion_id),
        None,
    )
    .await
}

/// Get all champion masteries
#[tauri::command]
pub async fn get_all_champion_masteries() -> Result<LcuResponse, String> {
    let credentials = LcuCredentials::from_lockfile()?;
    make_lcu_request(
        &credentials,
        "GET",
        "/lol-champions/v1/champions-mastery",
        None,
    )
    .await
}

/// Get owned skins
#[tauri::command]
pub async fn get_owned_skins() -> Result<LcuResponse, String> {
    let credentials = LcuCredentials::from_lockfile()?;
    make_lcu_request(
        &credentials,
        "GET",
        "/lol-inventory/v2/inventory/skins",
        None,
    )
    .await
}

/// Get current game queue type
#[tauri::command]
pub async fn get_current_queue_type() -> Result<LcuResponse, String> {
    let credentials = LcuCredentials::from_lockfile()?;
    make_lcu_request(
        &credentials,
        "GET",
        "/lol-gameflow/v1/gameflow-metadata/player-status",
        None,
    )
    .await
}

/// Check if a specific queue is available
#[tauri::command]
pub async fn is_queue_available(queue_id: i64) -> Result<LcuResponse, String> {
    let credentials = LcuCredentials::from_lockfile()?;

    // First, get all available queues
    let queues_response =
        make_lcu_request(&credentials, "GET", "/lol-queue/v1/queues", None).await?;

    // Check if the response contains data and parse it
    if let Some(queues) = queues_response.data {
        let queue_available = queues
            .as_array()
            .map(|arr| arr.iter().any(|q| q["id"].as_i64() == Some(queue_id)))
            .unwrap_or(false);

        Ok(LcuResponse {
            success: true,
            message: if queue_available {
                "Queue is available".to_string()
            } else {
                "Queue is not available".to_string()
            },
            data: Some(serde_json::json!(queue_available)),
        })
    } else {
        Err("Failed to retrieve queue information".to_string())
    }
}

/// Flush DNS cache to fix unknown player issues
#[tauri::command]
pub fn flush_dns() -> Result<LcuResponse, String> {
    #[cfg(target_os = "windows")]
    {
        use std::process::Command;

        // Use PowerShell to run ipconfig /flushdns with elevated privileges
        // This will show UAC prompt but no CMD window
        let output = Command::new("powershell")
            .args([
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
            Ok(LcuResponse {
                success: true,
                message: "DNS cache flushed successfully. This should fix unknown player issues."
                    .to_string(),
                data: None,
            })
        } else {
            let stderr = String::from_utf8_lossy(&output.stderr);
            Ok(LcuResponse {
                success: false,
                message: format!("Failed to flush DNS cache: {}", stderr),
                data: None,
            })
        }
    }

    #[cfg(not(target_os = "windows"))]
    {
        // For non-Windows systems, try common DNS flush commands
        use std::process::Command;

        // Try different DNS flush commands for different systems
        let commands = vec![
            vec!["sudo", "systemd-resolve", "--flush-caches"], // systemd
            vec!["sudo", "killall", "-HUP", "mDNSResponder"],  // macOS
            vec!["sudo", "service", "nscd", "restart"],        // Some Linux systems
            vec!["sudo", "rndc", "flush"],                     // BIND DNS server
        ];

        let mut last_error = String::new();

        for cmd in commands {
            if let Ok(output) = Command::new(&cmd[0]).args(&cmd[1..]).output() {
                if output.status.success() {
                    return Ok(LcuResponse {
                        success: true,
                        message: "DNS cache flushed successfully.".to_string(),
                        data: None,
                    });
                } else {
                    last_error = String::from_utf8_lossy(&output.stderr).to_string();
                }
            }
        }

        Ok(LcuResponse {
            success: false,
            message: format!("Failed to flush DNS cache on this system: {}", last_error),
            data: None,
        })
    }
}

/// Check if PersistedSettings.json is read-only
#[tauri::command]
pub fn check_settings_readonly() -> Result<LcuResponse, String> {
    #[cfg(target_os = "windows")]
    {
        use std::fs;
        use std::path::Path;

        let settings_path = match get_persisted_settings_path() {
            Some(path) => path,
            None => {
                return Ok(LcuResponse {
                    success: false,
                    message:
                        "Could not find League of Legends installation. Make sure League of Legends is installed."
                            .to_string(),
                    data: None,
                });
            }
        };

        if !Path::new(&settings_path).exists() {
            return Ok(LcuResponse {
                success: false,
                message:
                    "PersistedSettings.json not found. Make sure League of Legends is installed."
                        .to_string(),
                data: None,
            });
        }

        match fs::metadata(&settings_path) {
            Ok(metadata) => {
                let is_readonly = metadata.permissions().readonly();
                Ok(LcuResponse {
                    success: true,
                    message: if is_readonly {
                        "File is read-only"
                    } else {
                        "File is writable"
                    }
                    .to_string(),
                    data: Some(serde_json::json!(is_readonly)),
                })
            }
            Err(e) => Ok(LcuResponse {
                success: false,
                message: format!("Failed to check file permissions: {}", e),
                data: None,
            }),
        }
    }

    #[cfg(not(target_os = "windows"))]
    {
        Ok(LcuResponse {
            success: false,
            message: "Read-only settings management is only supported on Windows".to_string(),
            data: None,
        })
    }
}

/// Toggle read-only status of PersistedSettings.json
#[tauri::command]
pub fn toggle_settings_readonly(set_readonly: bool) -> Result<LcuResponse, String> {
    #[cfg(target_os = "windows")]
    {
        use std::fs;
        use std::path::Path;

        let settings_path = match get_persisted_settings_path() {
            Some(path) => path,
            None => {
                return Ok(LcuResponse {
                    success: false,
                    message:
                        "Could not find League of Legends installation. Make sure League of Legends is installed."
                            .to_string(),
                    data: None,
                });
            }
        };

        if !Path::new(&settings_path).exists() {
            return Ok(LcuResponse {
                success: false,
                message:
                    "PersistedSettings.json not found. Make sure League of Legends is installed."
                        .to_string(),
                data: None,
            });
        }

        let mut perms = fs::metadata(&settings_path)
            .map_err(|e| format!("Failed to get file metadata: {}", e))?
            .permissions();

        perms.set_readonly(set_readonly);

        fs::set_permissions(&settings_path, perms)
            .map_err(|e| format!("Failed to set file permissions: {}", e))?;

        Ok(LcuResponse {
            success: true,
            message: if set_readonly {
                "PersistedSettings.json is now read-only. Your settings are protected."
            } else {
                "PersistedSettings.json is now writable. Settings can be modified."
            }
            .to_string(),
            data: Some(serde_json::json!(set_readonly)),
        })
    }

    #[cfg(not(target_os = "windows"))]
    {
        Ok(LcuResponse {
            success: false,
            message: "Read-only settings management is only supported on Windows".to_string(),
            data: None,
        })
    }
}
