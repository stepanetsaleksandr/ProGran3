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
      
      @dialog ||= ::UI::HtmlDialog.new({
          :dialog_title => "proGran Конструктор",
          :preferences_key => "com.progran.ui",
          :scrollable => true,
          :resizable => true,
          :width => 420,
          :height => 850,
          :min_width => 350,
          :min_height => 600
      })

      @dialog.set_file(html_path)

      @dialog.add_action_callback("ready") do |d, _|
        puts "📱 UI повністю завантажено - запуск відстеження heartbeat..."
        
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


      # Callback'и для ліцензійних функцій
      @dialog.add_action_callback("has_license") do |dialog, _|
        ProGran3.has_license?
      end
      
      @dialog.add_action_callback("license_info") do |dialog, _|
        ProGran3.license_info
      end
      
      @dialog.add_action_callback("license_info_full") do |dialog, _|
        ProGran3.license_info_full.to_json
      end
      
      @dialog.add_action_callback("license_display_info") do |dialog, _|
        result = ProGran3.license_display_info
        puts "🔐 [UI] Callback license_display_info повертає: #{result}"
        puts "🔐 [UI] Callback result type: #{result.class}"
        puts "🔐 [UI] Callback result length: #{result&.length}"
        
        # SketchUp callback повертає кількість символів замість рядка
        # Використовуємо execute_script для передачі даних
        @dialog.execute_script("
          if (window.licenseDisplayInfoCallback) {
            window.licenseDisplayInfoCallback('#{result}');
          }
        ")
        
        # Повертаємо nil, щоб уникнути проблеми з return value
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
        html = @carousel_ui.get_carousel_html(carousel_id)
        dialog.execute_script("receiveCarouselHtml('#{carousel_id}', `#{html}`);")
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
          
          if $license_manager
            if !$license_manager.has_license?
              puts "🔐 [UI] Перша активація - потрібен email"
              {
                success: false,
                requires_email: true,
                message: "Введіть email для реєстрації ліцензії"
              }
            else
              puts "🔐 [UI] Ліцензія вже зареєстрована"
              {
                success: true,
                message: "Ліцензія вже зареєстрована",
                email: $license_manager.get_license_info_for_heartbeat[:email],
                license_info: $license_manager.get_license_display_info
              }
            end
          else
            {
              success: false,
              error: "License manager not initialized"
            }
          end
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
          
          if $license_manager
            result = $license_manager.register_license(email, license_key)
            
            if result[:success]
              puts "✅ [UI] Ліцензія успішно зареєстрована"
              {
                success: true,
                message: result[:message],
                user_license: result[:user_license]
              }
            else
              puts "❌ [UI] Помилка реєстрації: #{result[:error]}"
              {
                success: false,
                error: result[:error]
              }
            end
          else
            {
              success: false,
              error: "License manager not initialized"
            }
          end
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
          if $license_manager
            license_info = $license_manager.get_license_display_info
            {
              success: true,
              license_info: license_info,
              email: $license_manager.email
            }
          else
            {
              success: false,
              error: "License manager not initialized"
            }
          end
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
          if $license_manager
            $license_manager.clear_license
            {
              success: true,
              message: "Ліцензія очищена"
            }
          else
            {
              success: false,
              error: "License manager not initialized"
            }
          end
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

      @dialog.show
    end

    private

    # Генерація превью поточної моделі
    def generate_model_preview_callback(dialog, size, quality)
      begin
        ProGran3::Logger.info("🎨 Початок генерації превью моделі", "UI")
        ProGran3::Logger.info("📐 Параметри: розмір=#{size}, якість=#{quality}", "UI")

        # Використовуємо новий метод з SkpPreviewExtractor
        data_url = ProGran3::SkpPreviewExtractor.generate_current_model_preview(size, quality)
        
        if data_url
          ProGran3::Logger.success("✅ Превью успішно згенеровано", "UI")
          ProGran3::Logger.info("📏 Довжина base64 даних: #{data_url.length}", "UI")
          
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
  end
end