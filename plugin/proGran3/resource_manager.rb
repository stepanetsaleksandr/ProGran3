# plugin/proGran3/resource_manager.rb
# Resource Management - timeout wrapper та cleanup

require 'timeout'
require_relative 'logger'

module ProGran3
  module ResourceManager
    extend self
    
    # Timeout wrapper для операцій
    # @param timeout_seconds [Integer] Максимальний час виконання
    # @param operation_name [String] Назва операції для логування
    # @param block [Proc] Блок коду для виконання
    # @return [Object] Результат виконання блоку
    def with_timeout(timeout_seconds, operation_name = "Operation", &block)
      start_time = Time.now
      
      begin
        Timeout::timeout(timeout_seconds) do
          yield
        end
      rescue Timeout::Error
        duration = Time.now - start_time
        error_msg = "Operation '#{operation_name}' timed out after #{timeout_seconds} seconds (actual: #{duration.round(2)}s)"
        
        Logger.error(error_msg, "ResourceManager")
        raise Timeout::Error, error_msg
      rescue => e
        duration = Time.now - start_time
        Logger.error("Operation '#{operation_name}' failed after #{duration.round(2)}s: #{e.message}", "ResourceManager")
        raise e
      end
    end
    
    # Memory usage monitoring
    # @return [Hash] Статистика використання пам'яті
    def get_memory_usage
      begin
        # Ruby memory usage (approximate)
        ruby_memory = `ps -o rss= -p #{Process.pid}`.to_i rescue 0
        
        # SketchUp model statistics
        model = defined?(Sketchup) ? Sketchup.active_model : nil
        if model
          entities_count = model.entities.length
          components_count = model.definitions.length
          layers_count = model.layers.length
          materials_count = model.materials.length
        else
          entities_count = components_count = layers_count = materials_count = 0
        end
        
        {
          ruby_memory_kb: ruby_memory,
          entities_count: entities_count,
          components_count: components_count,
          layers_count: layers_count,
          materials_count: materials_count,
          timestamp: Time.now.to_s
        }
      rescue => e
        Logger.warn("Failed to get memory usage: #{e.message}", "ResourceManager")
        {
          error: e.message,
          timestamp: Time.now.to_s
        }
      end
    end
    
    # Cleanup resources
    # @param force [Boolean] Примусове очищення
    def cleanup_resources(force = false)
      Logger.info("Starting resource cleanup", "ResourceManager")
      
      begin
        # Cleanup global variables
        cleanup_global_variables if force
        
        # Cleanup temporary files
        cleanup_temp_files
        
        # Force garbage collection
        GC.start if force
        
        Logger.info("Resource cleanup completed", "ResourceManager")
      rescue => e
        Logger.error("Resource cleanup failed: #{e.message}", "ResourceManager")
      end
    end
    
    # Performance monitoring wrapper
    # @param operation_name [String] Назва операції
    # @param block [Proc] Блок коду
    # @return [Object] Результат виконання
    def monitor_performance(operation_name, &block)
      start_time = Time.now
      start_memory = get_memory_usage
      
      begin
        result = yield
        
        duration = Time.now - start_time
        end_memory = get_memory_usage
        
        Logger.info("Performance: #{operation_name} took #{duration.round(3)}s", "ResourceManager")
        
        # Log memory change if significant
        if end_memory[:ruby_memory_kb] && start_memory[:ruby_memory_kb] && 
           end_memory[:ruby_memory_kb].is_a?(Numeric) && start_memory[:ruby_memory_kb].is_a?(Numeric)
          memory_diff = end_memory[:ruby_memory_kb] - start_memory[:ruby_memory_kb]
          if memory_diff.abs > 1000 # > 1MB change
            Logger.info("Memory change: #{memory_diff > 0 ? '+' : ''}#{memory_diff}KB", "ResourceManager")
          end
        end
        
        result
      rescue => e
        duration = Time.now - start_time
        Logger.error("Performance: #{operation_name} failed after #{duration.round(3)}s: #{e.message}", "ResourceManager")
        raise e
      end
    end
    
    # Safe file operations with timeout
    # @param file_path [String] Шлях до файлу
    # @param operation [Symbol] :read, :write, :delete
    # @param timeout_seconds [Integer] Timeout
    # @param data [String] Дані для запису (якщо operation = :write)
    # @return [Object] Результат операції
    def safe_file_operation(file_path, operation, timeout_seconds = 10, data = nil)
      with_timeout(timeout_seconds, "File #{operation}") do
        case operation
        when :read
          File.read(file_path)
        when :write
          File.write(file_path, data)
        when :delete
          File.delete(file_path) if File.exist?(file_path)
        else
          raise ArgumentError, "Unknown operation: #{operation}"
        end
      end
    end
    
    # Resource limits checking
    # @return [Hash] Статус ресурсів
    def check_resource_limits
      limits = {
        max_entities: 10000,
        max_components: 1000,
        max_memory_mb: 500
      }
      
      current = get_memory_usage
      status = {
        entities_ok: (current[:entities_count] || 0) <= limits[:max_entities],
        components_ok: (current[:components_count] || 0) <= limits[:max_components],
        memory_ok: (current[:ruby_memory_kb] || 0) <= (limits[:max_memory_mb] * 1024)
      }
      
      # Log warnings for approaching limits
      if !status[:entities_ok]
        Logger.warn("Entities count (#{current[:entities_count]}) approaching limit (#{limits[:max_entities]})", "ResourceManager")
      end
      
      if !status[:components_ok]
        Logger.warn("Components count (#{current[:components_count]}) approaching limit (#{limits[:max_components]})", "ResourceManager")
      end
      
      if !status[:memory_ok]
        Logger.warn("Memory usage (#{current[:ruby_memory_kb]}KB) approaching limit (#{limits[:max_memory_mb]}MB)", "ResourceManager")
      end
      
      status
    end
    
    private
    
    # Cleanup global variables
    def cleanup_global_variables
      # Cleanup plugin globals
      $progran3_tracker = nil if defined?($progran3_tracker)
      $progran3_license_manager = nil if defined?($progran3_license_manager)
      
      # Cleanup web globals if accessible
      if defined?(ProGran3::Core::StateManager) && ProGran3::Core::StateManager.respond_to?(:cleanup)
        ProGran3::Core::StateManager.cleanup
      end
    end
    
    # Cleanup temporary files
    def cleanup_temp_files
      temp_dir = File.join(ENV['TEMP'] || '/tmp', 'progran3')
      
      if Dir.exist?(temp_dir)
        Dir.glob(File.join(temp_dir, '*')).each do |file|
          begin
            # Delete files older than 1 hour
            if File.mtime(file) < (Time.now - 3600)
              File.delete(file)
              Logger.debug("Deleted temp file: #{file}", "ResourceManager")
            end
          rescue => e
            Logger.warn("Failed to delete temp file #{file}: #{e.message}", "ResourceManager")
          end
        end
      end
    end
  end
end

# === ТЕСТУВАННЯ ===
if __FILE__ == $0
  puts "🧪 Тестування ResourceManager..."
  
  # Тест 1: Timeout wrapper
  puts "\n📝 Тест 1: Timeout wrapper..."
  begin
    ProGran3::ResourceManager.with_timeout(1, "Test Operation") do
      sleep(2) # Should timeout
    end
  rescue Timeout::Error => e
    puts "   ✅ Timeout працює: #{e.message}"
  end
  
  # Тест 2: Memory usage
  puts "\n📝 Тест 2: Memory usage..."
  usage = ProGran3::ResourceManager.get_memory_usage
  puts "   Ruby memory: #{usage[:ruby_memory_kb]}KB"
  puts "   Entities: #{usage[:entities_count]}"
  
  # Тест 3: Performance monitoring
  puts "\n📝 Тест 3: Performance monitoring..."
  ProGran3::ResourceManager.monitor_performance("Test Performance") do
    sleep(0.1)
    "Test result"
  end
  
  puts "\n✅ ResourceManager тестування завершено"
end
