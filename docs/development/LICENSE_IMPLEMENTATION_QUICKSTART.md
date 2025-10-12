# ⚡ ШВИДКИЙ СТАРТ: Offline First License System

**Для:** Розробників які починають реалізацію  
**Час:** 5 хвилин читання  
**Повний план:** `IMPLEMENTATION_PLAN_OFFLINE_FIRST.md`

---

## 🎯 ЩО РОБИМО

**Система:** Offline First + 7-day Grace Period  
**Захист:** 8/10  
**UX:** 9/10  
**Timeline:** 2-3 тижні

---

## 📁 ЩО СТВОРЮЄМО (6 ФАЙЛІВ)

### В `plugin/proGran3/security/`:

```ruby
1. hardware_fingerprint.rb     (200 lines)  - MB/CPU/MAC detection
2. api_client.rb              (250 lines)  - HTTP to server
3. license_storage.rb         (150 lines)  - Encrypted save/load
4. grace_period_manager.rb     (80 lines)  - 7-day logic
5. license_manager.rb         (400 lines)  - Main controller
6. crypto_utils.rb            (100 lines)  - HMAC helpers
```

---

## 🔑 КЛЮЧОВА ЛОГІКА

### Startup Flow:
```
1. Load local license file → 10ms
2. Verify hardware fingerprint → 50ms
3. Check grace period → 1ms
4. If OK → Start plugin → 0ms
5. Background validation → 300ms (async)
```

**Total:** 61ms perceived, user не чекає!

---

## 📋 INTEGRATION POINTS

### Оновити існуючі файли:

```ruby
proGran3.rb          +50 lines   - Initialize, can_start_plugin?
ui.rb                +30 lines   - Callbacks, footer update
splash_screen.rb     +80 lines   - License check
license_ui.rb        +60 lines   - Activation callback
```

### Створити server endpoints:

```typescript
/api/licenses/validate   150 lines   - Validate + update timestamp
/api/licenses/renew      100 lines   - Renew token
lib/crypto.ts            +50 lines   - HMAC functions
```

---

## ⏱️ 15-DAY TIMELINE

### Week 1: Ruby Modules
```
Day 1-2:  hardware_fingerprint.rb
Day 3-4:  api_client.rb
Day 5:    license_storage.rb
```

### Week 2: Logic & Server
```
Day 6-7:  grace_period_manager.rb
Day 8-9:  license_manager.rb
Day 10:   Server endpoints
```

### Week 3: Integration
```
Day 11-12: UI integration
Day 13-14: Testing
Day 15:    Deploy
```

---

## 🔐 ЗАХИСТ МЕХАНІЗМ

```
Hardware Fingerprint (SHA256):
  ├─ Motherboard Serial
  ├─ CPU ID  
  ├─ Primary MAC Address
  └─ Disk Serial
  
Encrypted Local Storage:
  ├─ AES-256-CBC
  ├─ Key from hardware fingerprint
  └─ Hidden file (~/.progran3/license.enc)
  
Grace Period:
  ├─ 7 days offline maximum
  ├─ Warning after 3 days
  └─ Force online after 7 days
  
Server Validation:
  ├─ HMAC signatures
  ├─ Fingerprint verification
  ├─ Expiration check
  └─ Remote revocation
```

---

## 💻 ШВИДКИЙ КОД

### Hardware Fingerprint (Day 1):
```ruby
# security/hardware_fingerprint.rb
def self.generate
  components = {
    mb: `wmic baseboard get serialnumber`.scan(/\w{8,}/).first,
    cpu: `wmic cpu get processorid`.scan(/\w{8,}/).first,
    mac: get_mac_address,
    disk: `wmic diskdrive get serialnumber`.scan(/\w{8,}/).first
  }
  
  fingerprint = Digest::SHA256.hexdigest(components.to_json)
  { fingerprint: fingerprint, components: components }
end
```

### API Client (Day 3):
```ruby
# security/api_client.rb
def self.activate_license(email, key, fp)
  Thread.new do
    uri = URI('#{API_URL}/licenses/activate')
    http = Net::HTTP.new(uri.host, uri.port)
    http.use_ssl = true
    
    request = Net::HTTP::Post.new(uri)
    request['Content-Type'] = 'application/json'
    request.body = { user_email: email, license_key: key, system_fingerprint: fp }.to_json
    
    response = http.request(request)
    JSON.parse(response.body)
  end
end
```

### License Manager (Day 8):
```ruby
# security/license_manager.rb
def validate_license
  license = LicenseStorage.load
  return requires_activation unless license
  
  # Check fingerprint
  current_fp = HardwareFingerprint.generate[:fingerprint]
  return hardware_mismatch if license[:fingerprint] != current_fp
  
  # Check grace period
  grace = GracePeriodManager.check_grace_period(license)
  
  case grace[:action]
  when :block then validate_online_required
  when :warn then validate_with_warning(grace)
  else validate_and_continue
  end
end
```

---

## ✅ DAILY CHECKLIST

### Day 1: Hardware Fingerprint
- [ ] Create file
- [ ] Windows support (wmic)
- [ ] Generate 64-char SHA256
- [ ] Cache result (1h)
- [ ] Test on 3 PCs
- [ ] Commit

### Day 3: API Client
- [ ] Create file
- [ ] Net::HTTP setup
- [ ] HTTPS working
- [ ] Thread wrapper
- [ ] Test to server
- [ ] Commit

### Day 5: Storage
- [ ] Create file
- [ ] AES encryption
- [ ] Save/Load works
- [ ] File hidden
- [ ] Test encrypt/decrypt
- [ ] Commit

### Day 8: License Manager
- [ ] Create file
- [ ] validate_license()
- [ ] activate_license()
- [ ] All edge cases
- [ ] Test scenarios
- [ ] Commit

### Day 11: Integration
- [ ] Update proGran3.rb
- [ ] Update splash_screen.rb
- [ ] Update license_ui.rb
- [ ] Test full flow
- [ ] Commit

---

## 🧪 КРИТИЧНІ ТЕСТИ

```ruby
# Test 1: Activation
result = $license_manager.activate_license('test@test.com', 'KEY-123')
assert result[:success] == true

# Test 2: Validation
result = $license_manager.validate_license
assert result[:valid] == true

# Test 3: Hardware mismatch
# Copy license file to different PC
result = $license_manager.validate_license
assert result[:valid] == false
assert result[:error] == :hardware_mismatch

# Test 4: Grace period
# Set last_validation to 8 days ago
result = $license_manager.validate_license
assert result[:valid] == false
assert result[:error] == :online_validation_required

# Test 5: Heartbeat
$license_manager.start_heartbeat_timer
sleep(301) # 5 min 1 sec
# Check server logs for heartbeat
```

---

## 📊 FILES TO CREATE

### Ruby (6 files):
```
security/hardware_fingerprint.rb    - 200 lines ⏱️ Day 1-2
security/api_client.rb              - 250 lines ⏱️ Day 3-4
security/license_storage.rb         - 150 lines ⏱️ Day 5
security/grace_period_manager.rb    -  80 lines ⏱️ Day 6-7
security/license_manager.rb         - 400 lines ⏱️ Day 8-9
security/crypto_utils.rb            - 100 lines ⏱️ Day 8
```

### TypeScript (2 files):
```
app/api/licenses/validate/route.ts - 150 lines ⏱️ Day 10
app/api/licenses/renew/route.ts    - 100 lines ⏱️ Day 10
```

### Updates (4 files):
```
proGran3.rb                         +50 lines ⏱️ Day 11
splash_screen.rb                    +80 lines ⏱️ Day 11
license_ui.rb                       +60 lines ⏱️ Day 12
ui.rb                               +30 lines ⏱️ Day 12
```

**Total:** ~1,700 lines нового коду

---

## 🚨 КРИТИЧНІ МОМЕНТИ

### ⚠️ Don't Forget:

1. **HMAC Secret Key**
   - Generate: `openssl rand -hex 32`
   - Add to server/.env.local
   - Add to Vercel env vars

2. **Error Handling**
   - Всі API calls в try/catch
   - Graceful fallback
   - User-friendly messages

3. **Testing**
   - Test на різних ПК
   - Test з різними мережами
   - Test offline scenarios

4. **Security**
   - Never log license keys
   - Never expose fingerprint raw data
   - Encrypt everything sensitive

---

## 🎯 NEXT STEPS

### Сьогодні:
1. ✅ Read full plan: `IMPLEMENTATION_PLAN_OFFLINE_FIRST.md`
2. ✅ Review architecture
3. ✅ Understand flow

### Завтра (коли почнете):
1. Create git branch: `feature/offline-first-licensing`
2. Create `plugin/proGran3/security/` folder
3. Start Day 1: hardware_fingerprint.rb
4. Daily commits

### Через 2 тижні:
- ✅ All code complete
- ✅ Tests passing
- ✅ Ready for beta

### Через 3 тижні:
- ✅ Beta testing done
- ✅ Production deployment
- ✅ License system LIVE!

---

## 📚 DOCUMENTATION

**Full Plan:** `IMPLEMENTATION_PLAN_OFFLINE_FIRST.md` (45 min read)  
**This Guide:** Quick reference (5 min)  
**Strategy:** `LICENSE_PROTECTION_STRATEGIES.md` (all 5 variants)

---

**Status:** ✅ READY TO IMPLEMENT  
**Next:** Read full plan and start coding!

🚀 **Успіхів у реалізації!**


