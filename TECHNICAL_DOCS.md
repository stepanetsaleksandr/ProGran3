# ProGran3 Technical Documentation

**Версія:** 2.0.0  
**Останнє оновлення:** 4 жовтня 2025

## 🏗️ АРХІТЕКТУРА СИСТЕМИ

### **Загальна архітектура**
```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Frontend      │    │   Backend       │    │   Database      │
│   (Next.js)     │◄──►│   (API Routes)  │◄──►│   (Supabase)    │
│                 │    │                 │    │                 │
│ - Dashboard     │    │ - License API   │    │ - PostgreSQL    │
│ - Components    │    │ - System API    │    │ - RLS Security  │
│ - Hooks         │    │ - Auth          │    │ - Real-time     │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

### **Frontend Architecture**
```
src/
├── app/
│   ├── components/          # React компоненти
│   │   ├── Dashboard.tsx    # Головний дашборд
│   │   ├── LicenseManager.tsx # Управління ліцензіями
│   │   ├── SystemMonitor.tsx # Моніторинг систем
│   │   ├── Toast.tsx        # Система повідомлень
│   │   └── Tabs.tsx         # Табовий інтерфейс
│   ├── hooks/               # Custom React hooks
│   │   ├── useDashboardStats.ts # Статистика дашборду
│   │   └── useLicenses.ts   # Управління ліцензіями
│   ├── context/             # React Context
│   │   └── DashboardContext.tsx # Глобальний стан
│   ├── api/                 # API endpoints
│   │   ├── licenses/        # CRUD операції з ліцензіями
│   │   ├── systems/         # Моніторинг систем
│   │   └── dashboard/       # Статистика дашборду
│   └── lib/                 # Утиліти
│       └── supabase.ts      # Supabase клієнт
```

## 🔧 ТЕХНІЧНИЙ СТЕК

### **Frontend**
- **Framework:** Next.js 14 (App Router)
- **Language:** TypeScript 5.x
- **Styling:** Tailwind CSS 3.x
- **State Management:** React Context API + Custom Hooks
- **Icons:** Heroicons (SVG)
- **Build Tool:** Turbopack (Next.js)

### **Backend**
- **Runtime:** Node.js 18+
- **Framework:** Next.js API Routes
- **Database:** Supabase (PostgreSQL 15)
- **Authentication:** Supabase Service Role
- **Deployment:** Vercel

### **Development Tools**
- **Package Manager:** npm
- **Version Control:** Git
- **Deployment:** Vercel CLI
- **Environment:** Environment Variables

## 📊 СТРУКТУРА БАЗИ ДАНИХ

### **Таблиця `licenses`**
```sql
CREATE TABLE licenses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  license_key TEXT UNIQUE NOT NULL,
  status TEXT CHECK (status IN ('generated', 'activated', 'active', 'expired', 'revoked')),
  duration_days INTEGER NOT NULL,
  description TEXT,
  expires_at TIMESTAMPTZ,
  activated_at TIMESTAMPTZ,
  user_id UUID REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

### **Таблиця `users`**
```sql
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  name TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### **Таблиця `system_infos`**
```sql
CREATE TABLE system_infos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  fingerprint_hash TEXT UNIQUE NOT NULL,
  system_data JSONB,
  last_seen TIMESTAMPTZ DEFAULT NOW(),
  license_id UUID REFERENCES licenses(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### **Row Level Security (RLS)**
```sql
-- Enable RLS
ALTER TABLE licenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE system_infos ENABLE ROW LEVEL SECURITY;

-- Service role has full access
CREATE POLICY "Service role full access" ON licenses
  FOR ALL TO service_role USING (true);

CREATE POLICY "Service role full access" ON users
  FOR ALL TO service_role USING (true);

CREATE POLICY "Service role full access" ON system_infos
  FOR ALL TO service_role USING (true);
```

## 🔌 API ENDPOINTS

### **License Management**
```
GET    /api/licenses              # Отримати всі ліцензії
POST   /api/licenses              # Створити нову ліцензію
GET    /api/licenses/[id]         # Отримати ліцензію за ID
PUT    /api/licenses/[id]         # Оновити ліцензію
DELETE /api/licenses/[id]         # Видалити ліцензію
POST   /api/licenses/generate     # Згенерувати новий ключ
POST   /api/licenses/activate     # Активувати ліцензію
```

### **System Monitoring**
```
GET    /api/systems               # Отримати всі системи
```

### **Dashboard**
```
GET    /api/dashboard/stats       # Статистика дашборду
```

## 🎨 COMPONENT ARCHITECTURE

### **Dashboard Component**
```typescript
interface DashboardStats {
  totalLicenses: number;
  activeLicenses: number;
  generatedLicenses: number;
  activatedLicenses: number;
  expiredLicenses: number;
  totalUsers: number;
}
```

### **License Manager Component**
```typescript
interface License {
  id: string;
  license_key: string;
  status: 'generated' | 'activated' | 'active' | 'expired' | 'revoked';
  duration_days: number;
  description: string;
  expires_at: string | null;
  activated_at: string | null;
  user_id: string | null;
  created_at: string;
  updated_at: string;
  users?: {
    email: string;
    name: string;
  };
}
```

### **Toast System**
```typescript
interface ToastContextType {
  showToast: (message: string, type: 'success' | 'error' | 'info') => void;
}
```

## 🔒 БЕЗПЕКА

### **Environment Variables**
```bash
# Supabase Configuration
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Optional: Plugin Communication
CRYPTO_SECRET_KEY=your-crypto-secret

# Auto-configured by Vercel
NEXT_PUBLIC_API_URL=https://your-app.vercel.app
```

### **Security Measures**
- ✅ Environment variables for sensitive data
- ✅ Service Role Key with RLS
- ✅ Input validation in forms
- ✅ Error handling without data exposure
- ✅ HTTPS enforcement (Vercel)
- ✅ CORS configuration

### **Access Control**
- Service role has full database access
- No user authentication (admin-only system)
- API endpoints protected by deployment security
- Environment variables secured by Vercel

## 🚀 DEPLOYMENT

### **Vercel Configuration**
```json
{
  "buildCommand": "cd server && npm run build",
  "outputDirectory": "server/.next",
  "installCommand": "cd server && npm install",
  "framework": "nextjs"
}
```

### **Build Process**
1. Install dependencies (`npm install`)
2. Build Next.js application (`npm run build`)
3. Deploy to Vercel Edge Network
4. Environment variables configured
5. Domain automatically assigned

### **Deployment URLs**
- **Production:** https://server-dxg9ndtge-provis3ds-projects.vercel.app
- **Vercel Dashboard:** https://vercel.com/provis3ds-projects/server

## 📈 ПРОДУКТИВНІСТЬ

### **Optimization Strategies**
- **Code Splitting:** Automatic with Next.js
- **Image Optimization:** Next.js Image component
- **Bundle Analysis:** Built-in webpack analyzer
- **Caching:** Vercel Edge Network
- **Database:** Supabase connection pooling

### **Performance Metrics**
- **First Load:** < 2s (Vercel Edge)
- **API Response:** < 500ms average
- **Database Queries:** Optimized with indexes
- **Bundle Size:** < 1MB gzipped

## 🐛 ERROR HANDLING

### **Error Types**
```typescript
// API Errors
interface ApiError {
  success: false;
  error: string;
  details?: string;
}

// Component Errors
interface ComponentError {
  message: string;
  type: 'error' | 'warning' | 'info';
  retryable?: boolean;
}
```

### **Error Handling Strategy**
1. **API Level:** Try-catch with proper error responses
2. **Component Level:** Error boundaries and state management
3. **User Level:** Toast notifications with retry options
4. **Logging:** Console logging for development

## 🧪 ТЕСТУВАННЯ

### **Testing Strategy**
- **Manual Testing:** All features tested manually
- **Error Scenarios:** Comprehensive error testing
- **Browser Compatibility:** Chrome, Firefox, Safari, Edge
- **Responsive Design:** Mobile, tablet, desktop
- **Performance Testing:** Load testing with multiple users

### **Test Coverage**
- ✅ License CRUD operations
- ✅ Dashboard statistics
- ✅ Error handling scenarios
- ✅ Toast notifications
- ✅ Responsive design
- ✅ Loading states

## 📚 DEVELOPMENT WORKFLOW

### **Git Workflow**
```
main (production)
├── dev (development)
    ├── feature/feature-name
    └── fix/bug-description
```

### **Development Commands**
```bash
# Development
npm run dev          # Start development server
npm run build        # Build for production
npm run start        # Start production server

# Deployment
npm run vercel:deploy    # Deploy to Vercel
npm run vercel:prod      # Deploy to production
```

### **Code Standards**
- TypeScript strict mode
- ESLint configuration
- Prettier formatting
- Conventional commits
- Component documentation

---

**Note:** Ця документація оновлюється разом з проектом. Для найновішої інформації дивіться актуальні файли в репозиторії.
