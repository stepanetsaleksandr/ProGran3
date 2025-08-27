# progran3/constants.rb
module ProGran3
  module Constants
    # Шляхи до файлів
    PLUGIN_ROOT = File.dirname(File.dirname(__FILE__))
    ASSETS_PATH = File.join(PLUGIN_ROOT, 'assets')
    ICONS_PATH = File.join(PLUGIN_ROOT, 'proGran3', 'icons')
    WEB_PATH = File.join(PLUGIN_ROOT, 'proGran3', 'web')
    
    # Налаштування превью
    DEFAULT_PREVIEW_SIZE = 256
    MAX_PREVIEW_SIZE = 512
    MIN_PREVIEW_SIZE = 64
    
    # Підтримувані одиниці вимірювання
    SUPPORTED_UNITS = [:mm, :cm]
    DEFAULT_UNIT = :mm
    
    # Налаштування UI
    DEFAULT_DIALOG_WIDTH = 500
    DEFAULT_DIALOG_HEIGHT = 850
    MIN_DIALOG_WIDTH = 400
    MIN_DIALOG_HEIGHT = 600
    
    # Налаштування каруселі
    DEFAULT_CAROUSEL_ITEMS = 10
    MAX_CAROUSEL_ITEMS = 50
    
    # Категорії компонентів
    COMPONENT_CATEGORIES = [
      :stands,
      :steles, 
      :flowerbeds,
      :gravestones,
      :pavement_tiles
    ]
    
    # Налаштування деплою
    SKETCHUP_PLUGINS_PATH = File.join(
      ENV['APPDATA'], 
      'SketchUp', 
      'SketchUp 2024', 
      'SketchUp', 
      'Plugins'
    )
    
    # Версія плагіна
    VERSION = "1.0.0"
    BUILD_DATE = "2024-01-01"
    
    # Налаштування логування
    LOG_LEVELS = [:debug, :info, :warn, :error, :fatal]
    DEFAULT_LOG_LEVEL = :info
    
    # Обмеження для валідації
    MIN_DIMENSION = 1
    MAX_DIMENSION = 10000
    MIN_THICKNESS = 1
    MAX_THICKNESS = 1000
  end
end

