use crate::types::*;
use regex::Regex;

pub fn parse_user_info(output: &str) -> Option<UserInfo> {
    // Example output: "Logged in as Bae-ChangHyun using GitHub."
    let re = Regex::new(r"Logged in as (.+?) using (GitHub|Microsoft)\.").ok()?;

    if let Some(caps) = re.captures(output) {
        let user_name = caps.get(1)?.as_str().to_string();
        let provider_str = caps.get(2)?.as_str();

        let provider = match provider_str {
            "GitHub" => AuthProvider::GitHub,
            _ => AuthProvider::Microsoft,
        };

        Some(UserInfo {
            user_id: user_name.clone(),
            user_name: Some(user_name.clone()),
            email: None,
            provider,
            is_authenticated: true,
        })
    } else {
        None
    }
}

pub fn parse_tunnel_list(output: &str) -> Vec<TunnelListItem> {
    let mut tunnels = Vec::new();
    let lines: Vec<&str> = output.lines().collect();

    // Skip header lines (first 3 lines)
    for line in lines.iter().skip(3) {
        let trimmed = line.trim();
        if trimmed.is_empty() {
            continue;
        }

        // Split line into fixed-width columns based on actual CLI output
        // The output has columns with variable spacing, so we use whitespace splitting
        let parts: Vec<&str> = trimmed.split_whitespace().collect();

        if parts.is_empty() {
            continue;
        }

        // First part is always the tunnel ID
        let tunnel_id = parts[0].to_string();

        // Find "days" or "day" keyword to locate expiration
        let expiration_keyword_idx = parts.iter().position(|&p| p == "days" || p == "day");

        // Parse expiration
        let expires_at = if let Some(idx) = expiration_keyword_idx {
            if idx > 0 {
                let value: i64 = parts.get(idx - 1).and_then(|s| s.parse().ok()).unwrap_or(0);
                let unit = parts.get(idx).unwrap_or(&"");

                let seconds = match *unit {
                    "day" | "days" => value * 86400,
                    _ => 0,
                };

                if seconds > 0 {
                    let now = std::time::SystemTime::now();
                    let duration = std::time::Duration::from_secs(seconds as u64);
                    if let Some(future) = now.checked_add(duration) {
                        if let Ok(datetime) = future.duration_since(std::time::UNIX_EPOCH) {
                            Some(datetime.as_secs().to_string())
                        } else {
                            None
                        }
                    } else {
                        None
                    }
                } else {
                    None
                }
            } else {
                None
            }
        } else {
            None
        };

        // Description is everything after expiration keyword
        let description = if let Some(idx) = expiration_keyword_idx {
            if idx + 1 < parts.len() {
                Some(parts[idx + 1..].join(" "))
            } else {
                None
            }
        } else {
            None
        };

        // Port count is the number before expiration
        // DON'T generate dummy ports - leave empty, frontend will fetch from 'show' command
        let ports: Vec<u16> = Vec::new();

        tunnels.push(TunnelListItem {
            tunnel_id,
            description,
            tags: None,
            ports,
            status: TunnelStatus::Active,
            expires_at,
        });
    }

    tunnels
}

pub fn parse_tunnel_show(output: &str) -> Vec<u16> {
    let mut ports = Vec::new();
    let lines: Vec<&str> = output.lines().collect();

    // Find the "Ports" line
    let mut in_ports_section = false;

    for line in lines {
        let trimmed = line.trim();

        // Check if we've reached the Ports section
        if trimmed.starts_with("Ports") {
            in_ports_section = true;
            continue;
        }

        // If we're in ports section and line starts with a number, it's a port entry
        if in_ports_section {
            // Port lines look like: "  3002  http  https://..."
            let parts: Vec<&str> = trimmed.split_whitespace().collect();
            if let Some(first) = parts.first() {
                if let Ok(port) = first.parse::<u16>() {
                    ports.push(port);
                } else {
                    // If we can't parse a port number, we've left the ports section
                    break;
                }
            }
        }
    }

    ports
}

pub fn parse_port_show(output: &str) -> Option<Port> {
    // Example output:
    // Tunnel ID             : main.asse
    // Port Number           : 8001
    // Protocol              : auto
    // Description           : landing_web
    // Access control        : {Inherited: +Anonymous [connect]}
    // Client connections    : 0

    let mut port_number: Option<u16> = None;
    let mut protocol: Option<Protocol> = None;
    let mut description: Option<String> = None;

    for line in output.lines() {
        let trimmed = line.trim();

        if trimmed.starts_with("Port Number") {
            if let Some(colon_pos) = trimmed.find(':') {
                let value = trimmed[colon_pos + 1..].trim();
                port_number = value.parse::<u16>().ok();
            }
        } else if trimmed.starts_with("Protocol") {
            if let Some(colon_pos) = trimmed.find(':') {
                let value = trimmed[colon_pos + 1..].trim();
                protocol = match value {
                    "http" => Some(Protocol::Http),
                    "https" => Some(Protocol::Https),
                    "auto" => Some(Protocol::Auto),
                    _ => Some(Protocol::Auto),
                };
            }
        } else if trimmed.starts_with("Description") {
            if let Some(colon_pos) = trimmed.find(':') {
                let value = trimmed[colon_pos + 1..].trim();
                if !value.is_empty() {
                    description = Some(value.to_string());
                }
            }
        }
    }

    if let (Some(port), Some(proto)) = (port_number, protocol) {
        Some(Port {
            port_number: port,
            protocol: proto,
            description,
            port_forwarding_uris: None,
            inspect_uri: None,
        })
    } else {
        None
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_parse_user_info() {
        let output = "Logged in as Bae-ChangHyun using GitHub.";
        let info = parse_user_info(output).unwrap();
        assert_eq!(info.user_name, Some("Bae-ChangHyun".to_string()));
    }

    #[test]
    fn test_parse_tunnel_list() {
        let output = r#"Found 2 tunnels.

Tunnel ID                           Host Connections     Labels                    Ports                Expiration                Description
bch.asse                            1                                              8                    30 days
test2.asse                          0                                              0                    30 days                   test
"#;
        let tunnels = parse_tunnel_list(output);
        assert_eq!(tunnels.len(), 2);
        assert_eq!(tunnels[0].tunnel_id, "bch.asse");
    }
}
