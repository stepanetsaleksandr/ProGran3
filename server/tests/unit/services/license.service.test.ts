import { LicenseService } from '../../../src/lib/services/license.service';
import { LicenseRepository } from '../../../src/lib/database/repositories/license.repository';
import { UserLicenseRepository } from '../../../src/lib/database/repositories/user-license.repository';
import { ApiError } from '../../../src/lib/errors/api.error';

// Mock репозиторіїв
jest.mock('../../../src/lib/database/repositories/license.repository');
jest.mock('../../../src/lib/database/repositories/user-license.repository');

describe('LicenseService', () => {
  let licenseService: LicenseService;
  let mockLicenseRepo: jest.Mocked<LicenseRepository>;
  let mockUserLicenseRepo: jest.Mocked<UserLicenseRepository>;
  
  beforeEach(() => {
    mockLicenseRepo = new LicenseRepository() as jest.Mocked<LicenseRepository>;
    mockUserLicenseRepo = new UserLicenseRepository() as jest.Mocked<UserLicenseRepository>;
    licenseService = new LicenseService(mockLicenseRepo, mockUserLicenseRepo);
  });
  
  describe('createLicense', () => {
    it('should create license with valid data', async () => {
      // Arrange
      const licenseData = { 
        license_key: 'TEST-1234-5678-9012',
        max_activations: 5,
        days_valid: 30
      };
      const expectedLicense = { id: 1, ...licenseData };
      mockLicenseRepo.findByKey.mockResolvedValue(null);
      mockLicenseRepo.create.mockResolvedValue(expectedLicense);
      
      // Act
      const result = await licenseService.createLicense(licenseData);
      
      // Assert
      expect(result).toEqual(expectedLicense);
      expect(mockLicenseRepo.findByKey).toHaveBeenCalledWith(licenseData.license_key);
      expect(mockLicenseRepo.create).toHaveBeenCalledWith(licenseData);
    });
    
    it('should throw error if license already exists', async () => {
      // Arrange
      const licenseData = { license_key: 'TEST-1234-5678-9012' };
      const existingLicense = { id: 1, license_key: 'TEST-1234-5678-9012' };
      mockLicenseRepo.findByKey.mockResolvedValue(existingLicense);
      
      // Act & Assert
      await expect(licenseService.createLicense(licenseData))
        .rejects
        .toThrow(ApiError);
    });
  });
  
  describe('validateLicense', () => {
    it('should return valid for correct license', async () => {
      // Arrange
      const licenseData = {
        email: 'test@example.com',
        license_key: 'TEST-1234-5678-9012',
        hardware_id: 'hardware123'
      };
      const license = { id: 1, license_key: 'TEST-1234-5678-9012', is_active: true };
      const userLicense = { id: 1, license_key: 'TEST-1234-5678-9012', hardware_id: 'hardware123', is_active: true };
      
      mockLicenseRepo.findByKey.mockResolvedValue(license);
      mockUserLicenseRepo.findByLicenseAndHardware.mockResolvedValue(userLicense);
      
      // Act
      const result = await licenseService.validateLicense(licenseData);
      
      // Assert
      expect(result.isValid).toBe(true);
      expect(result.reason).toBe('License is valid');
    });
    
    it('should return invalid for non-existent license', async () => {
      // Arrange
      const licenseData = {
        email: 'test@example.com',
        license_key: 'INVALID-KEY',
        hardware_id: 'hardware123'
      };
      
      mockLicenseRepo.findByKey.mockResolvedValue(null);
      
      // Act
      const result = await licenseService.validateLicense(licenseData);
      
      // Assert
      expect(result.isValid).toBe(false);
      expect(result.reason).toBe('License not found or inactive');
    });
  });
});
