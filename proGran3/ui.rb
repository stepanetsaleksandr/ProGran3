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

      # Callback для тестування нових функцій

      @dialog.add_action_callback("generate_preview_image") do |dialog, component_path|
        ProGran3.generate_preview_image(component_path)
      end

      @dialog.add_action_callback("generate_web_preview") do |dialog, component_path|
        puts "🔍 generate_web_preview callback викликано для: #{component_path}"
        base64_data = ProGran3.generate_web_preview(component_path)
        if base64_data
          puts "✅ Отримано base64 дані, довжина: #{base64_data.length}"
          puts "📄 Перші 100 символів: #{base64_data[0..100]}"
          @dialog.execute_script("receiveWebPreview('#{component_path}', '#{base64_data}');")
        else
          puts "❌ Не вдалося згенерувати превью"
          @dialog.execute_script("handlePreviewError('#{component_path}', 'Помилка генерації превью');")
        end
      end




      
      @dialog.show
    end
  end
end