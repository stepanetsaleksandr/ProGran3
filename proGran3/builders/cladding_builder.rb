# progran3/builders/cladding_builder.rb
#це модуль який відповідає за створення бокового (вертикального) облицювання фундаменту
require_relative '../validation'
require_relative '../error_handler'

module ProGran3
  module CladdingBuilder
    extend self

    def create(thickness)
      # Валідація вхідних параметрів
      validation_result = Validation.validate_dimensions(100, 100, thickness, "CladdingBuilder")
      unless validation_result.valid
        ErrorHandler.handle_error(
          Validation::ValidationError.new("Помилка валідації облицювання: #{validation_result.error_messages.join(', ')}"),
          "CladdingBuilder",
          "create"
        )
        return false
      end
      model = Sketchup.active_model
      entities = model.active_entities
      model.start_operation('Create Side Cladding', true)
      foundation = model.entities.grep(Sketchup::ComponentInstance).find { |c| c.definition.name == "Foundation" }
      return unless foundation
      entities.grep(Sketchup::ComponentInstance).select { |inst| inst.definition.name.start_with?("Cladding_Tile_") }.each(&:erase!)
      model.definitions.purge_unused
      bounds = foundation.bounds
      min_x, max_x = bounds.min.x, bounds.max.x
      min_y, max_y = bounds.min.y, bounds.max.y
      min_z, max_z = bounds.min.z, bounds.max.z
      cladding_thickness = thickness.mm
      seam_offset = 10.mm
      split_seam = 2.mm
      max_length = 1200.mm
      off_min_x, off_max_x = min_x - seam_offset, max_x + seam_offset
      off_min_y, off_max_y = min_y - seam_offset, max_y + seam_offset
      
      # Задня (North) та Передня (South)
      side_length_y = (off_max_y + cladding_thickness) - (off_min_y - cladding_thickness)
      [-1, 1].each do |side|
        name, x_pos, vector = (side == 1) ? ["South", off_max_x, Geom::Vector3d.new(cladding_thickness, 0, 0)] : ["North", off_min_x, Geom::Vector3d.new(-cladding_thickness, 0, 0)]
        if side_length_y <= max_length
          points = [Geom::Point3d.new(x_pos, off_min_y - cladding_thickness, min_z), Geom::Point3d.new(x_pos, off_max_y + cladding_thickness, min_z), Geom::Point3d.new(x_pos, off_max_y + cladding_thickness, max_z), Geom::Point3d.new(x_pos, off_min_y - cladding_thickness, max_z)]
          comp_def = create_extruded_component("Cladding_Tile_#{name}", points, vector)
          entities.add_instance(comp_def, Geom::Transformation.new)
        else
          panel_length = (side_length_y - split_seam) / 2.0
          points1 = [Geom::Point3d.new(x_pos, off_min_y - cladding_thickness, min_z), Geom::Point3d.new(x_pos, off_min_y - cladding_thickness + panel_length, min_z), Geom::Point3d.new(x_pos, off_min_y - cladding_thickness + panel_length, max_z), Geom::Point3d.new(x_pos, off_min_y - cladding_thickness, max_z)]
          comp_def1 = create_extruded_component("Cladding_Tile_#{name}_1", points1, vector)
          entities.add_instance(comp_def1, Geom::Transformation.new)
          points2 = [Geom::Point3d.new(x_pos, off_max_y + cladding_thickness - panel_length, min_z), Geom::Point3d.new(x_pos, off_max_y + cladding_thickness, min_z), Geom::Point3d.new(x_pos, off_max_y + cladding_thickness, max_z), Geom::Point3d.new(x_pos, off_max_y + cladding_thickness - panel_length, max_z)]
          comp_def2 = create_extruded_component("Cladding_Tile_#{name}_2", points2, vector)
          entities.add_instance(comp_def2, Geom::Transformation.new)
        end
      end
      
      # Ліва (West) та Права (East)
      side_length_x = off_max_x - off_min_x
      [-1, 1].each do |side|
        name, y_pos, vector = (side == 1) ? ["East", off_max_y, Geom::Vector3d.new(0, cladding_thickness, 0)] : ["West", off_min_y, Geom::Vector3d.new(0, -cladding_thickness, 0)]
        if side_length_x <= max_length
          points = [Geom::Point3d.new(off_min_x, y_pos, min_z), Geom::Point3d.new(off_max_x, y_pos, min_z), Geom::Point3d.new(off_max_x, y_pos, max_z), Geom::Point3d.new(off_min_x, y_pos, max_z)]
          comp_def = create_extruded_component("Cladding_Tile_#{name}", points, vector)
          entities.add_instance(comp_def, Geom::Transformation.new)
        else
          panel_length = (side_length_x - split_seam) / 2.0
          points1 = [Geom::Point3d.new(off_min_x, y_pos, min_z), Geom::Point3d.new(off_min_x + panel_length, y_pos, min_z), Geom::Point3d.new(off_min_x + panel_length, y_pos, max_z), Geom::Point3d.new(off_min_x, y_pos, max_z)]
          comp_def1 = create_extruded_component("Cladding_Tile_#{name}_1", points1, vector)
          entities.add_instance(comp_def1, Geom::Transformation.new)
          points2 = [Geom::Point3d.new(off_max_x - panel_length, y_pos, min_z), Geom::Point3d.new(off_max_x, y_pos, min_z), Geom::Point3d.new(off_max_x, y_pos, max_z), Geom::Point3d.new(off_max_x - panel_length, y_pos, max_z)]
          comp_def2 = create_extruded_component("Cladding_Tile_#{name}_2", points2, vector)
          entities.add_instance(comp_def2, Geom::Transformation.new)
        end
      end
      
      model.commit_operation
    end

    private
    
    def create_extruded_component(name, points, vector)
      model = Sketchup.active_model
      defs = model.definitions
      if (old_def = defs[name]) && old_def.instances.empty?
        defs.purge(old_def)
      end
      comp_def = defs.add(name)
      face = comp_def.entities.add_face(points)
      face.reverse! if face.normal.dot(vector) < 0
      face.pushpull(vector.length)
      return comp_def
    end
  end
end