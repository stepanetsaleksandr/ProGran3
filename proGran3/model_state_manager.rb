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
    lamps: [:gravestones]
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
    lamps: { required: false, max_count: 1, depends_on: [:gravestones] }
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
        required_dependencies.each do |dependency|
          unless @model_state[dependency][:exists]
            ProGran3::Logger.warn("Відсутня залежність: #{dependency} для #{category}", "ModelState")
            return false
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
    
    private
    
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
  end
end
