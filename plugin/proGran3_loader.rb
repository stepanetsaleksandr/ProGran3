# proGran3_loader.rb
# Extension loader для SketchUp Extension Manager

require 'sketchup.rb'
require 'extensions.rb'

module ProGran3Extension
  
  # Інформація про extension
  EXTENSION_NAME = "ProGran3 Конструктор"
  EXTENSION_VERSION = "3.2.1"
  EXTENSION_CREATOR = "ProVis3D"
  EXTENSION_DESCRIPTION = "Професійний конструктор для створення пам'ятників, стел, огорож та благоустрою"
  EXTENSION_COPYRIGHT = "2025 © ProVis3D. Всі права захищені."
  
  # Створюємо extension
  # Шлях до головного файлу (в архіві буде proGran3_core.rb поруч з loader)
  loader = File.join(File.dirname(__FILE__), 'proGran3_core.rb')
  extension = SketchupExtension.new(EXTENSION_NAME, loader)
  
  # Налаштування extension
  extension.version = EXTENSION_VERSION
  extension.creator = EXTENSION_CREATOR
  extension.description = EXTENSION_DESCRIPTION
  extension.copyright = EXTENSION_COPYRIGHT
  
  # Реєструємо extension
  Sketchup.register_extension(extension, true)
  
end

