import { ValidationService } from './validation.service';
import { PluginRepository } from '../database/repositories/plugin.repository';
import { LicenseService } from './license.service';
import { ApiError } from '../errors/api.error';

export interface HeartbeatRequest {
  plugin_id: string;
  plugin_name: string;
  version: string;
  user_id?: string;
  computer_name?: string;
  system_info?: any;
  timestamp: string;
  action?: string;
  source?: string;
  update_existing?: boolean;
  force_update?: boolean;
  license_info?: {
    email?: string;
    license_key?: string;
    hardware_id?: string;
  };
}

export interface HeartbeatResponse {
  success: boolean;
  message: string;
  plugin: {
    id: number;
    plugin_id: string;
    last_heartbeat: string;
    is_active: boolean;
    is_blocked: boolean;
  };
}

export class PluginService {
  constructor(
    private pluginRepo: PluginRepository,
    private licenseService: LicenseService
  ) {}

  async processHeartbeat(data: HeartbeatRequest, ipAddress: string): Promise<HeartbeatResponse> {
    // 1. Validate plugin data
    ValidationService.validateHeartbeatData(data);
    
    // 2. Check license if provided
    let isBlocked = false;
    if (data.license_info && data.license_info.email && data.license_info.license_key && data.license_info.hardware_id) {
      const validation = await this.licenseService.validateLicense({
        email: data.license_info.email,
        license_key: data.license_info.license_key,
        hardware_id: data.license_info.hardware_id
      });
      
      isBlocked = !validation.isValid;
    }
    
    // 3. Process action
    let result;
    let message;
    
    if (data.action === 'plugin_shutdown') {
      result = await this.pluginRepo.markInactive(data.plugin_id);
      message = 'Plugin shutdown signal received';
    } else {
      // Update plugin status
      result = await this.pluginRepo.upsert({
        plugin_id: data.plugin_id,
        plugin_name: data.plugin_name,
        version: data.version,
        user_id: data.user_id,
        computer_name: data.computer_name,
        system_info: data.system_info,
        ip_address: ipAddress,
        last_heartbeat: data.timestamp,
        is_blocked: isBlocked,
        is_active: !isBlocked
      });
      
      message = 'Heartbeat updated successfully';
    }
    
    return {
      success: true,
      message,
      plugin: {
        id: result.id,
        plugin_id: result.plugin_id,
        last_heartbeat: result.last_heartbeat,
        is_active: result.is_active,
        is_blocked: result.is_blocked
      }
    };
  }

  async getAllPlugins(): Promise<any[]> {
    return await this.pluginRepo.findAll();
  }

  async deletePlugin(pluginId: string): Promise<boolean> {
    return await this.pluginRepo.deleteByPluginId(pluginId);
  }
}
