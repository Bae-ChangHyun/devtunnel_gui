use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
#[serde(rename_all = "lowercase")]
pub enum Protocol {
    Http,
    Https,
    Auto,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "lowercase")]
pub enum TunnelStatus {
    Active,
    Stopped,
    Expired,
    Error,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "lowercase")]
pub enum AuthProvider {
    Microsoft,
    GitHub,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Port {
    #[serde(rename = "portNumber")]
    pub port_number: u16,
    pub protocol: Protocol,
    pub description: Option<String>,
    #[serde(rename = "portForwardingUris")]
    pub port_forwarding_uris: Option<Vec<String>>,
    #[serde(rename = "inspectUri")]
    pub inspect_uri: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PingResult {
    pub success: bool,
    #[serde(rename = "statusCode")]
    pub status_code: Option<u16>,
    #[serde(rename = "responseTimeMs")]
    pub response_time_ms: u64,
    pub error: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Tunnel {
    #[serde(rename = "tunnelId")]
    pub tunnel_id: String,
    #[serde(rename = "clusterId")]
    pub cluster_id: Option<String>,
    pub domain: Option<String>,
    pub description: Option<String>,
    pub tags: Option<Vec<String>>,
    pub ports: Vec<Port>,
    pub status: TunnelStatus,
    #[serde(rename = "createdAt")]
    pub created_at: Option<String>,
    #[serde(rename = "expiresAt")]
    pub expires_at: Option<String>,
    #[serde(rename = "allowAnonymous")]
    pub allow_anonymous: Option<bool>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct TunnelListItem {
    #[serde(rename = "tunnelId")]
    pub tunnel_id: String,
    pub description: Option<String>,
    pub tags: Option<Vec<String>>,
    pub ports: Vec<u16>,
    pub status: TunnelStatus,
    #[serde(rename = "expiresAt")]
    pub expires_at: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CreateTunnelRequest {
    #[serde(rename = "tunnelId")]
    pub tunnel_id: Option<String>,
    pub description: Option<String>,
    pub tags: Option<Vec<String>>,
    #[serde(rename = "allowAnonymous")]
    pub allow_anonymous: Option<bool>,
    pub expiration: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct HostTunnelRequest {
    #[serde(rename = "tunnelId")]
    pub tunnel_id: Option<String>,
    pub ports: Vec<u16>,
    pub protocol: Option<Protocol>,
    #[serde(rename = "allowAnonymous")]
    pub allow_anonymous: Option<bool>,
    pub expiration: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CreatePortRequest {
    #[serde(rename = "tunnelId")]
    pub tunnel_id: String,
    #[serde(rename = "portNumber")]
    pub port_number: u16,
    pub protocol: Option<Protocol>,
    pub description: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct UpdatePortRequest {
    #[serde(rename = "tunnelId")]
    pub tunnel_id: String,
    #[serde(rename = "portNumber")]
    pub port_number: u16,
    pub description: Option<String>,
    pub protocol: Option<Protocol>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct UserInfo {
    #[serde(rename = "userId")]
    pub user_id: String,
    #[serde(rename = "userName")]
    pub user_name: Option<String>,
    pub email: Option<String>,
    pub provider: AuthProvider,
    #[serde(rename = "isAuthenticated")]
    pub is_authenticated: bool,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Cluster {
    #[serde(rename = "clusterId")]
    pub cluster_id: String,
    pub uri: String,
    pub region: Option<String>,
    pub latency: Option<u64>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CommandResponse<T> {
    pub success: bool,
    pub data: Option<T>,
    pub error: Option<String>,
}

impl<T> CommandResponse<T> {
    pub fn success(data: T) -> Self {
        Self {
            success: true,
            data: Some(data),
            error: None,
        }
    }

    pub fn error(message: String) -> Self {
        Self {
            success: false,
            data: None,
            error: Some(message),
        }
    }
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ListTunnelsRequest {
    pub tags: Option<Vec<String>>,
    #[serde(rename = "allTags")]
    pub all_tags: Option<bool>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct UpdateTunnelRequest {
    #[serde(rename = "tunnelId")]
    pub tunnel_id: String,
    pub description: Option<String>,
    pub tags: Option<Vec<String>>,
    #[serde(rename = "removeTags")]
    pub remove_tags: Option<bool>,
    pub expiration: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AccessControlEntry {
    #[serde(rename = "type")]
    pub entry_type: String,
    pub scopes: Option<Vec<String>>,
    pub expiration: Option<String>,
    pub ports: Option<Vec<u16>>,
    #[serde(rename = "organizationId")]
    pub organization_id: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CreateAccessRequest {
    #[serde(rename = "tunnelId")]
    pub tunnel_id: String,
    pub entry: AccessControlEntry,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct LogEntry {
    pub timestamp: String,
    pub level: String,
    pub message: String,
    pub source: Option<String>,
}
