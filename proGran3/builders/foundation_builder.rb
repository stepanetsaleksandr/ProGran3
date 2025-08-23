# progran3/builders/foundation_builder.rb
module ProGran3
  module FoundationBuilder
    extend self
    def create(depth, width, height)
      model = Sketchup.active_model
      entities = model.active_entities
      model.active_entities.grep(Sketchup::Group).select { |g| g.name == "Foundation" }.each(&:erase!)
      foundation_group = entities.add_group
      points = [
        Geom::Point3d.new(0, 0, 0),
        Geom::Point3d.new(depth.mm, 0, 0),
        Geom::Point3d.new(depth.mm, width.mm, 0),
        Geom::Point3d.new(0, width.mm, 0)
      ]
      face = foundation_group.entities.add_face(points)
      face.reverse! if face.normal.z < 0
      face.pushpull(height.mm)
      foundation_group.name = "Foundation"
    end
  end
end