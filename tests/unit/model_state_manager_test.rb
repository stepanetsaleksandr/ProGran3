# tests/unit/model_state_manager_test.rb
# Unit тести для ModelStateManager

require 'test/unit'
require_relative '../../proGran3/model_state_manager'

class ModelStateManagerTest < Test::Unit::TestCase
  def setup
    # Очищення стану перед кожним тестом
    ModelStateManager.clear_change_history
    
    # Скидаємо стан всіх компонентів
    ModelStateManager.model_state.each do |category, state|
      state[:exists] = false
      state[:filename] = nil
      state[:params] = {}
      state[:position] = {}
      state[:bounds] = {}
    end
  end
  
  def test_can_add_foundation
    # Foundation можна додати завжди (не має залежностей)
    assert ModelStateManager.can_add_component?(:foundation)
  end
  
  def test_cannot_add_stands_without_foundation
    # Stands потребує foundation
    assert !ModelStateManager.can_add_component?(:stands)
    
    # Додаємо foundation
    ModelStateManager.component_added(:foundation, { depth: 100, width: 200, height: 50 })
    
    # Тепер можна додати stands
    assert ModelStateManager.can_add_component?(:stands)
  end
  
  def test_cannot_add_lamps_without_gravestones
    # Lamps потребує gravestones
    assert !ModelStateManager.can_add_component?(:lamps)
    
    # Додаємо foundation і stands
    ModelStateManager.component_added(:foundation, { depth: 100, width: 200, height: 50 })
    ModelStateManager.component_added(:stands, { filename: 'stand_50x20x15.skp' })
    
    # Додаємо gravestones
    ModelStateManager.component_added(:gravestones, { filename: 'plate_50x30x3.skp' })
    
    # Тепер можна додати lamps
    assert ModelStateManager.can_add_component?(:lamps)
  end
  
  def test_component_removal_cascades_to_dependents
    # Створюємо ланцюжок залежностей
    ModelStateManager.component_added(:foundation, { depth: 100, width: 200, height: 50 })
    ModelStateManager.component_added(:stands, { filename: 'stand_50x20x15.skp' })
    ModelStateManager.component_added(:gravestones, { filename: 'plate_50x30x3.skp' })
    ModelStateManager.component_added(:lamps, { filename: 'lamp_small.skp' })
    
    # Видаляємо stands
    ModelStateManager.component_removed(:stands)
    
    # Перевіряємо що залежні компоненти також видалені
    assert !ModelStateManager.model_state[:stands][:exists]
    assert !ModelStateManager.model_state[:gravestones][:exists]
    assert !ModelStateManager.model_state[:lamps][:exists]
    
    # Foundation залишається
    assert ModelStateManager.model_state[:foundation][:exists]
  end
  
  def test_save_and_restore_state
    # Створюємо початковий стан
    ModelStateManager.component_added(:foundation, { depth: 100, width: 200, height: 50 })
    ModelStateManager.component_added(:stands, { filename: 'stand_50x20x15.skp' })
    
    # Зберігаємо стан
    saved_state = ModelStateManager.save_state_before_update
    
    # Змінюємо стан
    ModelStateManager.component_removed(:stands)
    
    # Відновлюємо стан
    ModelStateManager.restore_state_after_update(saved_state)
    
    # Перевіряємо що стан відновлено
    assert ModelStateManager.model_state[:foundation][:exists]
    assert ModelStateManager.model_state[:stands][:exists]
  end
  
  def test_lamp_position_saving
    # Додаємо необхідні компоненти
    ModelStateManager.component_added(:foundation, { depth: 100, width: 200, height: 50 })
    ModelStateManager.component_added(:stands, { filename: 'stand_50x20x15.skp' })
    ModelStateManager.component_added(:gravestones, { filename: 'plate_50x30x3.skp' })
    ModelStateManager.component_added(:lamps, { filename: 'lamp_small.skp' })
    
    # Зберігаємо позицію лампадки
    ModelStateManager.save_lamp_position('center', 10.5, 20.3, 15.7)
    
    # Отримуємо позицію
    position = ModelStateManager.get_lamp_position
    
    # Перевіряємо
    assert_equal 'center', position[:type]
    assert_equal 10.5, position[:x]
    assert_equal 20.3, position[:y]
    assert_equal 15.7, position[:z]
    assert_equal 'gravestones', position[:relative_to]
  end
  
  def test_export_and_import_state
    # Створюємо стан
    ModelStateManager.component_added(:foundation, { depth: 100, width: 200, height: 50 })
    ModelStateManager.component_added(:stands, { filename: 'stand_50x20x15.skp' })
    
    # Експортуємо
    exported_state = ModelStateManager.export_state
    
    # Очищуємо стан
    ModelStateManager.component_removed(:foundation)
    
    # Імпортуємо
    ModelStateManager.import_state(exported_state)
    
    # Діагностика
    puts "Після імпорту:"
    puts "  foundation exists: #{ModelStateManager.model_state[:foundation][:exists]}"
    puts "  stands exists: #{ModelStateManager.model_state[:stands][:exists]}"
    puts "  exported foundation exists: #{exported_state[:model_state][:foundation][:exists]}"
    puts "  exported stands exists: #{exported_state[:model_state][:stands][:exists]}"
    
    # Перевіряємо
    assert ModelStateManager.model_state[:foundation][:exists]
    assert ModelStateManager.model_state[:stands][:exists]
  end
  
  def test_statistics
    # Створюємо компоненти
    ModelStateManager.component_added(:foundation, { depth: 100, width: 200, height: 50 })
    ModelStateManager.component_added(:stands, { filename: 'stand_50x20x15.skp' })
    
    # Отримуємо статистику
    stats = ModelStateManager.get_statistics
    
    # Перевіряємо
    assert_equal 10, stats[:total_components] # foundation, stands, steles, first_stele, second_stele, stele_block, flowerbeds, gravestones, lamps
    assert_equal 2, stats[:existing_components].count
    assert stats[:change_history_count] > 0
    assert_equal 10, stats[:dependencies_count]
  end
  
  def test_validation_rules
    # Перевіряємо що foundation обов'язковий
    foundation_rule = ModelStateManager.validation_rules[:foundation]
    assert foundation_rule[:required]
    assert_equal 1, foundation_rule[:max_count]
    
    # Перевіряємо що stands не обов'язковий
    stands_rule = ModelStateManager.validation_rules[:stands]
    assert !stands_rule[:required]
    assert_equal 1, stands_rule[:max_count]
    
    # Перевіряємо залежності
    assert_equal [:foundation], ModelStateManager.get_dependencies(:stands)
    assert_equal [:stands], ModelStateManager.get_dependencies(:gravestones)
    assert_equal [:gravestones], ModelStateManager.get_dependencies(:lamps)
  end
end
