use crate::types::*;
use crate::parser;
use anyhow::{Context, Result};
use std::process::{Command, Stdio};
use std::sync::{Arc, Mutex};
use std::collections::HashMap;
use tokio::process::Command as TokioCommand;

// Configuration constants
const PROCESS_START_DELAY_MS: u64 = 1500; // Wait time after starting a host process
const PROCESS_STOP_DELAY_MS: u64 = 500;   // Wait time after stopping a process before restart

pub struct DevTunnelClient {
    binary_path: String,
    // Maps tunnel_id to process_id for tracking active host processes
    active_processes: Arc<Mutex<HashMap<String, u32>>>,
}

impl DevTunnelClient {
    pub fn new(binary_path: String) -> Self {
        Self {
            binary_path,
            active_processes: Arc::new(Mutex::new(HashMap::new())),
        }
    }

    fn build_command(&self) -> Command {
        Command::new(&self.binary_path)
    }

    fn build_tokio_command(&self) -> TokioCommand {
        TokioCommand::new(&self.binary_path)
    }

    // Authentication
    pub fn login(&self, provider: &str, use_device_code: bool) -> Result<String> {
        let mut cmd = self.build_command();
        cmd.arg("user").arg("login");

        if provider == "github" {
            cmd.arg("-g");
        }

        if use_device_code {
            cmd.arg("-d");
        }

        let output = cmd
            .output()
            .context("Failed to execute devtunnel login")?;

        if output.status.success() {
            Ok(String::from_utf8_lossy(&output.stdout).to_string())
        } else {
            Err(anyhow::anyhow!(
                "Login failed: {}",
                String::from_utf8_lossy(&output.stderr)
            ))
        }
    }

    pub fn logout(&self) -> Result<String> {
        let output = self
            .build_command()
            .arg("user")
            .arg("logout")
            .output()
            .context("Failed to execute devtunnel logout")?;

        if output.status.success() {
            Ok("Logged out successfully".to_string())
        } else {
            Err(anyhow::anyhow!(
                "Logout failed: {}",
                String::from_utf8_lossy(&output.stderr)
            ))
        }
    }

    pub fn get_user_info(&self) -> Result<UserInfo> {
        let output = self
            .build_command()
            .arg("user")
            .arg("show")
            .output()
            .context("Failed to get user info")?;

        if output.status.success() {
            let stdout = String::from_utf8_lossy(&output.stdout);

            // Parse user info from output
            if let Some(user_info) = parser::parse_user_info(&stdout) {
                Ok(user_info)
            } else {
                Err(anyhow::anyhow!("Failed to parse user info"))
            }
        } else {
            Err(anyhow::anyhow!("Not authenticated"))
        }
    }

    // Tunnel Management
    pub fn create_tunnel(&self, req: CreateTunnelRequest) -> Result<String> {
        let mut cmd = self.build_command();
        cmd.arg("create");

        if let Some(tunnel_id) = &req.tunnel_id {
            cmd.arg(tunnel_id);
        }

        if req.allow_anonymous.unwrap_or(false) {
            cmd.arg("-a");
        }

        if let Some(description) = &req.description {
            cmd.arg("-d").arg(description);
        }

        if let Some(tags) = &req.tags {
            if !tags.is_empty() {
                cmd.arg("--tags");
                for tag in tags {
                    cmd.arg(tag);
                }
            }
        }

        if let Some(expiration) = &req.expiration {
            cmd.arg("--expiration").arg(expiration);
        }

        let output = cmd
            .output()
            .context("Failed to create tunnel")?;

        if output.status.success() {
            Ok(String::from_utf8_lossy(&output.stdout).to_string())
        } else {
            Err(anyhow::anyhow!(
                "Failed to create tunnel: {}",
                String::from_utf8_lossy(&output.stderr)
            ))
        }
    }

    // 경량 목록: ports 정보 없이 빠르게 반환
    pub fn list_tunnels_light(&self, req: Option<ListTunnelsRequest>) -> Result<Vec<TunnelListItem>> {
        let mut cmd = self.build_command();
        cmd.arg("list");

        if let Some(req) = req {
            if let Some(tags) = &req.tags {
                if req.all_tags.unwrap_or(false) {
                    cmd.arg("--all-tags");
                } else {
                    cmd.arg("--tags");
                }
                for tag in tags {
                    cmd.arg(tag);
                }
            }
        }

        let output = cmd
            .output()
            .context("Failed to list tunnels")?;

        if output.status.success() {
            let stdout = String::from_utf8_lossy(&output.stdout);
            let tunnels = parser::parse_tunnel_list(&stdout);
            Ok(tunnels)
        } else {
            Err(anyhow::anyhow!(
                "Failed to list tunnels: {}",
                String::from_utf8_lossy(&output.stderr)
            ))
        }
    }

    // 병렬 처리로 상세 정보 추가
    pub async fn enrich_tunnel_details(&self, tunnel_ids: Vec<String>) -> Result<Vec<TunnelListItem>> {
        use tokio::task::JoinSet;

        let mut set = JoinSet::new();

        for tunnel_id in tunnel_ids {
            let binary_path = self.binary_path.clone();
            set.spawn(async move {
                let client = DevTunnelClient::new(binary_path);
                let show_output = client.show_tunnel(Some(tunnel_id.clone()))?;
                let port_numbers = parser::parse_tunnel_show(&show_output);
                Ok::<(String, Vec<u16>), anyhow::Error>((tunnel_id, port_numbers))
            });
        }

        let mut results = Vec::new();
        while let Some(res) = set.join_next().await {
            match res {
                Ok(Ok((tunnel_id, port_numbers))) => {
                    results.push((tunnel_id, port_numbers));
                }
                Ok(Err(e)) => {
                    eprintln!("Failed to fetch details for tunnel: {}", e);
                }
                Err(e) => {
                    eprintln!("Task join error: {}", e);
                }
            }
        }

        // 경량 목록을 다시 가져와서 ports 정보를 병합
        let mut tunnels = self.list_tunnels_light(None)?;
        for tunnel in &mut tunnels {
            if let Some((_, port_numbers)) = results.iter().find(|(id, _)| id == &tunnel.tunnel_id) {
                tunnel.ports = port_numbers.clone();
            }
        }

        Ok(tunnels)
    }

    // 기존 호환성을 위한 함수 (동기 버전, 병렬 처리 없음)
    pub fn list_tunnels(&self, req: Option<ListTunnelsRequest>) -> Result<Vec<TunnelListItem>> {
        let mut cmd = self.build_command();
        cmd.arg("list");

        if let Some(req) = req {
            if let Some(tags) = &req.tags {
                if req.all_tags.unwrap_or(false) {
                    cmd.arg("--all-tags");
                } else {
                    cmd.arg("--tags");
                }
                for tag in tags {
                    cmd.arg(tag);
                }
            }
        }

        let output = cmd
            .output()
            .context("Failed to list tunnels")?;

        if output.status.success() {
            let stdout = String::from_utf8_lossy(&output.stdout);

            // Parse tunnel list
            let mut tunnels = parser::parse_tunnel_list(&stdout);

            // For each tunnel, fetch detailed info to get actual ports
            for tunnel in &mut tunnels {
                if let Ok(show_output) = self.show_tunnel(Some(tunnel.tunnel_id.clone())) {
                    let ports = parser::parse_tunnel_show(&show_output);
                    tunnel.ports = ports;
                }
            }

            Ok(tunnels)
        } else {
            Err(anyhow::anyhow!(
                "Failed to list tunnels: {}",
                String::from_utf8_lossy(&output.stderr)
            ))
        }
    }

    pub fn show_tunnel(&self, tunnel_id: Option<String>) -> Result<String> {
        let mut cmd = self.build_command();
        cmd.arg("show");

        if let Some(id) = tunnel_id {
            cmd.arg(id);
        }

        let output = cmd
            .output()
            .context("Failed to show tunnel")?;

        if output.status.success() {
            Ok(String::from_utf8_lossy(&output.stdout).to_string())
        } else {
            Err(anyhow::anyhow!(
                "Failed to show tunnel: {}",
                String::from_utf8_lossy(&output.stderr)
            ))
        }
    }

    pub fn update_tunnel(&self, req: UpdateTunnelRequest) -> Result<String> {
        let mut cmd = self.build_command();
        cmd.arg("update").arg(&req.tunnel_id);

        if let Some(description) = &req.description {
            cmd.arg("-d").arg(description);
        }

        if req.remove_tags.unwrap_or(false) {
            cmd.arg("--remove-tags");
        } else if let Some(tags) = &req.tags {
            cmd.arg("--tags");
            for tag in tags {
                cmd.arg(tag);
            }
        }

        if let Some(expiration) = &req.expiration {
            cmd.arg("--expiration").arg(expiration);
        }

        let output = cmd
            .output()
            .context("Failed to update tunnel")?;

        if output.status.success() {
            Ok(String::from_utf8_lossy(&output.stdout).to_string())
        } else {
            Err(anyhow::anyhow!(
                "Failed to update tunnel: {}",
                String::from_utf8_lossy(&output.stderr)
            ))
        }
    }

    pub fn delete_tunnel(&self, tunnel_id: String) -> Result<String> {
        let output = self
            .build_command()
            .arg("delete")
            .arg(tunnel_id)
            .output()
            .context("Failed to delete tunnel")?;

        if output.status.success() {
            Ok("Tunnel deleted successfully".to_string())
        } else {
            Err(anyhow::anyhow!(
                "Failed to delete tunnel: {}",
                String::from_utf8_lossy(&output.stderr)
            ))
        }
    }

    pub fn delete_all_tunnels(&self) -> Result<String> {
        let output = self
            .build_command()
            .arg("delete-all")
            .output()
            .context("Failed to delete all tunnels")?;

        if output.status.success() {
            Ok("All tunnels deleted successfully".to_string())
        } else {
            Err(anyhow::anyhow!(
                "Failed to delete all tunnels: {}",
                String::from_utf8_lossy(&output.stderr)
            ))
        }
    }

    // Port Management
    pub fn create_port(&self, req: CreatePortRequest) -> Result<String> {
        let mut cmd = self.build_command();
        cmd.arg("port")
            .arg("create")
            .arg(&req.tunnel_id)
            .arg("-p")
            .arg(req.port_number.to_string());

        if let Some(protocol) = &req.protocol {
            let proto_str = match protocol {
                Protocol::Http => "http",
                Protocol::Https => "https",
                Protocol::Auto => "auto",
            };
            cmd.arg("--protocol").arg(proto_str);
        }

        if let Some(description) = &req.description {
            cmd.arg("--description").arg(description);
        }

        let output = cmd
            .output()
            .context("Failed to create port")?;

        if output.status.success() {
            Ok(String::from_utf8_lossy(&output.stdout).to_string())
        } else {
            Err(anyhow::anyhow!(
                "Failed to create port: {}",
                String::from_utf8_lossy(&output.stderr)
            ))
        }
    }

    pub fn list_ports(&self, tunnel_id: String) -> Result<Vec<Port>> {
        let output = self
            .build_command()
            .arg("port")
            .arg("list")
            .arg(&tunnel_id)
            .arg("-j")  // JSON output
            .output()
            .context("Failed to list ports")?;

        if output.status.success() {
            let stdout = String::from_utf8_lossy(&output.stdout);

            // Try to parse as JSON
            match serde_json::from_str::<Vec<Port>>(&stdout) {
                Ok(ports) => Ok(ports),
                Err(e) => {
                    // If JSON parsing fails, return empty vec with warning
                    eprintln!("Failed to parse ports JSON for tunnel {}: {}", tunnel_id, e);
                    Ok(Vec::new())
                }
            }
        } else {
            Err(anyhow::anyhow!(
                "Failed to list ports: {}",
                String::from_utf8_lossy(&output.stderr)
            ))
        }
    }

    pub fn show_port(&self, tunnel_id: String, port_number: u16) -> Result<Port> {
        let output = self
            .build_command()
            .arg("port")
            .arg("show")
            .arg(tunnel_id)
            .arg("--port-number")
            .arg(port_number.to_string())
            .output()
            .context("Failed to show port")?;

        if output.status.success() {
            let stdout = String::from_utf8_lossy(&output.stdout);

            if let Some(port) = parser::parse_port_show(&stdout) {
                Ok(port)
            } else {
                Err(anyhow::anyhow!("Failed to parse port details"))
            }
        } else {
            Err(anyhow::anyhow!(
                "Failed to show port: {}",
                String::from_utf8_lossy(&output.stderr)
            ))
        }
    }

    pub fn update_port_description(&self, req: UpdatePortRequest) -> Result<String> {
        let mut cmd = self.build_command();
        cmd.arg("port")
            .arg("update")
            .arg(&req.tunnel_id)
            .arg("-p")
            .arg(req.port_number.to_string());

        if let Some(description) = &req.description {
            cmd.arg("--description").arg(description);
        }

        let output = cmd
            .output()
            .context("Failed to update port")?;

        if output.status.success() {
            Ok(String::from_utf8_lossy(&output.stdout).to_string())
        } else {
            Err(anyhow::anyhow!(
                "Failed to update port: {}",
                String::from_utf8_lossy(&output.stderr)
            ))
        }
    }

    // Update port by recreating it (needed for protocol changes)
    pub fn update_port(&self, req: UpdatePortRequest) -> Result<String> {
        // If protocol is specified and different, we need to recreate the port
        if let Some(new_protocol) = &req.protocol {
            // Get current port details to compare
            if let Ok(current_port) = self.show_port(req.tunnel_id.clone(), req.port_number) {
                if &current_port.protocol != new_protocol {
                    // Protocol changed - need to delete and recreate
                    self.delete_port(req.tunnel_id.clone(), req.port_number)?;

                    // Recreate with new protocol
                    return self.create_port(CreatePortRequest {
                        tunnel_id: req.tunnel_id.clone(),
                        port_number: req.port_number,
                        protocol: Some(new_protocol.clone()),
                        description: req.description.clone(),
                    });
                }
            }
        }

        // No protocol change, just update description
        self.update_port_description(req)
    }

    pub fn delete_port(&self, tunnel_id: String, port: u16) -> Result<String> {
        let output = self
            .build_command()
            .arg("port")
            .arg("delete")
            .arg(tunnel_id)
            .arg("-p")
            .arg(port.to_string())
            .output()
            .context("Failed to delete port")?;

        if output.status.success() {
            Ok("Port deleted successfully".to_string())
        } else {
            Err(anyhow::anyhow!(
                "Failed to delete port: {}",
                String::from_utf8_lossy(&output.stderr)
            ))
        }
    }

    // Access Control
    pub fn create_access(&self, req: CreateAccessRequest) -> Result<String> {
        let mut cmd = self.build_command();
        cmd.arg("access")
            .arg("create")
            .arg(&req.tunnel_id);

        match req.entry.entry_type.as_str() {
            "anonymous" => {
                cmd.arg("--anonymous");
            }
            "organization" => {
                if let Some(org_id) = &req.entry.organization_id {
                    cmd.arg("--org").arg(org_id);
                }
            }
            _ => {}
        }

        if let Some(ports) = &req.entry.ports {
            for port in ports {
                cmd.arg("-p").arg(port.to_string());
            }
        }

        if let Some(expiration) = &req.entry.expiration {
            cmd.arg("--expiration").arg(expiration);
        }

        let output = cmd
            .output()
            .context("Failed to create access")?;

        if output.status.success() {
            Ok(String::from_utf8_lossy(&output.stdout).to_string())
        } else {
            Err(anyhow::anyhow!(
                "Failed to create access: {}",
                String::from_utf8_lossy(&output.stderr)
            ))
        }
    }

    pub fn list_access(&self, tunnel_id: String) -> Result<String> {
        let output = self
            .build_command()
            .arg("access")
            .arg("list")
            .arg(tunnel_id)
            .output()
            .context("Failed to list access")?;

        if output.status.success() {
            Ok(String::from_utf8_lossy(&output.stdout).to_string())
        } else {
            Err(anyhow::anyhow!(
                "Failed to list access: {}",
                String::from_utf8_lossy(&output.stderr)
            ))
        }
    }

    pub fn reset_access(&self, tunnel_id: String) -> Result<String> {
        let output = self
            .build_command()
            .arg("access")
            .arg("reset")
            .arg(tunnel_id)
            .output()
            .context("Failed to reset access")?;

        if output.status.success() {
            Ok("Access reset successfully".to_string())
        } else {
            Err(anyhow::anyhow!(
                "Failed to reset access: {}",
                String::from_utf8_lossy(&output.stderr)
            ))
        }
    }

    // Clusters
    pub fn list_clusters(&self, ping: bool) -> Result<Vec<Cluster>> {
        let mut cmd = self.build_command();
        cmd.arg("clusters");
        cmd.arg("-j");  // JSON output

        if ping {
            cmd.arg("--ping");
        }

        let output = cmd
            .output()
            .context("Failed to list clusters")?;

        if output.status.success() {
            let stdout = String::from_utf8_lossy(&output.stdout);

            // Try to parse as JSON
            match serde_json::from_str::<Vec<Cluster>>(&stdout) {
                Ok(clusters) => Ok(clusters),
                Err(e) => {
                    // If JSON parsing fails, return empty vec with warning
                    eprintln!("Failed to parse clusters JSON: {}", e);
                    Ok(Vec::new())
                }
            }
        } else {
            Err(anyhow::anyhow!(
                "Failed to list clusters: {}",
                String::from_utf8_lossy(&output.stderr)
            ))
        }
    }

    // Host tunnel (async operation)
    pub async fn host_tunnel(&self, req: HostTunnelRequest) -> Result<()> {
        let mut cmd = self.build_tokio_command();
        cmd.arg("host");

        if let Some(tunnel_id) = &req.tunnel_id {
            cmd.arg(tunnel_id);
        }

        // IMPORTANT: Do NOT pass -p flags when hosting a tunnel with pre-configured ports
        // DevTunnel will error with "Batch update of ports is not supported"
        // Ports should be added using 'devtunnel port create' before hosting
        // Only pass -p flags if you're creating a tunnel + port in one command
        // Since our workflow is: create tunnel -> add ports -> host, we skip -p here

        if req.allow_anonymous.unwrap_or(false) {
            cmd.arg("--allow-anonymous");
        }

        if let Some(expiration) = &req.expiration {
            cmd.arg("--expiration").arg(expiration);
        }

        // Don't pass protocol either - it's set when creating the port

        // Use null() instead of piped() to discard output
        // This prevents the process from blocking when buffers fill up
        cmd.stdout(Stdio::null())
            .stderr(Stdio::null());

        let mut child = cmd.spawn()
            .context("Failed to spawn devtunnel host")?;

        // Give it a moment to start
        tokio::time::sleep(tokio::time::Duration::from_millis(PROCESS_START_DELAY_MS)).await;

        // Check if process is still running
        match child.try_wait() {
            Ok(Some(status)) => {
                return Err(anyhow::anyhow!(
                    "devtunnel host process exited immediately with status: {}",
                    status
                ));
            }
            Ok(None) => {
                // Process is still running, store its PID for tracking
                if let Some(id) = &req.tunnel_id {
                    if let Some(pid) = child.id() {
                        let mut processes = self.active_processes.lock().unwrap();
                        processes.insert(id.clone(), pid);
                    }
                }
                // Child will be dropped here, but the process continues running
                // because stdout/stderr are set to null (not piped)
            }
            Err(e) => {
                return Err(anyhow::anyhow!("Failed to check process status: {}", e));
            }
        }

        Ok(())
    }

    #[allow(dead_code)]
    pub fn get_active_hosts(&self) -> Vec<String> {
        self.active_processes
            .lock()
            .unwrap()
            .keys()
            .cloned()
            .collect()
    }

    // Stop hosting tunnel by killing the devtunnel host process
    pub fn stop_tunnel(&self, tunnel_id: String) -> Result<String> {
        // SECURITY: Validate tunnel_id to prevent command injection
        // Tunnel IDs should only contain alphanumeric characters, dots, hyphens, and underscores
        // This prevents wildcards, shell metacharacters, and other potentially dangerous inputs
        let valid_id = regex::Regex::new(r"^[a-zA-Z0-9.\-_]+$").unwrap();
        if !valid_id.is_match(&tunnel_id) {
            return Err(anyhow::anyhow!(
                "Invalid tunnel ID format: contains potentially dangerous characters. \
                Only alphanumeric, dots, hyphens, and underscores are allowed."
            ));
        }

        #[cfg(target_os = "linux")]
        {
            let output = Command::new("pkill")
                .arg("-f")
                .arg(format!("devtunnel host {}", tunnel_id))
                .output()
                .context("Failed to execute pkill")?;

            // Remove from active process tracking
            let mut processes = self.active_processes.lock().unwrap();
            processes.remove(&tunnel_id);

            // pkill returns 0 if processes were killed, 1 if no processes matched
            if output.status.success() {
                Ok(format!("Tunnel {} stopped successfully", tunnel_id))
            } else {
                // Even if pkill returns 1, it might mean the process was already stopped
                Ok(format!("No active host process found for tunnel {}", tunnel_id))
            }
        }

        #[cfg(target_os = "macos")]
        {
            let output = Command::new("pkill")
                .arg("-f")
                .arg(format!("devtunnel host {}", tunnel_id))
                .output()
                .context("Failed to execute pkill")?;

            let mut processes = self.active_processes.lock().unwrap();
            processes.remove(&tunnel_id);

            if output.status.success() {
                Ok(format!("Tunnel {} stopped successfully", tunnel_id))
            } else {
                Ok(format!("No active host process found for tunnel {}", tunnel_id))
            }
        }

        #[cfg(target_os = "windows")]
        {
            // Use taskkill on Windows
            // SECURITY: tunnel_id has been validated with regex above to prevent injection
            // Only alphanumeric, dots, hyphens, and underscores are allowed
            let output = Command::new("taskkill")
                .arg("/F")
                .arg("/FI")
                .arg(format!("COMMANDLINE eq *devtunnel host {}*", tunnel_id))
                .output()
                .context("Failed to execute taskkill")?;

            let mut processes = self.active_processes.lock().unwrap();
            processes.remove(&tunnel_id);

            if output.status.success() {
                Ok(format!("Tunnel {} stopped successfully", tunnel_id))
            } else {
                Ok(format!("No active host process found for tunnel {}", tunnel_id))
            }
        }
    }

    // Restart tunnel by stopping and restarting
    pub async fn restart_tunnel(&self, req: HostTunnelRequest) -> Result<String> {
        if let Some(tunnel_id) = req.tunnel_id.clone() {
            // Stop the existing process
            let _ = self.stop_tunnel(tunnel_id.clone());

            // Wait a moment for the process to fully terminate
            tokio::time::sleep(tokio::time::Duration::from_millis(PROCESS_STOP_DELAY_MS)).await;

            // Start hosting again
            self.host_tunnel(req).await?;

            Ok(format!("Tunnel {} restarted successfully", tunnel_id))
        } else {
            Err(anyhow::anyhow!("Tunnel ID is required for restart"))
        }
    }

    // Get tunnel host process start time
    pub fn get_tunnel_start_time(&self, tunnel_id: String) -> Result<String> {
        #[cfg(any(target_os = "linux", target_os = "macos"))]
        {
            // Use ps to find the process and get its start time
            let output = Command::new("ps")
                .arg("-eo")
                .arg("pid,lstart,cmd")
                .output()
                .context("Failed to execute ps")?;

            if output.status.success() {
                let stdout = String::from_utf8_lossy(&output.stdout);

                // Look for lines containing "devtunnel host {tunnel_id}"
                for line in stdout.lines() {
                    if line.contains("devtunnel") && line.contains("host") && line.contains(&tunnel_id) {
                        // Parse the line: PID STARTED CMD
                        // Example: 12345 Mon Jan 15 14:30:25 2024 /home/user/bin/devtunnel host my-tunnel
                        let parts: Vec<&str> = line.split_whitespace().collect();

                        if parts.len() >= 6 {
                            // Extract the start time (indices 1-5 typically contain the lstart format)
                            let start_time = parts[1..6].join(" ");
                            return Ok(start_time);
                        }
                    }
                }

                Err(anyhow::anyhow!("No active host process found for tunnel {}", tunnel_id))
            } else {
                Err(anyhow::anyhow!("Failed to get process information"))
            }
        }

        #[cfg(target_os = "windows")]
        {
            // Use WMIC on Windows to get process start time
            let output = Command::new("wmic")
                .arg("process")
                .arg("where")
                .arg(format!("CommandLine like '%devtunnel host {}%'", tunnel_id))
                .arg("get")
                .arg("CreationDate")
                .output()
                .context("Failed to execute wmic")?;

            if output.status.success() {
                let stdout = String::from_utf8_lossy(&output.stdout);

                // Parse WMIC output (format: YYYYMMDDHHMMSS.mmmmmm+ZZZ)
                for line in stdout.lines().skip(1) {
                    let trimmed = line.trim();
                    if !trimmed.is_empty() {
                        // Convert Windows datetime format to readable format
                        if trimmed.len() >= 14 {
                            let year = &trimmed[0..4];
                            let month = &trimmed[4..6];
                            let day = &trimmed[6..8];
                            let hour = &trimmed[8..10];
                            let minute = &trimmed[10..12];
                            let second = &trimmed[12..14];

                            return Ok(format!("{}-{}-{} {}:{}:{}", year, month, day, hour, minute, second));
                        }
                    }
                }

                Err(anyhow::anyhow!("No active host process found for tunnel {}", tunnel_id))
            } else {
                Err(anyhow::anyhow!("Failed to get process information"))
            }
        }
    }

    // Ping a port URL to check if it's reachable
    pub fn ping_port(&self, url: String) -> Result<PingResult> {
        use std::time::Instant;

        let start = Instant::now();

        let output = Command::new("curl")
            .arg("-s")
            .arg("-o")
            .arg("/dev/null")
            .arg("-w")
            .arg("%{http_code}")
            .arg("--max-time")
            .arg("5")
            .arg(&url)
            .output()
            .context("Failed to execute curl")?;

        let elapsed = start.elapsed();
        let status_code = String::from_utf8_lossy(&output.stdout).trim().to_string();

        if output.status.success() {
            let code: u16 = status_code.parse().unwrap_or(0);

            Ok(PingResult {
                success: code > 0 && code < 600,
                status_code: Some(code),
                response_time_ms: elapsed.as_millis() as u64,
                error: None,
            })
        } else {
            let error_msg = String::from_utf8_lossy(&output.stderr).to_string();
            Ok(PingResult {
                success: false,
                status_code: None,
                response_time_ms: elapsed.as_millis() as u64,
                error: Some(if error_msg.is_empty() {
                    "Connection failed".to_string()
                } else {
                    error_msg
                }),
            })
        }
    }
}
