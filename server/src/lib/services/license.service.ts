import { ValidationService } from './validation.service';
import { LicenseRepository } from '../database/repositories/license.repository';
import { UserLicenseRepository } from '../database/repositories/user-license.repository';
import { ApiError } from '../errors/api.error';

export interface CreateLicenseRequest {
  license_key: string;
  license_type?: string;
  days_valid?: number;
  max_activations?: number;
  features?: any;
  is_active?: boolean;
}

export interface ActivateLicenseRequest {
  email: string;
  license_key: string;
  hardware_id: string;
}

export interface ValidateLicenseRequest {
  email: string;
  license_key: string;
  hardware_id: string;
}

export interface LicenseValidation {
  isValid: boolean;
  reason?: string;
}

export class LicenseService {
  constructor(
    private licenseRepo: LicenseRepository,
    private userLicenseRepo: UserLicenseRepository
  ) {}

  async createLicense(data: CreateLicenseRequest): Promise<any> {
    // 1. Validate input
    ValidationService.validateLicenseData(data);
    
    // 2. Check for duplicates
    const existing = await this.licenseRepo.findByKey(data.license_key);
    if (existing) {
      throw new ApiError(409, 'LICENSE_EXISTS', 'License key already exists');
    }
    
    // 3. Create license
    const licenseData = {
      license_key: data.license_key,
      license_type: data.license_type || 'standard',
      days_valid: data.days_valid || 30,
      max_activations: data.max_activations || 1,
      features: data.features || {},
      is_active: data.is_active !== false
    };
    
    return await this.licenseRepo.create(licenseData);
  }

  async activateLicense(data: ActivateLicenseRequest): Promise<any> {
    // 1. Validate input
    ValidationService.validateActivateLicenseData(data);
    
    // 2. Check license exists and is active
    const license = await this.licenseRepo.findByKey(data.license_key);
    if (!license || !license.is_active) {
      throw new ApiError(404, 'LICENSE_NOT_FOUND', 'License not found or inactive');
    }
    
    // 3. Check activation limit
    if (license.activation_count >= license.max_activations) {
      throw new ApiError(403, 'ACTIVATION_LIMIT_EXCEEDED', 'Maximum activations reached');
    }
    
    // 4. Check if already activated on this hardware
    const existing = await this.userLicenseRepo.findByLicenseAndHardware(
      data.license_key, 
      data.hardware_id
    );
    
    if (existing) {
      // Update existing activation
      return await this.userLicenseRepo.updateHeartbeat(existing.id);
    }
    
    // 5. Create new activation
    const userLicense = await this.userLicenseRepo.create({
      license_key: data.license_key,
      email: data.email,
      hardware_id: data.hardware_id
    });
    
    // 6. Update license activation count
    await this.licenseRepo.incrementActivationCount(license.id);
    
    return userLicense;
  }

  async validateLicense(data: ValidateLicenseRequest): Promise<LicenseValidation> {
    // 1. Check license exists and is active
    const license = await this.licenseRepo.findByKey(data.license_key);
    if (!license || !license.is_active) {
      return { isValid: false, reason: 'License not found or inactive' };
    }
    
    // 2. Check if activated on this hardware
    const userLicense = await this.userLicenseRepo.findByLicenseAndHardware(
      data.license_key, 
      data.hardware_id
    );
    
    if (!userLicense) {
      return { isValid: false, reason: 'License not activated on this hardware' };
    }
    
    // 3. Check if user license is active
    if (!userLicense.is_active) {
      return { isValid: false, reason: 'User license is inactive' };
    }
    
    return { isValid: true, reason: 'License is valid' };
  }

  async getAllLicenses(): Promise<any[]> {
    return await this.licenseRepo.findAll();
  }

  async deleteLicense(licenseId: number): Promise<boolean> {
    // 1. Get license details
    const license = await this.licenseRepo.findById(licenseId);
    if (!license) {
      throw new ApiError(404, 'LICENSE_NOT_FOUND', 'License not found');
    }
    
    // 2. Delete all user licenses for this license
    await this.userLicenseRepo.deleteByLicenseKey(license.license_key);
    
    // 3. Delete the license
    return await this.licenseRepo.delete(licenseId);
  }
}
