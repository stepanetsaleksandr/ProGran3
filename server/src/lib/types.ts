// TypeScript типи для ProGran3 API

export interface HeartbeatRequest {
  plugin_id: string;
  plugin_name: string;
  version: string;
  user_id: string;
  computer_name: string;
  system_info: {
    os: string;
    ruby_version: string;
    sketchup_version: string;
    architecture: string;
  };
  timestamp: string;
  action: string;
  source: string;
  update_existing: boolean;
  force_update: boolean;
}

export interface PluginRecord {
  id: number;
  plugin_id: string;
  plugin_name: string;
  version: string;
  user_id: string;
  computer_name: string;
  system_info: object;
  ip_address: string;
  last_heartbeat: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface HeartbeatResponse {
  success: boolean;
  message: string;
  plugin: {
    id: number;
    plugin_id: string;
    last_heartbeat: string;
    is_active: boolean;
  };
}

export interface PluginsResponse {
  success: boolean;
  data: {
    plugins: PluginRecord[];
    stats: {
      total_plugins: number;
      active_plugins: number;
      recent_plugins: number;
    };
    last_updated: string;
  };
}

export interface ErrorResponse {
  success: false;
  error: string;
  code?: string;
}
