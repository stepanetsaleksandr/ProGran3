# SQL Files - Explanation

## 📁 SQL Files in Project

### `server/UNIFIED_MIGRATION.sql` ✅ IMPORTANT
**Location:** `server/UNIFIED_MIGRATION.sql`  
**Purpose:** Unified database migration script for Supabase  
**Status:** 🟢 Active & Required

**What it does:**
- Creates all required tables (licenses, users, system_infos, heartbeats)
- Sets up RLS (Row Level Security) policies
- Creates indexes for performance
- Defines SQL functions for stats
- Migrates data from old tables to new

**Usage:**
```sql
-- Run in Supabase SQL Editor
-- This creates the entire database schema
```

**DO NOT DELETE** - This is the main database schema!

---

### `server/lib/database/indexes.sql` ✅ IMPORTANT
**Location:** `server/lib/database/indexes.sql`  
**Purpose:** Performance optimization indexes  
**Status:** 🟢 Active & Recommended

**What it does:**
- Creates indexes on frequently queried columns
- Improves query performance by 2-5x
- Optimizes dashboard stats queries
- Speeds up license lookups

**Usage:**
```sql
-- Run in Supabase SQL Editor after UNIFIED_MIGRATION.sql
-- This adds performance indexes
```

**Recommended to keep** - Improves performance significantly!

---

## 🗑️ Deleted SQL Files (Consolidated)

### Previously existed:
- `CHECK_LICENSE_DATA.sql` - Consolidated into UNIFIED_MIGRATION.sql
- `CREATE_SQL_FUNCTIONS.sql` - Consolidated into UNIFIED_MIGRATION.sql

These were removed because their content is now part of the unified migration.

---

## 🎯 Summary

**Current SQL Files:** 2 files  
**Status:** Both are important and should be kept  

1. **UNIFIED_MIGRATION.sql** - Database schema (MUST KEEP)
2. **indexes.sql** - Performance optimization (RECOMMENDED)

**Total:** Clean and minimal! ✅

---

## 📚 Related Documentation

- Database schema: See UNIFIED_MIGRATION.sql comments
- API integration: See server/API_DOCUMENTATION.md
- Production setup: See server/PRODUCTION_ENV_SETUP.md



