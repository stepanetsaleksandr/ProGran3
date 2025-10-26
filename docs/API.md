# ProGran3 API Documentation

## 🔗 Base URL
- **Production**: `https://server-one-amber.vercel.app`
- **Local**: `http://localhost:3000`

## 🔐 Authentication

### Admin Authentication
```typescript
// Login endpoint
POST /api/auth/login
{
  "email": "admin@example.com",
  "password": "password"
}

// Response
{
  "token": "jwt_token_here",
  "user": {
    "id": "user_id",
    "email": "admin@example.com"
  }
}
```

### Plugin Authentication
```typescript
// License activation
POST /api/licenses/activate
Headers: {
  "X-Fingerprint": "device_fingerprint",
  "X-Timestamp": "timestamp",
  "X-Endpoint": "activate",
  "X-Plugin-Version": "3.2.1"
}
Body: {
  "licenseKey": "PROGRAN3-2025-XXXX-XXXX"
}

// Response
{
  "success": true,
  "data": {
    "license": {
      "id": "license_id",
      "key": "license_key",
      "status": "active",
      "expires_at": "2025-12-31T23:59:59Z"
    }
  }
}
```

## 📋 License Management

### Get All Licenses
```typescript
GET /api/licenses
Headers: {
  "Authorization": "Bearer jwt_token"
}

// Response
{
  "licenses": [
    {
      "id": "license_id",
      "key": "PROGRAN3-2025-XXXX-XXXX",
      "status": "active",
      "created_at": "2025-01-01T00:00:00Z",
      "expires_at": "2025-12-31T23:59:59Z",
      "description": "License description"
    }
  ]
}
```

### Create License
```typescript
POST /api/licenses
Headers: {
  "Authorization": "Bearer jwt_token"
}
Body: {
  "duration_days": 365,
  "description": "New license"
}

// Response
{
  "license": {
    "id": "new_license_id",
    "key": "PROGRAN3-2025-XXXX-XXXX",
    "status": "generated",
    "expires_at": "2025-12-31T23:59:59Z"
  }
}
```

### Validate License
```typescript
POST /api/licenses/validate
Headers: {
  "X-Fingerprint": "device_fingerprint",
  "X-Timestamp": "timestamp",
  "X-Endpoint": "validate",
  "X-Plugin-Version": "3.2.1"
}
Body: {
  "licenseKey": "PROGRAN3-2025-XXXX-XXXX"
}

// Response
{
  "valid": true,
  "data": {
    "license": {
      "id": "license_id",
      "status": "active",
      "expires_at": "2025-12-31T23:59:59Z"
    }
  }
}
```

### Delete License
```typescript
DELETE /api/licenses/[id]
Headers: {
  "Authorization": "Bearer jwt_token"
}

// Response
{
  "success": true,
  "message": "License deleted successfully"
}
```

## 🛡️ Security Headers

### Required Headers (Plugin)
- `X-Fingerprint`: Device fingerprint
- `X-Timestamp`: Request timestamp
- `X-Endpoint`: API endpoint name
- `X-Plugin-Version`: Plugin version

### Optional Headers
- `X-HMAC-Signature`: HMAC signature (if enabled)
- `Content-Type`: application/json

## 📊 Error Responses

### Standard Error Format
```typescript
{
  "error": "Error message",
  "code": "ERROR_CODE",
  "details": "Additional details"
}
```

### Common Error Codes
- `INVALID_LICENSE_KEY`: License key format invalid
- `LICENSE_NOT_FOUND`: License doesn't exist
- `LICENSE_EXPIRED`: License has expired
- `DEVICE_MISMATCH`: Device fingerprint doesn't match
- `UNAUTHORIZED`: Authentication required
- `RATE_LIMITED`: Too many requests

## 🔄 Rate Limiting

- **License endpoints**: 10 requests per minute
- **Admin endpoints**: 100 requests per minute
- **Health check**: No limit

## 📈 Health Check

```typescript
GET /api/health

// Response
{
  "status": "ok",
  "timestamp": "2025-01-26T12:00:00Z",
  "version": "3.2.1"
}
```

---

**Last Updated**: 2025-01-26  
**Version**: 3.2.1
