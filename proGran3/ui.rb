# progran3/ui.rb
require 'json'

module ProGran3
  module UI
    extend self

    def show_dialog
      html_path = File.join(File.dirname(__FILE__), "web", "index.html")
      categories = {
        stands: Dir.glob(File.join(ProGran3::ASSETS_PATH, "stands", "*.skp")).map { |f| File.basename(f) },
        steles: Dir.glob(File.join(ProGran3::ASSETS_PATH, "steles", "*.skp")).map { |f| File.basename(f) },
        flowerbeds: Dir.glob(File.join(ProGran3::ASSETS_PATH, "flowerbeds", "*.skp")).map { |f| File.basename(f) },
        gravestones: Dir.glob(File.join(ProGran3::ASSETS_PATH, "gravestones", "*.skp")).map { |f| File.basename(f) },
        pavement_tiles: Dir.glob(File.join(ProGran3::ASSETS_PATH, "pavement_tiles", "*.skp")).map { |f| File.basename(f) },
      }

      if @dialog && @dialog.visible?
        @dialog.close
        @dialog = nil
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
        @dialog.execute_script("loadModelLists(#{categories.to_json});")
      end

      # Callback'и для JavaScript
      @dialog.add_action_callback("add_foundation") do |dialog, depth, width, height|
        ProGran3::FoundationBuilder.create(depth.to_i, width.to_i, height.to_i)
      end

      @dialog.add_action_callback("add_tiles") do |dialog, type, *params|
        if type == "frame"
          thickness, borderWidth, overhang = params.map(&:to_i)
          ProGran3::TilingBuilder.insert_perimeter_tiles(thickness, borderWidth, overhang)
        elsif type == "modular"
          tileSize, thickness, seam, overhang = params
          thickness, seam, overhang = [thickness, seam, overhang].map(&:to_i)
          ProGran3::TilingBuilder.insert_modular_tiles(tileSize, thickness, seam, overhang)
        end
      end
      
      @dialog.add_action_callback("add_side_cladding") do |dialog, thickness|
        ProGran3::CladdingBuilder.create(thickness.to_i)
      end

      @dialog.add_action_callback("add_model") do |dialog, category, filename|
        ProGran3.insert_component(category, filename)
      end

      # Старі callback'и для сумісності
      @dialog.add_action_callback("insert_foundation") do |dialog, params_json|
        params = JSON.parse(params_json)
        ProGran3::FoundationBuilder.create(params["depth"], params["width"], params["height"])
      end

      @dialog.add_action_callback("insert_component") do |dialog, params|
        category, filename = params.split("|")
        ProGran3.insert_component(category, filename)
      end

      @dialog.add_action_callback("insert_tiles") do |dialog, params_json|
        params = JSON.parse(params_json)
        if params["type"] == "frame"
          ProGran3::TilingBuilder.insert_perimeter_tiles(params["thickness"], params["borderWidth"], params["overhang"])
        elsif params["type"] == "modular"
          ProGran3::TilingBuilder.insert_modular_tiles(params["tileSize"], params["thickness"], params["seam"], params["overhang"])
        end
      end
      
      @dialog.add_action_callback("insert_side_cladding") do |dialog, params_json|
        params = JSON.parse(params_json)
        ProGran3::CladdingBuilder.create(params["thickness"])
      end

      @dialog.add_action_callback("reload_plugin") do |dialog, _|
        dialog.close
        ProGran3.reload
        ProGran3::UI.show_dialog
      end

      # Callback для тестування нових функцій (універсальна логіка з .skp файлів)

      @dialog.add_action_callback("generate_preview_image") do |dialog, component_path|
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
      @dialog.add_action_callback("get_model_status") do |dialog, _|
        puts "🔍 get_model_status callback викликано"
        
        # Отримуємо поточну модель SketchUp
        model = Sketchup.active_model
        status = {
          foundation: false,
          tiling: false,
          cladding: false,
          stands: false,
          flowerbeds: false,
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
                elsif name.include?('stele') || name.include?('стела') || name.include?('стелла')
                  status[:steles] = true
                  puts "✅ Знайдено стелу: #{name}"
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
      


      @dialog.show
    end
  end
end