# proGran3/model_state_manager.rb
# Центральний компонент для управління станом моделі

require_relative 'constants'
require_relative 'logger'

class ModelStateManager
  include ProGran3::Constants
  
  # Основний стан моделі
  @model_state = {
    foundation: {
      exists: false,
      params: {},
      position: {},
      bounds: {}
    },
    stands: {
      exists: false,
      filename: nil,
      position: {},
      bounds: {}
    },
    steles: {
      exists: false,
      filename: nil,
      position: {},
      bounds: {}
    },
    first_stele: {
      exists: false,
      filename: nil,
      position: {},
      bounds: {}
    },
    second_stele: {
      exists: false,
      filename: nil,
      position: {},
      bounds: {}
    },
    stele_block: {
      exists: false,
      configuration: {
        type: 'single', # 'single' | 'double'
        first_stele: {
          exists: false,
          filename: nil,
          position: {},
          decorations: {
            portrait: { exists: false, params: {} },
            inscription: { exists: false, params: {} },
            brass_decor: { exists: false, params: {} },
            columns: { exists: false, params: {} }
          }
        },
        second_stele: {
          exists: false,
          filename: nil,
          position: {},
          decorations: {
            portrait: { exists: false, params: {} },
            inscription: { exists: false, params: {} },
            brass_decor: { exists: false, params: {} },
            columns: { exists: false, params: {} }
          }
        },
        between_steles: {
          exists: false,
          type: nil, # 'cross' | 'attached_detail'
          cross: { exists: false, params: {} },
          attached_detail: { exists: false, params: {} }
        },
        roof: {
          exists: false,
          elements: {
            element1: { exists: false, params: {} },
            element2: { exists: false, params: {} },
            element3: { exists: false, params: {} }
          }
        }
      }
    },
    flowerbeds: {
      exists: false,
      filename: nil,
      position: {},
      bounds: {}
    },
    gravestones: {
      exists: false,
      filename: nil,
      position: {},
      bounds: {}
    },
    lamps: {
      exists: false,
      filename: nil,
      position: {
        type: nil, # 'left' | 'center' | 'right'
        x: 0,
        y: 0,
        z: 0,
        relative_to: 'gravestones'
      }
    },
    fence_corner: {
      exists: false,
      filename: nil,
      position: {},
      bounds: {},
      settings: {
        post_height: 25,
        post_width: 15,
        post_depth: 15,
        side_height: 15,
        side_length: 35,
        side_thickness: 5,
        decorative_size: 12
      }
    },
    fence_perimeter: {
      exists: false,
      filename: nil,
      position: {},
      bounds: {},
      settings: {
        post_height: 25,
        post_width: 15,
        post_depth: 15,
        intermediate_count: 1,
        decorative_height: 150,
        decorative_thickness: 50
      }
    },
    fence_decor: {
      exists: false,
      filename: nil,
      position: {},
      bounds: {}
    },
    blind_area: {
      exists: false,
      params: {},
      position: {},
      bounds: {}
    },
    tiles: {
      exists: false,
      params: {},
      position: {},
      bounds: {}
    },
    cladding: {
      exists: false,
      params: {},
      position: {},
      bounds: {}
    },
    pavement_tiles: {
      exists: false,
      filename: nil,
      position: {},
      bounds: {}
    }
  }
  
  # Залежності між компонентами
  @dependencies = {
    stands: [:foundation],
    steles: [:stands],
    stele_block: [:stands],
    first_stele: [:stele_block],
    second_stele: [:stele_block],
    flowerbeds: [:stands],
    gravestones: [:stands],
    lamps: [:gravestones],
    fence_corner: [:foundation],
    fence_perimeter: [:foundation],
    fence_decor: [:fence_corner, :fence_perimeter],
    blind_area: [:foundation],
    tiles: [:foundation],
    cladding: [:foundation],
    pavement_tiles: [:foundation]
  }
  
  # Валідаційні правила
  @validation_rules = {
    foundation: { required: true, max_count: 1 },
    stands: { required: false, max_count: 1 },
    steles: { required: false, max_count: 1 },
    stele_block: { required: true, depends_on: [:stands] },
    first_stele: { required: true, depends_on: [:stele_block] },
    second_stele: { required: false, depends_on: [:stele_block] },
    flowerbeds: { required: false, max_count: 1 },
    gravestones: { required: false, max_count: 1 },
    lamps: { required: false, max_count: 1, depends_on: [:gravestones] },
    fence_corner: { required: false, max_count: 1, depends_on: [:foundation] },
    fence_perimeter: { required: false, max_count: 1, depends_on: [:foundation] },
    fence_decor: { required: false, max_count: 1, depends_on: [:fence_corner, :fence_perimeter] },
    blind_area: { required: false, max_count: 1, depends_on: [:foundation] },
    tiles: { required: false, max_count: 1, depends_on: [:foundation] },
    cladding: { required: false, max_count: 1, depends_on: [:foundation] },
    pavement_tiles: { required: false, max_count: 1, depends_on: [:foundation] }
  }
  
  # Історія змін
  @change_history = []
  
  class << self
    attr_reader :model_state, :dependencies, :validation_rules, :change_history
    
    # Перевірка чи можна додати компонент
    def can_add_component?(category)
      ProGran3::Logger.info("Перевірка можливості додавання компонента: #{category}", "ModelState")
      
      # Перевірка валідаційних правил
      validation_rule = @validation_rules[category]
      return false unless validation_rule
      
      # Перевірка залежностей
      required_dependencies = @dependencies[category]
      if required_dependencies
        # Спеціальна логіка для fence_decor - потрібна хоча б одна з залежностей
        if category == :fence_decor
          has_any_dependency = required_dependencies.any? do |dependency|
            @model_state[dependency][:exists]
          end
          unless has_any_dependency
            ProGran3::Logger.warn("Відсутні залежності для #{category}: потрібна хоча б одна з #{required_dependencies.join(', ')}", "ModelState")
            return false
          end
        else
          # Стандартна логіка - всі залежності обов'язкові
          required_dependencies.each do |dependency|
            unless @model_state[dependency][:exists]
              ProGran3::Logger.warn("Відсутня залежність: #{dependency} для #{category}", "ModelState")
              return false
            end
          end
        end
      end
      
      # Перевірка максимальної кількості (всі компоненти можна оновлювати)
      if validation_rule[:max_count] && validation_rule[:max_count] == 1
        if @model_state[category][:exists]
          ProGran3::Logger.info("Компонент #{category} вже існує - дозволяємо оновлення", "ModelState")
          return true
        end
      end
      
      ProGran3::Logger.info("Можна додати компонент: #{category}", "ModelState")
      true
    end
    
    # Додавання компонента
    def component_added(category, params = {})
      ProGran3::Logger.info("Додавання компонента: #{category}", "ModelState")
      
      # Для foundation та інших компонентів дозволяємо оновлення
      if @model_state[category][:exists]
        ProGran3::Logger.info("Оновлення існуючого компонента: #{category}", "ModelState")
        @model_state[category][:params] = params
        log_change(:component_updated, category, params)
        ProGran3::Logger.info("Компонент оновлено: #{category}", "ModelState")
        return true
      end
      
      unless can_add_component?(category)
        ProGran3::Logger.error("Неможливо додати компонент: #{category}", "ModelState")
        return false
      end
      
      # Оновлення стану
      @model_state[category][:exists] = true
      @model_state[category][:params] = params
      
      # Зберігаємо позицію та bounds компонента
      save_component_position_and_bounds(category)
      
      # Логування зміни
      log_change(:component_added, category, params)
      
      ProGran3::Logger.info("Компонент додано: #{category}", "ModelState")
      true
    end
    
    # Видалення компонента
    def component_removed(category)
      ProGran3::Logger.info("Видалення компонента: #{category}", "ModelState")
      
      # Перевірка залежних компонентів
      dependent_components = find_dependent_components(category)
      if dependent_components.any?
        ProGran3::Logger.warn("Видалення залежних компонентів: #{dependent_components.join(', ')}", "ModelState")
        dependent_components.each { |dep| component_removed(dep) }
      end
      
      # Оновлення стану
      @model_state[category][:exists] = false
      @model_state[category][:filename] = nil
      @model_state[category][:params] = {}
      @model_state[category][:position] = {}
      @model_state[category][:bounds] = {}
      
      # Логування зміни
      log_change(:component_removed, category)
      
      ProGran3::Logger.info("Компонент видалено: #{category}", "ModelState")
      true
    end
    
    # Збереження стану перед оновленням
    def save_state_before_update
      ProGran3::Logger.info("Збереження стану перед оновленням", "ModelState")
      
      saved_state = Marshal.load(Marshal.dump(@model_state))
      log_change(:state_saved, nil, { saved_state: saved_state })
      
      saved_state
    end
    
    # Відновлення стану після оновлення
    def restore_state_after_update(saved_state)
      ProGran3::Logger.info("Відновлення стану після оновлення", "ModelState")
      
      @model_state = Marshal.load(Marshal.dump(saved_state))
      log_change(:state_restored, nil, { restored_state: saved_state })
      
      true
    end
    
    # Експорт стану
    def export_state
      ProGran3::Logger.info("Експорт стану моделі", "ModelState")
      
      {
        model_state: @model_state,
        dependencies: @dependencies,
        validation_rules: @validation_rules,
        change_history: @change_history.last(100) # Останні 100 змін
      }
    end
    
    # Імпорт стану
    def import_state(state_data)
      ProGran3::Logger.info("Імпорт стану моделі", "ModelState")
      
      @model_state = Marshal.load(Marshal.dump(state_data[:model_state])) if state_data[:model_state]
      @dependencies = Marshal.load(Marshal.dump(state_data[:dependencies])) if state_data[:dependencies]
      @validation_rules = Marshal.load(Marshal.dump(state_data[:validation_rules])) if state_data[:validation_rules]
      
      log_change(:state_imported, nil, { imported_data: state_data })
      
      true
    end
    
    # Збереження позиції компонента
    def save_component_position(category, position)
      ProGran3::Logger.info("Збереження позиції компонента: #{category}", "ModelState")
      
      @model_state[category][:position] = position
      log_change(:position_saved, category, { position: position })
      
      true
    end
    
    # Збереження позиції та bounds компонента
    def save_component_position_and_bounds(category)
      ProGran3::Logger.info("Збереження позиції та bounds компонента: #{category}", "ModelState")
      
      # Знаходимо компонент в моделі
      component = find_component_in_model(category)
      if component
        bounds = component.bounds
        position = {
          x: bounds.center.x,
          y: bounds.center.y,
          z: bounds.center.z,
          min: { x: bounds.min.x, y: bounds.min.y, z: bounds.min.z },
          max: { x: bounds.max.x, y: bounds.max.y, z: bounds.max.z }
        }
        
        @model_state[category][:position] = position
        @model_state[category][:bounds] = {
          width: bounds.width,
          height: bounds.height,
          depth: bounds.depth
        }
        
        log_change(:position_and_bounds_saved, category, { position: position, bounds: @model_state[category][:bounds] })
        ProGran3::Logger.info("Позиція та bounds збережено для #{category}: #{position[:x]}, #{position[:y]}, #{position[:z]}", "ModelState")
      else
        ProGran3::Logger.warn("Не знайдено компонент #{category} в моделі для збереження позиції", "ModelState")
      end
      
      true
    end
    
    # Отримання позиції компонента
    def get_component_position(category)
      @model_state[category][:position]
    end
    
    # Збереження позиції лампадки
    def save_lamp_position(position_type, x, y, z, relative_to = 'gravestones')
      ProGran3::Logger.info("Збереження позиції лампадки: #{position_type}", "ModelState")
      
      @model_state[:lamps][:position] = {
        type: position_type,
        x: x,
        y: y,
        z: z,
        relative_to: relative_to
      }
      
      log_change(:lamp_position_saved, :lamps, { position: @model_state[:lamps][:position] })
      
      true
    end
    
    # Отримання позиції лампадки
    def get_lamp_position
      @model_state[:lamps][:position]
    end
    
    # Отримання залежностей компонента
    def get_dependencies(category)
      @dependencies[category] || []
    end
    
    # Пошук залежних компонентів
    def find_dependent_components(category)
      dependent_components = []
      
      @dependencies.each do |comp, deps|
        if deps.include?(category.to_sym)
          dependent_components << comp
        end
      end
      
      dependent_components
    end
    
    # Очищення історії змін
    def clear_change_history
      @change_history.clear
      ProGran3::Logger.info("Історія змін очищена", "ModelState")
    end
    
    # Отримання статистики
    def get_statistics
      {
        total_components: @model_state.keys.count,
        existing_components: @model_state.select { |k, v| v[:exists] }.keys,
        change_history_count: @change_history.count,
        dependencies_count: @dependencies.count
      }
    end
    
    # Збереження параметрів користувача для залежних компонентів
    def save_user_parameters_for_dependents(base_category)
      ProGran3::Logger.info("Збереження параметрів користувача для залежних компонентів: #{base_category}", "ModelState")
      
      user_params = {}
      dependent_components = find_dependent_components(base_category)
      
      dependent_components.each do |component|
        if @model_state[component][:exists]
          user_params[component] = {
            filename: @model_state[component][:filename],
            params: @model_state[component][:params].dup,
            position: @model_state[component][:position].dup,
            bounds: @model_state[component][:bounds].dup
          }
          
          # Спеціальні параметри для різних компонентів
          case component
          when :stands
            user_params[component][:gaps] = get_stands_gaps_setting
          when :steles
            user_params[component][:type] = get_steles_type_setting
            user_params[component][:distance] = get_steles_distance_setting
            user_params[component][:central_detail] = get_central_detail_setting
          when :lamps
            user_params[component][:position_type] = get_lamp_position_type
          end
          
          ProGran3::Logger.info("Збережено параметри для #{component}: #{user_params[component].keys.join(', ')}", "ModelState")
        end
      end
      
      log_change(:user_params_saved, base_category, { saved_components: user_params.keys })
      user_params
    end
    
    # Перебудова залежних компонентів з збереженими параметрами
    def rebuild_dependent_components_with_user_params(base_category, user_params)
      ProGran3::Logger.info("Перебудова залежних компонентів для #{base_category}", "ModelState")
      
      dependent_components = find_dependent_components(base_category)
      
      dependent_components.each do |component|
        if user_params[component]
          ProGran3::Logger.info("Перебудова компонента: #{component}", "ModelState")
          
          # Видаляємо старий компонент
          component_removed(component)
          
          # Перебудовуємо з збереженими параметрами
          rebuild_component_with_params(component, user_params[component])
        end
      end
      
      log_change(:components_rebuilt, base_category, { rebuilt_components: dependent_components })
      true
    end
    
    # Перебудова одного компонента з параметрами
    def rebuild_component_with_params(component, params)
      ProGran3::Logger.info("Перебудова компонента #{component} з параметрами", "ModelState")
      
      # Відновлюємо стан компонента
      @model_state[component][:exists] = true
      @model_state[component][:filename] = params[:filename]
      @model_state[component][:params] = params[:params]
      @model_state[component][:position] = params[:position]
      @model_state[component][:bounds] = params[:bounds]
      
      # Спеціальна логіка для різних компонентів
      case component
      when :stands
        apply_stands_gaps_setting(params[:gaps]) if params[:gaps]
      when :steles
        apply_steles_settings(params) if params[:type]
      when :lamps
        apply_lamp_position_setting(params[:position_type]) if params[:position_type]
      end
      
      log_change(:component_rebuilt, component, { params: params })
      true
    end
    
    private
    
    # Пошук компонента в моделі
    def find_component_in_model(category)
      model = Sketchup.active_model
      entities = model.entities
      
      case category.to_sym
      when :foundation
        entities.grep(Sketchup::ComponentInstance).find { |c| c.definition.name == "Foundation" }
      when :stands
        entities.grep(Sketchup::ComponentInstance).find { |c| c.definition.name == "Stand" }
      when :steles, :first_stele, :second_stele
        entities.grep(Sketchup::ComponentInstance).find { |c| c.definition.name.downcase.include?('stele') }
      when :flowerbeds
        entities.grep(Sketchup::ComponentInstance).find { |c| c.definition.name.downcase.include?('flowerbed') }
      when :gravestones
        entities.grep(Sketchup::ComponentInstance).find { |c| c.definition.name.downcase.include?('gravestone') || c.definition.name.downcase.include?('plate') }
      when :lamps
        entities.grep(Sketchup::ComponentInstance).find { |c| c.definition.name.downcase.include?('lamp') }
      when :fence_corner
        entities.grep(Sketchup::ComponentInstance).find { |c| c.definition.name.include?('CornerFence') }
      when :fence_perimeter
        entities.grep(Sketchup::ComponentInstance).find { |c| c.definition.name.include?('PerimeterFence') }
      when :fence_decor
        entities.grep(Sketchup::ComponentInstance).find { |c| c.definition.name.downcase.include?('fence_decor') }
      when :blind_area
        entities.grep(Sketchup::ComponentInstance).find { |c| c.definition.name.start_with?("BlindArea") }
      when :tiles
        entities.grep(Sketchup::ComponentInstance).find { |c| c.definition.name.start_with?("Perimeter_Tile_") || c.definition.name.start_with?("Modular_Tile") }
      when :cladding
        entities.grep(Sketchup::ComponentInstance).find { |c| c.definition.name.start_with?("Cladding") }
      when :pavement_tiles
        entities.grep(Sketchup::ComponentInstance).find { |c| c.definition.name.downcase.include?('pavement_tile') }
      else
        nil
      end
    end
    
    # Логування змін
    def log_change(action, category, params = {})
      change_record = {
        timestamp: Time.now,
        action: action,
        category: category,
        params: params
      }
      
      @change_history << change_record
      
      # Обмеження розміру історії
      if @change_history.count > 1000
        @change_history = @change_history.last(500)
      end
    end
    
    # Отримання налаштувань підставки (проміжки)
    def get_stands_gaps_setting
      # Отримуємо з UI або збереженого стану
      if defined?(carouselState) && carouselState[:stands]
        carouselState[:stands][:gaps] || false
      else
        false
      end
    end
    
    # Отримання налаштувань стел
    def get_steles_type_setting
      if defined?(carouselState) && carouselState[:steles]
        carouselState[:steles][:type] || 'single'
      else
        'single'
      end
    end
    
    def get_steles_distance_setting
      if defined?(carouselState) && carouselState[:steles]
        carouselState[:steles][:distance] || 200
      else
        200
      end
    end
    
    def get_central_detail_setting
      if defined?(carouselState) && carouselState[:steles]
        carouselState[:steles][:centralDetail] || false
      else
        false
      end
    end
    
    # Отримання типу позиції лампадки
    def get_lamp_position_type
      if defined?(carouselState) && carouselState[:lamps]
        carouselState[:lamps][:position_type] || 'center'
      else
        'center'
      end
    end
    
    # Застосування налаштувань підставки
    def apply_stands_gaps_setting(gaps)
      if defined?(carouselState) && carouselState[:stands]
        carouselState[:stands][:gaps] = gaps
        ProGran3::Logger.info("Застосовано налаштування проміжків підставки: #{gaps}", "ModelState")
      end
    end
    
    # Застосування налаштувань стел
    def apply_steles_settings(params)
      if defined?(carouselState) && carouselState[:steles]
        carouselState[:steles][:type] = params[:type] if params[:type]
        carouselState[:steles][:distance] = params[:distance] if params[:distance]
        carouselState[:steles][:centralDetail] = params[:central_detail] if params[:central_detail]
        ProGran3::Logger.info("Застосовано налаштування стел: #{params.keys.join(', ')}", "ModelState")
      end
    end
    
    # Застосування позиції лампадки
    def apply_lamp_position_setting(position_type)
      if defined?(carouselState) && carouselState[:lamps]
        carouselState[:lamps][:position_type] = position_type
        ProGran3::Logger.info("Застосовано позицію лампадки: #{position_type}", "ModelState")
      end
    end

  end
end
