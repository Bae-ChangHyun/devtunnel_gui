mod devtunnel;
mod types;
mod commands;
mod parser;

use commands::*;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .manage(AppState::new())
        .invoke_handler(tauri::generate_handler![
            // Authentication
            login_devtunnel,
            logout_devtunnel,
            get_user_info,
            // Tunnel Management
            create_tunnel,
            list_tunnels,
            list_tunnels_light,
            enrich_tunnel_details,
            show_tunnel,
            update_tunnel,
            delete_tunnel,
            delete_all_tunnels,
            host_tunnel,
            stop_tunnel,
            restart_tunnel,
            get_tunnel_start_time,
            ping_port,
            // Port Management
            create_port,
            list_ports,
            show_port,
            update_port,
            delete_port,
            // Access Control
            create_access,
            list_access,
            reset_access,
            // Clusters
            list_clusters,
            // System
            check_devtunnel_installation,
            open_url,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
