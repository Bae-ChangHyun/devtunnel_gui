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

// Command invocation with automatic retry logic
async function invokeCommandWithRetry<T>(
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
    const response = await invoke<CommandResponse<string>>('create_tunnel', { req });

    if (!response.success || !response.data) {
      throw new Error(response.error || 'Failed to create tunnel');
    }

    return response.data;
  },

  list: async (req?: ListTunnelsRequest): Promise<TunnelListItem[]> => {
    const response = await invoke<CommandResponse<TunnelListItem[]>>('list_tunnels', { req });

    if (!response.success || !response.data) {
      throw new Error(response.error || 'Failed to list tunnels');
    }

    return response.data;
  },

  show: async (tunnelId?: string): Promise<string> => {
    const response = await invoke<CommandResponse<string>>('show_tunnel', { tunnelId });

    if (!response.success || !response.data) {
      throw new Error(response.error || 'Failed to show tunnel');
    }

    return response.data;
  },

  update: async (req: UpdateTunnelRequest): Promise<string> => {
    const response = await invoke<CommandResponse<string>>('update_tunnel', { req });

    if (!response.success || !response.data) {
      throw new Error(response.error || 'Failed to update tunnel');
    }

    return response.data;
  },

  delete: async (tunnelId: string): Promise<string> => {
    const response = await invoke<CommandResponse<string>>('delete_tunnel', { tunnelId });

    if (!response.success || !response.data) {
      throw new Error(response.error || 'Failed to delete tunnel');
    }

    return response.data;
  },

  deleteAll: async (): Promise<string> => {
    const response = await invoke<CommandResponse<string>>('delete_all_tunnels');

    if (!response.success || !response.data) {
      throw new Error(response.error || 'Failed to delete all tunnels');
    }

    return response.data;
  },

  host: async (req: HostTunnelRequest): Promise<string> => {
    const response = await invoke<CommandResponse<string>>('host_tunnel', { req });

    if (!response.success || !response.data) {
      throw new Error(response.error || 'Failed to host tunnel');
    }

    return response.data;
  },

  stop: async (tunnelId: string): Promise<string> => {
    const response = await invoke<CommandResponse<string>>('stop_tunnel', { tunnelId });

    if (!response.success || !response.data) {
      throw new Error(response.error || 'Failed to stop tunnel');
    }

    return response.data;
  },

  restart: async (req: HostTunnelRequest): Promise<string> => {
    const response = await invoke<CommandResponse<string>>('restart_tunnel', { req });

    if (!response.success || !response.data) {
      throw new Error(response.error || 'Failed to restart tunnel');
    }

    return response.data;
  },

  getStartTime: async (tunnelId: string): Promise<string> => {
    const response = await invoke<CommandResponse<string>>('get_tunnel_start_time', { tunnelId });

    if (!response.success || !response.data) {
      throw new Error(response.error || 'Failed to get tunnel start time');
    }

    return response.data;
  },
};

// Port Management API
export const portApi = {
  create: async (req: CreatePortRequest): Promise<string> => {
    const response = await invoke<CommandResponse<string>>('create_port', { req });

    if (!response.success || !response.data) {
      throw new Error(response.error || 'Failed to create port');
    }

    return response.data;
  },

  list: async (tunnelId: string): Promise<Port[]> => {
    const response = await invoke<CommandResponse<Port[]>>('list_ports', { tunnelId });

    if (!response.success || !response.data) {
      throw new Error(response.error || 'Failed to list ports');
    }

    return response.data;
  },

  show: async (tunnelId: string, portNumber: number): Promise<Port> => {
    const response = await invoke<CommandResponse<Port>>('show_port', { tunnelId, portNumber });

    if (!response.success || !response.data) {
      throw new Error(response.error || 'Failed to show port');
    }

    return response.data;
  },

  update: async (req: UpdatePortRequest): Promise<string> => {
    const response = await invoke<CommandResponse<string>>('update_port', { req });

    if (!response.success || !response.data) {
      throw new Error(response.error || 'Failed to update port');
    }

    return response.data;
  },

  delete: async (tunnelId: string, port: number): Promise<string> => {
    const response = await invoke<CommandResponse<string>>('delete_port', { tunnelId, port });

    if (!response.success || !response.data) {
      throw new Error(response.error || 'Failed to delete port');
    }

    return response.data;
  },

  ping: async (url: string): Promise<PingResult> => {
    const response = await invoke<CommandResponse<PingResult>>('ping_port', { url });

    if (!response.success || !response.data) {
      throw new Error(response.error || 'Failed to ping port');
    }

    return response.data;
  },
};

// Access Control API
export const accessApi = {
  create: async (req: CreateAccessRequest): Promise<string> => {
    const response = await invoke<CommandResponse<string>>('create_access', { req });

    if (!response.success || !response.data) {
      throw new Error(response.error || 'Failed to create access');
    }

    return response.data;
  },

  list: async (tunnelId: string): Promise<string> => {
    const response = await invoke<CommandResponse<string>>('list_access', { tunnelId });

    if (!response.success || !response.data) {
      throw new Error(response.error || 'Failed to list access');
    }

    return response.data;
  },

  reset: async (tunnelId: string): Promise<string> => {
    const response = await invoke<CommandResponse<string>>('reset_access', { tunnelId });

    if (!response.success || !response.data) {
      throw new Error(response.error || 'Failed to reset access');
    }

    return response.data;
  },
};

// Cluster API
export const clusterApi = {
  list: async (ping = false): Promise<Cluster[]> => {
    const response = await invoke<CommandResponse<Cluster[]>>('list_clusters', { ping });

    if (!response.success || !response.data) {
      throw new Error(response.error || 'Failed to list clusters');
    }

    return response.data;
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
    const response = await invoke<CommandResponse<DevTunnelInfo>>('check_devtunnel_installation');

    if (!response.success || !response.data) {
      throw new Error(response.error || 'Failed to check DevTunnel installation');
    }

    return response.data;
  },

  openUrl: async (url: string): Promise<string> => {
    const response = await invoke<CommandResponse<string>>('open_url', { url });

    if (!response.success || !response.data) {
      throw new Error(response.error || 'Failed to open URL');
    }

    return response.data;
  },
};
