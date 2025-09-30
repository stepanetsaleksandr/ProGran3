import { BaseRepository } from './base.repository';
import { DatabaseConnection } from '../connection';

export class UserLicenseRepository extends BaseRepository<any> {
  constructor() {
    super(DatabaseConnection.getInstance());
  }
  
  async create(data: any): Promise<any> {
    const { data: userLicense, error } = await this.supabase
      .from('user_licenses')
      .insert(data)
      .select()
      .single();
    
    if (error) {
      this.handleError('Failed to create user license', error);
    }
    
    return userLicense;
  }
  
  async findById(id: number): Promise<any | null> {
    const { data: userLicense, error } = await this.supabase
      .from('user_licenses')
      .select('*')
      .eq('id', id)
      .single();
    
    if (error && error.code !== 'PGRST116') {
      this.handleError('Failed to find user license', error);
    }
    
    return userLicense;
  }
  
  async findByLicenseAndHardware(licenseKey: string, hardwareId: string): Promise<any | null> {
    const { data: userLicense, error } = await this.supabase
      .from('user_licenses')
      .select('*')
      .eq('license_key', licenseKey)
      .eq('hardware_id', hardwareId)
      .single();
    
    if (error && error.code !== 'PGRST116') {
      this.handleError('Failed to find user license', error);
    }
    
    return userLicense;
  }
  
  async update(id: number, data: any): Promise<any> {
    const { data: userLicense, error } = await this.supabase
      .from('user_licenses')
      .update(data)
      .eq('id', id)
      .select()
      .single();
    
    if (error) {
      this.handleError('Failed to update user license', error);
    }
    
    return userLicense;
  }
  
  async delete(id: number): Promise<boolean> {
    const { error } = await this.supabase
      .from('user_licenses')
      .delete()
      .eq('id', id);
    
    if (error) {
      this.handleError('Failed to delete user license', error);
    }
    
    return true;
  }
  
  async updateHeartbeat(id: number): Promise<any> {
    const { data: userLicense, error } = await this.supabase
      .from('user_licenses')
      .update({ 
        last_heartbeat: new Date().toISOString(),
        is_active: true
      })
      .eq('id', id)
      .select()
      .single();
    
    if (error) {
      this.handleError('Failed to update heartbeat', error);
    }
    
    return userLicense;
  }
  
  async findAll(): Promise<any[]> {
    const { data: userLicenses, error } = await this.supabase
      .from('user_licenses')
      .select('*')
      .order('activated_at', { ascending: false });
    
    if (error) {
      this.handleError('Failed to find user licenses', error);
    }
    
    return userLicenses || [];
  }
  
  async deleteByLicenseKey(licenseKey: string): Promise<void> {
    const { error } = await this.supabase
      .from('user_licenses')
      .delete()
      .eq('license_key', licenseKey);
    
    if (error) {
      this.handleError('Failed to delete user licenses by license key', error);
    }
  }
}
