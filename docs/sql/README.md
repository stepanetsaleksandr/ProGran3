# Database Schema

## 📊 SQL Files

### **UNIFIED_MIGRATION.sql**
Complete database schema with all tables:
- `licenses` - License management
- `system_infos` - Device information  
- `heartbeats` - Plugin activity tracking
- `telemetry` - Usage analytics

### **indexes.sql**
Database indexes for performance optimization.

### **supabase_modules_schema.sql**
Supabase-specific schema extensions and modules.

## 🚀 Usage

### Initial Setup
```sql
-- Run the complete migration
\i UNIFIED_MIGRATION.sql

-- Add performance indexes
\i indexes.sql
```

### Schema Updates
The `UNIFIED_MIGRATION.sql` file contains the complete schema. For updates, modify this file and re-run.

---

**Last Updated**: 2025-01-26  
**Version**: 3.2.1
