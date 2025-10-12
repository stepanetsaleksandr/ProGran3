# 📚 ProGran3 API Documentation

**Version:** 2.1.0  
**Last Updated:** October 12, 2025  
**Base URL:** `https://your-domain.vercel.app` or `http://localhost:3001`

---

## 🔐 Authentication

Most endpoints require an API key in the header:

```http
X-API-Key: your-api-key-here
```

**Protected Endpoints:**
- `POST /api/licenses/generate` - License generation
- `PUT /api/licenses/:id` - License updates
- `DELETE /api/licenses/:id` - License deletion

**Public Endpoints:**
- `GET /api/licenses` - View licenses (consider protecting in production)
- `GET /api/licenses/:id` - View single license
- `POST /api/licenses/activate` - License activation
- `GET /api/systems` - View systems

---

## 📋 Standard Response Format

### Success Response
```json
{
  "success": true,
  "data": { ... },
  "message": "Optional success message"
}
```

### Error Response
```json
{
  "success": false,
  "error": "Error message",
  "details": { ... },
  "code": "ERROR_CODE"
}
```

### Error Codes
- `VALIDATION_ERROR` - Invalid input data
- `NOT_FOUND` - Resource not found
- `UNAUTHORIZED` - Missing or invalid API key
- `FORBIDDEN` - Insufficient permissions
- `RATE_LIMIT_EXCEEDED` - Too many requests

---

## 🎫 License Endpoints

### List Licenses

```http
GET /api/licenses
```

**Query Parameters:**
- `page` (number, default: 1) - Page number
- `limit` (number, default: 50, max: 100) - Items per page
- `sort` (string, default: "created_at") - Sort field (created_at, updated_at, expires_at)
- `order` (string, default: "desc") - Sort order (asc, desc)
- `status` (string, optional) - Filter by status (generated, activated, active, expired, revoked)
- `user_id` (uuid, optional) - Filter by user ID
- `search` (string, optional) - Search in license_key and description

**Example:**
```bash
curl "https://api.example.com/api/licenses?page=1&limit=10&status=active"
```

**Response:**
```json
{
  "success": true,
  "data": {
    "licenses": [
      {
        "id": "123e4567-e89b-12d3-a456-426614174000",
        "license_key": "PROGRAN3-2025-A1B2C3-XYZ",
        "duration_days": 365,
        "status": "active",
        "description": "Annual license",
        "activated_at": "2025-01-01T00:00:00Z",
        "expires_at": "2026-01-01T00:00:00Z",
        "created_at": "2024-12-01T00:00:00Z",
        "users": {
          "email": "user@example.com",
          "name": "John Doe"
        }
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 10,
      "total": 42,
      "totalPages": 5
    }
  }
}
```

---

### Get Single License

```http
GET /api/licenses/:id
```

**Parameters:**
- `id` (uuid, required) - License ID

**Example:**
```bash
curl "https://api.example.com/api/licenses/123e4567-e89b-12d3-a456-426614174000"
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "123e4567-e89b-12d3-a456-426614174000",
    "license_key": "PROGRAN3-2025-A1B2C3-XYZ",
    "duration_days": 365,
    "status": "active",
    ...
  }
}
```

---

### Generate License

```http
POST /api/licenses/generate
```

**🔐 Requires Authentication**

**Body:**
```json
{
  "duration_days": 365,
  "description": "Annual license for premium user"
}
```

**Validation:**
- `duration_days` (number, required) - 1 to 3650 days (max 10 years)
- `description` (string, optional) - Max 500 characters

**Example:**
```bash
curl -X POST "https://api.example.com/api/licenses/generate" \
  -H "X-API-Key: your-api-key" \
  -H "Content-Type: application/json" \
  -d '{
    "duration_days": 365,
    "description": "Annual license"
  }'
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "123e4567-e89b-12d3-a456-426614174000",
    "license_key": "PROGRAN3-2025-A1B2C3-XYZ789",
    "duration_days": 365,
    "description": "Annual license",
    "status": "generated",
    "created_at": "2025-10-12T12:00:00Z"
  },
  "message": "License generated successfully"
}
```

---

### Activate License

```http
POST /api/licenses/activate
```

**Body:**
```json
{
  "license_key": "PROGRAN3-2025-A1B2C3-XYZ789",
  "user_email": "user@example.com",
  "system_fingerprint": "a1b2c3d4e5f6..." // 64-char SHA256 hash
}
```

**Validation:**
- `license_key` (string, required) - Format: PROGRAN3-YYYY-XXXXXX-XXXXXX
- `user_email` (email, required) - Valid email address
- `system_fingerprint` (string, required) - 64-character SHA256 hash

**Example:**
```bash
curl -X POST "https://api.example.com/api/licenses/activate" \
  -H "Content-Type: application/json" \
  -d '{
    "license_key": "PROGRAN3-2025-A1B2C3-XYZ789",
    "user_email": "user@example.com",
    "system_fingerprint": "a1b2c3d4e5f6789012345678901234567890123456789012345678901234"
  }'
```

**Response:**
```json
{
  "success": true,
  "data": {
    "license_id": "123e4567-e89b-12d3-a456-426614174000",
    "license_key": "PROGRAN3-2025-A1B2C3-XYZ789",
    "user_email": "user@example.com",
    "duration_days": 365,
    "activated_at": "2025-10-12T12:00:00Z",
    "expires_at": "2026-10-12T12:00:00Z",
    "status": "active"
  },
  "message": "License activated successfully"
}
```

---

### Update License

```http
PUT /api/licenses/:id
```

**🔐 Requires Authentication**

**Body:**
```json
{
  "duration_days": 730,
  "status": "active",
  "description": "Updated description"
}
```

**Validation:**
- `duration_days` (number, optional) - 1 to 3650
- `status` (enum, optional) - generated, activated, active, expired, revoked
- `description` (string, optional) - Max 500 characters

**Example:**
```bash
curl -X PUT "https://api.example.com/api/licenses/123e4567-e89b-12d3-a456-426614174000" \
  -H "X-API-Key: your-api-key" \
  -H "Content-Type: application/json" \
  -d '{
    "duration_days": 730,
    "status": "active"
  }'
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "123e4567-e89b-12d3-a456-426614174000",
    "license_key": "PROGRAN3-2025-A1B2C3-XYZ789",
    "duration_days": 730,
    "status": "active",
    ...
  },
  "message": "License updated successfully"
}
```

---

### Delete License

```http
DELETE /api/licenses/:id
```

**🔐 Requires Authentication**

**Example:**
```bash
curl -X DELETE "https://api.example.com/api/licenses/123e4567-e89b-12d3-a456-426614174000" \
  -H "X-API-Key: your-api-key"
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "123e4567-e89b-12d3-a456-426614174000"
  },
  "message": "License deleted successfully"
}
```

---

## 💻 System Endpoints

### List Systems

```http
GET /api/systems
```

**Example:**
```bash
curl "https://api.example.com/api/systems"
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "789e4567-e89b-12d3-a456-426614174000",
      "license_id": "123e4567-e89b-12d3-a456-426614174000",
      "fingerprint_hash": "a1b2c3d4e5f6...",
      "system_data": {
        "os": "Windows 10",
        "hostname": "USER-PC"
      },
      "last_seen": "2025-10-12T12:00:00Z",
      "created_at": "2025-10-01T00:00:00Z",
      "licenses": {
        "id": "123e4567-e89b-12d3-a456-426614174000",
        "license_key": "PROGRAN3-2025-A1B2C3-XYZ789",
        "status": "active",
        "users": {
          "email": "user@example.com",
          "name": "John Doe"
        }
      }
    }
  ]
}
```

---

### Update System Info

```http
POST /api/systems
```

**Body:**
```json
{
  "license_id": "123e4567-e89b-12d3-a456-426614174000",
  "fingerprint_hash": "a1b2c3d4e5f6...",
  "system_data": {
    "os": "Windows 10",
    "hostname": "USER-PC",
    "ruby_version": "2.7.0"
  }
}
```

**Example:**
```bash
curl -X POST "https://api.example.com/api/systems" \
  -H "Content-Type: application/json" \
  -d '{
    "license_id": "123e4567-e89b-12d3-a456-426614174000",
    "fingerprint_hash": "a1b2c3d4e5f6789012345678901234567890123456789012345678901234",
    "system_data": { "os": "Windows 10" }
  }'
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "789e4567-e89b-12d3-a456-426614174000",
    "license_id": "123e4567-e89b-12d3-a456-426614174000",
    "fingerprint_hash": "a1b2c3d4e5f6...",
    ...
  },
  "message": "System information updated"
}
```

---

## ❌ Error Handling

### Validation Error (400)
```json
{
  "success": false,
  "error": "Validation failed",
  "details": [
    {
      "field": "duration_days",
      "message": "Duration must be at least 1 day"
    }
  ],
  "code": "VALIDATION_ERROR"
}
```

### Unauthorized (401)
```json
{
  "success": false,
  "error": "Valid API key required",
  "code": "UNAUTHORIZED"
}
```

### Not Found (404)
```json
{
  "success": false,
  "error": "License not found",
  "code": "NOT_FOUND"
}
```

### Rate Limit (429)
```json
{
  "success": false,
  "error": "Too many requests. Please try again later.",
  "details": {
    "resetAt": "2025-10-12T13:00:00Z"
  },
  "code": "RATE_LIMIT_EXCEEDED"
}
```

### Server Error (500)
```json
{
  "success": false,
  "error": "Internal server error",
  "code": "INTERNAL_ERROR"
}
```

---

## 🔧 Development

### Testing Endpoints Locally

```bash
# Start development server
cd server
npm run dev

# Test endpoints
curl "http://localhost:3001/api/licenses"
```

### Environment Variables

Required in `.env.local`:
```env
SUPABASE_URL=your-supabase-url
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
API_KEYS=key1,key2,key3
```

---

## 📝 Changelog

### v2.1.0 (October 12, 2025)
- ✅ Refactored all API endpoints to RESTful standard
- ✅ Added centralized error handling
- ✅ Added Zod validation for all inputs
- ✅ Removed hardcoded credentials
- ✅ Added API authentication middleware
- ✅ Improved logging and debugging
- ✅ Standardized response format

### v2.0.0 (October 4, 2025)
- Initial production release

---

## 🆘 Support

**Issues:** Report bugs in GitHub Issues  
**Email:** support@your-company.com  
**Documentation:** https://docs.your-company.com

---

**Made with ❤️ by ProGran3 Team**


