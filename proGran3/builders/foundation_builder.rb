# progran3/builders/foundation_builder.rb
require_relative '../validation'

module ProGran3
  module FoundationBuilder
    extend self
    def create(depth, width, height)
      # Валідація вхідних параметрів
      validation_result = Validation.validate_dimensions(depth, width, height, "FoundationBuilder")
      unless validation_result.valid
        ErrorHandler.handle_error(
          Validation::ValidationError.new("Помилка валідації фундаменту: #{validation_result.error_messages.join(', ')}"),
          "FoundationBuilder",
          "create"
        )
        return false
      end
      model = Sketchup.active_model
      entities = model.active_entities
      defs = model.definitions
      
      # Видаляємо старі компоненти фундаменту
      model.active_entities.grep(Sketchup::ComponentInstance).select { |c| c.definition.name == "Foundation" }.each(&:erase!)
      
      # Очищаємо невикористані визначення
      defs.purge_unused
      
      # Створюємо новий компонент фундаменту
      comp_def = defs.add("Foundation")
      
      # Створюємо геометрію фундаменту
      points = [
        Geom::Point3d.new(0, 0, 0),
        Geom::Point3d.new(depth.mm, 0, 0),
        Geom::Point3d.new(depth.mm, width.mm, 0),
        Geom::Point3d.new(0, width.mm, 0)
      ]
      
      face = comp_def.entities.add_face(points)
      face.reverse! if face.normal.z < 0
      face.pushpull(height.mm)
      
      # Додаємо екземпляр компонента до моделі
      entities.add_instance(comp_def, Geom::Transformation.new)
    end
  end
end