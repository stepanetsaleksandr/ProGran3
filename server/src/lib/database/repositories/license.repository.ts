import { BaseRepository } from './base.repository';
import { DatabaseConnection } from '../connection';

export class LicenseRepository extends BaseRepository<any> {
  constructor() {
    super(DatabaseConnection.getInstance());
  }
  
  async create(data: any): Promise<any> {
    console.log('🔍 [LicenseRepository] Creating license with data:', data);
    
    const { data: license, error } = await this.supabase
      .from('licenses')
      .insert(data)
      .select()
      .single();
    
    console.log('🔍 [LicenseRepository] Insert result:', { data: license, error });
    
    if (error) {
      console.error('❌ [LicenseRepository] Insert error:', error);
      this.handleError('Failed to create license', error);
    }
    
    console.log('✅ [LicenseRepository] License created successfully:', license);
    return license;
  }
  
  async findById(id: number): Promise<any | null> {
    const { data: license, error } = await this.supabase
      .from('licenses')
      .select('*')
      .eq('id', id)
      .single();
    
    if (error && error.code !== 'PGRST116') {
      this.handleError('Failed to find license', error);
    }
    
    return license;
  }
  
  async findByKey(licenseKey: string): Promise<any | null> {
    const { data: license, error } = await this.supabase
      .from('licenses')
      .select('*')
      .eq('license_key', licenseKey)
      .single();
    
    if (error && error.code !== 'PGRST116') {
      this.handleError('Failed to find license', error);
    }
    
    return license;
  }
  
  async update(id: number, data: any): Promise<any> {
    const { data: license, error } = await this.supabase
      .from('licenses')
      .update(data)
      .eq('id', id)
      .select()
      .single();
    
    if (error) {
      this.handleError('Failed to update license', error);
    }
    
    return license;
  }
  
  async delete(id: number): Promise<boolean> {
    const { error } = await this.supabase
      .from('licenses')
      .delete()
      .eq('id', id);
    
    if (error) {
      this.handleError('Failed to delete license', error);
    }
    
    return true;
  }
  
  async findAll(): Promise<any[]> {
    console.log('🔍 [LicenseRepository] Finding all licenses');
    
    const { data: licenses, error } = await this.supabase
      .from('licenses')
      .select('*')
      .order('created_at', { ascending: false });
    
    console.log('🔍 [LicenseRepository] Find all result:', { data: licenses, error });
    
    if (error) {
      console.error('❌ [LicenseRepository] Find all error:', error);
      this.handleError('Failed to find licenses', error);
    }
    
    console.log('✅ [LicenseRepository] Found licenses:', licenses?.length || 0);
    return licenses || [];
  }
  
  async incrementActivationCount(id: number): Promise<void> {
    // Спочатку отримуємо поточне значення
    const { data: license, error: fetchError } = await this.supabase
      .from('licenses')
      .select('activation_count')
      .eq('id', id)
      .single();
    
    if (fetchError) {
      this.handleError('Failed to fetch license for increment', fetchError);
      return;
    }
    
    // Оновлюємо з новим значенням
    const { error } = await this.supabase
      .from('licenses')
      .update({ activation_count: (license.activation_count || 0) + 1 })
      .eq('id', id);
    
    if (error) {
      this.handleError('Failed to increment activation count', error);
    }
  }
}
