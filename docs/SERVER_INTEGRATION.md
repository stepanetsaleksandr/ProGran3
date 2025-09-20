# ProGran3 Plugin - Server Integration Guide

## API Endpoints

### POST `/api/heartbeat`
**Purpose**: Plugin activity tracking

**Request Body**:
```json
{
  "plugin_id": "progran3-desktop-60aqeiu-provis3d",
  "plugin_name": "ProGran3",
  "version": "1.0.0",
  "user_id": "ProVis3D@DESKTOP-60AQEIU",
  "computer_name": "DESKTOP-60AQEIU",
  "system_info": "Windows 10.0.19045",
  "timestamp": "2025-09-20T13:27:09.295+00:00",
  "action": "heartbeat_update",
  "source": "sketchup_plugin",
  "update_existing": true,
  "force_update": false
}
```

**Response**:
```json
{
  "success": true,
  "message": "Heartbeat updated successfully",
  "plugin": {
    "id": 2,
    "plugin_id": "progran3-desktop-60aqeiu-provis3d",
    "last_heartbeat": "2025-09-20T13:27:09.295+00:00",
    "is_active": true
  }
}
```

### GET `/api/plugins`
**Purpose**: Retrieve plugin statistics

**Response**:
```json
{
  "success": true,
  "data": {
    "plugins": [
      {
        "id": 2,
        "plugin_id": "progran3-desktop-60aqeiu-provis3d",
        "plugin_name": "ProGran3",
        "version": "1.0.0",
        "user_id": "ProVis3D@DESKTOP-60AQEIU",
        "computer_name": "DESKTOP-60AQEIU",
        "ip_address": "46.219.244.238",
        "last_heartbeat": "2025-09-20T13:27:09.295+00:00",
        "is_active": true,
        "created_at": "2025-09-20T13:20:48.555+00:00",
        "updated_at": "2025-09-20T13:27:09.626799+00:00"
      }
    ],
    "stats": {
      "total_plugins": 2,
      "active_plugins": 2,
      "recent_plugins": 2
    },
    "sync_info": {
      "total_plugins": 2,
      "active_plugins": 2,
      "recent_plugins": 2,
      "last_check": "2025-09-20T13:27:54.538Z"
    },
    "diagnosis": {
      "connection": "OK",
      "recent_records": [...],
      "stats": {...},
      "diagnosis_time": "2025-09-20T13:27:55.090Z"
    },
    "last_updated": "2025-09-20T13:27:55.090Z"
  }
}
```

## Plugin Behavior

### Heartbeat Timing
- **Initial**: Sent when user opens plugin UI
- **Interval**: Every 5 minutes while UI is open
- **Stop**: When UI is closed

### Plugin ID Generation
```ruby
"progran3-#{hostname}-#{username}".downcase
```
- Stable across sessions
- Based on computer hostname + username
- Example: `progran3-desktop-60aqeiu-provis3d`

### User Identification
```ruby
"#{username}@#{hostname}"
```
- Example: `ProVis3D@DESKTOP-60AQEIU`

## Database Requirements

### Required Fields
- `plugin_id` (unique, string)
- `plugin_name` (string)
- `version` (string)
- `user_id` (string)
- `computer_name` (string)
- `ip_address` (string)
- `last_heartbeat` (timestamp)
- `is_active` (boolean)
- `created_at` (timestamp)
- `updated_at` (timestamp)

### Index Requirements
- Primary key on `plugin_id`
- Index on `last_heartbeat` for active plugins query

## Expected Server Behavior

1. **Heartbeat API**: Update existing record or create new
2. **Plugins API**: Return real-time data (no caching delays)
3. **Sync**: Both APIs must show identical timestamps
4. **Status**: Return HTTP 200 for successful operations

## HTTP Headers

### Request Headers
```
Content-Type: application/json
User-Agent: ProGran3-Plugin/1.0
```

### Response Headers (Plugins API)
```
Cache-Control: no-cache, no-store, must-revalidate
Pragma: no-cache
Expires: 0
```

## Error Handling

### Expected Error Responses
```json
{
  "success": false,
  "error": "Error message",
  "code": "ERROR_CODE"
}
```

### Common HTTP Status Codes
- `200`: Success
- `400`: Bad Request (invalid data)
- `500`: Internal Server Error

## Testing

### Test Endpoints
- `/api/health` - Server health check
- `/api/status` - Server status
- `/` - Root endpoint

### Validation
- Plugin ID format: `progran3-{hostname}-{username}`
- Timestamp format: ISO 8601 with timezone
- Required fields validation
- Duplicate plugin_id handling (update vs create)
