# 🚀 ПЛАН РОЗРОБКИ ProGran3 - МОНОРЕПО MVP APPROACH

## 📋 **МОНОРЕПО АРХІТЕКТУРА РІШЕННЯ**

### **Plugin (Ruby + SketchUp Integration)**
- **Існуюча структура** - без змін поточної архітектури
- **Security модулі** - додати в `progran3/security/`
- **HMAC Cryptography** - прості підписи для MVP
- **API Client** - комунікація з сервером
- **Local Caching** - офлайн робота з ліцензіями

### **Server (Next.js 14 + TypeScript)**
- **Admin Dashboard** - управління ліцензіями та користувачами
- **API Routes** - REST API для плагіна
- **Real-time Monitoring** - моніторинг активності
- **License Management** - система управління ліцензіями

### **Database (Supabase PostgreSQL)**
- **PostgreSQL Database** - прості таблиці без партиціонування
- **Row Level Security** - базова безпека на рівні БД
- **Real-time Subscriptions** - live оновлення
- **Audit Logging** - базовий аудит операцій

### **Shared (TypeScript Modules)**
- **Common Types** - спільні типи для plugin/server
- **Crypto Utils** - криптографічні функції
- **Validation** - валідація даних
- **Constants** - спільні константи

---

## 🎯 **МОНОРЕПО ЕТАПИ РОЗРОБКИ**

### **Етап 1: Монорепо Infrastructure (2 тижні)**

#### **1.1 Створення монорепо структури**
```bash
# Створення кореневої структури
mkdir -p ProGran3/{server,database,shared,docs,scripts}
cd ProGran3

# Ініціалізація workspace
npm init -y
npm install -D concurrently

# Налаштування workspaces
echo '{
  "workspaces": ["server", "shared"],
  "scripts": {
    "dev": "concurrently \"npm run dev:server\" \"npm run dev:plugin\"",
    "dev:server": "cd server && npm run dev",
    "dev:plugin": "cd plugin && ruby proGran3.rb"
  }
}' > package.json
```

#### **1.2 Supabase проект - SIMPLIFIED MVP SCHEMA**
```sql
-- ===========================================
-- SIMPLIFIED MVP DATABASE SCHEMA
-- ===========================================

-- Users table (спрощена)
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE NOT NULL,
  name VARCHAR(255),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_users_email ON users(email);

-- Licenses table (базова функціональність)
CREATE TABLE licenses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  license_key VARCHAR(255) UNIQUE NOT NULL,
  license_type VARCHAR(50) NOT NULL CHECK (license_type IN ('trial', 'standard', 'professional')),
  status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'expired', 'suspended')),
  expires_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_licenses_key ON licenses(license_key);
CREATE INDEX idx_licenses_user_id ON licenses(user_id);
CREATE INDEX idx_licenses_status ON licenses(status);

-- System infos (без партиціонування)
CREATE TABLE system_infos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  license_id UUID REFERENCES licenses(id) ON DELETE CASCADE,
  fingerprint_hash VARCHAR(255) NOT NULL,
  system_data JSONB,
  last_seen TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_system_infos_license_id ON system_infos(license_id);
CREATE INDEX idx_system_infos_fingerprint ON system_infos(fingerprint_hash);

-- Heartbeats (проста таблиця)
CREATE TABLE heartbeats (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  license_id UUID REFERENCES licenses(id) ON DELETE CASCADE,
  system_info_id UUID REFERENCES system_infos(id) ON DELETE CASCADE,
  status VARCHAR(50) DEFAULT 'active',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_heartbeats_license_id ON heartbeats(license_id);
CREATE INDEX idx_heartbeats_created_at ON heartbeats(created_at);

-- RLS політики (базові)
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE licenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE system_infos ENABLE ROW LEVEL SECURITY;
ALTER TABLE heartbeats ENABLE ROW LEVEL SECURITY;

-- Прості RLS політики
CREATE POLICY "Service role full access" ON licenses
  FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Service role full access" ON system_infos
  FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Service role full access" ON heartbeats
  FOR ALL USING (auth.role() = 'service_role');
```

#### **1.3 Next.js Server проект**
```bash
# Створення server проекту в монорепо
cd server
npx create-next-app@latest . --typescript --tailwind --app --src-dir=false

# Залежності
npm install @supabase/supabase-js @supabase/auth-helpers-nextjs
npm install @headlessui/react @heroicons/react
npm install recharts date-fns crypto-js
```

#### **1.4 Shared модулі**
```bash
# Створення shared workspace
cd ../shared
npm init -y
npm install -D typescript @types/node
npm install crypto-js

# TypeScript конфігурація
echo '{
  "compilerOptions": {
    "target": "ES2020",
    "module": "commonjs",
    "declaration": true,
    "outDir": "./dist"
  }
}' > tsconfig.json
```

#### **1.5 Монорепо структура**
```
ProGran3/
├── plugin/                          # ✅ ІСНУЮЧА СТРУКТУРА
│   ├── proGran3.rb
│   ├── proGran3/
│   │   ├── security/                # ✅ НОВА ПАПКА
│   │   │   ├── license_manager.rb
│   │   │   ├── api_client.rb
│   │   │   └── crypto_manager.rb
│   │   └── web/                     # ✅ ІСНУЮЧА
│   │       ├── modules/
│   │       │   ├── core/
│   │       │   │   └── LicenseManager.js
│   │       │   └── security/
│   │       │       ├── LicenseAPI.js
│   │       │       └── CryptoUtils.js
│   │       └── index.html
│   └── config.json
├── server/                          # ✅ НОВИЙ SERVER
│   ├── package.json
│   ├── next.config.js
│   ├── app/
│   │   ├── api/
│   │   │   ├── licenses/route.ts
│   │   │   ├── systems/route.ts
│   │   │   └── heartbeats/route.ts
│   │   ├── dashboard/page.tsx
│   │   └── layout.tsx
│   ├── components/
│   │   ├── LicenseManager.tsx
│   │   ├── SystemMonitor.tsx
│   │   └── Dashboard.tsx
│   ├── lib/
│   │   ├── supabase.ts
│   │   ├── crypto.ts
│   │   └── utils.ts
│   └── types/database.ts
├── shared/                          # ✅ СПІЛЬНІ МОДУЛІ
│   ├── types/
│   │   ├── license.ts
│   │   ├── system.ts
│   │   └── api.ts
│   ├── crypto/
│   │   ├── hmac.ts
│   │   └── fingerprint.ts
│   └── utils/
│       ├── validation.ts
│       └── constants.ts
├── database/                        # ✅ БАЗА ДАНИХ
│   ├── schema.sql
│   ├── migrations/
│   └── seeds/
├── docs/                            # ✅ ДОКУМЕНТАЦІЯ
├── scripts/                         # ✅ СКРИПТИ
├── .env.example
├── .gitignore
├── README.md
└── package.json                     # ✅ КОРІНЕВИЙ
```

### **Етап 2: Plugin Security Integration (2 тижні)**

#### **2.1 Plugin Security модулі**
```ruby
# plugin/proGran3/security/license_manager.rb
module ProGran3
  module Security
    class LicenseManager
      def initialize(api_url, api_key)
        @api_client = ApiClient.new(api_url, api_key)
        @crypto_manager = CryptoManager.new(api_key)
        @cache = {}
        @cache_ttl = 3600 # 1 година
      end
      
      def has_valid_license?
        # Використовуємо існуючий Logger
        Logger.info("Перевірка ліцензії", "LicenseManager")
        
        # Перевіряємо кеш
        return @cache[:license_valid] if cache_valid?(:license_valid)
        
        # Перевіряємо локальний файл ліцензії
        local_license = load_local_license
        if local_license && local_license[:expires_at] > Time.now
          @cache[:license_valid] = true
          @cache[:license_valid_timestamp] = Time.now
          return true
        end
        
        # Спроба активації через API
        result = @api_client.validate_license
        if result[:success]
          save_license_locally(result[:license])
          @cache[:license_valid] = true
          @cache[:license_valid_timestamp] = Time.now
          return true
        end
        
        @cache[:license_valid] = false
        @cache[:license_valid_timestamp] = Time.now
        false
      end
      
      private
      
      def load_local_license
        license_file = File.join(Dir.home, '.progran3_license')
        return nil unless File.exist?(license_file)
        
        JSON.parse(File.read(license_file), symbolize_names: true)
      rescue => e
        Logger.warn("Помилка читання локальної ліцензії: #{e.message}", "LicenseManager")
        nil
      end
      
      def save_license_locally(license_data)
        license_file = File.join(Dir.home, '.progran3_license')
        File.open(license_file, 'w') do |file|
          file.write(license_data.to_json)
        end
        Logger.info("Ліцензія збережена локально", "LicenseManager")
      rescue => e
        Logger.warn("Не вдалося зберегти ліцензію: #{e.message}", "LicenseManager")
      end
      
      def cache_valid?(key)
        timestamp_key = "#{key}_timestamp".to_sym
        return false unless @cache[timestamp_key]
        
        Time.now - @cache[timestamp_key] < @cache_ttl
      end
    end
  end
end
```

#### **2.2 API Client для Plugin**
```ruby
# plugin/proGran3/security/api_client.rb
module ProGran3
  module Security
    class ApiClient
      def initialize(base_url, api_key)
        @base_url = base_url
        @api_key = api_key
        @crypto_manager = CryptoManager.new(api_key)
        @retry_count = 0
        @max_retries = 3
      end
      
      def validate_license
        system_fingerprint = @crypto_manager.generate_system_fingerprint
        
        payload = {
          license_key: get_license_key,
          system_fingerprint: system_fingerprint
        }
        
        make_request('/licenses/validate', payload)
      end
      
      def send_heartbeat
        system_fingerprint = @crypto_manager.generate_system_fingerprint
        
        payload = {
          license_key: get_license_key,
          system_fingerprint: system_fingerprint,
          timestamp: Time.now.to_i
        }
        
        make_request('/heartbeats', payload)
      end
      
      private
      
      def get_license_key
        # Читаємо з локального файлу або змінних середовища
        license_file = File.join(Dir.home, '.progran3_license')
        if File.exist?(license_file)
          license_data = JSON.parse(File.read(license_file), symbolize_names: true)
          return license_data[:license_key]
        end
        
        ENV['PROGRAN3_LICENSE_KEY'] || 'demo-key'
      end
      
      def make_request(endpoint, payload)
        require 'net/http'
        require 'uri'
        require 'json'
        
        uri = URI("#{@base_url}#{endpoint}")
        
        http = Net::HTTP.new(uri.host, uri.port)
        http.use_ssl = uri.scheme == 'https'
        http.read_timeout = 10
        http.open_timeout = 5
        
        request = Net::HTTP::Post.new(uri)
        request['Content-Type'] = 'application/json'
        request['X-API-Key'] = @api_key
        request.body = payload.to_json
        
        response = http.request(request)
        
        case response.code.to_i
        when 200..299
          JSON.parse(response.body, symbolize_names: true)
        when 401
          { success: false, error: 'unauthorized' }
        when 403
          { success: false, error: 'forbidden' }
        when 404
          { success: false, error: 'not_found' }
        else
          { success: false, error: "server_error_#{response.code}" }
        end
      rescue => e
        @retry_count += 1
        
        if @retry_count <= @max_retries
          Logger.warn("API помилка (спроба #{@retry_count}): #{e.message}", "ApiClient")
          sleep(1)
          make_request(endpoint, payload)
        else
          Logger.error("API недоступний після #{@max_retries} спроб", "ApiClient")
          { success: false, error: 'api_unavailable' }
        end
      end
    end
  end
end
```

#### **2.3 Server API Routes**
```typescript
// app/api/licenses/route.ts - SIMPLIFIED VERSION
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase'

export async function POST(request: NextRequest) {
  try {
    const { license_key, system_fingerprint } = await request.json()
    
    // Базова валідація
    if (!license_key || !system_fingerprint) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }
    
    const supabase = createClient()
    
    // Пошук ліцензії
    const { data: license, error: licenseError } = await supabase
      .from('licenses')
      .select('*')
      .eq('license_key', license_key)
      .eq('status', 'active')
      .single()
    
    if (licenseError || !license) {
      return NextResponse.json({ error: 'Invalid license' }, { status: 404 })
    }
    
    // Перевірка терміну дії
    if (license.expires_at && new Date(license.expires_at) < new Date()) {
      return NextResponse.json({ error: 'License expired' }, { status: 403 })
    }
    
    // Оновлення системної інформації
    const { error } = await supabase
      .from('system_infos')
      .upsert({
        license_id: license.id,
        fingerprint_hash: system_fingerprint,
        system_data: { timestamp: new Date().toISOString() },
        last_seen: new Date().toISOString()
      })
    
    if (error) {
      console.error('Database error:', error)
      return NextResponse.json({ error: 'Database error' }, { status: 500 })
    }
    
    return NextResponse.json({ 
      success: true, 
      license: {
        id: license.id,
        type: license.license_type,
        expires_at: license.expires_at
      }
    })
    
  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
```

#### **2.2 Basic HMAC Cryptography (MVP)**
```typescript
// lib/crypto.ts - SIMPLIFIED HMAC IMPLEMENTATION
import crypto from 'crypto'

export class BasicCryptoManager {
  private static readonly SECRET_KEY = process.env.CRYPTO_SECRET_KEY || 'default-secret-key'
  
  // HMAC підпис (простий, але достатній для MVP)
  static signData(data: any): string {
    const dataString = JSON.stringify(data, Object.keys(data).sort())
    const hmac = crypto.createHmac('sha256', this.SECRET_KEY)
    hmac.update(dataString)
    return hmac.digest('hex')
  }
  
  // Верифікація HMAC підпису
  static verifySignature(data: any, signature: string): boolean {
    const expectedSignature = this.signData(data)
    return crypto.timingSafeEqual(
      Buffer.from(signature, 'hex'),
      Buffer.from(expectedSignature, 'hex')
    )
  }
  
  // Генерація системного відбитка (спрощена)
  static generateSystemFingerprint(systemData: any): string {
    const timestamp = Math.floor(Date.now() / 1000)
    const dataToHash = {
      ...systemData,
      timestamp
    }
    
    const dataString = JSON.stringify(dataToHash, Object.keys(dataToHash).sort())
    return crypto.createHash('sha256').update(dataString).digest('hex')
  }
  
  // Генерація безпечного токену
  static generateSecureToken(length: number = 16): string {
    return crypto.randomBytes(length).toString('hex')
  }
}
```

### **Етап 3: Shared Modules & Integration (2 тижні)**

#### **3.1 Shared TypeScript модулі**
```typescript
// shared/types/license.ts
export interface License {
  id: string
  user_id: string
  license_key: string
  license_type: 'trial' | 'standard' | 'professional'
  status: 'active' | 'expired' | 'suspended'
  expires_at?: string
  created_at: string
  updated_at: string
}

export interface SystemInfo {
  id: string
  license_id: string
  fingerprint_hash: string
  system_data: any
  last_seen: string
  created_at: string
}

export interface ApiResponse<T = any> {
  success: boolean
  data?: T
  error?: string
}
```

```typescript
// shared/crypto/hmac.ts
import CryptoJS from 'crypto-js'

export function signData(data: any, secretKey: string): string {
  const dataString = JSON.stringify(data, Object.keys(data).sort())
  return CryptoJS.HmacSHA256(dataString, secretKey).toString()
}

export function verifySignature(data: any, signature: string, secretKey: string): boolean {
  const expectedSignature = signData(data, secretKey)
  return CryptoJS.timingSafeEqual(
    CryptoJS.enc.Hex.parse(signature),
    CryptoJS.enc.Hex.parse(expectedSignature)
  )
}

export function generateSystemFingerprint(systemData: any): string {
  const timestamp = Math.floor(Date.now() / 1000)
  const dataToHash = {
    ...systemData,
    timestamp
  }
  
  const dataString = JSON.stringify(dataToHash, Object.keys(dataToHash).sort())
  return CryptoJS.SHA256(dataString).toString()
}
```

#### **3.2 Plugin Integration з існуючою структурою**
```ruby
# progran3/security/simple_crypto_manager.rb - MVP VERSION
module ProGran3
  module Security
    class SimpleCryptoManager
      def initialize(api_key)
        @api_key = api_key
        @base_url = ENV['PROGRAN3_API_URL'] || 'https://your-app.vercel.app/api'
        @cache = {}
        @cache_ttl = 3600 # 1 година
      end
      
      # HMAC підпис (простий, але достатній для MVP)
      def sign_data(data)
        require 'digest'
        require 'openssl'
        
        sorted_data = data.sort.to_h
        data_string = sorted_data.to_json
        signature = OpenSSL::HMAC.hexdigest('SHA256', @api_key, data_string)
        signature
      end
      
      # Верифікація HMAC підпису
      def verify_signature(data, signature)
        expected_signature = sign_data(data)
        expected_signature == signature
      end
      
      # Спрощена генерація системного відбитка
      def generate_system_fingerprint
        system_data = collect_basic_system_data
        
        timestamp = Time.current.to_i
        fingerprint_data = {
          hardware: system_data[:hardware],
          software: system_data[:software],
          timestamp: timestamp
        }
        
        require 'digest'
        data_string = fingerprint_data.to_json
        Digest::SHA256.hexdigest(data_string)
      end
      
      # Базова збірка системних даних (без складних викликів)
      def collect_basic_system_data
        {
          hardware: {
            motherboard_serial: get_cached_motherboard_serial,
            cpu_id: get_cached_cpu_id,
            mac_addresses: get_cached_mac_addresses
          },
          software: {
            os_name: get_os_name,
            ruby_version: RUBY_VERSION,
            ruby_platform: RUBY_PLATFORM,
            sketchup_version: get_sketchup_version,
            plugin_version: get_plugin_version
          }
        }
      end
      
      private
      
      # Кешування системних даних для швидкості
      def get_cached_motherboard_serial
        return @cache[:motherboard_serial] if cache_valid?(:motherboard_serial)
        
        serial = if RUBY_PLATFORM.include?('mingw')
          result = `wmic baseboard get serialnumber /value 2>nul`
          result.scan(/SerialNumber=(.+)/).flatten.first&.strip
        else
          'unknown'
        end
        
        @cache[:motherboard_serial] = (serial && !serial.empty?) ? serial : 'unknown'
        @cache[:motherboard_serial_timestamp] = Time.now
        @cache[:motherboard_serial]
      end
      
      def get_cached_cpu_id
        return @cache[:cpu_id] if cache_valid?(:cpu_id)
        
        cpu_id = if RUBY_PLATFORM.include?('mingw')
          result = `wmic cpu get processorid /value 2>nul`
          result.scan(/ProcessorId=(.+)/).flatten.first&.strip
        else
          'unknown'
        end
        
        @cache[:cpu_id] = (cpu_id && !cpu_id.empty?) ? cpu_id : 'unknown'
        @cache[:cpu_id_timestamp] = Time.now
        @cache[:cpu_id]
      end
      
      def get_cached_mac_addresses
        return @cache[:mac_addresses] if cache_valid?(:mac_addresses)
        
        macs = []
        if RUBY_PLATFORM.include?('mingw')
          result = `getmac /v /fo csv 2>nul`
          result.scan(/"([A-F0-9-]{17})"/) do |mac|
            mac_address = mac[0].upcase
            next if virtual_mac?(mac_address)
            macs << mac_address
          end
        end
        
        @cache[:mac_addresses] = macs.uniq.first(3)
        @cache[:mac_addresses_timestamp] = Time.now
        @cache[:mac_addresses]
      end
      
      def get_os_name
        if RUBY_PLATFORM.include?('mingw')
          result = `wmic os get name /value`
          result.scan(/Name=(.+)/).flatten.first&.strip || 'Windows'
        elsif RUBY_PLATFORM.include?('linux')
          `uname -s`.strip
        else
          'unknown'
        end
      end
      
      def get_sketchup_version
        defined?(Sketchup) ? Sketchup.version : 'unknown'
      end
      
      def get_plugin_version
        ProGran3::Constants::VERSION rescue 'unknown'
      end
      
      def virtual_mac?(mac)
        virtual_prefixes = ['00:05:69', '00:0C:29', '00:1C:14', '00:50:56', '08:00:27']
        virtual_prefixes.any? { |prefix| mac.start_with?(prefix) }
      end
      
      def cache_valid?(key)
        timestamp_key = "#{key}_timestamp".to_sym
        return false unless @cache[timestamp_key]
        
        Time.now - @cache[timestamp_key] < @cache_ttl
      end
    end
  end
end
```

#### **3.2 Simple API Client**
```ruby
# progran3/security/simple_api_client.rb - MVP VERSION
module ProGran3
  module Security
    class SimpleApiClient
      def initialize(base_url, api_key)
        @base_url = base_url
        @api_key = api_key
        @crypto_manager = SimpleCryptoManager.new(api_key)
        @retry_count = 0
        @max_retries = 3
      end
      
      def activate_license(license_key)
        system_fingerprint = @crypto_manager.generate_system_fingerprint
        
        payload = {
          license_key: license_key,
          system_fingerprint: system_fingerprint
        }
        
        response = make_request('/licenses', payload)
        
        if response[:success]
          save_license_locally(response[:license])
          Logger.success("Ліцензія активована", "ApiClient")
          { success: true, license: response[:license] }
        else
          Logger.warn("Помилка активації: #{response[:error]}", "ApiClient")
          { success: false, error: response[:error] }
        end
      end
      
      def validate_license(license_key)
        system_fingerprint = @crypto_manager.generate_system_fingerprint
        
        payload = {
          license_key: license_key,
          system_fingerprint: system_fingerprint
        }
        
        make_request('/licenses/validate', payload)
      end
      
      def send_heartbeat(license_key)
        system_fingerprint = @crypto_manager.generate_system_fingerprint
        
        payload = {
          license_key: license_key,
          system_fingerprint: system_fingerprint,
          timestamp: Time.current.to_i
        }
        
        make_request('/heartbeats', payload)
      end
      
      private
      
      def make_request(endpoint, payload)
        require 'net/http'
        require 'uri'
        require 'json'
        
        uri = URI("#{@base_url}#{endpoint}")
        
        http = Net::HTTP.new(uri.host, uri.port)
        http.use_ssl = true
        http.read_timeout = 10  # Зменшено timeout для швидкості
        http.open_timeout = 5
        
        request = Net::HTTP::Post.new(uri)
        request['Content-Type'] = 'application/json'
        request['X-API-Key'] = @api_key
        request.body = payload.to_json
        
        response = http.request(request)
        
        case response.code.to_i
        when 200..299
          JSON.parse(response.body, symbolize_names: true)
        when 401
          { success: false, error: 'unauthorized' }
        when 403
          { success: false, error: 'forbidden' }
        when 404
          { success: false, error: 'not_found' }
        else
          { success: false, error: "server_error_#{response.code}" }
        end
      rescue => e
        @retry_count += 1
        
        if @retry_count <= @max_retries
          Logger.warn("API помилка (спроба #{@retry_count}): #{e.message}", "ApiClient")
          sleep(1) # Коротка затримка перед повторною спробою
          make_request(endpoint, payload)
        else
          Logger.error("API недоступний після #{@max_retries} спроб", "ApiClient")
          { success: false, error: 'api_unavailable' }
        end
      end
      
      def save_license_locally(license_data)
        # Просте збереження в локальний файл
        license_file = File.join(Dir.home, '.progran3_license')
        
        File.open(license_file, 'w') do |file|
          file.write(license_data.to_json)
        end
        
        Logger.info("Ліцензія збережена локально", "ApiClient")
      rescue => e
        Logger.warn("Не вдалося зберегти ліцензію локально: #{e.message}", "ApiClient")
      end
    end
  end
end
```

### **Етап 4: Dashboard & Monitoring (1 тиждень)**

#### **4.1 Server Dashboard**
```typescript
// components/Dashboard.tsx
'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase'

export default function Dashboard() {
  const [stats, setStats] = useState({
    totalLicenses: 0,
    activeLicenses: 0,
    totalSystems: 0,
    recentActivity: []
  })
  
  const supabase = createClient()
  
  useEffect(() => {
    fetchStats()
    setupRealtime()
  }, [])
  
  const fetchStats = async () => {
    const { data: licenses } = await supabase
      .from('licenses')
      .select('*')
    
    const { data: systems } = await supabase
      .from('system_infos')
      .select('*')
    
    setStats({
      totalLicenses: licenses?.length || 0,
      activeLicenses: licenses?.filter(l => l.status === 'active').length || 0,
      totalSystems: systems?.length || 0,
      recentActivity: []
    })
  }
  
  const setupRealtime = () => {
    supabase
      .channel('heartbeats')
      .on('postgres_changes', 
        { event: 'INSERT', schema: 'public', table: 'heartbeats' },
        (payload) => {
          console.log('New heartbeat:', payload)
          fetchStats() // Оновлюємо статистику
        }
      )
      .subscribe()
  }
  
  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
      <div className="bg-white p-6 rounded-lg shadow">
        <h3 className="text-lg font-medium">Всього ліцензій</h3>
        <p className="text-3xl font-bold text-blue-600">{stats.totalLicenses}</p>
      </div>
      
      <div className="bg-white p-6 rounded-lg shadow">
        <h3 className="text-lg font-medium">Активні ліцензії</h3>
        <p className="text-3xl font-bold text-green-600">{stats.activeLicenses}</p>
      </div>
      
      <div className="bg-white p-6 rounded-lg shadow">
        <h3 className="text-lg font-medium">Системи</h3>
        <p className="text-3xl font-bold text-purple-600">{stats.totalSystems}</p>
      </div>
      
      <div className="bg-white p-6 rounded-lg shadow">
        <h3 className="text-lg font-medium">Онлайн зараз</h3>
        <p className="text-3xl font-bold text-orange-600">-</p>
      </div>
    </div>
  )
}
```

#### **4.2 Real-time моніторинг**
```typescript
// components/SystemMonitor.tsx
'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase'

interface SystemInfo {
  id: string
  license_key: string
  fingerprint_hash: string
  last_seen: string
  system_data: any
}

export default function SystemMonitor() {
  const [systems, setSystems] = useState<SystemInfo[]>([])
  const supabase = createClient()
  
  useEffect(() => {
    fetchSystems()
    setupRealtime()
  }, [])
  
  const fetchSystems = async () => {
    const { data } = await supabase
      .from('system_infos')
      .select(`
        *,
        licenses!inner(license_key, license_type, status)
      `)
      .order('last_seen', { ascending: false })
    
    setSystems(data || [])
  }
  
  const setupRealtime = () => {
    supabase
      .channel('system_updates')
      .on('postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'system_infos' },
        (payload) => {
          setSystems(prev => 
            prev.map(system => 
              system.id === payload.new.id ? payload.new : system
            )
          )
        }
      )
      .subscribe()
  }
  
  const isOnline = (lastSeen: string) => {
    const lastSeenDate = new Date(lastSeen)
    const now = new Date()
    const diffMinutes = (now.getTime() - lastSeenDate.getTime()) / (1000 * 60)
    return diffMinutes < 5 // Онлайн якщо остання активність менше 5 хвилин тому
  }
  
  return (
    <div className="bg-white shadow rounded-lg">
      <div className="px-4 py-5 sm:p-6">
        <h3 className="text-lg leading-6 font-medium text-gray-900">
          Активні системи
        </h3>
        
        <div className="mt-5">
          <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 md:rounded-lg">
            <table className="min-w-full divide-y divide-gray-300">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Ліцензія
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Система
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Статус
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Остання активність
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {systems.map((system) => (
                  <tr key={system.id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {system.licenses?.license_key || 'N/A'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {system.fingerprint_hash.substring(0, 16)}...
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        isOnline(system.last_seen) 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {isOnline(system.last_seen) ? 'Онлайн' : 'Офлайн'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(system.last_seen).toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  )
}
```

### **Етап 5: Монорепо Integration & Testing (1 тиждень)**

#### **5.1 Оновлення основного плагіна (мінімальні зміни)**
```ruby
# progran3.rb - додати до існуючого коду
module ProGran3
  # Додати нові модулі до існуючих require_relative
  require_relative 'progran3/security/crypto_manager'
  require_relative 'progran3/security/api_client'
  require_relative 'progran3/security/license_manager'
  
  # Ініціалізація системи безпеки
  $license_manager = nil
  
  def self.initialize_licensing
    api_key = ENV['PROGRAN3_API_KEY'] || 'demo-key'
    base_url = ENV['PROGRAN3_API_URL'] || 'https://your-app.vercel.app/api'
    
    $license_manager = Security::LicenseManager.new(base_url, api_key)
    Logger.info("Система ліцензування ініціалізована", "Main")
  end
  
  # Модифікувати існуючий трекер
  class ProGran3Tracker
    def initialize
      @license_manager = $license_manager
      @plugin_id = generate_unique_plugin_id
      @is_running = false
      # ... існуючий код
    end
    
    def start_tracking
      if @is_running
        Logger.info("Відстеження вже запущено", "Tracker")
        return
      end
      
      # Перевірка ліцензії перед запуском
      if @license_manager && !@license_manager.has_valid_license?
        Logger.warn("Ліцензія не активна, запуск в демо режимі", "Tracker")
        return start_demo_mode
      end
      
      @is_running = true
      Logger.info("Запуск відстеження з ліцензуванням", "Tracker")
      
      # Запускаємо heartbeat до сервера
      start_heartbeat_tracking
      
      # Локальне логування
      log_local_activity
    end
    
    private
    
    def start_heartbeat_tracking
      return unless @license_manager
      
      @heartbeat_timer = UI.start_timer(300, true) do # Кожні 5 хвилин
        @license_manager.send_heartbeat
      end
    end
    
    def start_demo_mode
      @is_running = true
      Logger.info("Запуск в демо режимі", "Tracker")
      log_local_activity
    end
  end
  
  # Ініціалізація при завантаженні
  unless file_loaded?(__FILE__)
    initialize_licensing
    
    # ... існуючий код завантаження
  end
end
```

#### **5.2 Environment variables**
```bash
# .env.local (Vercel)
CRYPTO_SECRET_KEY=your-secret-key-here
SUPABASE_URL=your-supabase-url
SUPABASE_ANON_KEY=your-supabase-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

```ruby
# В плагіні (config або constants)
PROGRAN3_API_URL = 'https://your-app.vercel.app/api'
PROGRAN3_API_KEY = 'your-api-key'
```

---

## 🚀 **МОНОРЕПО ПЛАН РОЗГОРТАННЯ**

### **Тиждень 1-2: Монорепо Infrastructure**
- [ ] Створення монорепо структури
- [ ] Налаштування workspace (server, shared)
- [ ] Створення Supabase проекту з простою схемою
- [ ] Налаштування Next.js server проекту
- [ ] Створення базових таблиць без партиціонування
- [ ] Прості RLS політики

### **Тиждень 3-4: Plugin Security Integration**
- [ ] Створення `plugin/proGran3/security/` папки
- [ ] HMAC криптографія (замість RSA)
- [ ] API клієнт з кешуванням
- [ ] Інтеграція з існуючим ErrorHandler та Logger
- [ ] Graceful fallback до demo режиму

### **Тиждень 5-6: Server API & Shared Modules**
- [ ] Server API routes для ліцензування
- [ ] Shared TypeScript модулі
- [ ] Базова heartbeat система
- [ ] Тестування API з fallback механізмами
- [ ] Інтеграція shared модулів

### **Тиждень 7: Dashboard & Monitoring**
- [ ] Server admin dashboard
- [ ] Real-time моніторинг активності
- [ ] Система управління ліцензіями
- [ ] Інтеграція з існуючим UI плагіна

### **Тиждень 8: Монорепо Integration & Testing**
- [ ] Інтеграційне тестування всіх частин
- [ ] Performance оптимізація
- [ ] Fallback тестування
- [ ] Документація для MVP
- [ ] Підготовка до MVP релізу

---

## 🔧 **МОНОРЕПО ТЕХНІЧНІ ДЕТАЛІ**

### **Кореневий package.json**
```json
{
  "name": "progran3-monorepo",
  "version": "1.0.0",
  "workspaces": [
    "server",
    "shared"
  ],
  "scripts": {
    "dev": "concurrently \"npm run dev:server\" \"npm run dev:plugin\"",
    "dev:server": "cd server && npm run dev",
    "dev:plugin": "cd plugin && ruby proGran3.rb",
    "build": "npm run build:server && npm run build:shared",
    "build:server": "cd server && npm run build",
    "build:shared": "cd shared && npm run build",
    "deploy": "npm run deploy:server && npm run deploy:plugin",
    "deploy:server": "cd server && npm run deploy",
    "deploy:plugin": "cd plugin && ruby deploy.ps1",
    "test": "npm run test:server && npm run test:plugin",
    "test:server": "cd server && npm run test",
    "test:plugin": "cd plugin && ruby test_suite.rb"
  },
  "devDependencies": {
    "concurrently": "^8.2.2",
    "typescript": "^5.0.0"
  }
}
```

### **Environment Variables**
```bash
# .env.example (корінь монорепо)
# Server
NEXT_PUBLIC_API_URL=http://localhost:3000/api
SUPABASE_URL=your-supabase-url
SUPABASE_ANON_KEY=your-supabase-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
CRYPTO_SECRET_KEY=your-secret-key

# Plugin
PROGRAN3_API_URL=http://localhost:3000/api
PROGRAN3_API_KEY=your-api-key
PROGRAN3_LICENSE_KEY=demo-license-key
```

### **Supabase налаштування**
```sql
-- RLS політики для безпеки
CREATE POLICY "Users can view own data" ON users
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can insert own data" ON users
  FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "Service role can manage licenses" ON licenses
  FOR ALL USING (auth.role() = 'service_role');
```

### **Next.js Server налаштування**
```json
// server/next.config.js
/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    appDir: true,
  },
  env: {
    CRYPTO_SECRET_KEY: process.env.CRYPTO_SECRET_KEY,
    SUPABASE_URL: process.env.SUPABASE_URL,
    SUPABASE_ANON_KEY: process.env.SUPABASE_ANON_KEY,
    SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY,
  },
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: '/api/:path*',
      },
    ]
  },
}

module.exports = nextConfig
```

### **Shared TypeScript конфігурація**
```json
// shared/tsconfig.json
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "commonjs",
    "declaration": true,
    "outDir": "./dist",
    "rootDir": "./src",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist"]
}
```

### **Безпека**
- **API ключі** в environment variables
- **Row Level Security** в Supabase
- **HTTPS** для всіх комунікацій
- **Криптографічні підписи** для ліцензій
- **Rate limiting** в API routes

---

## 🚨 **МОНОРЕПО РЕКОМЕНДАЦІЇ**

### **1. МОНОРЕПО ПІДХІД**

#### **✅ ПЕРЕВАГИ МОНОРЕПО:**
- **Єдина структура** - все в одному репозиторії
- **Shared модулі** - спільні типи та утиліти
- **Простий деплой** - один скрипт для всього
- **Зручний розробка** - все в одному місці

#### **✅ ПРАКТИЧНІ РІШЕННЯ:**
- **Workspace налаштування** для server та shared
- **Shared TypeScript модулі** для типів
- **Єдині environment variables**
- **Спільні скрипти** для розробки та деплою

### **2. PLUGIN INTEGRATION - БЕЗ ЗМІН**

#### **✅ ЗБЕРЕЖЕНО ІСНУЮЧУ СТРУКТУРУ:**
- **Нулі змін** в поточній архітектурі
- **Додано тільки security папку** в `progran3/security/`
- **Мінімальні зміни** в `ui.rb` та `constants.rb`
- **Використання існуючих модулів** (Logger, ErrorHandler)

#### **✅ РІШЕННЯ:**
- **Seamless integration** з існуючим кодом
- **Demo режим** як fallback
- **Local license caching** для офлайн роботи
- **Retry logic** з експоненційною затримкою

### **3. SERVER ARCHITECTURE - СУЧАСНА**

#### **✅ NEXT.JS 14 + TYPESCRIPT:**
- **App Router** для сучасної архітектури
- **API Routes** для backend логіки
- **Real-time** через Supabase
- **TypeScript** для типобезпеки

#### **✅ РІШЕННЯ:**
- **Shared типи** між plugin та server
- **HMAC криптографія** для безпеки
- **Real-time monitoring** через Supabase
- **Responsive dashboard** для управління

### **4. TIMELINE - МОНОРЕПО ОПТИМІЗОВАНИЙ**

#### **✅ ВИПРАВЛЕНО:**
- **8 тижнів** для повного монорепо
- **Паралельна розробка** server та plugin
- **Shared модулі** на початку
- **Integration testing** в кінці

---

## 📊 **ПОРІВНЯЛЬНА ТАБЛИЦЯ**

| Аспект | Початковий план | Монорепо план |
|--------|----------------|---------------|
| **Архітектура** | Окремі проекти | Монорепо з workspaces |
| **Безпека** | RSA 2048-bit (складно) | HMAC (достатньо для MVP) |
| **БД** | Партиціонування (складно) | Прості таблиці |
| **API** | Rate limiting + caching (складно) | Простий REST API |
| **Plugin** | Зміни структури | Без змін існуючої структури |
| **Shared** | Відсутність | TypeScript shared модулі |
| **Timeline** | 5 тижнів (нереально) | 8 тижнів (реалістично) |
| **Fallback** | Відсутність | Graceful degradation |
| **Testing** | Мінімальне | Повне тестування |

---

## 🎯 **МОНОРЕПО ПРИОРИТЕТИ MVP**

### **ПРИОРИТЕТ 1 (КРИТИЧНО):**
1. **Монорепо структура** - все в одному місці
2. **Plugin без змін** - збереження існуючої архітектури
3. **Shared модулі** - спільні типи та утиліти
4. **Базова система ліцензування** - працює

### **ПРИОРИТЕТ 2 (ВАЖЛИВО):**
1. **Server API** - Next.js 14 + TypeScript
2. **Real-time monitoring** - Supabase subscriptions
3. **Graceful fallback** - демо режим
4. **Local caching** - офлайн робота

### **ПРИОРИТЕТ 3 (МАЙБУТНЄ):**
1. **RSA криптографія** - після MVP
2. **Rate limiting** - при масштабуванні
3. **Advanced analytics** - для бізнесу
4. **Microservices** - при потребі масштабування

---

## 🚀 **МОНОРЕПО TIMELINE**

| Тиждень | Фокус | Ключові досягнення |
|---------|-------|-------------------|
| **1-2** | Монорепо Infrastructure | Workspace setup + БД + Server |
| **3-4** | Plugin Security | Security модулі + API Client |
| **5-6** | Server API & Shared | API Routes + Shared модулі |
| **7** | Dashboard & Monitoring | Real-time dashboard |
| **8** | Integration & Testing | Full integration testing |

---

## 🎯 **КЛЮЧОВІ ПЕРЕВАГИ МОНОРЕПО ПЛАНУ**

### **✅ МОНОРЕПО ПЕРЕВАГИ:**
- **Єдина структура** - все в одному репозиторії
- **Shared модулі** - спільні типи та утиліти
- **Простий деплой** - один скрипт для всього
- **Зручний розробка** - все в одному місці

### **✅ PLUGIN БЕЗ ЗМІН:**
- **Збереження існуючої архітектури**
- **Додано тільки security папку**
- **Мінімальні зміни** в ui.rb та constants.rb
- **Використання існуючих модулів**

### **✅ СУЧАСНА СЕРВЕРНА АРХІТЕКТУРА:**
- **Next.js 14 + TypeScript** для сучасності
- **Real-time monitoring** через Supabase
- **Shared типи** між plugin та server
- **Responsive dashboard** для управління

### **✅ МАСШТАБОВАНІСТЬ:**
- **Модульна архітектура** для майбутніх покращень
- **Shared модулі** легко розширювати
- **Workspace структура** для додавання нових частин
- **TypeScript** для типобезпеки

---

*Цей монорепо план забезпечує **реалістичну реалізацію** MVP системи ліцензування з збереженням існуючої архітектури плагіна та додаванням сучасної серверної частини.*
