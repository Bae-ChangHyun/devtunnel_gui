use crate::devtunnel::DevTunnelClient;
use crate::types::*;
use std::sync::Mutex;
use tauri::Emitter;

// Helper function to emit log events
fn emit_log(app: &tauri::AppHandle, message: &str) {
    let _ = app.emit("devtunnel-log", message);
}

// Helper function to get devtunnel binary path
// Priority: 1. DEVTUNNEL_BIN env var, 2. which devtunnel, 3. "devtunnel" (fallback to PATH)
fn get_devtunnel_path() -> String {
    std::env::var("DEVTUNNEL_BIN")
        .or_else(|_| {
            which::which("devtunnel")
                .map(|p| p.to_string_lossy().to_string())
        })
        .unwrap_or_else(|_| "devtunnel".to_string())
}

#[allow(dead_code)]
pub struct AppState {
    pub client: Mutex<DevTunnelClient>,
}

#[allow(dead_code)]
impl AppState {
    pub fn new() -> Self {
        Self {
            client: Mutex::new(DevTunnelClient::new(get_devtunnel_path())),
        }
    }
}

// Authentication Commands

#[tauri::command]
pub fn login_devtunnel(
    app: tauri::AppHandle,
    provider: String,
    use_device_code: bool,
) -> CommandResponse<String> {
    emit_log(&app, &format!("Attempting login with provider: {}", provider));

    let client = DevTunnelClient::new(get_devtunnel_path());

    match client.login(&provider, use_device_code) {
        Ok(result) => {
            emit_log(&app, "Login successful");
            CommandResponse::success(result)
        },
        Err(e) => {
            emit_log(&app, &format!("ERROR: Login failed: {}", e));
            CommandResponse::error(e.to_string())
        },
    }
}

#[tauri::command]
pub fn logout_devtunnel(app: tauri::AppHandle) -> CommandResponse<String> {
    emit_log(&app, "Logging out...");

    let client = DevTunnelClient::new(get_devtunnel_path());

    match client.logout() {
        Ok(result) => {
            emit_log(&app, "Logout successful");
            CommandResponse::success(result)
        },
        Err(e) => {
            emit_log(&app, &format!("ERROR: Logout failed: {}", e));
            CommandResponse::error(e.to_string())
        },
    }
}

#[tauri::command]
pub fn get_user_info(app: tauri::AppHandle) -> CommandResponse<UserInfo> {
    emit_log(&app, "Checking user authentication status...");

    let client = DevTunnelClient::new(get_devtunnel_path());

    match client.get_user_info() {
        Ok(info) => {
            let username = info.user_name.as_deref().unwrap_or(&info.user_id);
            emit_log(&app, &format!("User authenticated: {}", username));
            CommandResponse::success(info)
        },
        Err(e) => {
            emit_log(&app, &format!("ERROR: Failed to get user info: {}", e));
            CommandResponse::error(e.to_string())
        },
    }
}

// Tunnel Management Commands

#[tauri::command]
pub fn create_tunnel(app: tauri::AppHandle, req: CreateTunnelRequest) -> CommandResponse<String> {
    let tunnel_id = req.tunnel_id.as_deref().unwrap_or("auto-generated");
    emit_log(&app, &format!("Creating tunnel: {}", tunnel_id));

    let client = DevTunnelClient::new(get_devtunnel_path());

    match client.create_tunnel(req.clone()) {
        Ok(result) => {
            emit_log(&app, "Tunnel created successfully");
            CommandResponse::success(result)
        },
        Err(e) => {
            emit_log(&app, &format!("ERROR: Failed to create tunnel: {}", e));
            CommandResponse::error(e.to_string())
        },
    }
}

#[tauri::command]
pub fn list_tunnels(app: tauri::AppHandle, req: Option<ListTunnelsRequest>) -> CommandResponse<Vec<TunnelListItem>> {
    emit_log(&app, "Loading tunnel list...");

    let client = DevTunnelClient::new(get_devtunnel_path());

    match client.list_tunnels(req) {
        Ok(tunnels) => {
            emit_log(&app, &format!("Loaded {} tunnel(s)", tunnels.len()));
            CommandResponse::success(tunnels)
        },
        Err(e) => {
            emit_log(&app, &format!("ERROR: Failed to list tunnels: {}", e));
            CommandResponse::error(e.to_string())
        },
    }
}

// 경량 목록: ports 없이 빠르게 반환
#[tauri::command]
pub fn list_tunnels_light(app: tauri::AppHandle, req: Option<ListTunnelsRequest>) -> CommandResponse<Vec<TunnelListItem>> {
    emit_log(&app, "Loading tunnel list (light mode)...");

    let client = DevTunnelClient::new(get_devtunnel_path());

    match client.list_tunnels_light(req) {
        Ok(tunnels) => {
            emit_log(&app, &format!("Loaded {} tunnel(s) in light mode", tunnels.len()));
            CommandResponse::success(tunnels)
        },
        Err(e) => {
            emit_log(&app, &format!("ERROR: Failed to list tunnels: {}", e));
            CommandResponse::error(e.to_string())
        },
    }
}

// 병렬 처리로 상세 정보 추가
#[tauri::command]
pub async fn enrich_tunnel_details(app: tauri::AppHandle, tunnel_ids: Vec<String>) -> CommandResponse<Vec<TunnelListItem>> {
    emit_log(&app, &format!("Enriching details for {} tunnel(s)...", tunnel_ids.len()));

    let client = DevTunnelClient::new(get_devtunnel_path());

    match client.enrich_tunnel_details(tunnel_ids).await {
        Ok(tunnels) => {
            emit_log(&app, "Tunnel details enriched successfully");
            CommandResponse::success(tunnels)
        },
        Err(e) => {
            emit_log(&app, &format!("ERROR: Failed to enrich tunnel details: {}", e));
            CommandResponse::error(e.to_string())
        },
    }
}

#[tauri::command]
pub fn show_tunnel(app: tauri::AppHandle, tunnel_id: Option<String>) -> CommandResponse<String> {
    let id_str = tunnel_id.as_deref().unwrap_or("current").to_string();
    emit_log(&app, &format!("Fetching details for tunnel: {}", id_str));

    let client = DevTunnelClient::new(get_devtunnel_path());

    match client.show_tunnel(tunnel_id) {
        Ok(result) => {
            emit_log(&app, &format!("Retrieved tunnel details for: {}", id_str));
            CommandResponse::success(result)
        },
        Err(e) => {
            emit_log(&app, &format!("ERROR: Failed to show tunnel: {}", e));
            CommandResponse::error(e.to_string())
        },
    }
}

#[tauri::command]
pub fn update_tunnel(app: tauri::AppHandle, req: UpdateTunnelRequest) -> CommandResponse<String> {
    emit_log(&app, &format!("Updating tunnel: {}", req.tunnel_id));

    let client = DevTunnelClient::new(get_devtunnel_path());

    match client.update_tunnel(req.clone()) {
        Ok(result) => {
            emit_log(&app, &format!("Tunnel updated: {}", req.tunnel_id));
            CommandResponse::success(result)
        },
        Err(e) => {
            emit_log(&app, &format!("ERROR: Failed to update tunnel: {}", e));
            CommandResponse::error(e.to_string())
        },
    }
}

#[tauri::command]
pub fn delete_tunnel(app: tauri::AppHandle, tunnel_id: String) -> CommandResponse<String> {
    emit_log(&app, &format!("Deleting tunnel: {}", tunnel_id));

    let client = DevTunnelClient::new(get_devtunnel_path());

    match client.delete_tunnel(tunnel_id.clone()) {
        Ok(result) => {
            emit_log(&app, &format!("Tunnel deleted: {}", tunnel_id));
            CommandResponse::success(result)
        },
        Err(e) => {
            emit_log(&app, &format!("ERROR: Failed to delete tunnel: {}", e));
            CommandResponse::error(e.to_string())
        },
    }
}

#[tauri::command]
pub fn delete_all_tunnels(app: tauri::AppHandle) -> CommandResponse<String> {
    emit_log(&app, "Deleting all tunnels...");

    let client = DevTunnelClient::new(get_devtunnel_path());

    match client.delete_all_tunnels() {
        Ok(result) => {
            emit_log(&app, "All tunnels deleted");
            CommandResponse::success(result)
        },
        Err(e) => {
            emit_log(&app, &format!("ERROR: Failed to delete all tunnels: {}", e));
            CommandResponse::error(e.to_string())
        },
    }
}

#[tauri::command]
pub async fn host_tunnel(app: tauri::AppHandle, req: HostTunnelRequest) -> CommandResponse<String> {
    let tunnel_id = req.tunnel_id.as_deref().unwrap_or("unknown");
    emit_log(&app, &format!("Starting tunnel host: {}", tunnel_id));

    let client = DevTunnelClient::new(get_devtunnel_path());

    match client.host_tunnel(req.clone()).await {
        Ok(_) => {
            emit_log(&app, &format!("Tunnel host started: {}", tunnel_id));
            CommandResponse::success("Tunnel hosting started".to_string())
        },
        Err(e) => {
            emit_log(&app, &format!("ERROR: Failed to host tunnel: {}", e));
            CommandResponse::error(e.to_string())
        },
    }
}

#[tauri::command]
pub fn stop_tunnel(app: tauri::AppHandle, tunnel_id: String) -> CommandResponse<String> {
    emit_log(&app, &format!("Stopping tunnel: {}", tunnel_id));

    let client = DevTunnelClient::new(get_devtunnel_path());

    match client.stop_tunnel(tunnel_id.clone()) {
        Ok(result) => {
            emit_log(&app, &format!("Tunnel stopped: {}", tunnel_id));
            CommandResponse::success(result)
        },
        Err(e) => {
            emit_log(&app, &format!("ERROR: Failed to stop tunnel: {}", e));
            CommandResponse::error(e.to_string())
        },
    }
}

#[tauri::command]
pub async fn restart_tunnel(app: tauri::AppHandle, req: HostTunnelRequest) -> CommandResponse<String> {
    let tunnel_id = req.tunnel_id.clone().unwrap_or_else(|| "unknown".to_string());
    emit_log(&app, &format!("Restarting tunnel: {}", tunnel_id));

    let client = DevTunnelClient::new(get_devtunnel_path());

    match client.restart_tunnel(req).await {
        Ok(result) => {
            emit_log(&app, &format!("Tunnel restarted: {}", tunnel_id));
            CommandResponse::success(result)
        },
        Err(e) => {
            emit_log(&app, &format!("ERROR: Failed to restart tunnel: {}", e));
            CommandResponse::error(e.to_string())
        },
    }
}

#[tauri::command]
pub fn get_tunnel_start_time(tunnel_id: String) -> CommandResponse<String> {
    let client = DevTunnelClient::new(get_devtunnel_path());

    match client.get_tunnel_start_time(tunnel_id) {
        Ok(start_time) => CommandResponse::success(start_time),
        Err(e) => CommandResponse::error(e.to_string()),
    }
}

#[tauri::command]
pub fn ping_port(app: tauri::AppHandle, url: String) -> CommandResponse<crate::types::PingResult> {
    emit_log(&app, &format!("Pinging port: {}", url));

    let client = DevTunnelClient::new(get_devtunnel_path());

    match client.ping_port(url.clone()) {
        Ok(result) => {
            emit_log(&app, &format!("Ping successful: {}", url));
            CommandResponse::success(result)
        },
        Err(e) => {
            emit_log(&app, &format!("ERROR: Ping failed: {}", e));
            CommandResponse::error(e.to_string())
        },
    }
}

// Port Management Commands

#[tauri::command]
pub fn create_port(app: tauri::AppHandle, req: CreatePortRequest) -> CommandResponse<String> {
    emit_log(&app, &format!("Creating port {} on tunnel {}", req.port_number, req.tunnel_id));

    let client = DevTunnelClient::new(get_devtunnel_path());

    match client.create_port(req.clone()) {
        Ok(result) => {
            emit_log(&app, &format!("Port {} created successfully", req.port_number));
            CommandResponse::success(result)
        },
        Err(e) => {
            emit_log(&app, &format!("ERROR: Failed to create port: {}", e));
            CommandResponse::error(e.to_string())
        },
    }
}

#[tauri::command]
pub fn list_ports(app: tauri::AppHandle, tunnel_id: String) -> CommandResponse<Vec<Port>> {
    emit_log(&app, &format!("Listing ports for tunnel: {}", tunnel_id));

    let client = DevTunnelClient::new(get_devtunnel_path());

    match client.list_ports(tunnel_id.clone()) {
        Ok(ports) => {
            emit_log(&app, &format!("Found {} port(s) for tunnel: {}", ports.len(), tunnel_id));
            CommandResponse::success(ports)
        },
        Err(e) => {
            emit_log(&app, &format!("ERROR: Failed to list ports: {}", e));
            CommandResponse::error(e.to_string())
        },
    }
}

#[tauri::command]
pub fn show_port(app: tauri::AppHandle, tunnel_id: String, port_number: u16) -> CommandResponse<Port> {
    emit_log(&app, &format!("Fetching port {} details for tunnel: {}", port_number, tunnel_id));

    let client = DevTunnelClient::new(get_devtunnel_path());

    match client.show_port(tunnel_id.clone(), port_number) {
        Ok(port) => {
            emit_log(&app, &format!("Retrieved port {} details", port_number));
            CommandResponse::success(port)
        },
        Err(e) => {
            emit_log(&app, &format!("ERROR: Failed to show port: {}", e));
            CommandResponse::error(e.to_string())
        },
    }
}

#[tauri::command]
pub fn update_port(app: tauri::AppHandle, req: UpdatePortRequest) -> CommandResponse<String> {
    emit_log(&app, &format!("Updating port {} on tunnel {}", req.port_number, req.tunnel_id));
    let client = DevTunnelClient::new(get_devtunnel_path());

    match client.update_port(req.clone()) {
        Ok(result) => {
            emit_log(&app, &format!("Port {} updated successfully", req.port_number));
            CommandResponse::success(result)
        },
        Err(e) => {
            emit_log(&app, &format!("ERROR: Failed to update port: {}", e));
            CommandResponse::error(e.to_string())
        },
    }
}

#[tauri::command]
pub fn delete_port(app: tauri::AppHandle, tunnel_id: String, port: u16) -> CommandResponse<String> {
    emit_log(&app, &format!("Deleting port {} from tunnel {}", port, tunnel_id));

    let client = DevTunnelClient::new(get_devtunnel_path());

    match client.delete_port(tunnel_id.clone(), port) {
        Ok(result) => {
            emit_log(&app, &format!("Port {} deleted successfully", port));
            CommandResponse::success(result)
        },
        Err(e) => {
            emit_log(&app, &format!("ERROR: Failed to delete port: {}", e));
            CommandResponse::error(e.to_string())
        },
    }
}

// Access Control Commands

#[tauri::command]
pub fn create_access(app: tauri::AppHandle, req: CreateAccessRequest) -> CommandResponse<String> {
    emit_log(&app, &format!("Creating access for tunnel: {}", req.tunnel_id));

    let client = DevTunnelClient::new(get_devtunnel_path());

    match client.create_access(req.clone()) {
        Ok(result) => {
            emit_log(&app, &format!("Access created for tunnel: {}", req.tunnel_id));
            CommandResponse::success(result)
        },
        Err(e) => {
            emit_log(&app, &format!("ERROR: Failed to create access: {}", e));
            CommandResponse::error(e.to_string())
        },
    }
}

#[tauri::command]
pub fn list_access(app: tauri::AppHandle, tunnel_id: String) -> CommandResponse<String> {
    emit_log(&app, &format!("Listing access for tunnel: {}", tunnel_id));

    let client = DevTunnelClient::new(get_devtunnel_path());

    match client.list_access(tunnel_id.clone()) {
        Ok(result) => {
            emit_log(&app, &format!("Retrieved access list for tunnel: {}", tunnel_id));
            CommandResponse::success(result)
        },
        Err(e) => {
            emit_log(&app, &format!("ERROR: Failed to list access: {}", e));
            CommandResponse::error(e.to_string())
        },
    }
}

#[tauri::command]
pub fn reset_access(app: tauri::AppHandle, tunnel_id: String) -> CommandResponse<String> {
    emit_log(&app, &format!("Resetting access for tunnel: {}", tunnel_id));

    let client = DevTunnelClient::new(get_devtunnel_path());

    match client.reset_access(tunnel_id.clone()) {
        Ok(result) => {
            emit_log(&app, &format!("Access reset for tunnel: {}", tunnel_id));
            CommandResponse::success(result)
        },
        Err(e) => {
            emit_log(&app, &format!("ERROR: Failed to reset access: {}", e));
            CommandResponse::error(e.to_string())
        },
    }
}

// Cluster Commands

#[tauri::command]
pub fn list_clusters(app: tauri::AppHandle, ping: bool) -> CommandResponse<Vec<Cluster>> {
    emit_log(&app, "Fetching available clusters...");

    let client = DevTunnelClient::new(get_devtunnel_path());

    match client.list_clusters(ping) {
        Ok(clusters) => {
            emit_log(&app, &format!("Found {} cluster(s)", clusters.len()));
            CommandResponse::success(clusters)
        },
        Err(e) => {
            emit_log(&app, &format!("ERROR: Failed to list clusters: {}", e));
            CommandResponse::error(e.to_string())
        },
    }
}

// System Commands

#[derive(serde::Serialize)]
pub struct DevTunnelInfo {
    pub installed: bool,
    pub path: Option<String>,
    pub version: Option<String>,
}

#[tauri::command]
pub fn check_devtunnel_installation() -> CommandResponse<DevTunnelInfo> {
    use std::process::Command;

    // Try to find devtunnel binary
    let binary_path = get_devtunnel_path();

    // Check if the binary exists and is executable
    let path_obj = std::path::Path::new(&binary_path);

    if !path_obj.exists() {
        // Try to find it in PATH
        if let Ok(output) = Command::new("which").arg("devtunnel").output() {
            if output.status.success() {
                let found_path = String::from_utf8_lossy(&output.stdout).trim().to_string();
                if !found_path.is_empty() {
                    // Get version
                    let version = Command::new(&found_path)
                        .arg("--version")
                        .output()
                        .ok()
                        .and_then(|o| {
                            if o.status.success() {
                                Some(String::from_utf8_lossy(&o.stdout).trim().to_string())
                            } else {
                                None
                            }
                        });

                    return CommandResponse::success(DevTunnelInfo {
                        installed: true,
                        path: Some(found_path),
                        version,
                    });
                }
            }
        }

        return CommandResponse::success(DevTunnelInfo {
            installed: false,
            path: None,
            version: None,
        });
    }

    // Binary exists at configured path, get version
    let version = Command::new(&binary_path)
        .arg("--version")
        .output()
        .ok()
        .and_then(|o| {
            if o.status.success() {
                Some(String::from_utf8_lossy(&o.stdout).trim().to_string())
            } else {
                None
            }
        });

    CommandResponse::success(DevTunnelInfo {
        installed: true,
        path: Some(binary_path),
        version,
    })
}

#[tauri::command]
pub fn open_url(url: String) -> CommandResponse<String> {
    use std::process::Command;
    use url::Url;

    // Validate URL: only allow http/https schemes
    match Url::parse(&url) {
        Ok(parsed) => {
            let scheme = parsed.scheme();
            if scheme != "http" && scheme != "https" {
                return CommandResponse::error(
                    format!("Invalid URL scheme: {}. Only http/https are allowed.", scheme)
                );
            }
        }
        Err(e) => {
            return CommandResponse::error(format!("Invalid URL format: {}", e));
        }
    }

    #[cfg(target_os = "linux")]
    let command_result = Command::new("xdg-open").arg(&url).spawn();

    #[cfg(target_os = "macos")]
    let command_result = Command::new("open").arg(&url).spawn();

    #[cfg(target_os = "windows")]
    let command_result = Command::new("cmd").args(&["/C", "start", &url]).spawn();

    match command_result {
        Ok(_) => CommandResponse::success("URL opened successfully".to_string()),
        Err(e) => CommandResponse::error(format!("Failed to open URL: {}", e)),
    }
}
