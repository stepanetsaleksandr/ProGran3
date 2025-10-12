# 🔧 ПЛАН ВИПРАВЛЕННЯ ВРАЗЛИВОСТЕЙ ProGran3

**Дата:** 12 жовтня 2025  
**Пріоритет:** КРИТИЧНИЙ  
**Estimated Time:** 3-4 тижні

---

## 📋 PHASE 1: КРИТИЧНІ ВИПРАВЛЕННЯ (3-5 днів)

### 🚨 1.1 ВИДАЛЕННЯ HARDCODED CREDENTIALS

**Файл:** `server/app/api/licenses/activate/route.ts`

**ПОТОЧНИЙ КОД (НЕБЕЗПЕЧНО):**
```typescript
const supabase = createClient(
  process.env.SUPABASE_URL || 'https://zgkxtdjdaqnktjxunbeu.supabase.co',
  process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...'
);
```

**НОВИЙ КОД (БЕЗПЕЧНО):**
```typescript
import { createSupabaseClient } from '@/lib/supabase';

export async function POST(request: NextRequest) {
  try {
    const supabase = createSupabaseClient(); // Без fallback!
    // ... rest of code
  } catch (error) {
    if (error.message === 'Missing Supabase environment variables') {
      console.error('CRITICAL: Supabase credentials not configured');
      return NextResponse.json({ 
        success: false, 
        error: 'Server configuration error' 
      }, { status: 500 });
    }
  }
}
```

**Дії:**
```bash
# 1. Змінити Supabase service role key НЕГАЙНО
# 2. Видалити hardcoded значення з коду
# 3. Перевірити всі файли на hardcoded secrets
grep -r "eyJhbGciOiJIUzI1" server/
grep -r "zgkxtdjdaqnktjxunbeu" server/
```

---

### 🚨 1.2 ВИДАЛЕННЯ DEBUG ENDPOINTS

**Команди:**
```bash
cd server/app/api

# Видалити небезпечні endpoints
rm -rf check-db/
rm -rf check-state/
rm -rf cleanup-test-data/
rm -rf clear-all-data/          # ДУЖЕ НЕБЕЗПЕЧНО
rm -rf debug-dashboard/
rm -rf debug-env/               # ВИТІК ENV
rm -rf debug-licenses/
rm -rf debug-licenses-data/
rm -rf debug-stats-deep/
rm -rf nuclear-cleanup/         # ЕКСТРЕМАЛЬНО НЕБЕЗПЕЧНО
rm -rf raw-database-check/
rm -rf test-connection/
rm -rf test-count/
rm -rf test-real-data/
rm -rf test-rls-access/
rm -rf test-supabase-client/
rm -rf test/
rm -rf setup-db/
rm -rf fix-license-statuses/
rm -rf force-clear-cache/
rm -rf force-refresh-data/
rm -rf final-migration/

# Залишити ТІЛЬКИ production endpoints:
# - licenses/
# - systems/
# - heartbeats/
# - dashboard/stats/ (якщо потрібно)
# - delete-license/ (з auth)
```

**Результат:**
```
server/app/api/
├── licenses/
│   ├── route.ts
│   ├── generate/route.ts
│   ├── activate/route.ts
│   └── [id]/route.ts
├── systems/
│   └── route.ts
├── heartbeats/
│   └── route.ts
└── dashboard/
    └── stats/route.ts
```

---

### 🚨 1.3 ДОДАТИ АУТЕНТИФІКАЦІЮ

**Створити файл:** `server/middleware.ts`

```typescript
import { NextRequest, NextResponse } from 'next/server';

// API Keys management
const VALID_API_KEYS = new Set(
  (process.env.API_KEYS || '').split(',').filter(Boolean)
);

// Admin endpoints що вимагають спеціального ключа
const ADMIN_ENDPOINTS = [
  '/api/delete-license',
  '/api/dashboard',
];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Skip middleware for non-API routes
  if (!pathname.startsWith('/api/')) {
    return NextResponse.next();
  }

  // Get API key from header
  const apiKey = request.headers.get('X-API-Key');
  const isAdminEndpoint = ADMIN_ENDPOINTS.some(ep => pathname.startsWith(ep));

  // Check if endpoint requires authentication
  if (isAdminEndpoint || pathname.includes('/generate')) {
    if (!apiKey || !VALID_API_KEYS.has(apiKey)) {
      console.warn('Unauthorized API access attempt:', {
        path: pathname,
        ip: request.ip,
        timestamp: new Date().toISOString()
      });

      return NextResponse.json(
        { 
          success: false,
          error: 'Unauthorized. Valid API key required.' 
        },
        { status: 401, headers: { 'WWW-Authenticate': 'API-Key' } }
      );
    }
  }

  // Log all API requests
  console.log('API Request:', {
    method: request.method,
    path: pathname,
    ip: request.ip,
    timestamp: new Date().toISOString()
  });

  return NextResponse.next();
}

export const config = {
  matcher: '/api/:path*',
};
```

**Додати в `.env.local`:**
```env
# API Keys (comma-separated)
API_KEYS=your-secret-api-key-1,your-secret-api-key-2

# Admin API Keys (for sensitive operations)
ADMIN_API_KEYS=your-admin-key-1
```

---

### 🚨 1.4 ДОДАТИ RATE LIMITING

**Установка:**
```bash
cd server
npm install @upstash/ratelimit @upstash/redis
```

**Створити файл:** `server/lib/rate-limit.ts`

```typescript
import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';

// Initialize Redis client
const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
});

// Different rate limits for different endpoints
export const rateLimits = {
  // Strict limit for license generation
  generate: new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(5, '1 h'), // 5 per hour
    analytics: true,
  }),

  // Moderate limit for activation
  activate: new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(10, '1 h'), // 10 per hour
    analytics: true,
  }),

  // Lenient limit for viewing
  read: new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(100, '1 m'), // 100 per minute
    analytics: true,
  }),

  // Very strict for admin operations
  admin: new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(10, '1 d'), // 10 per day
    analytics: true,
  }),
};

export async function checkRateLimit(
  identifier: string,
  limitType: keyof typeof rateLimits
) {
  const { success, limit, reset, remaining } = await rateLimits[limitType].limit(
    identifier
  );

  return { success, limit, reset, remaining };
}
```

**Використання в API:**
```typescript
// server/app/api/licenses/generate/route.ts
import { checkRateLimit } from '@/lib/rate-limit';

export async function POST(request: NextRequest) {
  const ip = request.ip || 'unknown';
  const rateLimit = await checkRateLimit(ip, 'generate');

  if (!rateLimit.success) {
    return NextResponse.json(
      { 
        success: false,
        error: 'Rate limit exceeded. Please try again later.',
        reset: rateLimit.reset
      },
      { 
        status: 429,
        headers: {
          'X-RateLimit-Limit': rateLimit.limit.toString(),
          'X-RateLimit-Remaining': rateLimit.remaining.toString(),
          'X-RateLimit-Reset': new Date(rateLimit.reset).toISOString(),
        }
      }
    );
  }

  // ... rest of handler
}
```

**Додати в `.env.local`:**
```env
# Upstash Redis (для rate limiting)
UPSTASH_REDIS_REST_URL=https://your-redis.upstash.io
UPSTASH_REDIS_REST_TOKEN=your-token-here
```

---

### 🚨 1.5 ЗМІНИТИ ВСІ SECRETS

**Інструкції:**

1. **Supabase:**
```bash
# 1. Перейти в Supabase Dashboard
# https://app.supabase.com/project/YOUR_PROJECT/settings/api

# 2. Settings -> API -> "Rotate service_role key"
# 3. Скопіювати новий ключ

# 4. Оновити в Vercel
vercel env add SUPABASE_SERVICE_ROLE_KEY production
# Paste new key

# 5. Оновити локально
echo "SUPABASE_SERVICE_ROLE_KEY=new-key-here" >> server/.env.local
```

2. **Crypto Secret:**
```bash
# Generate secure random key
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# Add to env
vercel env add CRYPTO_SECRET_KEY production
```

3. **API Keys:**
```bash
# Generate API keys
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# Add to env
vercel env add API_KEYS production
vercel env add ADMIN_API_KEYS production
```

---

## 📋 PHASE 2: INPUT VALIDATION (5-7 днів)

### 2.1 УСТАНОВКА ZOD

```bash
cd server
npm install zod
```

### 2.2 СТВОРИТИ SCHEMAS

**Файл:** `server/lib/validation/schemas.ts`

```typescript
import { z } from 'zod';

// License validation schemas
export const LicenseGenerateSchema = z.object({
  duration_days: z.number()
    .int('Duration must be an integer')
    .min(1, 'Duration must be at least 1 day')
    .max(3650, 'Duration cannot exceed 10 years'),
  description: z.string()
    .max(500, 'Description too long')
    .optional()
    .transform(val => val?.trim()),
});

export const LicenseActivateSchema = z.object({
  license_key: z.string()
    .regex(/^PROGRAN3-\d{4}-[A-Z0-9]+-[A-Z0-9]+$/, 'Invalid license key format')
    .min(20, 'License key too short')
    .max(100, 'License key too long'),
  user_email: z.string()
    .email('Invalid email address')
    .toLowerCase()
    .trim(),
  system_fingerprint: z.string()
    .length(64, 'Invalid system fingerprint')
    .regex(/^[a-f0-9]{64}$/, 'System fingerprint must be SHA256 hex'),
});

export const LicenseDeleteSchema = z.object({
  id: z.string()
    .uuid('Invalid license ID'),
});

// System info schema
export const SystemInfoSchema = z.object({
  fingerprint_hash: z.string()
    .length(64, 'Invalid fingerprint')
    .regex(/^[a-f0-9]{64}$/),
  system_data: z.object({
    os: z.string().optional(),
    hostname: z.string().optional(),
    ruby_version: z.string().optional(),
    sketchup_version: z.string().optional(),
  }).optional(),
});

// Pagination schema
export const PaginationSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(50),
  sort: z.enum(['created_at', 'updated_at', 'expires_at']).default('created_at'),
  order: z.enum(['asc', 'desc']).default('desc'),
});
```

### 2.3 СТВОРИТИ VALIDATION MIDDLEWARE

**Файл:** `server/lib/validation/validate.ts`

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { z, ZodError } from 'zod';

export function validateRequest<T extends z.ZodType>(schema: T) {
  return async (request: NextRequest) => {
    try {
      const body = await request.json();
      const validated = schema.parse(body);
      return { data: validated, error: null };
    } catch (error) {
      if (error instanceof ZodError) {
        return {
          data: null,
          error: {
            message: 'Validation failed',
            details: error.errors.map(err => ({
              field: err.path.join('.'),
              message: err.message,
            })),
          },
        };
      }
      return {
        data: null,
        error: {
          message: 'Invalid request format',
        },
      };
    }
  };
}

// Sanitization helpers
export function sanitizeHtml(text: string): string {
  return text
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;');
}

export function sanitizeInput(obj: Record<string, any>): Record<string, any> {
  const sanitized: Record<string, any> = {};
  
  for (const [key, value] of Object.entries(obj)) {
    if (typeof value === 'string') {
      sanitized[key] = sanitizeHtml(value.trim());
    } else if (typeof value === 'object' && value !== null) {
      sanitized[key] = sanitizeInput(value);
    } else {
      sanitized[key] = value;
    }
  }
  
  return sanitized;
}
```

### 2.4 ВИКОРИСТАННЯ В API

**Оновити:** `server/app/api/licenses/generate/route.ts`

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseClient } from '@/lib/supabase';
import { LicenseGenerateSchema } from '@/lib/validation/schemas';
import { validateRequest, sanitizeInput } from '@/lib/validation/validate';

export async function POST(request: NextRequest) {
  try {
    // Validate input
    const validation = await validateRequest(LicenseGenerateSchema)(request);
    
    if (validation.error) {
      return NextResponse.json({
        success: false,
        error: validation.error.message,
        details: validation.error.details,
      }, { status: 400 });
    }

    const { duration_days, description } = validation.data!;
    
    // Sanitize input
    const sanitizedDescription = description ? sanitizeInput({ description }).description : null;

    // Generate license key
    const generateLicenseKey = () => {
      const crypto = require('crypto');
      const year = new Date().getFullYear();
      const timestamp = Date.now().toString(36).toUpperCase();
      const randomPart = crypto.randomBytes(6).toString('hex').toUpperCase();
      return `PROGRAN3-${year}-${randomPart}-${timestamp}`;
    };

    const license_key = generateLicenseKey();

    // Create license record
    const supabase = createSupabaseClient();
    const currentDate = new Date().toISOString();
    
    const { data: license, error } = await supabase
      .from('licenses')
      .insert({
        license_key,
        duration_days,
        description: sanitizedDescription,
        status: 'generated',
        created_at: currentDate,
        updated_at: currentDate,
      })
      .select()
      .single();

    if (error) {
      console.error('Supabase error:', error);
      throw error;
    }

    return NextResponse.json({
      success: true,
      data: {
        id: license.id,
        license_key: license.license_key,
        duration_days: license.duration_days,
        description: license.description,
        status: license.status,
        created_at: license.created_at,
      },
    });
  } catch (error) {
    console.error('Generate license error:', error);
    
    // Don't expose internal errors
    return NextResponse.json({
      success: false,
      error: 'Failed to generate license. Please try again or contact support.',
      error_id: require('crypto').randomUUID(), // For support tracking
    }, { status: 500 });
  }
}
```

---

## 📋 PHASE 3: PLUGIN SECURITY (1-2 тижні)

### 3.1 СТВОРИТИ CRYPTO MANAGER

**Файл:** `plugin/proGran3/security/crypto_manager.rb`

```ruby
require 'openssl'
require 'digest'
require 'json'

module ProGran3
  module Security
    class CryptoManager
      def initialize(api_key)
        @api_key = api_key
      end

      # HMAC signature for data integrity
      def sign_data(data)
        sorted_data = data.sort.to_h
        data_string = sorted_data.to_json
        OpenSSL::HMAC.hexdigest('SHA256', @api_key, data_string)
      end

      # Verify HMAC signature
      def verify_signature(data, signature)
        expected_signature = sign_data(data)
        secure_compare(expected_signature, signature)
      end

      # Generate system fingerprint
      def generate_system_fingerprint
        system_data = collect_system_data
        data_string = system_data.sort.to_h.to_json
        Digest::SHA256.hexdigest(data_string)
      end

      private

      # Timing-safe string comparison
      def secure_compare(a, b)
        return false unless a.bytesize == b.bytesize
        
        l = a.unpack("C*")
        r, i = 0, -1
        b.each_byte { |v| r |= v ^ l[i+=1] }
        r == 0
      end

      def collect_system_data
        {
          motherboard: get_motherboard_serial,
          cpu: get_cpu_id,
          mac: get_primary_mac,
          hostname: Socket.gethostname.downcase,
          platform: RUBY_PLATFORM
        }
      end

      def get_motherboard_serial
        if RUBY_PLATFORM.include?('mingw')
          result = `wmic baseboard get serialnumber /value 2>nul`
          serial = result.scan(/SerialNumber=(.+)/).flatten.first&.strip
          return serial if serial && !serial.empty?
        end
        'unknown'
      rescue => e
        ProGran3::Logger.warn("Failed to get motherboard serial: #{e.message}", "CryptoManager")
        'unknown'
      end

      def get_cpu_id
        if RUBY_PLATFORM.include?('mingw')
          result = `wmic cpu get processorid /value 2>nul`
          cpu_id = result.scan(/ProcessorId=(.+)/).flatten.first&.strip
          return cpu_id if cpu_id && !cpu_id.empty?
        end
        'unknown'
      rescue => e
        ProGran3::Logger.warn("Failed to get CPU ID: #{e.message}", "CryptoManager")
        'unknown'
      end

      def get_primary_mac
        if RUBY_PLATFORM.include?('mingw')
          result = `getmac /v /fo csv 2>nul`
          macs = result.scan(/"([A-F0-9-]{17})"/).flatten
          # Filter out virtual adapters
          physical = macs.reject { |mac| virtual_mac?(mac) }
          return physical.first if physical.any?
        end
        'unknown'
      rescue => e
        ProGran3::Logger.warn("Failed to get MAC address: #{e.message}", "CryptoManager")
        'unknown'
      end

      def virtual_mac?(mac)
        virtual_prefixes = [
          '00:05:69', # VMware
          '00:0C:29', # VMware
          '00:1C:14', # VMware
          '00:50:56', # VMware
          '08:00:27', # VirtualBox
          '00:15:5D', # Hyper-V
        ]
        virtual_prefixes.any? { |prefix| mac.upcase.start_with?(prefix) }
      end
    end
  end
end
```

---

### 3.2 СТВОРИТИ API CLIENT

**Файл:** `plugin/proGran3/security/api_client.rb`

```ruby
require 'net/http'
require 'uri'
require 'json'
require 'timeout'

module ProGran3
  module Security
    class ApiClient
      API_TIMEOUT = 10
      MAX_RETRIES = 3

      def initialize(base_url, api_key)
        @base_url = base_url
        @api_key = api_key
        @crypto_manager = CryptoManager.new(api_key)
      end

      def activate_license(license_key, user_email)
        system_fingerprint = @crypto_manager.generate_system_fingerprint
        
        payload = {
          license_key: license_key,
          user_email: user_email,
          system_fingerprint: system_fingerprint
        }

        # Sign the payload
        signature = @crypto_manager.sign_data(payload)
        
        response = make_request(
          '/api/licenses/activate',
          payload,
          { 'X-Signature' => signature }
        )

        if response[:success]
          save_license_locally(response[:data])
          ProGran3::Logger.success("License activated successfully", "ApiClient")
        end

        response
      end

      def validate_license(license_key)
        system_fingerprint = @crypto_manager.generate_system_fingerprint
        
        payload = {
          license_key: license_key,
          system_fingerprint: system_fingerprint
        }

        signature = @crypto_manager.sign_data(payload)
        
        make_request(
          '/api/licenses/validate',
          payload,
          { 'X-Signature' => signature }
        )
      end

      def send_heartbeat(license_key)
        system_fingerprint = @crypto_manager.generate_system_fingerprint
        
        payload = {
          license_key: license_key,
          system_fingerprint: system_fingerprint,
          timestamp: Time.now.to_i
        }

        signature = @crypto_manager.sign_data(payload)
        
        make_request(
          '/api/heartbeats',
          payload,
          { 'X-Signature' => signature }
        )
      end

      private

      def make_request(endpoint, payload, extra_headers = {})
        uri = URI("#{@base_url}#{endpoint}")
        
        http = Net::HTTP.new(uri.host, uri.port)
        http.use_ssl = uri.scheme == 'https'
        http.read_timeout = API_TIMEOUT
        http.open_timeout = API_TIMEOUT

        request = Net::HTTP::Post.new(uri.path)
        request['Content-Type'] = 'application/json'
        request['X-API-Key'] = @api_key
        request.body = payload.to_json

        # Add extra headers (like signatures)
        extra_headers.each { |k, v| request[k] = v }

        retry_count = 0
        begin
          response = Timeout.timeout(API_TIMEOUT) do
            http.request(request)
          end

          parse_response(response)
        rescue Timeout::Error, Errno::ECONNREFUSED, Net::HTTPError => e
          retry_count += 1
          if retry_count < MAX_RETRIES
            ProGran3::Logger.warn("API request failed (attempt #{retry_count}/#{MAX_RETRIES}): #{e.message}", "ApiClient")
            sleep(2 ** retry_count) # Exponential backoff
            retry
          else
            ProGran3::Logger.error("API request failed after #{MAX_RETRIES} attempts", "ApiClient")
            { success: false, error: 'api_unavailable', offline_mode: true }
          end
        end
      end

      def parse_response(response)
        case response.code.to_i
        when 200..299
          JSON.parse(response.body, symbolize_names: true)
        when 400
          { success: false, error: 'bad_request' }
        when 401
          { success: false, error: 'unauthorized' }
        when 403
          { success: false, error: 'forbidden' }
        when 404
          { success: false, error: 'not_found' }
        when 429
          { success: false, error: 'rate_limit_exceeded' }
        else
          { success: false, error: "server_error_#{response.code}" }
        end
      rescue JSON::ParserError => e
        ProGran3::Logger.error("Failed to parse API response: #{e.message}", "ApiClient")
        { success: false, error: 'invalid_response' }
      end

      def save_license_locally(license_data)
        license_file = File.join(Dir.home, '.progran3_license')
        
        File.open(license_file, 'w') do |file|
          file.write(license_data.to_json)
        end

        # Set file permissions (Windows doesn't support chmod the same way)
        if RUBY_PLATFORM.include?('mingw')
          # Hide the file on Windows
          system("attrib +h \"#{license_file}\"")
        else
          File.chmod(0600, license_file)
        end

        ProGran3::Logger.info("License saved locally", "ApiClient")
      rescue => e
        ProGran3::Logger.warn("Failed to save license locally: #{e.message}", "ApiClient")
      end
    end
  end
end
```

---

### 3.3 СТВОРИТИ LICENSE MANAGER

**Файл:** `plugin/proGran3/security/license_manager.rb`

```ruby
module ProGran3
  module Security
    class LicenseManager
      CACHE_TTL = 3600 # 1 hour
      LICENSE_FILE = File.join(Dir.home, '.progran3_license')

      def initialize(api_url, api_key)
        @api_client = ApiClient.new(api_url, api_key)
        @cache = {}
      end

      def has_valid_license?
        ProGran3::Logger.info("Checking license validity", "LicenseManager")

        # Check cache first
        if cache_valid?(:license_valid)
          ProGran3::Logger.info("Using cached license status", "LicenseManager")
          return @cache[:license_valid]
        end

        # Check local license file
        local_license = load_local_license
        if local_license && !license_expired?(local_license)
          update_cache(:license_valid, true)
          return true
        end

        # Validate with server
        if local_license
          result = @api_client.validate_license(local_license[:license_key])
          if result[:success]
            update_cache(:license_valid, true)
            return true
          end
        end

        # No valid license
        update_cache(:license_valid, false)
        false
      end

      def activate_license(license_key, user_email)
        result = @api_client.activate_license(license_key, user_email)
        
        if result[:success]
          update_cache(:license_valid, true)
          ProGran3::Logger.success("License activated successfully", "LicenseManager")
        else
          ProGran3::Logger.warn("License activation failed: #{result[:error]}", "LicenseManager")
        end

        result
      end

      def send_heartbeat
        local_license = load_local_license
        return unless local_license

        result = @api_client.send_heartbeat(local_license[:license_key])
        
        if result[:success]
          ProGran3::Logger.info("Heartbeat sent successfully", "LicenseManager")
        elsif result[:offline_mode]
          ProGran3::Logger.warn("Server unavailable, continuing in offline mode", "LicenseManager")
        end
      end

      def get_license_info
        local_license = load_local_license
        return nil unless local_license

        {
          license_key: obfuscate_license_key(local_license[:license_key]),
          user_email: local_license[:user_email],
          expires_at: local_license[:expires_at],
          status: license_expired?(local_license) ? 'expired' : 'active'
        }
      end

      private

      def load_local_license
        return nil unless File.exist?(LICENSE_FILE)

        content = File.read(LICENSE_FILE)
        JSON.parse(content, symbolize_names: true)
      rescue => e
        ProGran3::Logger.warn("Failed to load local license: #{e.message}", "LicenseManager")
        nil
      end

      def license_expired?(license)
        return false unless license[:expires_at]
        
        expires_at = Time.parse(license[:expires_at])
        expires_at < Time.now
      rescue => e
        ProGran3::Logger.warn("Failed to parse expiration date: #{e.message}", "LicenseManager")
        true # Assume expired if can't parse
      end

      def cache_valid?(key)
        timestamp_key = "#{key}_timestamp".to_sym
        return false unless @cache[timestamp_key]
        
        Time.now - @cache[timestamp_key] < CACHE_TTL
      end

      def update_cache(key, value)
        @cache[key] = value
        @cache["#{key}_timestamp".to_sym] = Time.now
      end

      def obfuscate_license_key(key)
        return key if key.length < 20
        "#{key[0..15]}...#{key[-4..-1]}"
      end
    end
  end
end
```

---

## 📋 PHASE 4: ДОДАТКОВІ ПОКРАЩЕННЯ (2-3 тижні)

### 4.1 ДОБАВИТИ ERROR MONITORING

```bash
npm install @sentry/nextjs
npx @sentry/wizard -i nextjs
```

### 4.2 ДОБАВИТИ ТЕСТИ

```bash
npm install -D @testing-library/react @testing-library/jest-dom vitest
```

### 4.3 ДОБАВИТИ CI/CD

Створити `.github/workflows/ci.yml`

### 4.4 ДОБАВИТИ LOGGING

Створити централізовану систему логування

---

## ✅ CHECKLIST

### Phase 1 (КРИТИЧНО - 3-5 днів):
- [ ] Видалити hardcoded credentials з activate/route.ts
- [ ] Змінити Supabase service role key
- [ ] Видалити всі debug/test endpoints (24 папки)
- [ ] Створити middleware.ts з auth
- [ ] Додати rate limiting з Upstash
- [ ] Оновити environment variables в Vercel
- [ ] Протестувати що API працює з auth

### Phase 2 (5-7 днів):
- [ ] Установити Zod
- [ ] Створити validation schemas
- [ ] Додати validate middleware
- [ ] Оновити всі API routes з validation
- [ ] Додати sanitization
- [ ] Протестувати валідацію

### Phase 3 (1-2 тижні):
- [ ] Створити crypto_manager.rb
- [ ] Створити api_client.rb
- [ ] Створити license_manager.rb
- [ ] Інтегрувати з основним плагіном
- [ ] Додати UI для активації ліцензій
- [ ] Протестувати повний flow

### Phase 4 (2-3 тижні):
- [ ] Додати Sentry
- [ ] Написати тести
- [ ] Налаштувати CI/CD
- [ ] Додати логування
- [ ] Performance optimization
- [ ] Security audit

---

**Total Estimated Time:** 3-4 тижні  
**Priority:** CRITICAL  
**Risk Level:** HIGH if not addressed


