# ProGran3 - Professional License Management System

## 🚀 Overview

ProGran3 is a comprehensive license management system built with Next.js 14, Supabase, and TypeScript. It provides a modern dashboard for managing software licenses, user activations, and system monitoring.

## 📋 Features

### ✅ Core Features
- **License Management**: Create, view, update, and delete software licenses
- **User Activation**: Track license activations and user assignments
- **Dashboard Analytics**: Real-time statistics and monitoring
- **Secure API**: RESTful API with HMAC authentication
- **Modern UI**: Responsive dashboard built with Tailwind CSS

### 🔧 Technical Stack
- **Frontend**: Next.js 14 (App Router), React, TypeScript
- **Backend**: Next.js API Routes, Supabase (PostgreSQL)
- **Styling**: Tailwind CSS
- **Authentication**: HMAC-based plugin-server communication
- **Deployment**: Vercel

## 🏗️ Architecture

```
progran3/
├── server/                 # Next.js server application
│   ├── app/               # App Router structure
│   │   ├── api/           # API endpoints
│   │   └── components/    # React components
│   ├── lib/               # Utility libraries
│   └── UNIFIED_MIGRATION.sql  # Database migration script
├── shared/                # Shared modules
└── plugin/                # SketchUp plugin
```

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- Supabase account
- Vercel account (for deployment)

### 1. Clone Repository
```bash
git clone <repository-url>
cd progran3
```

### 2. Install Dependencies
```bash
npm install
cd server && npm install
```

### 3. Environment Setup
Create `server/.env.local`:
```env
SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
CRYPTO_SECRET_KEY=your_crypto_secret_key
NEXT_PUBLIC_API_URL=http://localhost:3000
```

### 4. Database Setup
1. Run the migration script in Supabase SQL Editor:
   ```sql
   -- Execute server/UNIFIED_MIGRATION.sql
   ```

### 5. Development
```bash
cd server
npm run dev
```

Visit: http://localhost:3000

## 📊 API Endpoints

### Core Endpoints
- `GET /api/licenses` - Get all licenses
- `POST /api/licenses` - Create new license
- `POST /api/licenses/generate` - Generate license key
- `DELETE /api/licenses/[id]` - Delete license
- `POST /api/licenses/activate` - Activate license

### Dashboard
- `GET /api/dashboard/stats` - Get dashboard statistics
- `GET /api/systems` - Get system information
- `GET /api/heartbeats` - Get heartbeat data

## 🗄️ Database Schema

### Main Tables
- **licenses**: Main license storage
- **users**: User management
- **heartbeats**: System monitoring data

### License Statuses
- `generated`: Newly created license
- `activated`: License activated by user
- `active`: License in use
- `expired`: License expired
- `revoked`: License revoked

## 🚀 Deployment

### Vercel Deployment
```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel --prod --yes
```

### Environment Variables (Production)
Set in Vercel Dashboard:
- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`
- `CRYPTO_SECRET_KEY`
- `NEXT_PUBLIC_API_URL`

## 🔧 Development Scripts

```bash
# Development
npm run dev

# Build
npm run build

# Production
npm run start

# Deploy to Vercel
npm run vercel:deploy
```

## 📁 Project Structure

```
server/
├── app/
│   ├── api/                    # API Routes
│   │   ├── licenses/          # License management
│   │   ├── dashboard/         # Dashboard data
│   │   └── systems/           # System monitoring
│   ├── components/            # React components
│   │   ├── Dashboard.tsx      # Main dashboard
│   │   ├── LicenseManager.tsx # License management UI
│   │   └── SystemMonitor.tsx  # System monitoring
│   └── globals.css           # Global styles
├── lib/
│   └── supabase.ts           # Supabase client
└── UNIFIED_MIGRATION.sql     # Database migration
```

## 🔒 Security

- Environment variables for sensitive data
- HMAC authentication for plugin communication
- Row Level Security (RLS) in Supabase
- Input validation and sanitization

## 📝 License Management Workflow

1. **Generate License**: Create new license with duration and description
2. **User Activation**: User activates license with provided key
3. **Status Tracking**: Monitor license usage and expiration
4. **Renewal/Revocation**: Manage license lifecycle

## 🐛 Troubleshooting

### Common Issues
1. **Environment Variables**: Ensure all required variables are set
2. **Database Connection**: Verify Supabase credentials
3. **Migration**: Run UNIFIED_MIGRATION.sql if data is missing

### Debug Commands
```bash
# Check deployment logs
vercel logs

# Test API endpoints
curl https://your-domain.vercel.app/api/dashboard/stats
```

## 📞 Support

For issues and questions:
1. Check the troubleshooting section
2. Review environment variable setup
3. Verify database migration status

## 🔄 Version History

- **v2.0.0**: Unified database structure, improved UI, production-ready
- **v1.0.0**: Initial release with basic license management

---

**ProGran3** - Professional License Management System
Built with ❤️ using Next.js, Supabase, and TypeScript
