import { invoke } from '@tauri-apps/api/core';
import type {
  CommandResponse,
  CreateTunnelRequest,
  HostTunnelRequest,
  TunnelListItem,
  ListTunnelsRequest,
  UpdateTunnelRequest,
  CreatePortRequest,
  UpdatePortRequest,
  Port,
  CreateAccessRequest,
  UserInfo,
  Cluster,
  PingResult,
} from '../types/devtunnel';

// API Error class for better error handling
export class ApiError extends Error {
  constructor(message: string, public command?: string) {
    super(message);
    this.name = 'ApiError';
  }
}

// Common wrapper for Tauri command invocations
async function invokeCommand<T>(
  command: string,
  args?: Record<string, unknown>,
  errorMessage?: string
): Promise<T> {
  const response = await invoke<CommandResponse<T>>(command, args);

  if (!response.success || response.data === undefined || response.data === null) {
    throw new ApiError(
      response.error || errorMessage || `Command '${command}' failed`,
      command
    );
  }

  return response.data;
}

// Helper function for exponential backoff delay
function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// Command invocation with automatic retry logic (exported for future use)
export async function invokeCommandWithRetry<T>(
  command: string,
  args?: Record<string, unknown>,
  errorMessage?: string,
  maxRetries = 3
): Promise<T> {
  let lastError: ApiError | null = null;

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await invokeCommand<T>(command, args, errorMessage);
    } catch (error) {
      lastError = error as ApiError;

      // Don't retry on certain error types (authentication, validation, etc.)
      if (lastError.message.includes('authentication') ||
          lastError.message.includes('not found') ||
          lastError.message.includes('invalid')) {
        throw lastError;
      }

      // On last attempt, throw the error
      if (attempt === maxRetries - 1) {
        throw lastError;
      }

      // Exponential backoff: wait 1s, 2s, 4s, etc.
      const delayMs = 1000 * Math.pow(2, attempt);
      await delay(delayMs);
    }
  }

  throw lastError;
}

// Authentication API
export const authApi = {
  login: async (provider: 'microsoft' | 'github', useDeviceCode = false): Promise<string> => {
    return invokeCommand<string>('login_devtunnel', { provider, useDeviceCode }, 'Login failed');
  },

  logout: async (): Promise<string> => {
    return invokeCommand<string>('logout_devtunnel', undefined, 'Logout failed');
  },

  getUserInfo: async (): Promise<UserInfo> => {
    return invokeCommand<UserInfo>('get_user_info', undefined, 'Failed to get user info');
  },
};

// Tunnel Management API
export const tunnelApi = {
  create: async (req: CreateTunnelRequest): Promise<string> => {
    return invokeCommand<string>('create_tunnel', { req }, 'Failed to create tunnel');
  },

  list: async (req?: ListTunnelsRequest): Promise<TunnelListItem[]> => {
    return invokeCommand<TunnelListItem[]>('list_tunnels', { req }, 'Failed to list tunnels');
  },

  show: async (tunnelId?: string): Promise<string> => {
    return invokeCommand<string>('show_tunnel', { tunnelId }, 'Failed to show tunnel');
  },

  update: async (req: UpdateTunnelRequest): Promise<string> => {
    return invokeCommand<string>('update_tunnel', { req }, 'Failed to update tunnel');
  },

  delete: async (tunnelId: string): Promise<string> => {
    return invokeCommand<string>('delete_tunnel', { tunnelId }, 'Failed to delete tunnel');
  },

  deleteAll: async (): Promise<string> => {
    return invokeCommand<string>('delete_all_tunnels', undefined, 'Failed to delete all tunnels');
  },

  host: async (req: HostTunnelRequest): Promise<string> => {
    return invokeCommand<string>('host_tunnel', { req }, 'Failed to host tunnel');
  },

  stop: async (tunnelId: string): Promise<string> => {
    return invokeCommand<string>('stop_tunnel', { tunnelId }, 'Failed to stop tunnel');
  },

  restart: async (req: HostTunnelRequest): Promise<string> => {
    return invokeCommand<string>('restart_tunnel', { req }, 'Failed to restart tunnel');
  },

  getStartTime: async (tunnelId: string): Promise<string> => {
    return invokeCommand<string>('get_tunnel_start_time', { tunnelId }, 'Failed to get tunnel start time');
  },
};

// Port Management API
export const portApi = {
  create: async (req: CreatePortRequest): Promise<string> => {
    return invokeCommand<string>('create_port', { req }, 'Failed to create port');
  },

  list: async (tunnelId: string): Promise<Port[]> => {
    return invokeCommand<Port[]>('list_ports', { tunnelId }, 'Failed to list ports');
  },

  show: async (tunnelId: string, portNumber: number): Promise<Port> => {
    return invokeCommand<Port>('show_port', { tunnelId, portNumber }, 'Failed to show port');
  },

  update: async (req: UpdatePortRequest): Promise<string> => {
    return invokeCommand<string>('update_port', { req }, 'Failed to update port');
  },

  delete: async (tunnelId: string, port: number): Promise<string> => {
    return invokeCommand<string>('delete_port', { tunnelId, port }, 'Failed to delete port');
  },

  ping: async (url: string): Promise<PingResult> => {
    return invokeCommand<PingResult>('ping_port', { url }, 'Failed to ping port');
  },
};

// Access Control API
export const accessApi = {
  create: async (req: CreateAccessRequest): Promise<string> => {
    return invokeCommand<string>('create_access', { req }, 'Failed to create access');
  },

  list: async (tunnelId: string): Promise<string> => {
    return invokeCommand<string>('list_access', { tunnelId }, 'Failed to list access');
  },

  reset: async (tunnelId: string): Promise<string> => {
    return invokeCommand<string>('reset_access', { tunnelId }, 'Failed to reset access');
  },
};

// Cluster API
export const clusterApi = {
  list: async (ping = false): Promise<Cluster[]> => {
    return invokeCommand<Cluster[]>('list_clusters', { ping }, 'Failed to list clusters');
  },
};

// System API
export interface DevTunnelInfo {
  installed: boolean;
  path: string | null;
  version: string | null;
}

export const systemApi = {
  checkDevTunnelInstallation: async (): Promise<DevTunnelInfo> => {
    return invokeCommand<DevTunnelInfo>('check_devtunnel_installation', undefined, 'Failed to check DevTunnel installation');
  },

  openUrl: async (url: string): Promise<string> => {
    return invokeCommand<string>('open_url', { url }, 'Failed to open URL');
  },
};
