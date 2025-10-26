# ProGran3 Build & Deploy Guide

## 🏗️ Build Scripts

### **Plugin Build**
```bash
# Windows (recommended)
build_rbz.bat

# Manual Ruby build
ruby build_rbz.rb
```

**Output**: `dist/proGran3_v3.2.1_YYYYMMDD_HHMMSS.rbz`

### **Server Deploy**
```bash
# Smart deploy (auto-updates config.json)
deploy_smart.bat
```

**Features**:
- ✅ Pre-deployment checks
- ✅ Build testing
- ✅ Vercel deployment
- ✅ Auto-update plugin config.json
- ✅ Post-deployment instructions

## 📦 Build Process

### **Plugin Build Steps**:
1. Check Ruby installation
2. Install rubyzip gem if needed
3. Create dist/ directory
4. Package plugin files into .rbz
5. Create latest symlink
6. Show installation instructions

### **Server Deploy Steps**:
1. Check environment variables
2. Test build
3. Deploy to Vercel
4. Extract deployment URL
5. Update plugin config.json
6. Show next steps

## 🎯 Quick Commands

### **Full Build & Deploy**:
```bash
# 1. Build plugin
build_rbz.bat

# 2. Deploy server
deploy_smart.bat
```

### **Plugin Only**:
```bash
build_rbz.bat
```

### **Server Only**:
```bash
deploy_smart.bat
```

## 📁 Output Structure

```
dist/
├── proGran3_v3.2.1_20250126_143022.rbz  # Timestamped build
└── proGran3_latest.rbz                  # Latest symlink
```

## 🔧 Configuration

### **Plugin Config** (auto-updated by deploy_smart.bat):
```json
{
  "api": {
    "base_url": "https://server-one-amber.vercel.app",
    "timeout": 10000
  }
}
```

### **Environment Variables** (server/.env.local):
```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_key
JWT_SECRET=your_jwt_secret
```

---

**Last Updated**: 2025-01-26  
**Version**: 3.2.1
