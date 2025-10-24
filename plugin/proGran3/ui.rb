# progran3/ui.rb
require 'json'
require_relative 'validation'

module ProGran3
  module UI
    extend self

    def show_dialog
      puts "📱 Відкриття UI ProGran3..."
      
      # Відстеження буде запущено після завантаження UI
      
      html_path = File.join(File.dirname(__FILE__), "web", "index.html")
      categories = {
        stands: Dir.glob(File.join(ProGran3::ASSETS_PATH, "stands", "*.skp")).map { |f| File.basename(f) },
        steles: Dir.glob(File.join(ProGran3::ASSETS_PATH, "steles", "*.skp")).map { |f| File.basename(f) },
        flowerbeds: Dir.glob(File.join(ProGran3::ASSETS_PATH, "flowerbeds", "*.skp")).map { |f| File.basename(f) },
        gravestones: Dir.glob(File.join(ProGran3::ASSETS_PATH, "gravestones", "*.skp")).map { |f| File.basename(f) },
        pavement_tiles: Dir.glob(File.join(ProGran3::ASSETS_PATH, "pavement_tiles", "*.skp")).map { |f| File.basename(f) },
        fence_decor: Dir.glob(File.join(ProGran3::ASSETS_PATH, "fence_decor", "*.skp")).map { |f| File.basename(f) },
      }

      if @dialog && @dialog.visible?
        # Зупиняємо відстеження при закритті діалогу
        # Відстеження продовжує працювати навіть при закритті UI
        puts "📊 Відстеження продовжує працювати"
        @dialog.close
        @dialog = nil
        puts "📱 UI ProGran3 закрито"
      end
      
      # Розраховуємо висоту екрану (для 1080p: 1080 - 200 = 880)
      # Для різних екранів: 720p=520, 900p=700, 1080p=880, 1440p=1240
      default_height = 880  # Для стандартного 1080p екрану
      
      @dialog ||= ::UI::HtmlDialog.new({
          :dialog_title => "proGran Конструктор",
          :preferences_key => "com.progran.ui",
          :scrollable => true,
          :resizable => true,
          :width => 500,
          :height => default_height,
          :min_width => 350,
          :min_height => 600
      })
      
      # Зберігаємо початкові розміри для звіту
      @initial_width = 500
      @initial_height = default_height
      
      # Зберігаємо початкову позицію для відновлення
      @initial_position = nil

      @dialog.set_file(html_path)

      @dialog.add_action_callback("ready") do |d, _|
        puts "📱 UI повністю завантажено - запуск відстеження heartbeat..."
        
        # Зберігаємо початкову позицію після завантаження UI
        if @initial_position.nil?
          begin
            current_pos = @dialog.get_position
            @initial_position = [current_pos[0], current_pos[1]]
            puts "📍 Початкова позиція збережена після завантаження UI: x=#{current_pos[0]}, y=#{current_pos[1]}"
          rescue => e
            puts "⚠️ Не вдалося зберегти початкову позицію: #{e.message}"
          end
        end
        
        # Оновлюємо статус ліцензії в UI з затримкою
        @dialog.execute_script("
          setTimeout(() => {
            console.log('🔐 [DELAYED] Викликаємо updateLicenseStatus через 1 секунду...');
            updateLicenseStatus();
          }, 1000);
          
          // Додатковий виклик через 3 секунди для впевненості
          setTimeout(() => {
            console.log('🔐 [DELAYED] Додатковий виклик updateLicenseStatus через 3 секунди...');
            updateLicenseStatus();
          }, 3000);
        ")
        
        
        # Перевіряємо чи плагін заблокований перед запуском
        if $plugin_blocked
          puts "🚫 Плагін заблокований - показуємо карточку блокування"
          @dialog.execute_script("showBlockingCard();")
        else
          puts "✅ Плагін активний - запускаємо нормальну роботу"
        end
        
        # Додатковий тест видимості footer
        @dialog.execute_script("
          setTimeout(() => {
            console.log('🔐 [VISIBILITY] Перевірка видимості footer...');
            const footer = document.getElementById('license-footer');
            if (footer) {
              console.log('🔐 [VISIBILITY] Footer знайдено');
              console.log('🔐 [VISIBILITY] Footer style.display:', footer.style.display);
              console.log('🔐 [VISIBILITY] Footer computed style:', window.getComputedStyle(footer).display);
              console.log('🔐 [VISIBILITY] Footer offsetHeight:', footer.offsetHeight);
              console.log('🔐 [VISIBILITY] Footer offsetWidth:', footer.offsetWidth);
              
              // Примусово показуємо footer
              footer.style.display = 'block';
              footer.style.visibility = 'visible';
              footer.style.opacity = '1';
              console.log('🔐 [VISIBILITY] Footer примусово показано');
            } else {
              console.log('🔐 [VISIBILITY] Footer не знайдено');
            }
          }, 3000);
        ")
        
        # Запускаємо відстеження після повного завантаження UI
        begin
          ProGran3.start_tracking
          puts "✅ Відстеження heartbeat запущено після завантаження UI"
        rescue => e
          puts "⚠️ Не вдалося запустити відстеження: #{e.message}"
        end
        
        @dialog.execute_script("loadModelLists(#{categories.to_json});")
      end
      
      # Callback для закриття діалогу (відстеження продовжує працювати)
      @dialog.set_on_closed {
        puts "📱 Закриття UI ProGran3..."
        puts "📊 Відстеження продовжує працювати в фоновому режимі"
      }

      # Callback'и для JavaScript (використовуємо CallbackManager)
      @dialog.add_action_callback("add_foundation") do |dialog, depth, width, height|
        CallbackManager.add_foundation_callback(dialog, depth, width, height)
      end

      @dialog.add_action_callback("add_stand") do |dialog, height, width, depth, gaps = false, gaps_height = 0, gaps_width = 0, gaps_depth = 0|
        CallbackManager.add_stand_callback(dialog, height, width, depth, gaps, gaps_height, gaps_width, gaps_depth)
      end

      @dialog.add_action_callback("add_tiles") do |dialog, type, *params|
        CallbackManager.add_tiles_callback(dialog, type, *params)
      end
      
      @dialog.add_action_callback("add_side_cladding") do |dialog, thickness|
        CallbackManager.add_cladding_callback(dialog, thickness)
      end
      
             # Callback для відмостки (використовуємо CallbackManager)
       @dialog.add_action_callback("add_blind_area_uniform") do |dialog, width, thickness|
         CallbackManager.add_blind_area_callback(dialog, thickness, "uniform", width)
       end

       @dialog.add_action_callback("add_blind_area_custom") do |dialog, north, south, east, west, thickness|
         CallbackManager.add_blind_area_callback(dialog, thickness, "custom", north, south, east, west)
       end


      @dialog.add_action_callback("add_model") do |dialog, category, filename, stele_type = nil, stele_distance = nil, central_detail = false, central_detail_width = 200, central_detail_depth = 50, central_detail_height = 1200|
        CallbackManager.add_model_callback(dialog, category, filename, stele_type, stele_distance, central_detail, central_detail_width, central_detail_depth, central_detail_height)
      end
      
      # Callback для отримання розмірів стели
      @dialog.add_action_callback("get_stele_dimensions") do |dialog|
        CallbackManager.get_stele_dimensions_callback(@dialog)
      end
      
      # Callback для масштабування стели
      @dialog.add_action_callback("scale_stele") do |dialog, scale_x, scale_y, scale_z|
        CallbackManager.scale_stele_callback(dialog, scale_x, scale_y, scale_z)
      end
      
      # Callback для альтернативного масштабування стели
      @dialog.add_action_callback("scale_stele_alternative") do |dialog, new_width, new_height, new_depth|
        CallbackManager.scale_stele_alternative_callback(dialog, new_width, new_height, new_depth)
      end
      
      @dialog.add_action_callback("create_central_detail") do |dialog, width, depth, height|
        CallbackManager.create_central_detail_callback(dialog, width, depth, height)
      end
      
      @dialog.add_action_callback("delete_central_detail") do |dialog|
        CallbackManager.delete_central_detail_callback(dialog)
      end
      
      @dialog.add_action_callback("add_fence_decor") do |dialog, filename|
        CallbackManager.add_fence_decor_callback(dialog, filename)
      end
       
      # Callback'и для огорожі
      @dialog.add_action_callback("add_fence_corner") do |dialog, post_height, post_width, post_depth, side_height, side_length, side_thickness, decorative_size|
        CallbackManager.add_fence_corner_callback(dialog, post_height, post_width, post_depth, side_height, side_length, side_thickness, decorative_size)
      end
      
      @dialog.add_action_callback("add_fence_perimeter") do |dialog, post_height, post_width, post_depth, north_count, south_count, east_west_count, decorative_height, decorative_thickness|
        CallbackManager.add_fence_perimeter_callback(dialog, post_height, post_width, post_depth, north_count, south_count, east_west_count, decorative_height, decorative_thickness)
      end
      
      @dialog.add_action_callback("add_lamp") do |dialog, category, filename, position|
        CallbackManager.add_lamp_callback(dialog, category, filename, position)
      end
      
      @dialog.add_action_callback("get_detailed_summary") do |dialog|
        CallbackManager.get_detailed_summary_callback(@dialog)
      end
      
      @dialog.add_action_callback("generate_report") do |dialog|
        CallbackManager.generate_report_callback(@dialog)
      end
      
      # Callbacks для зміни розміру вікна (розширення вліво)
      @dialog.add_action_callback("expand_window_for_report") do |dialog|
        expand_window_left
      end
      
      @dialog.add_action_callback("restore_window_size") do |dialog|
        puts "🔔 Отримано запит на restore_window_size"
        puts "   Поточна позиція перед відновленням: #{@dialog.get_position.inspect}"
        restore_window_size
        puts "   Поточна позиція після відновлення: #{@dialog.get_position.inspect}"
      end
      
      # Тестовий callback для діагностики
      @dialog.add_action_callback("test_position_info") do |dialog|
        puts "\n📊 === Діагностична інформація ==="
        puts "   @initial_position: #{@initial_position.inspect}"
        puts "   @saved_position: #{@saved_position.inspect}"
        puts "   Поточна позиція: #{@dialog.get_position.inspect}"
        puts "   Поточний розмір: #{[@dialog.get_size[0], @dialog.get_size[1]].inspect}"
        puts "   @initial_width: #{@initial_width}"
        puts "   @initial_height: #{@initial_height}"
        puts "=================================\n"
      end
      
      # Callback для логування з JavaScript
      @dialog.add_action_callback("log_message") do |dialog, message|
        puts message
      end
      
      # Callback для збереження та відкриття звіту для друку
      @dialog.add_action_callback("save_and_print_report") do |dialog, html_content|
        puts "📄 [Ruby] Отримано запит на збереження звіту"
        puts "   Розмір контенту: #{html_content.length} символів"
        
        begin
          # Створюємо тимчасовий файл
          require 'tmpdir'
          temp_dir = Dir.tmpdir
          timestamp = Time.now.strftime("%Y%m%d_%H%M%S")
          filename = "ProGran3_Report_#{timestamp}.html"
          filepath = File.join(temp_dir, filename)
          
          puts "   Зберігаємо в: #{filepath}"
          
          # Записуємо HTML в файл
          File.write(filepath, html_content, encoding: 'UTF-8')
          
          puts "   ✓ Файл збережено успішно"
          puts "   Відкриваємо файл в браузері..."
          
          # Відкриваємо файл в браузері за замовчуванням
          ::UI.openURL("file:///#{filepath.gsub('\\', '/')}")
          
          puts "✅ Звіт відкрито в браузері. Використовуйте Ctrl+P для друку або збереження в PDF"
          
        rescue => e
          puts "❌ Помилка збереження звіту: #{e.message}"
          puts "   #{e.backtrace.first(3).join("\n   ")}"
        end
      end
      
      # Альтернативний callback для копіювання HTML
      @dialog.add_action_callback("copy_report_html") do |dialog, html_content|
        puts "📋 [Ruby] Копіювання звіту (розмір: #{html_content.length} символів)"
        
        begin
          # Створюємо файл на робочому столі
          desktop = File.expand_path("~/Desktop")
          timestamp = Time.now.strftime("%Y%m%d_%H%M%S")
          filename = "ProGran3_Report_#{timestamp}.html"
          filepath = File.join(desktop, filename)
          
          File.write(filepath, html_content, encoding: 'UTF-8')
          
          puts "✅ Звіт збережено на робочий стіл: #{filename}"
          puts "   Відкрийте файл у браузері та натисніть Ctrl+P для друку/PDF"
          
          ::UI.openURL("file:///#{filepath.gsub('\\', '/')}")
          
        rescue => e
          puts "❌ Помилка: #{e.message}"
        end
      end


      # Callback'и для ліцензійних функцій
      @dialog.add_action_callback("has_license") do |dialog, _|
        # ЗАГЛУШКА: Ліцензійна система видалена, завжди true для демо
        true
      end
      
      @dialog.add_action_callback("license_info") do |dialog, _|
        # ЗАГЛУШКА: Ліцензійна система видалена, повертаємо тестові дані
        "Демо версія - всі функції доступні"
      end
      
      @dialog.add_action_callback("license_info_full") do |dialog, _|
        # ЗАГЛУШКА: Ліцензійна система видалена, повертаємо тестові дані
        {
          status: "active",
          type: "demo",
          days_remaining: 30,
          message: "Демо версія - всі функції доступні",
          features: ["all"]
        }.to_json
      end
      
      @dialog.add_action_callback("license_display_info") do |dialog, _|
        begin
          # Отримуємо реальну інформацію про ліцензію
          require_relative 'system/core/session_manager'
          manager = ProGran3::System::Core::SessionManager.new
          
          info = manager.license_info
          
          if info[:has_license]
            # Розраховуємо днів до закінчення
            days_remaining = if info[:expires_at]
              expires = Time.parse(info[:expires_at])
              ((expires - Time.now) / 86400).to_i
            else
              nil # Необмежено
            end
            
            # Завантажуємо ліцензію напряму з файлу щоб отримати fingerprint
            require_relative 'system/core/data_storage'
            stored_license = ProGran3::System::Core::DataStorage.load
            stored_fp = stored_license ? stored_license[:fingerprint] : nil
            
            puts "🔐 [UI] Email: #{info[:email]}"
            puts "🔐 [UI] Fingerprint from storage: #{stored_fp ? stored_fp[0..16] : 'nil'}"
            
            result = {
              status: info[:status] || "active",
              type: "full",
              email: info[:email] || "Невідомий email",
              license_key: info[:license_key],
              fingerprint: stored_fp,
              days_remaining: days_remaining,
              message: days_remaining ? "Ліцензія активна (#{days_remaining} днів)" : "Ліцензія активна"
            }.to_json
          else
            # Немає ліцензії - демо режим
            current_fp = ProGran3::System::Utils::DeviceIdentifier.generate[:fingerprint]
            
            result = {
              status: "demo",
              type: "demo",
              fingerprint: current_fp,
              days_remaining: nil,
              message: "Демо версія"
            }.to_json
          end
          
          puts "🔐 [UI] License info: #{result}"
          puts "🔐 [UI] Info hash: #{info.inspect}"
          
          # Додатково встановлюємо fingerprint напряму
          # Беремо fingerprint напряму з файлу ліцензії
          require_relative 'system/core/data_storage'
          stored_license = ProGran3::System::Core::DataStorage.load
          
          stored_fp = stored_license ? stored_license[:fingerprint] : nil
          
          fp_display = if stored_fp && stored_fp.length >= 12
            "#{stored_fp[0..7]}...#{stored_fp[-4..-1]}"
          else
            'N/A'
          end
          
          puts "🔐 [UI] Stored FP: #{stored_fp ? stored_fp[0..16] : 'nil'}"
          puts "🔐 [UI] FP Display: #{fp_display}"
          
          # Передаємо дані в JavaScript через execute_script
          @dialog.execute_script("
            if (window.licenseDisplayInfoCallback) {
              window.licenseDisplayInfoCallback('#{result}');
            }
            
            // Додатково встановлюємо fingerprint напряму
            const footerFp = document.getElementById('license-footer-fingerprint');
            if (footerFp) {
              footerFp.textContent = '#{fp_display}';
            }
          ")
          
        rescue => e
          puts "❌ [UI] Помилка отримання license info: #{e.message}"
          
          # Fallback - демо (але все одно показуємо fingerprint)
          begin
            current_fp = ProGran3::System::Utils::DeviceIdentifier.generate[:fingerprint]
            fp_display = "#{current_fp[0..7]}...#{current_fp[-4..-1]}"
          rescue
            current_fp = 'unavailable'
            fp_display = 'N/A'
          end
          
          result = {
            status: "demo",
            type: "demo",
            fingerprint: current_fp,
            message: "Демо версія"
          }.to_json
          
          @dialog.execute_script("
            if (window.licenseDisplayInfoCallback) {
              window.licenseDisplayInfoCallback('#{result}');
            }
            
            // Встановлюємо fingerprint напряму
            const footerFp = document.getElementById('license-footer-fingerprint');
            if (footerFp) {
              footerFp.textContent = '#{fp_display}';
            }
          ")
        end
        
        nil
      end
      
      @dialog.add_action_callback("activate_license") do |dialog, license_key, email|
        result = ProGran3.activate_license(email, license_key)
        # Примусове оновлення UI після активації
        if result && result[:success]
          puts "🔄 [UI] Примусове оновлення UI після активації"
          @dialog.execute_script("
            setTimeout(() => {
              console.log('🔐 [UI] Примусове оновлення статусу з Ruby (1 сек)');
              updateLicenseStatus();
            }, 1000);
            
            setTimeout(() => {
              console.log('🔐 [UI] Примусове оновлення статусу з Ruby (3 сек)');
              updateLicenseStatus();
            }, 3000);
            
            setTimeout(() => {
              console.log('🔐 [UI] Примусове оновлення статусу з Ruby (5 сек)');
              updateLicenseStatus();
            }, 5000);
          ")
        end
        result
      end
      
      @dialog.add_action_callback("check_blocking_status") do |dialog, _|
        ProGran3.check_blocking_status
      end

      @dialog.add_action_callback("reload_plugin") do |dialog, _|
        # Валідація перед перезавантаженням
        Validation.validate!(true, "Перезавантаження плагіна", "UI")
        
        dialog.close
        ProGran3.reload
        ProGran3::UI.show_dialog
      end

      # Callback для тестування нових функцій (універсальна логіка з .skp файлів)

      @dialog.add_action_callback("generate_preview_image") do |dialog, component_path|
        # Валідація шляху до файлу
        file_result = Validation.validate_file_path(component_path, "UI")
        unless file_result.valid
          ErrorHandler.handle_error(
            Validation::ValidationError.new("Помилка валідації файлу превью: #{file_result.error_messages.join(', ')}"),
            "UI",
            "generate_preview_image"
          )
          return false
        end
        
        # Використовуємо універсальний екстрактор для .skp файлів
        result = ProGran3.extract_skp_preview(component_path)
        puts "✅ Превью витягнуто: #{result}" if result
      end

      @dialog.add_action_callback("generate_web_preview") do |dialog, component_path|
        puts "🔍 generate_web_preview callback викликано для: #{component_path}"
        
        # Використовуємо універсальний метод для отримання base64
        base64_data = ProGran3.get_preview_base64(component_path, 256)
        
        if base64_data
          puts "✅ Отримано base64 дані, довжина: #{base64_data.length}"
          puts "🔄 Відправляємо дані в JavaScript..."
          
          # Екрануємо одинарні лапки в base64_data
          escaped_base64 = base64_data.gsub("'", "\\'")
          
          script = "receiveWebPreview('#{component_path}', '#{escaped_base64}');"
          puts "📝 JavaScript скрипт: #{script[0..100]}..." if script.length > 100
          
          @dialog.execute_script(script)
          puts "✅ Скрипт виконано"
        else
          puts "❌ Помилка генерації превью для: #{component_path}"
          @dialog.execute_script("handlePreviewError('#{component_path}', 'Помилка генерації превью');")
        end
      end

      # Реєструємо callback'и для нового модуля каруселі
      @carousel_ui = ProGran3::Carousel::CarouselUI.new
      @carousel_ui.register_callbacks(@dialog)
      
      # Додаємо callback для отримання HTML каруселі
      @dialog.add_action_callback("get_carousel_html") do |dialog, carousel_id|
        # v3.1: Sanitize carousel_id для запобігання code injection
        safe_carousel_id = carousel_id.to_s.gsub(/['"\\`]/, '')  # Видаляємо небезпечні символи
        
        html = @carousel_ui.get_carousel_html(safe_carousel_id)
        
        # v3.1: Escape HTML для безпечного вставлення
        safe_html = html.gsub('`', '\\`').gsub('${', '\\${')
        
        dialog.execute_script("receiveCarouselHtml('#{safe_carousel_id}', `#{safe_html}`);")
      end

      # Callback для отримання статусу моделі
             # Методи для отримання збережених параметрів (делегування до CallbackManager)
       def self.get_blind_area_params
         CallbackManager.get_blind_area_params
       end
       
       def self.get_tiles_params
         CallbackManager.get_tiles_params
       end
       
       def self.get_cladding_params
         CallbackManager.get_cladding_params
       end
       
       def self.get_foundation_params
         CallbackManager.get_foundation_params
       end
      
      @dialog.add_action_callback("get_model_status") do |dialog, _|
        puts "🔍 get_model_status callback викликано"
        
        # Отримуємо поточну модель SketchUp
        model = Sketchup.active_model
        status = {
          foundation: false,
          tiling: false,
          cladding: false,
          blindArea: false,
          stands: false,
          flowerbeds: false,
          gravestones: false,
          steles: false
        }
        
        if model
          # Функція для рекурсивного пошуку елементів
          def check_entities(entities, status)
            entities.each do |entity|
              if entity.is_a?(Sketchup::ComponentInstance)
                definition = entity.definition
                name = definition.name.downcase
                
                # Перевіряємо категорії на основі імені компонента
                if name == 'foundation'
                  status[:foundation] = true
                  puts "✅ Знайдено фундамент (компонент): #{name}"
                elsif name.include?('stand') || name.include?('підставка') || name.include?('подставка')
                  status[:stands] = true
                  puts "✅ Знайдено підставку: #{name}"
                elsif name.include?('flowerbed') || name.include?('квітник') || name.include?('цветник')
                  status[:flowerbeds] = true
                  puts "✅ Знайдено квітник: #{name}"
                elsif name.include?('gravestone') || name.include?('plate') || name.include?('надгробна') || name.include?('плита')
                  status[:gravestones] = true
                  puts "✅ Знайдено надгробну плиту: #{name}"
                elsif name.include?('stele') || name.include?('стела') || name.include?('стелла')
                  status[:steles] = true
                  puts "✅ Знайдено стелу: #{name}"
                elsif name.start_with?('blindarea_') || name.include?('відмостка') || name.include?('отмостка')
                  status[:blindArea] = true
                  puts "✅ Знайдено відмостку: #{name}"
                end
              elsif entity.is_a?(Sketchup::Group)
                # Рекурсивно перевіряємо групи
                check_entities(entity.entities, status)
                
                # Також перевіряємо ім'я групи
                group_name = entity.name.downcase
                if group_name.include?('tile') || group_name.include?('плитка')
                  status[:tiling] = true
                  puts "✅ Знайдено плитку (група): #{group_name}"
                elsif group_name.include?('cladding') || group_name.include?('облицювання')
                  status[:cladding] = true
                  puts "✅ Знайдено облицювання (група): #{group_name}"
                elsif group_name.include?('blindarea') || group_name.include?('відмостка') || group_name.include?('отмостка')
                  status[:blindArea] = true
                  puts "✅ Знайдено відмостку (група): #{group_name}"
                end
              elsif entity.is_a?(Sketchup::Edge) || entity.is_a?(Sketchup::Face)
                # Перевіряємо геометрію для фундаменту, плитки та облицювання
                if entity.layer
                  layer_name = entity.layer.name.downcase
                  if layer_name.include?('foundation') || layer_name.include?('фундамент')
                    status[:foundation] = true
                    puts "✅ Знайдено фундамент (layer): #{layer_name}"
                  elsif layer_name.include?('tile') || layer_name.include?('плитка')
                    status[:tiling] = true
                    puts "✅ Знайдено плитку (layer): #{layer_name}"
                  elsif layer_name.include?('cladding') || layer_name.include?('облицювання')
                    status[:cladding] = true
                    puts "✅ Знайдено облицювання (layer): #{layer_name}"
                  elsif layer_name.include?('blindarea') || layer_name.include?('відмостка') || layer_name.include?('отмостка')
                    status[:blindArea] = true
                    puts "✅ Знайдено відмостку (layer): #{layer_name}"
                  end
                end
              end
            end
          end
          
          # Перевіряємо всі елементи моделі
          check_entities(model.active_entities, status)
          
          # Додаткова перевірка для фундаменту, плитки та облицювання
          # Шукаємо за розмірами або іншими характеристиками
          model.active_entities.each do |entity|
            if entity.is_a?(Sketchup::Group)
              # Перевіряємо групи на основі їх розмірів або імені
              bounds = entity.bounds
              if bounds
                width = bounds.width
                height = bounds.height
                depth = bounds.depth
                
                # Фундамент зазвичай має великі розміри і малу висоту
                if width > 800 && depth > 800 && height < 300
                  status[:foundation] = true
                  puts "✅ Знайдено фундамент (розміри): #{width}×#{depth}×#{height}"
                end
                
                # Плитка зазвичай тонка і широка
                if height < 100 && width > 400 && depth > 400
                  status[:tiling] = true
                  puts "✅ Знайдено плитку (розміри): #{width}×#{depth}×#{height}"
                end
                
                # Облицювання зазвичай вертикальне
                if height > 150 && (width < 200 || depth < 200)
                  status[:cladding] = true
                  puts "✅ Знайдено облицювання (розміри): #{width}×#{depth}×#{height}"
                end
                
                # Відмостка зазвичай широка і тонка
                if height < 100 && (width > 600 || depth > 600)
                  status[:blindArea] = true
                  puts "✅ Знайдено відмостку (розміри): #{width}×#{depth}×#{height}"
                end
              end
            end
          end
        end
        
        puts "📊 Статус моделі: #{status}"
        
        # Відправляємо статус в JavaScript
        script = "receiveModelStatus(#{status.to_json});"
        @dialog.execute_script(script)
        puts "✅ Статус моделі відправлено в JavaScript"
      end
      
      # Callback для зміни одиниці вимірювання
      @dialog.add_action_callback("change_unit") do |dialog, unit|
        # Встановлюємо нову одиницю в DimensionsManager
        success = DimensionsManager.set_current_unit(unit)
        
        if success
          ProGran3::Logger.info("Одиниця вимірювання змінена на: #{unit}", "UI")
          true
        else
          ErrorHandler.handle_error(
            Validation::ValidationError.new("Непідтримувана одиниця вимірювання: #{unit}"),
            "UI",
            "change_unit"
          )
          false
        end
      end
      
      # Callback для отримання поточної одиниці
      @dialog.add_action_callback("get_current_unit") do |dialog, _|
        # Повертаємо поточну одиницю (за замовчуванням мм)
        "mm"
      end
      



      # Callback для оновлення розміру підставки
      @dialog.add_action_callback("update_stand_size") do |dialog, height, width, depth|
        CallbackManager.update_stand_size_callback(dialog, height, width, depth)
      end
      
      # Callback для отримання списку підставок
      @dialog.add_action_callback("get_stands_list") do |dialog, _|
        stands_list = Dir.glob(File.join(ProGran3::ASSETS_PATH, "stands", "*.skp")).map { |f| File.basename(f) }
        ProGran3::Logger.info("Повертаємо список підставок: #{stands_list.length} елементів", "UI")
        stands_list
      end

      # Тестовий callback для перевірки
      @dialog.add_action_callback("test_preview_callback") do |action_context, size, quality|
        @dialog.execute_script("console.log('🧪 Тестовий callback працює! size=#{size}, quality=#{quality}');")
        42
      end

      # ========== ЛІЦЕНЗІЙНІ CALLBACK'И ==========
      
      # Callback для активації ліцензії
      @dialog.add_action_callback("activate_license") do |action_context, license_key|
        begin
          puts "🔐 [UI] Callback активації ліцензії: #{license_key[0..8]}..."
          
          # ЗАГЛУШКА: Ліцензійна система видалена, завжди успішно
          {
            success: true,
            message: "Ліцензія активована (локальна версія)",
            email: "local@progran3.com",
            license_info: "Локальна версія - всі функції доступні"
          }
        rescue => e
          {
            success: false,
            error: e.message
          }
        end
      end
      
      # Callback для реєстрації ліцензії з email
      @dialog.add_action_callback("register_license_with_email") do |action_context, email, license_key|
        begin
          puts "🔐 [UI] Callback реєстрації ліцензії: #{email} + #{license_key[0..8]}..."
          
          # ЗАГЛУШКА: Ліцензійна система видалена, завжди успішно
          {
            success: true,
            message: "Ліцензія зареєстрована (локальна версія)",
            user_license: {
              email: email,
              status: "active",
              expires_at: nil
            }
          }
        rescue => e
          {
            success: false,
            error: e.message
          }
        end
      end
      
      # Callback для отримання інформації про ліцензію
      @dialog.add_action_callback("get_license_info") do |action_context, _|
        begin
          # ЗАГЛУШКА: Ліцензійна система видалена, повертаємо тестові дані
          {
            success: true,
            license_info: "Демо версія - всі функції доступні",
            email: "demo@example.com"
          }
        rescue => e
          {
            success: false,
            error: e.message
          }
        end
      end
      
      # Callback для очищення ліцензії
      @dialog.add_action_callback("clear_license") do |action_context, _|
        begin
          # ЗАГЛУШКА: Ліцензійна система видалена
          {
            success: true,
            message: "Ліцензія очищена (локальна версія)"
          }
        rescue => e
          {
            success: false,
            error: e.message
          }
        end
      end
      
      # Callback для генерації превью моделі
      @dialog.add_action_callback("generate_model_preview") do |action_context, size, quality|
        begin
          ProGran3::Logger.info("🔄 Callback generate_model_preview викликано", "UI")
          ProGran3::Logger.info("📥 Параметри: size=#{size}, quality=#{quality}", "UI")
          
          result = generate_model_preview_callback(@dialog, size, quality)
          
          ProGran3::Logger.info("📤 Результат callback: #{result.inspect}", "UI")
          
          # Відправляємо результат в JavaScript
          if result && result[:success]
            ProGran3::Logger.info("✅ Відправляємо успішний результат в JavaScript", "UI")
            # Екрануємо одинарні лапки в base64 даних
            escaped_data = result[:data].gsub("'", "\\'")
            script = "receiveModelPreview(#{result.to_json});"
            @dialog.execute_script(script)
            ProGran3::Logger.info("✅ Результат превью відправлено в JavaScript", "UI")
            ProGran3::Logger.info("🔄 Повертаємо 1 (успіх)", "UI")
            1
          else
            error_msg = result ? result[:error] : "Невідома помилка"
            ProGran3::Logger.error("❌ Відправляємо помилку в JavaScript: #{error_msg}", "UI")
            script = "handleModelPreviewError('#{error_msg}');"
            @dialog.execute_script(script)
            ProGran3::Logger.error("❌ Помилка превью відправлена в JavaScript: #{error_msg}", "UI")
            ProGran3::Logger.info("🔄 Повертаємо 0 (помилка)", "UI")
            0
          end
          
        rescue => e
          ProGran3::Logger.error("❌ Критична помилка в callback: #{e.message}", "UI")
          ProGran3::Logger.error("Stack trace: #{e.backtrace.join("\n")}", "UI")
          
          # Відправляємо помилку в JavaScript
          script = "handleModelPreviewError('Критична помилка: #{e.message}');"
          @dialog.execute_script(script)
          
          ProGran3::Logger.info("🔄 Повертаємо 0 (критична помилка)", "UI")
          0
        end
      end
      
      # Додаємо callback для перевірки статусу блокування
      add_blocking_status_callback(@dialog)

      # Позиціонуємо вікно до правого боку екрану
      position_window_to_right_side
      
      @dialog.show
    end

    private

    # Позиціонування вікна до правого боку екрану
    def position_window_to_right_side
      begin
        # Отримуємо розміри екрану
        screen_width = Sketchup.get_desktop_width
        screen_height = Sketchup.get_desktop_height
        
        # Отримуємо розміри діалогу
        dialog_width = @dialog.get_size[0]
        dialog_height = @dialog.get_size[1]
        
        # Розраховуємо позицію для правого боку
        # Відступ від краю екрану (20 пікселів)
        margin = 20
        x_position = screen_width - dialog_width - margin
        y_position = (screen_height - dialog_height) / 2  # По центру по вертикалі
        
        # Встановлюємо позицію
        @dialog.set_position(x_position, y_position)
        
        puts "📍 Вікно позиціоновано до правого боку екрану:"
        puts "   Екран: #{screen_width}x#{screen_height}"
        puts "   Діалог: #{dialog_width}x#{dialog_height}"
        puts "   Позиція: x=#{x_position}, y=#{y_position}"
        
      rescue => e
        puts "⚠️ Помилка позиціонування вікна: #{e.message}"
        # Якщо не вдалося позиціонувати, використовуємо стандартну позицію
      end
    end

    # Генерація превью поточної моделі
    def generate_model_preview_callback(dialog, size, quality)
      begin
        ProGran3::Logger.info("🎨 Початок генерації превью моделі", "UI")
        ProGran3::Logger.info("📐 Параметри: розмір=#{size}, якість=#{quality}", "UI")

        # Використовуємо новий метод з SkpPreviewExtractor
        data_url = ProGran3::SkpPreviewExtractor.generate_current_model_preview(size, quality)
        
        if data_url
          ProGran3::Logger.success("✅ Превью успішно згенеровано", "UI")
          ProGran3::Logger.info("📏 Розмір превью: #{data_url.length} символів", "UI")
          
          result = {
            success: true,
            data: data_url,
            size: size.to_i,
            quality: quality,
            generated_at: Time.now.iso8601
          }
          
          ProGran3::Logger.info("📤 Повертаємо результат: #{result.keys.join(', ')}", "UI")
          return result
        else
          ProGran3::Logger.error("Не вдалося згенерувати превью", "UI")
          return { success: false, error: "Не вдалося згенерувати превью моделі" }
        end

      rescue => e
        ProGran3::Logger.error("Помилка генерації превью: #{e.message}", "UI")
        ProGran3::Logger.error("Stack trace: #{e.backtrace.join("\n")}", "UI")
        return { success: false, error: "Помилка генерації превью: #{e.message}" }
      end
    end

    # Callback для перевірки статусу блокування з сервера
    def self.add_blocking_status_callback(dialog)
      dialog.add_action_callback("checkBlockingStatus") do |action_context, _|
        puts "🔍 Перевірка статусу блокування з сервера..."
        
        begin
          # Використовуємо метод check_blocking_status для перевірки статусу
          result = ProGran3.check_blocking_status
          
          if result[:success]
            is_blocked = result[:blocked] || false
            puts "📡 Статус з сервера: #{is_blocked ? 'ЗАБЛОКОВАНО' : 'АКТИВНИЙ'}"
            
            # Відправляємо результат в JavaScript через @dialog
            @dialog.execute_script("updateBlockingStatusFromServer(#{is_blocked});")
          else
            puts "⚠️ Не вдалося отримати статус з сервера: #{result[:error]}"
            @dialog.execute_script("debugLog('❌ Помилка отримання статусу: #{result[:error]}', 'error');")
          end
        rescue => e
          puts "❌ Помилка при перевірці статусу блокування: #{e.message}"
          puts "❌ Backtrace: #{e.backtrace.join('\n')}"
          @dialog.execute_script("debugLog('❌ Помилка Ruby callback: #{e.message}', 'error');")
        end
      end
    end
    
    # Розширення вікна ВЛІВО (права сторона залишається на місці)
    def expand_window_left
      if @dialog
        begin
          # Отримуємо поточну позицію
          current_pos = @dialog.get_position
          current_x = current_pos[0]
          current_y = current_pos[1]
          
          # Зберігаємо початкову позицію ПЕРЕД розширенням (якщо ще не збережена)
          if @initial_position.nil?
            @initial_position = [current_x, current_y]
            puts "📍 Початкова позиція збережена перед розширенням: x=#{current_x}, y=#{current_y}"
          end
          
          # Нові розміри (A4 пропорції: 850×1200 + відступи на модальне вікно)
          new_width = 950   # 850px + 100px на відступи
          new_height = 1280 # 1200px + 80px на header модального вікна
          old_width = @initial_width || 500
          
          # Розраховуємо зміщення вліво (щоб права сторона залишилась на місці)
          shift_left = new_width - old_width  # 950 - 420 = 530
          new_x = current_x - shift_left
          
          # Зберігаємо позицію для тимчасового відновлення
          @saved_position = current_pos
          
          puts "📐 Розширення вікна ВЛІВО: #{old_width}×850 → #{new_width}×#{new_height}"
          puts "   Позиція: x=#{current_x} → x=#{new_x} (зміщення вліво на #{shift_left}px)"
          puts "   Модальне всередині: 850×1200 (пропорції A4)"
          
          # Спочатку змінюємо позицію, потім розмір
          @dialog.set_position(new_x, current_y)
          @dialog.set_size(new_width, new_height)
          
          # Позиціонуємо до правого боку після розширення
          position_window_to_right_side
          
          puts "✅ Вікно розширено вліво та позиціоновано до правого боку"
          
        rescue => e
          puts "⚠️ Помилка розширення вікна: #{e.message}"
          # Fallback - просто розширюємо без зміщення
          @dialog.set_size(950, 1250) rescue nil
        end
      end
    end
    
    # Повернення вікна до початкових розмірів та позиції
    def restore_window_size
      if @dialog
        begin
          width = @initial_width || 500
          height = @initial_height || 880
          
          puts "📐 Повернення розміру вікна: #{width}x#{height}"
          puts "   Початкова позиція: #{@initial_position.inspect}"
          puts "   Збережена позиція: #{@saved_position.inspect}"
          
          # ВАЖЛИВО: Спочатку повертаємо позицію, потім розмір
          # Це гарантує що вікно буде в правильному місці
          
          # Крок 1: Позиціонуємо до правого боку екрану
          puts "   Крок 1: Позиціонування до правого боку екрану"
          position_window_to_right_side
          
          # Крок 2: Встановлюємо розмір
          puts "   Крок 2: Встановлення розміру #{width}x#{height}"
          @dialog.set_size(width, height)
          
          # Крок 3: Повторно позиціонуємо до правого боку (після зміни розміру вона може зміститися)
          puts "   Крок 3: Повторне позиціонування до правого боку"
          position_window_to_right_side
          
          # Перевіряємо фактичну позицію
          final_pos = @dialog.get_position
          puts "   ✓ Фінальна позиція: x=#{final_pos[0]}, y=#{final_pos[1]}"
          
          # Очищаємо збережену позицію
          @saved_position = nil
          
          puts "✅ Вікно повернуто до початкових розмірів та позиції"
          
        rescue => e
          puts "⚠️ Помилка відновлення розміру: #{e.message}"
          puts "   Трасування: #{e.backtrace.first(3).join("\n   ")}"
        end
      else
        puts "⚠️ Діалог не знайдено для відновлення"
      end
    end
    
    # Fallback - центрування вікна на екрані якщо початкова позиція не збережена
    def center_window_on_screen_fallback
      if @dialog
        begin
          puts "🔍 Центрування на екрані (fallback)..."
          
          # Типові розміри екрану
          screen_width = 1920
          screen_height = 1080
          
          # Спробуємо отримати реальні розміри екрану
          begin
            if SketchUp.respond_to?(:screen_width) && SketchUp.respond_to?(:screen_height)
              screen_width = SketchUp.screen_width
              screen_height = SketchUp.screen_height
            end
          rescue
            # Використовуємо типові розміри якщо не вдалося отримати реальні
          end
          
          # Розміри вікна
          window_width = @initial_width || 500
          window_height = @initial_height || 880
          
          # Розраховуємо центральну позицію
          center_x = (screen_width - window_width) / 2
          center_y = (screen_height - window_height) / 2
          
          # Встановлюємо центральну позицію
          @dialog.set_position(center_x.to_i, center_y.to_i)
          
          puts "📍 Вікно відцентровано на екрані #{screen_width}x#{screen_height}: x=#{center_x.to_i}, y=#{center_y.to_i}"
          
        rescue => e
          puts "⚠️ Помилка центрування: #{e.message}"
        end
      end
    end
    
  end
end