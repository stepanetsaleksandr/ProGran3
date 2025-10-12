/**
 * Application constants
 */

export const APP_CONFIG = {
  name: 'ProGran3',
  version: '2.1.0',
  description: 'Professional License Management System',
};

export const API_CONFIG = {
  defaultPageSize: 50,
  maxPageSize: 100,
  requestTimeout: 30000, // 30 seconds
  rateLimitWindow: 60000, // 1 minute
};

export const LICENSE_CONFIG = {
  minDuration: 1, // 1 day
  maxDuration: 3650, // 10 years
  defaultDuration: 365, // 1 year
  statuses: ['generated', 'activated', 'active', 'expired', 'revoked'] as const,
};

export const CACHE_CONFIG = {
  // Cache durations in seconds
  short: 60, // 1 minute
  medium: 300, // 5 minutes
  long: 3600, // 1 hour
  static: 86400, // 1 day
};

export const SECURITY_CONFIG = {
  // Active system threshold (in minutes)
  activeSystemThreshold: 5,
  
  // Session timeout (in hours)
  sessionTimeout: 24,
  
  // Password requirements
  minPasswordLength: 8,
  requireSpecialChars: true,
};

export const ERROR_MESSAGES = {
  // Authentication errors
  UNAUTHORIZED: 'Valid API key required',
  FORBIDDEN: 'Access forbidden',
  
  // Validation errors
  VALIDATION_FAILED: 'Validation failed',
  INVALID_INPUT: 'Invalid input data',
  
  // Resource errors
  NOT_FOUND: 'Resource not found',
  ALREADY_EXISTS: 'Resource already exists',
  
  // Server errors
  INTERNAL_ERROR: 'Internal server error',
  DATABASE_ERROR: 'Database error occurred',
  
  // License errors
  INVALID_LICENSE: 'Invalid or already activated license key',
  EXPIRED_LICENSE: 'License has expired',
  LICENSE_NOT_ACTIVE: 'License is not active',
};

export const SUCCESS_MESSAGES = {
  LICENSE_GENERATED: 'License generated successfully',
  LICENSE_ACTIVATED: 'License activated successfully',
  LICENSE_UPDATED: 'License updated successfully',
  LICENSE_DELETED: 'License deleted successfully',
  HEARTBEAT_RECORDED: 'Heartbeat recorded successfully',
  SYSTEM_UPDATED: 'System information updated successfully',
};

