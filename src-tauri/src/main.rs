// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

mod commands;
mod lcu_connection;

use commands::*;

fn main() {
    tauri::Builder::default()
        .invoke_handler(tauri::generate_handler![
            greet,
            check_lcu_connection,
            set_status_message,
            set_profile_background,
            set_summoner_icon,
            set_chat_rank,
            set_chibi_icon,
            create_practice_lobby,
            custom_lcu_request,
            set_availability_status,
            appear_offline,
            appear_online,
            disconnect_chat,
            reconnect_chat,
            launch_new_client,
            auto_accept,
            instalock,
            auto_ban_champion,
            send_instant_message,
            instant_mute_all,
            multi_search,
            auto_import_runes,
            set_backup_pick,
            get_all_champions,
            get_champion_mastery,
            get_all_champion_masteries,
            get_owned_skins,
            get_current_queue_type,
            is_queue_available,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
