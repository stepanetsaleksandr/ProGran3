// Сервіс для валідації даних
export class ValidationService {
  static validateLicenseData(data: any): void {
    if (!data.license_key) {
      throw new ValidationError('License key is required', 'license_key');
    }
    
    if (!this.isValidLicenseKey(data.license_key)) {
      throw new ValidationError('Invalid license key format', 'license_key');
    }
    
    if (data.max_activations && data.max_activations < 1) {
      throw new ValidationError('Max activations must be at least 1', 'max_activations');
    }
    
    if (data.days_valid && data.days_valid < 1) {
      throw new ValidationError('Days valid must be at least 1', 'days_valid');
    }
  }
  
  static validateHeartbeatData(data: any): void {
    if (!data.plugin_id) {
      throw new ValidationError('Plugin ID is required', 'plugin_id');
    }
    
    if (!this.isValidPluginId(data.plugin_id)) {
      throw new ValidationError('Invalid plugin ID format', 'plugin_id');
    }
    
    if (!data.plugin_name) {
      throw new ValidationError('Plugin name is required', 'plugin_name');
    }
    
    if (!data.version) {
      throw new ValidationError('Version is required', 'version');
    }
  }
  
  static validateActivateLicenseData(data: any): void {
    if (!data.email) {
      throw new ValidationError('Email is required', 'email');
    }
    
    if (!this.isValidEmail(data.email)) {
      throw new ValidationError('Invalid email format', 'email');
    }
    
    if (!data.license_key) {
      throw new ValidationError('License key is required', 'license_key');
    }
    
    if (!data.hardware_id) {
      throw new ValidationError('Hardware ID is required', 'hardware_id');
    }
  }
  
  private static isValidLicenseKey(key: string): boolean {
    return /^[A-Z0-9]{4}-[A-Z0-9]{4}-[A-Z0-9]{4}-[A-Z0-9]{4}$/.test(key);
  }
  
  private static isValidPluginId(id: string): boolean {
    return /^[a-z0-9-]+$/.test(id);
  }
  
  private static isValidEmail(email: string): boolean {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  }
}

export class ValidationError extends Error {
  constructor(message: string, public field: string) {
    super(message);
    this.name = 'ValidationError';
  }
}
