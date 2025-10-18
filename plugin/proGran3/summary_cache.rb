# progran3/summary_cache.rb
# Система кешування для підсумку проекту

require 'digest/sha2'

module ProGran3
  module SummaryCache
    extend self
    
    @cache = {}
    @model_hash = nil
    
    # Генерує hash моделі на основі компонентів
    def get_model_hash
      model = Sketchup.active_model
      components = model.active_entities.grep(Sketchup::ComponentInstance)
      
      # Створюємо унікальний hash на основі компонентів та їх розмірів
      hash_data = components.map do |c|
        b = c.bounds
        "#{c.definition.name}_#{b.width.to_mm.round(0)}_#{b.height.to_mm.round(0)}_#{b.depth.to_mm.round(0)}"
      end.sort.join('|')
      
      # Якщо немає компонентів
      return "empty" if hash_data.empty?
      
      # SHA256 hash
      Digest::SHA256.hexdigest(hash_data)[0..16]
    end
    
    # Отримує кешований підсумок
    def get_cached_summary
      current_hash = get_model_hash
      
      if @model_hash == current_hash && @cache[:summary]
        ProGran3::Logger.info("✅ Використовую кешований підсумок (hash: #{current_hash})", "Cache")
        return @cache[:summary]
      end
      
      ProGran3::Logger.info("🔄 Кеш застарів або відсутній (hash: #{current_hash})", "Cache")
      nil
    end
    
    # Зберігає підсумок в кеш
    def cache_summary(summary)
      @model_hash = get_model_hash
      @cache[:summary] = summary
      @cache[:cached_at] = Time.now
      
      ProGran3::Logger.info("💾 Підсумок закешовано (hash: #{@model_hash})", "Cache")
    end
    
    # Очищує кеш
    def clear_cache
      @cache = {}
      @model_hash = nil
      ProGran3::Logger.info("🗑️ Кеш очищено", "Cache")
    end
    
    # Інформація про кеш
    def cache_info
      {
        has_cache: !@cache.empty?,
        model_hash: @model_hash,
        cached_at: @cache[:cached_at],
        age_seconds: @cache[:cached_at] ? (Time.now - @cache[:cached_at]).to_i : nil
      }
    end
  end
end

