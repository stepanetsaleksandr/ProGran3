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

      # Callback для тестування нових функцій (нова логіка з .skp файлів)

                  @dialog.add_action_callback("generate_preview_image") do |dialog, component_path|
              # Використовуємо гібридний екстрактор для .skp файлів
              skp_file_path = File.join(ProGran3::ASSETS_PATH, component_path)
              if File.exist?(skp_file_path)
                result = ProGran3.extract_skp_preview(skp_file_path)
                puts "✅ Превью витягнуто: #{result}" if result
              else
                puts "❌ Файл не знайдено: #{skp_file_path}"
              end
            end

                  @dialog.add_action_callback("generate_web_preview") do |dialog, component_path|
              puts "🔍 generate_web_preview callback викликано для: #{component_path}"
              
              # Використовуємо гібридний екстрактор для .skp файлів
              skp_file_path = File.join(ProGran3::ASSETS_PATH, component_path)
              
              if File.exist?(skp_file_path)
                # Витягуємо превью за допомогою гібридного методу
                temp_preview_path = ProGran3.extract_skp_preview(skp_file_path, 256)
                
                if temp_preview_path && File.exist?(temp_preview_path)
                  # Читаємо файл та конвертуємо в base64
                  begin
                    require 'base64'
                    image_data = File.read(temp_preview_path, mode: 'rb')
                    base64_data = Base64.strict_encode64(image_data)
                    
                    puts "✅ Отримано base64 дані, довжина: #{base64_data.length}"
                    @dialog.execute_script("receiveWebPreview('#{component_path}', 'data:image/png;base64,#{base64_data}');")
                  rescue => e
                    puts "❌ Помилка конвертації в base64: #{e.message}"
                    @dialog.execute_script("handlePreviewError('#{component_path}', 'Помилка конвертації превью');")
                  end
                else
                  puts "❌ Не вдалося витягнути превью"
                  @dialog.execute_script("handlePreviewError('#{component_path}', 'Помилка витягування превью');")
                end
              else
                puts "❌ Файл не знайдено: #{skp_file_path}"
                @dialog.execute_script("handlePreviewError('#{component_path}', 'Файл не знайдено');")
              end
            end




      
      @dialog.show
    end
  end
end