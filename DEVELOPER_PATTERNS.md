# ProGran3 Developer Patterns Guide

## 🎯 **Критично важливо**: При розробці нового - дивись як працює все що працює!

---

## 📋 **1. УПРАВЛІННЯ СТАНОМ МОДЕЛІ**

### **Доступ до інформації про компонент в моделі:**
```ruby
# ✅ ПРАВИЛЬНО - через ModelStateManager
component_info = ModelStateManager.get_component_info(:foundation)
if component_info[:exists]
  position = component_info[:position]
  params = component_info[:params]
end

# ✅ Перевірка можливості додавання
unless ModelStateManager.can_add_component?(:stands)
  # Показати помилку користувачу
end

# ✅ Оновлення стану після додавання
ModelStateManager.component_added(:foundation, { depth: 100, width: 200, height: 50 })
```

### **Структура стану компонента:**
```ruby
{
  foundation: {
    exists: false,
    params: { depth: 100, width: 200, height: 50 },
    position: { x: 0, y: 0, z: 0 },
    bounds: { width: 200, height: 50, depth: 100 }
  }
}
```

---

## 🔗 **2. КОМУНІКАЦІЯ UI ↔ SKETCHUP**

### **Виклик методів SketchUp з UI:**
```javascript
// ✅ ПРАВИЛЬНО - через SketchUpBridge
ProGran3.Communication.SketchUpBridge.createFoundation(depth, width, height);
ProGran3.Communication.SketchUpBridge.addStand('stands', 'stand_model.skp');
ProGran3.Communication.SketchUpBridge.addStele('steles', 'stele_model.skp');
```

### **Callback функції в Ruby:**
```ruby
# ✅ ПРАВИЛЬНО - через CallbackManager
def add_foundation_callback(dialog, depth, width, height)
  return false unless validate_dimensions_callback(depth, width, height, "фундаменту")
  
  # Зберігаємо параметри
  @foundation_params = { depth: depth.to_i, width: width.to_i, height: height.to_i }
  
  # Створюємо з координацією
  success = CoordinationManager.update_all_elements(@foundation_params)
  
  if success
    ModelStateManager.component_added(:foundation, @foundation_params)
  end
  
  success
end
```

### **Реєстрація callback в UI:**
```javascript
// ✅ ПРАВИЛЬНО - реєстрація в script.js
dialog.add_action_callback("add_foundation") { |dialog, depth, width, height|
  ProGran3::CallbackManager.add_foundation_callback(dialog, depth, width, height)
}
```

---

## 🌐 **3. МЕРЕЖЕВІ ЗАПИТИ (PLUGIN → SERVER)**

### **Конфігурація NetworkClient:**
```ruby
# ✅ ПРАВИЛЬНО - динамічне завантаження конфігу
def self.get_api_base_url
  url = load_api_config[:base_url]
  puts "🌐 Використовуємо сервер: #{url}"
  url
end

# ✅ Примусове оновлення конфігу
ProGran3::System::Network::NetworkClient.reload_config!
```

### **Структура запиту:**
```ruby
# ✅ ПРАВИЛЬНО - з обов'язковими заголовками
headers = {
  'Content-Type' => 'application/json',
  'X-Fingerprint' => device_fingerprint,
  'X-Timestamp' => timestamp.to_s,
  'X-Endpoint' => 'activate',
  'X-Plugin-Version' => '3.2.1'
}

payload = { licenseKey: license_key }
response = make_request('POST', '/api/licenses/activate', payload, headers)
```

---

## 🔐 **4. СИСТЕМА ЛІЦЕНЗІЙ**

### **Валідація ліцензії:**
```ruby
# ✅ ПРАВИЛЬНО - через SessionManager
result = SessionManager.new.validate_license
if result[:valid]
  # Ліцензія активна
else
  # Показати вікно активації
  show_activation_dialog
end
```

### **Грейс період:**
```ruby
# ✅ ПРАВИЛЬНО - динамічний грейс період
grace_result = check_grace_period(reason)
# reason: 'license_deleted' -> 0 днів
# reason: 'network_error' -> 2 дні
```

---

## 🏗️ **5. СТВОРЕННЯ КОМПОНЕНТІВ**

### **Додавання моделей:**
```ruby
# ✅ ПРАВИЛЬНО - через CoordinationManager
success = CoordinationManager.update_all_elements(params)
# або для стел:
success = CoordinationManager.update_stele_dependents(stele_params)
```

### **Валідація перед додаванням:**
```ruby
# ✅ ПРАВИЛЬНО - перевірка залежностей
unless ModelStateManager.can_add_component?(category.to_sym)
  ErrorHandler.handle_error(StandardError.new("Неможливо додати компонент: #{category}"))
  return false
end
```

---

## 🎨 **6. UI МОДУЛІ (JAVASCRIPT)**

### **Namespace Pattern (обов'язково для SketchUp):**
```javascript
// ✅ ПРАВИЛЬНО - ES6 модулі НЕ ПРАЦЮЮТЬ в SketchUp!
(function(global) {
  'use strict';
  
  global.ProGran3 = global.ProGran3 || {};
  global.ProGran3.Core = global.ProGran3.Core || {};
  
  function myFunction() { /* ... */ }
  
  // Експорт
  global.ProGran3.Core.MyModule = { myFunction };
  
})(window);
```

### **Управління станом UI:**
```javascript
// ✅ ПРАВИЛЬНО - через StateManager
ProGran3.Core.StateManager.setModelLists(newLists);
ProGran3.Core.StateManager.setCarouselState('stands', { index: 2 });
```

---

## 🛡️ **7. СЕРВЕР API (NEXT.JS)**

### **Структура API handler:**
```typescript
// ✅ ПРАВИЛЬНО - через withPublicApi wrapper
export const POST = withPublicApi(async ({ supabase, request }: ApiContext) => {
  try {
    const body = await request.json();
    const validation = await validateBody(request, MySchema);
    
    // Бізнес логіка
    
    return apiSuccess({ data: result });
  } catch (error) {
    return apiError(error.message);
  }
});
```

### **Аутентифікація:**
```typescript
// ✅ ПРАВИЛЬНО - hardware-based аутентифікація
const fingerprint = request.headers.get('X-Fingerprint');
const timestamp = request.headers.get('X-Timestamp');
const endpoint = request.headers.get('X-Endpoint');

// Валідація timestamp
if (!isValidTimestamp(timestamp)) {
  return apiError('Invalid timestamp');
}
```

---

## 📝 **8. ЛОГУВАННЯ ТА ОБРОБКА ПОМИЛОК**

### **Логування в Ruby:**
```ruby
# ✅ ПРАВИЛЬНО - через Logger
ProGran3::Logger.info("Створення фундаменту", "Foundation")
ProGran3::Logger.warn("Попередження", "Validation")
ProGran3::Logger.error("Помилка", "Network")
```

### **Обробка помилок:**
```ruby
# ✅ ПРАВИЛЬНО - через ErrorHandler
begin
  # Код що може викинути помилку
rescue => e
  ErrorHandler.handle_error(e, "UI", "add_foundation")
  false
end
```

---

## 🔄 **9. ПЕРЕЗАВАНТАЖЕННЯ ПЛАГІНА**

### **Примусове перезавантаження:**
```ruby
# ✅ ПРАВИЛЬНО - через force_reload_plugin.rb
load File.join(File.dirname(__FILE__), 'force_reload_plugin.rb')

# Або через метод в proGran3.rb
ProGran3.reload_plugin
```

### **Автоматична перевірка змін:**
```ruby
# ✅ ПРАВИЛЬНО - перевірка mtime
def self.check_for_updates
  current_mtime = File.mtime(__FILE__)
  if current_mtime > $last_plugin_mtime
    reload_plugin
    return true
  end
  false
end
```

---

## 🎯 **10. КРИТИЧНІ ПРАВИЛА**

### **❌ НІКОЛИ НЕ РОБИ:**
- Не використовуй ES6 модулі в UI (не працюють в SketchUp)
- Не кешуй конфігурацію NetworkClient (завжди читай з файлу)
- Не додавай зайві перевірки блокування (використовуй природний механізм активації)
- Не створюй компоненти без перевірки залежностей

### **✅ ЗАВЖДИ РОБИ:**
- Використовуй ModelStateManager для стану моделі
- Використовуй CallbackManager для UI callbacks
- Використовуй ErrorHandler для обробки помилок
- Використовуй Logger для логування
- Перевіряй залежності перед додаванням компонентів
- Оновлюй стан після успішного додавання

---

## 📚 **11. ФАЙЛИ ДЛЯ ВИВЧЕННЯ ПАТЕРНІВ**

### **Обов'язково вивчи:**
1. `plugin/proGran3/model_state_manager.rb` - управління станом
2. `plugin/proGran3/callback_manager.rb` - UI callbacks
3. `plugin/proGran3/web/modules/communication/SketchUpBridge.js` - комунікація
4. `server/lib/api-handler.ts` - API структура
5. `plugin/proGran3/system/network/network_client.rb` - мережеві запити

### **Приклад використання:**
```ruby
# ✅ ПОВНИЙ ПАТЕРН додавання компонента
def add_component_callback(dialog, params)
  # 1. Валідація
  return false unless validate_params(params)
  
  # 2. Перевірка можливості додавання
  unless ModelStateManager.can_add_component?(:component_type)
    ErrorHandler.handle_error(StandardError.new("Неможливо додати"))
    return false
  end
  
  # 3. Створення компонента
  success = CoordinationManager.update_all_elements(params)
  
  # 4. Оновлення стану
  if success
    ModelStateManager.component_added(:component_type, params)
  end
  
  success
end
```

---

**🎯 ПАМ'ЯТАЙ: При розробці нового - дивись як працює все що працює!**

**Last Updated**: 2025-01-26  
**Version**: 3.2.1
