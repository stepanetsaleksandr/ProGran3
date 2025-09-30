import { BaseRepository } from './base.repository';
import { DatabaseConnection } from '../connection';

export class PluginRepository extends BaseRepository<any> {
  constructor() {
    super(DatabaseConnection.getInstance());
  }
  
  async create(data: any): Promise<any> {
    const { data: plugin, error } = await this.supabase
      .from('plugins')
      .insert(data)
      .select()
      .single();
    
    if (error) {
      this.handleError('Failed to create plugin', error);
    }
    
    return plugin;
  }
  
  async findById(id: number): Promise<any | null> {
    const { data: plugin, error } = await this.supabase
      .from('plugins')
      .select('*')
      .eq('id', id)
      .single();
    
    if (error && error.code !== 'PGRST116') {
      this.handleError('Failed to find plugin', error);
    }
    
    return plugin;
  }
  
  async findByPluginId(pluginId: string): Promise<any | null> {
    const { data: plugin, error } = await this.supabase
      .from('plugins')
      .select('*')
      .eq('plugin_id', pluginId)
      .single();
    
    if (error && error.code !== 'PGRST116') {
      this.handleError('Failed to find plugin', error);
    }
    
    return plugin;
  }
  
  async update(id: number, data: any): Promise<any> {
    const { data: plugin, error } = await this.supabase
      .from('plugins')
      .update(data)
      .eq('id', id)
      .select()
      .single();
    
    if (error) {
      this.handleError('Failed to update plugin', error);
    }
    
    return plugin;
  }
  
  async delete(id: number): Promise<boolean> {
    const { error } = await this.supabase
      .from('plugins')
      .delete()
      .eq('id', id);
    
    if (error) {
      this.handleError('Failed to delete plugin', error);
    }
    
    return true;
  }
  
  async upsert(data: any): Promise<any> {
    console.log('🔍 [PluginRepository] Upserting plugin with data:', data);
    
    // Спочатку перевіряємо, чи існує плагін
    const { data: existingPlugin, error: findError } = await this.supabase
      .from('plugins')
      .select('id, plugin_id, last_heartbeat, is_active, is_blocked')
      .eq('plugin_id', data.plugin_id)
      .single();
    
    console.log('🔍 [PluginRepository] Find existing plugin result:', { data: existingPlugin, error: findError });
    
    if (findError && findError.code !== 'PGRST116') {
      console.error('❌ [PluginRepository] Error finding existing plugin:', findError);
      this.handleError('Failed to find existing plugin', findError);
    }
    
    if (existingPlugin) {
      // Оновлюємо існуючий плагін
      console.log('🔄 [PluginRepository] Updating existing plugin:', existingPlugin.id);
      const { data: updatedPlugin, error: updateError } = await this.supabase
        .from('plugins')
        .update({
          ...data,
          updated_at: new Date().toISOString()
        })
        .eq('id', existingPlugin.id)
        .select('id, plugin_id, last_heartbeat, is_active, is_blocked')
        .single();
      
      console.log('🔍 [PluginRepository] Update result:', { data: updatedPlugin, error: updateError });
      
      if (updateError) {
        console.error('❌ [PluginRepository] Update error:', updateError);
        this.handleError('Failed to update plugin', updateError);
      }
      
      console.log('✅ [PluginRepository] Plugin updated successfully:', updatedPlugin);
      return updatedPlugin;
    } else {
      // Створюємо новий плагін
      console.log('➕ [PluginRepository] Creating new plugin');
      const { data: newPlugin, error: insertError } = await this.supabase
        .from('plugins')
        .insert({
          ...data,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select('id, plugin_id, last_heartbeat, is_active, is_blocked')
        .single();
      
      console.log('🔍 [PluginRepository] Insert result:', { data: newPlugin, error: insertError });
      
      if (insertError) {
        console.error('❌ [PluginRepository] Insert error:', insertError);
        this.handleError('Failed to create plugin', insertError);
      }
      
      console.log('✅ [PluginRepository] Plugin created successfully:', newPlugin);
      return newPlugin;
    }
  }
  
  async markInactive(pluginId: string): Promise<any> {
    const { data: plugin, error } = await this.supabase
      .from('plugins')
      .update({ 
        is_active: false,
        last_heartbeat: new Date().toISOString()
      })
      .eq('plugin_id', pluginId)
      .select('id, plugin_id, last_heartbeat, is_active, is_blocked')
      .single();
    
    if (error) {
      this.handleError('Failed to mark plugin inactive', error);
    }
    
    return plugin;
  }
  
  async findAll(): Promise<any[]> {
    const { data: plugins, error } = await this.supabase
      .from('plugins')
      .select('*')
      .order('last_heartbeat', { ascending: false });
    
    if (error) {
      this.handleError('Failed to find plugins', error);
    }
    
    return plugins || [];
  }
  
  async deleteByPluginId(pluginId: string): Promise<boolean> {
    const { error } = await this.supabase
      .from('plugins')
      .delete()
      .eq('plugin_id', pluginId);
    
    if (error) {
      this.handleError('Failed to delete plugin by plugin_id', error);
    }
    
    return true;
  }
}
