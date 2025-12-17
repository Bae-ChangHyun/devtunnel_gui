// DevTunnel Type Definitions

export type Protocol = 'http' | 'https' | 'auto';

export type TunnelStatus = 'active' | 'stopped' | 'expired' | 'error';

export type AuthProvider = 'microsoft' | 'github';

export type AccessScope = 'connect' | 'host' | 'manage';

export interface Port {
  portNumber: number;
  protocol: Protocol;
  description?: string;
  portForwardingUris?: string[];
  inspectUri?: string;
}

export interface PingResult {
  success: boolean;
  statusCode?: number;
  responseTimeMs: number;
  error?: string;
}

export interface Tunnel {
  tunnelId: string;
  clusterId?: string;
  domain?: string;
  description?: string;
  tags?: string[];
  ports: Port[];
  status: TunnelStatus;
  createdAt?: string;
  expiresAt?: string;
  allowAnonymous?: boolean;
}

export interface TunnelListItem {
  tunnelId: string;
  description?: string;
  tags?: string[];
  ports: number[];
  status: TunnelStatus;
  expiresAt?: string;
}

export interface CreateTunnelRequest {
  tunnelId?: string;
  description?: string;
  tags?: string[];
  allowAnonymous?: boolean;
  expiration?: string;
}

export interface HostTunnelRequest {
  tunnelId?: string;
  ports: number[];
  protocol?: Protocol;
  allowAnonymous?: boolean;
  expiration?: string;
}

export interface CreatePortRequest {
  tunnelId: string;
  portNumber: number;
  protocol?: Protocol;
  description?: string;
}

export interface UpdatePortRequest {
  tunnelId: string;
  portNumber: number;
  description?: string;
  protocol?: Protocol;
}

export interface AccessControlEntry {
  type: 'anonymous' | 'user' | 'tenant' | 'organization';
  scopes?: AccessScope[];
  expiration?: string;
  ports?: number[];
  // For specific types
  userId?: string;
  tenantId?: string;
  organizationId?: string;
}

export interface CreateAccessRequest {
  tunnelId: string;
  entry: AccessControlEntry;
}

export interface UserInfo {
  userId: string;
  userName?: string;
  email?: string;
  provider: AuthProvider;
  isAuthenticated: boolean;
}

export interface Cluster {
  clusterId: string;
  uri: string;
  region?: string;
  latency?: number;
}

export interface TunnelToken {
  token: string;
  scopes: AccessScope[];
  expiresAt?: string;
}

export interface LogEntry {
  timestamp: string;
  level: 'info' | 'warning' | 'error' | 'debug';
  message: string;
  source?: string;
}

export interface TunnelStats {
  tunnelId: string;
  totalConnections: number;
  activeConnections: number;
  bytesTransferred: number;
  requestCount: number;
  errorCount: number;
  uptime: number;
}

// Request/Response types for Tauri commands

export interface CommandResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

export interface ListTunnelsRequest {
  tags?: string[];
  allTags?: boolean;
}

export interface UpdateTunnelRequest {
  tunnelId: string;
  description?: string;
  tags?: string[];
  removeTags?: boolean;
  expiration?: string;
}

export interface DeleteTunnelRequest {
  tunnelId: string;
}

export interface TokenRequest {
  tunnelId: string;
  scopes: AccessScope[];
}

// Access Control Preset templates

export type AccessPresetType = 'public-demo' | 'team-only' | 'client-preview' | 'custom';

export interface AccessPreset {
  name: string;
  type: AccessPresetType;
  description: string;
  template: AccessControlEntry;
}

export const ACCESS_PRESETS: AccessPreset[] = [
  {
    name: 'Public Demo',
    type: 'public-demo',
    description: 'Public access for 24 hours',
    template: {
      type: 'anonymous',
      scopes: ['connect'],
      expiration: '24h',
    },
  },
  {
    name: 'Team Access',
    type: 'team-only',
    description: 'Organization members only',
    template: {
      type: 'organization',
      scopes: ['connect', 'host'],
      expiration: '30d',
    },
  },
  {
    name: 'Client Preview',
    type: 'client-preview',
    description: 'Token-based access for clients',
    template: {
      type: 'anonymous',
      scopes: ['connect'],
      expiration: '7d',
    },
  },
];

// Utility types

export interface FilterOptions {
  status?: TunnelStatus[];
  tags?: string[];
  searchTerm?: string;
}

export interface SortOptions {
  field: 'tunnelId' | 'createdAt' | 'expiresAt' | 'status';
  direction: 'asc' | 'desc';
}
