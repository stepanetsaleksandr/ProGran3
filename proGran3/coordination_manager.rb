# progran3/coordination_manager.rb
# Модуль для координації позиціонування всіх елементів моделі
require_relative 'validation'
require_relative 'logger'
require_relative 'error_handler'

module ProGran3
  module CoordinationManager
    extend self
    
    # Основний метод для оновлення всіх елементів при зміні фундаменту
    def update_all_elements(new_foundation_params = nil)
      model = Sketchup.active_model
      model.start_operation('Update All Elements', true)
      
      begin
        # Знаходимо всі існуючі елементи
        elements = find_existing_elements
        
        # Якщо передано нові параметри фундаменту, оновлюємо його
        if new_foundation_params
          update_foundation(new_foundation_params)
        else
          # Використовуємо збережені параметри
          foundation_params = get_foundation_params
          update_foundation(foundation_params)
        end
        
        # Отримуємо оновлені межі фундаменту
        foundation = find_foundation
        return false unless foundation
        
        foundation_bounds = foundation.bounds
        
        # Оновлюємо всі залежні елементи з їх збереженими параметрами
        update_blind_area(foundation_bounds) if elements[:blind_area]
        update_tiles(foundation_bounds) if elements[:tiles]
        update_cladding(foundation_bounds) if elements[:cladding]
        update_stand(foundation_bounds) if elements[:stand]
        update_stele(foundation_bounds) if elements[:stele]
        update_flowerbed(foundation_bounds) if elements[:flowerbed]
        
        model.commit_operation
        Logger.success("Всі елементи оновлено успішно", "CoordinationManager")
        true
        
      rescue => e
        model.abort_operation
        ErrorHandler.handle_error(e, "CoordinationManager", "update_all_elements")
        false
      end
    end
    
    # Оновлення тільки відмостки
    def update_blind_area_only
      foundation = find_foundation
      return false unless foundation
      
      update_blind_area(foundation.bounds)
    end
    
    # Оновлення тільки плитки
    def update_tiles_only
      foundation = find_foundation
      return false unless foundation
      
      update_tiles(foundation.bounds)
    end
    
    # Оновлення тільки облицювання
    def update_cladding_only
      foundation = find_foundation
      return false unless foundation
      
      update_cladding(foundation.bounds)
    end
    
    private
    
    # Пошук всіх існуючих елементів
    def find_existing_elements
      model = Sketchup.active_model
      entities = model.entities
      
      {
        foundation: entities.grep(Sketchup::ComponentInstance).find { |c| c.definition.name == "Foundation" },
        blind_area: entities.grep(Sketchup::ComponentInstance).find { |c| c.definition.name.start_with?("BlindArea") },
        tiles: entities.grep(Sketchup::ComponentInstance).find { |c| c.definition.name.start_with?("Perimeter_Tile_") || c.definition.name.start_with?("Modular_Tile") },
        cladding: entities.grep(Sketchup::ComponentInstance).find { |c| c.definition.name.start_with?("Cladding") },
        stand: entities.grep(Sketchup::ComponentInstance).find { |c| c.definition.name.downcase.include?('stand') },
        stele: entities.grep(Sketchup::ComponentInstance).find { |c| c.definition.name.downcase.include?('stele') },
        flowerbed: entities.grep(Sketchup::ComponentInstance).find { |c| c.definition.name.downcase.include?('flowerbed') }
      }
    end
    
    # Пошук фундаменту
    def find_foundation
      model = Sketchup.active_model
      model.entities.grep(Sketchup::ComponentInstance).find { |c| c.definition.name == "Foundation" }
    end
    
    # Оновлення фундаменту з новими параметрами
    def update_foundation(params)
      # Видаляємо старий фундамент
      old_foundation = find_foundation
      old_foundation.erase! if old_foundation
      
      # Створюємо новий фундамент
      ProGran3::FoundationBuilder.create(
        params[:depth] || 2000,
        params[:width] || 1000,
        params[:height] || 150
      )
    end
    
    # Отримання параметрів фундаменту з UI
    def get_foundation_params
      ProGran3::UI.get_foundation_params
    end
    
    # Оновлення відмостки
    def update_blind_area(foundation_bounds)
      # Отримуємо поточні параметри відмостки з UI або збережених даних
      blind_area_params = get_blind_area_params
      
      # Видаляємо стару відмостку
      model = Sketchup.active_model
      entities = model.entities
      old_blind_area = entities.grep(Sketchup::ComponentInstance).find { |c| c.definition.name.start_with?("BlindArea") }
      old_blind_area.erase! if old_blind_area
      
      # Створюємо нову відмостку
      if blind_area_params[:mode] == 'uniform'
        ProGran3::BlindAreaBuilder.create_uniform(
          blind_area_params[:uniform_width] || 300,
          blind_area_params[:thickness] || 50
        )
      else
        ProGran3::BlindAreaBuilder.create(
          blind_area_params[:north_width] || 300,
          blind_area_params[:south_width] || 300,
          blind_area_params[:east_width] || 300,
          blind_area_params[:west_width] || 300,
          blind_area_params[:thickness] || 50
        )
      end
    end
    
    # Оновлення плитки
    def update_tiles(foundation_bounds)
      # Отримуємо поточні параметри плитки
      tiles_params = get_tiles_params
      
      # Видаляємо стару плитку
      model = Sketchup.active_model
      entities = model.entities
      old_tiles = entities.grep(Sketchup::ComponentInstance).select { |c| c.definition.name.start_with?("Perimeter_Tile_") || c.definition.name.start_with?("Modular_Tile") }
      old_tiles.each(&:erase!)
      
      # Створюємо нову плитку
      if tiles_params[:mode] == 'frame'
        ProGran3::TilingBuilder.insert_perimeter_tiles(
          tiles_params[:thickness] || 30,
          tiles_params[:border_width] || 300,
          tiles_params[:overhang] || 50
        )
      else
        ProGran3::TilingBuilder.insert_modular_tiles(
          tiles_params[:size] || '60x30',
          tiles_params[:thickness] || 30,
          tiles_params[:seam] || 5,
          tiles_params[:overhang] || 50
        )
      end
    end
    
    # Оновлення облицювання
    def update_cladding(foundation_bounds)
      # Отримуємо поточні параметри облицювання
      cladding_params = get_cladding_params
      
      # Видаляємо старе облицювання
      model = Sketchup.active_model
      entities = model.entities
      old_cladding = entities.grep(Sketchup::ComponentInstance).find { |c| c.definition.name.start_with?("Cladding") }
      old_cladding.erase! if old_cladding
      
      # Створюємо нове облицювання
      ProGran3::CladdingBuilder.create(cladding_params[:thickness] || 20)
    end
    
    # Отримання параметрів відмостки з UI
    def get_blind_area_params
      ProGran3::UI.get_blind_area_params
    end
    
    # Отримання параметрів плитки з UI
    def get_tiles_params
      ProGran3::UI.get_tiles_params
    end
    
    # Отримання параметрів облицювання з UI
    def get_cladding_params
      ProGran3::UI.get_cladding_params
    end
    
    # Оновлення підставки
    def update_stand(foundation_bounds)
      # Отримуємо поточні параметри підставки
      stand_params = get_stand_params
      return unless stand_params[:filename]
      
      # Видаляємо стару підставку
      model = Sketchup.active_model
      entities = model.entities
      old_stand = entities.grep(Sketchup::ComponentInstance).find { |c| c.definition.name.downcase.include?('stand') }
      old_stand.erase! if old_stand
      
      # Створюємо нову підставку
      ProGran3.insert_component(stand_params[:category], stand_params[:filename])
    end
    
    # Оновлення стели
    def update_stele(foundation_bounds)
      # Отримуємо поточні параметри стели
      stele_params = get_stele_params
      return unless stele_params[:filename]
      
      # Видаляємо стару стелу
      model = Sketchup.active_model
      entities = model.entities
      old_stele = entities.grep(Sketchup::ComponentInstance).find { |c| c.definition.name.downcase.include?('stele') }
      old_stele.erase! if old_stele
      
      # Створюємо нову стелу
      ProGran3.insert_component(stele_params[:category], stele_params[:filename])
    end
    
    # Оновлення квітника
    def update_flowerbed(foundation_bounds)
      # Отримуємо поточні параметри квітника
      flowerbed_params = get_flowerbed_params
      return unless flowerbed_params[:filename]
      
      # Видаляємо старий квітник
      model = Sketchup.active_model
      entities = model.entities
      old_flowerbed = entities.grep(Sketchup::ComponentInstance).find { |c| c.definition.name.downcase.include?('flowerbed') }
      old_flowerbed.erase! if old_flowerbed
      
      # Створюємо новий квітник
      ProGran3.insert_component(flowerbed_params[:category], flowerbed_params[:filename])
    end
    
    # Отримання параметрів підставки з UI
    def get_stand_params
      ProGran3::UI.get_stand_params
    end
    
    # Отримання параметрів стели з UI
    def get_stele_params
      ProGran3::UI.get_stele_params
    end
    
    # Отримання параметрів квітника з UI
    def get_flowerbed_params
      ProGran3::UI.get_flowerbed_params
    end
  end
end
