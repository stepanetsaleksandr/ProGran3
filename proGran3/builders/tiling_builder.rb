# progran/builders/tiling_builder.rb
# Модуль, що відповідає за всі типи плитки на фундаменті.

module ProGran3
  module TilingBuilder
    extend self

    def insert_perimeter_tiles(thickness, border_width, overhang)
      model = Sketchup.active_model
      entities = model.active_entities
      defs = model.definitions
      model.start_operation('Create Perimeter Tiles', true)
      foundation = model.entities.grep(Sketchup::ComponentInstance).find { |c| c.definition.name == "Foundation" }
      return unless foundation
      entities.grep(Sketchup::ComponentInstance).select { |inst| inst.definition.name.start_with?("Perimeter_Tile_") || inst.definition.name.start_with?("Modular_Tile")}.each(&:erase!)
      defs.purge_unused
      bounds = foundation.bounds
      z = bounds.max.z
      min_x, max_x = bounds.min.x, bounds.max.x
      min_y, max_y = bounds.min.y, bounds.max.y
      bw = border_width.mm
      oh = overhang.mm
      outer_min_x, outer_max_x = min_x - oh, max_x + oh
      outer_min_y, outer_max_y = min_y - oh, max_y + oh
      inner_min_x, inner_max_x = outer_min_x + bw, outer_max_x - bw
      inner_min_y, inner_max_y = outer_min_y + bw, outer_max_y - bw
      n_points = [Geom::Point3d.new(outer_min_x, outer_min_y, z), Geom::Point3d.new(inner_min_x, outer_min_y, z), Geom::Point3d.new(inner_min_x, outer_max_y, z), Geom::Point3d.new(outer_min_x, outer_max_y, z)]
      s_points = [Geom::Point3d.new(inner_max_x, outer_min_y, z), Geom::Point3d.new(outer_max_x, outer_min_y, z), Geom::Point3d.new(outer_max_x, outer_max_y, z), Geom::Point3d.new(inner_max_x, outer_max_y, z)]
      w_points = [Geom::Point3d.new(inner_min_x, outer_min_y, z), Geom::Point3d.new(inner_max_x, outer_min_y, z), Geom::Point3d.new(inner_max_x, inner_min_y, z), Geom::Point3d.new(inner_min_x, inner_min_y, z)]
      e_points = [Geom::Point3d.new(inner_min_x, inner_max_y, z), Geom::Point3d.new(inner_max_x, inner_max_y, z), Geom::Point3d.new(inner_max_x, outer_max_y, z), Geom::Point3d.new(inner_min_x, outer_max_y, z)]
      tile_thickness = thickness.mm
      south_def = create_tile_component("Perimeter_Tile_South", s_points, tile_thickness)
      north_def = create_tile_component("Perimeter_Tile_North", n_points, tile_thickness)
      west_def = create_tile_component("Perimeter_Tile_West", w_points, tile_thickness)
      east_def = create_tile_component("Perimeter_Tile_East", e_points, tile_thickness)
      entities.add_instance(south_def, Geom::Transformation.new)
      entities.add_instance(north_def, Geom::Transformation.new)
      entities.add_instance(west_def, Geom::Transformation.new)
      entities.add_instance(east_def, Geom::Transformation.new)
      model.commit_operation
    end

    # --- ВІДНОВЛЕНА ЛОГІКА ЗАМОЩЕННЯ З ВЕРСІЇ 1.1 ---
    def insert_modular_tiles(tile_size_str, thickness, seam, overhang)
      model = Sketchup.active_model
      entities = model.active_entities
      
      model.start_operation('Create Modular Tiling', true)

      foundation = model.entities.grep(Sketchup::ComponentInstance).find { |c| c.definition.name == "Foundation" }
      unless foundation
        UI.messagebox("Спочатку потрібно додати фундамент.")
        model.abort_operation
        return
      end

      entities.grep(Sketchup::ComponentInstance).select do |inst|
        inst.definition.name.start_with?("Perimeter_Tile_") || inst.definition.name.start_with?("Modular_Tile")
      end.each(&:erase!)
      model.definitions.purge_unused

      bounds = foundation.bounds
      tile_dims = tile_size_str.split('x').map { |s| s.to_f * 10 }
      tile_depth = tile_dims[0].mm
      tile_width = tile_dims[1].mm
      tile_thickness = thickness.mm
      seam_width = seam.mm
      
      area_min_x = bounds.min.x - overhang.mm
      area_max_x = bounds.max.x + overhang.mm
      area_min_y = bounds.min.y - overhang.mm
      area_max_y = bounds.max.y + overhang.mm
      
      area_depth = area_max_x - area_min_x
      area_width = area_max_y - area_min_y
      z = bounds.max.z

      step_y = tile_width + seam_width
      count_y_half = 0
      if area_width > 0 && step_y > 0
        loop do
          test_width = 2 * ((count_y_half + 1) * tile_width) + (2 * (count_y_half + 1) -1) * seam_width
          break if test_width > area_width
          count_y_half += 1
        end
      end
      
      width_of_sides = 2 * (count_y_half * tile_width + (count_y_half > 0 ? count_y_half - 1 : 0) * seam_width)
      center_gap = area_width - width_of_sides
      center_tile_width = center_gap - (count_y_half > 0 ? 2 * seam_width : 0)
      center_tile_width = 0 if center_tile_width < 1.mm

      step_x = tile_depth + seam_width
      count_x_full = area_depth > 0 && step_x > 0 ? ((area_depth + seam_width) / step_x).floor : 0
      remainder_x = area_depth > 0 && step_x > 0 ? (area_depth + seam_width) % step_x : 0
      partial_tile_depth = remainder_x > 0 ? remainder_x - seam_width : 0
      partial_tile_depth = 0 if partial_tile_depth < 1.mm

      std_def = create_modular_component(model, "Modular_Tile_#{tile_size_str}", tile_depth, tile_width, tile_thickness)
      
      center_y_def, partial_center_y_def = nil, nil
      if center_tile_width > 0
        center_y_def = create_modular_component(model, "Modular_Tile_CenterY_Full", tile_depth, center_tile_width, tile_thickness)
        if partial_tile_depth > 0
          partial_center_y_def = create_modular_component(model, "Modular_Tile_CenterY_Partial", partial_tile_depth, center_tile_width, tile_thickness)
        end
      end
      
      partial_x_def = nil
      if partial_tile_depth > 0
        partial_x_def = create_modular_component(model, "Modular_Tile_PartialX", partial_tile_depth, tile_width, tile_thickness)
      end
      
      lay_x_row = lambda do |y_pos, std_tile, partial_tile|
        (0...count_x_full).each do |i|
          x = area_max_x - std_tile.bounds.width - i * step_x
          entities.add_instance(std_tile, Geom::Transformation.new([x, y_pos, z]))
        end
        if partial_tile
          x = area_min_x
          entities.add_instance(partial_tile, Geom::Transformation.new([x, y_pos, z]))
        end
      end

      (0...count_y_half).each do |j|
        y = area_min_y + j * step_y
        lay_x_row.call(y, std_def, partial_x_def)
      end

      (0...count_y_half).each do |j|
        y = area_max_y - tile_width - j * step_y
        lay_x_row.call(y, std_def, partial_x_def)
      end
      
      if center_y_def
        y = area_min_y + count_y_half * step_y
        lay_x_row.call(y, center_y_def, partial_center_y_def)
      end

      model.commit_operation
    end

    private

    def create_modular_component(model, name, depth, width, thickness)
      comp_def = model.definitions[name]
      unless comp_def
        comp_def = model.definitions.add(name)
        face = comp_def.entities.add_face([0,0,0], [depth,0,0], [depth,width,0], [0,width,0])
        face.reverse! if face.normal.z < 0
        face.pushpull(thickness)
      end
      return comp_def
    end

    def create_tile_component(name, points, thickness)
      model = Sketchup.active_model
      defs = model.definitions
      if (old_def = defs[name]) && old_def.instances.empty?
        defs.purge(old_def)
      end
      comp_def = defs.add(name)
      face = comp_def.entities.add_face(points)
      face.reverse! if face.normal.z < 0
      face.pushpull(thickness)
      return comp_def
    end
  end
end
