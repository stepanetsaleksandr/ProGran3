# ProGran3 Deployment Guide

## 🚀 Server Deployment

### Prerequisites
- Node.js 18+ installed
- Vercel account (for production)
- Supabase project configured

### Environment Setup
1. Copy `server/env.template` to `server/.env.local`
2. Configure environment variables:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
   JWT_SECRET=your_jwt_secret
   ```

### Local Development
```bash
cd server
npm install
npm run dev
```

### Production Deployment

#### Option 1: Vercel CLI (Recommended)
```bash
cd server
vercel --prod
```

#### Option 2: Git Push (Auto-deploy)
```bash
git push origin main
```

#### Option 3: Manual Scripts
```bash
# Windows
deploy.bat

# Smart deployment with checks
deploy_smart.bat
```

### Database Setup
1. Run SQL migrations in Supabase:
   - `docs/archive/sql/UNIFIED_MIGRATION.sql`
   - `server/supabase_modules_schema.sql`

2. Set up admin credentials:
   ```bash
   cd server
   node scripts/change-admin-credentials.js
   ```

## 🔧 Plugin Build

### Build Process
```bash
# Windows
build_rbz.bat

# Linux/Mac
./build_rbz.sh
```

### Build Options
- **Standard**: `build_rbz.rb` - Basic obfuscation
- **Encrypted**: `build_rbz_encrypted.rb` - Advanced encryption
- **Advanced**: `build_rbz_advanced_obfuscation.rb` - Maximum protection

### Output
Built plugins are saved to `dist/` folder with timestamp naming.

## 🔄 Update Process

### Server Updates
1. Make changes to `server/` code
2. Test locally: `npm run dev`
3. Deploy: `vercel --prod` or `git push`

### Plugin Updates
1. Make changes to `plugin/` code
2. Test in SketchUp
3. Build: `build_rbz.bat`
4. Distribute new `.rbz` file

## 🛡️ Security Considerations

- Always use HTTPS in production
- Keep environment variables secure
- Regularly update dependencies
- Monitor server logs for anomalies

## 📊 Monitoring

### Server Health
- Check Vercel dashboard for deployment status
- Monitor Supabase for database performance
- Review server logs for errors

### Plugin Health
- Monitor license activation rates
- Track error reports from users
- Check grace period usage

## 🚨 Troubleshooting

### Common Issues

#### Server Won't Start
- Check environment variables
- Verify Supabase connection
- Check Node.js version compatibility

#### Plugin Won't Load
- Verify SketchUp version compatibility
- Check Ruby console for errors
- Ensure proper file permissions

#### License Issues
- Verify server connectivity
- Check license status in admin dashboard
- Review grace period settings

### Rollback Procedure
1. Revert to previous Git commit
2. Redeploy server: `vercel --prod`
3. Distribute previous plugin version

---

**Last Updated**: 2025-01-26  
**Version**: 3.2.1
