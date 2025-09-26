# 🔒 Security Guide - ProGran3 Tracking Server

## Overview

This document outlines the security measures implemented in the ProGran3 tracking server to protect against common vulnerabilities and ensure data integrity.

## Security Features

### 1. Rate Limiting
- **Global Rate Limit**: 100 requests per minute per IP
- **Heartbeat Rate Limit**: 20 requests per minute per IP
- **License Registration**: 5 requests per minute per IP
- **Automatic IP Detection**: Supports X-Forwarded-For and X-Real-IP headers

### 2. CORS Protection
- **Allowed Origins**: Configurable via `ALLOWED_ORIGINS` environment variable
- **Default Origins**: `https://progran3.com,https://www.progran3.com,http://localhost:3000`
- **Headers**: Content-Type, Authorization, X-Requested-With
- **Methods**: GET, POST, PUT, DELETE, OPTIONS

### 3. Input Validation
- **Required Fields**: All API endpoints validate required fields
- **Format Validation**: Email, license key, plugin ID, timestamp formats
- **Type Validation**: Strict type checking for all inputs
- **Length Limits**: Reasonable limits on string lengths

### 4. Secure Logging
- **Sensitive Data Masking**: License keys, emails, IPs, passwords automatically masked
- **Pattern Recognition**: Detects and masks common sensitive patterns
- **Structured Logging**: JSON format for easy parsing and analysis
- **Context Awareness**: Different log levels for different contexts

### 5. Error Handling
- **Centralized Error Handling**: Consistent error responses across all endpoints
- **Error Classification**: Automatic classification of error types
- **Sensitive Data Protection**: No sensitive data in error responses
- **Request ID Tracking**: Unique request IDs for debugging

### 6. Database Security
- **Supabase Protection**: Built-in SQL injection protection
- **Index Optimization**: Optimized queries for performance
- **Connection Security**: Encrypted connections to database
- **Access Control**: Service role key for server operations only

## Security Headers

The server implements comprehensive security headers:

```http
X-Content-Type-Options: nosniff
X-Frame-Options: DENY
X-XSS-Protection: 1; mode=block
Strict-Transport-Security: max-age=31536000; includeSubDomains
Referrer-Policy: strict-origin-when-cross-origin
```

## API Security

### Authentication
- **No Authentication Required**: Public API for plugin communication
- **Rate Limiting**: Primary protection mechanism
- **Input Validation**: Strict validation of all inputs

### Authorization
- **License Validation**: Server-side license validation
- **Hardware Binding**: License tied to specific hardware
- **Offline Limits**: Time-based offline usage limits

### Data Protection
- **No Local Storage**: All data stored on server
- **Encrypted Transmission**: HTTPS only
- **Secure Logging**: Sensitive data automatically masked

## Monitoring and Alerts

### System Health Monitoring
- **Health Score**: 0-100 health score calculation
- **Anomaly Detection**: Automatic detection of suspicious activity
- **Alert System**: Configurable alerts for various conditions
- **Performance Metrics**: Real-time performance monitoring

### Suspicious Activity Detection
- **Spam Detection**: Multiple requests from same IP
- **License Abuse**: Multiple registrations from same email
- **Offline Abuse**: Excessive offline usage
- **Plugin Abuse**: Unusual plugin behavior patterns

## Deployment Security

### Environment Variables
```bash
# Required
STORAGE_SUPABASE_URL=https://your-project.supabase.co
STORAGE_SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Security
ALLOWED_ORIGINS=https://progran3.com,https://www.progran3.com
RATE_LIMIT_WINDOW_MS=60000
RATE_LIMIT_MAX_REQUESTS=100

# Monitoring
MONITORING_ENABLED=true
ALERT_EMAIL=admin@progran3.com
```

### Production Checklist
- [ ] Environment variables configured
- [ ] CORS origins set correctly
- [ ] Rate limiting configured
- [ ] Monitoring enabled
- [ ] SSL/TLS certificates valid
- [ ] Database access restricted
- [ ] Logging configured
- [ ] Backup strategy in place

## Incident Response

### Security Incident Procedure
1. **Detection**: Automated monitoring alerts
2. **Assessment**: Determine severity and impact
3. **Containment**: Block malicious IPs/requests
4. **Investigation**: Analyze logs and data
5. **Recovery**: Restore normal operations
6. **Documentation**: Record incident details

### Emergency Contacts
- **Admin Email**: admin@progran3.com
- **Monitoring**: Automated alerts to admin
- **Escalation**: Critical issues escalated immediately

## Best Practices

### Development
- **Code Review**: All changes reviewed for security
- **Testing**: Comprehensive security testing
- **Dependencies**: Regular security audits
- **Updates**: Keep dependencies updated

### Operations
- **Monitoring**: Continuous system monitoring
- **Logging**: Comprehensive audit logging
- **Backups**: Regular data backups
- **Updates**: Regular security updates

### User Education
- **Documentation**: Clear security documentation
- **Guidelines**: User security guidelines
- **Support**: Security support available

## Compliance

### Data Protection
- **GDPR Compliance**: EU data protection regulations
- **Data Minimization**: Only necessary data collected
- **Retention Policies**: Automatic data cleanup
- **User Rights**: Data access and deletion rights

### Privacy
- **No Personal Data**: Minimal personal data collection
- **Anonymization**: IP addresses and identifiers anonymized
- **Consent**: Clear consent for data collection
- **Transparency**: Open about data usage

## Security Testing

### Automated Testing
```bash
# Run security tests
npm run test

# Run security audit
npm run security:audit

# Fix security issues
npm run security:fix
```

### Manual Testing
- **Penetration Testing**: Regular security assessments
- **Vulnerability Scanning**: Automated vulnerability scans
- **Code Review**: Security-focused code reviews
- **Threat Modeling**: Regular threat model updates

## Updates and Maintenance

### Security Updates
- **Dependencies**: Regular dependency updates
- **Patches**: Security patches applied promptly
- **Monitoring**: Continuous security monitoring
- **Alerts**: Immediate security alerts

### Maintenance Schedule
- **Daily**: Monitor system health
- **Weekly**: Review security logs
- **Monthly**: Security audit and updates
- **Quarterly**: Comprehensive security review

## Contact

For security concerns or questions:
- **Email**: security@progran3.com
- **Issues**: GitHub security issues
- **Responsible Disclosure**: security@progran3.com

---

*Last updated: 2024-12-19*
*Version: 1.0*
