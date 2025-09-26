#!/usr/bin/env ruby
# test-plugin.rb
# Тестування плагіна ProGran3

require 'net/http'
require 'json'
require 'uri'

class ProGran3Tester
  def initialize
    @server_url = 'https://progran3-tracking-server-odv98n7ek-provis3ds-projects.vercel.app'
    @test_results = []
  end

  def run_all_tests
    puts "🧪 ProGran3 Plugin Testing"
    puts "=" * 50
    
    test_health_check
    test_heartbeat
    test_license_registration
    test_dashboard
    test_error_handling
    
    show_results
  end

  private

  def test_health_check
    puts "\n1. Testing Health Check..."
    begin
      uri = URI("#{@server_url}/api/init")
      response = Net::HTTP.get_response(uri)
      
      if response.code == '200'
        data = JSON.parse(response.body)
        if data['success']
          puts "✅ Health check passed"
          @test_results << { test: 'Health Check', status: 'PASS' }
        else
          puts "❌ Health check failed: #{data['message']}"
          @test_results << { test: 'Health Check', status: 'FAIL', error: data['message'] }
        end
      else
        puts "❌ Health check failed: HTTP #{response.code}"
        @test_results << { test: 'Health Check', status: 'FAIL', error: "HTTP #{response.code}" }
      end
    rescue => e
      puts "❌ Health check error: #{e.message}"
      @test_results << { test: 'Health Check', status: 'ERROR', error: e.message }
    end
  end

  def test_heartbeat
    puts "\n2. Testing Heartbeat..."
    begin
      uri = URI("#{@server_url}/api/heartbeat")
      http = Net::HTTP.new(uri.host, uri.port)
      http.use_ssl = true
      
      data = {
        plugin_id: "test-plugin-#{Time.now.to_i}",
        plugin_name: "ProGran3",
        version: "1.0.0",
        user_id: "test@example.com",
        computer_name: "test-computer",
        system_info: {
          os: "Windows",
          ruby_version: "3.0.0",
          sketchup_version: "2024",
          architecture: "64-bit"
        },
        timestamp: Time.now.iso8601,
        action: "heartbeat_update",
        source: "sketchup_plugin",
        update_existing: true,
        force_update: false
      }
      
      request = Net::HTTP::Post.new(uri)
      request['Content-Type'] = 'application/json'
      request.body = data.to_json
      
      response = http.request(request)
      
      if response.code == '200'
        result = JSON.parse(response.body)
        if result['success']
          puts "✅ Heartbeat test passed"
          @test_results << { test: 'Heartbeat', status: 'PASS' }
        else
          puts "❌ Heartbeat test failed: #{result['message']}"
          @test_results << { test: 'Heartbeat', status: 'FAIL', error: result['message'] }
        end
      else
        puts "❌ Heartbeat test failed: HTTP #{response.code}"
        @test_results << { test: 'Heartbeat', status: 'FAIL', error: "HTTP #{response.code}" }
      end
    rescue => e
      puts "❌ Heartbeat test error: #{e.message}"
      @test_results << { test: 'Heartbeat', status: 'ERROR', error: e.message }
    end
  end

  def test_license_registration
    puts "\n3. Testing License Registration..."
    begin
      uri = URI("#{@server_url}/api/license/register")
      http = Net::HTTP.new(uri.host, uri.port)
      http.use_ssl = true
      
      data = {
        email: "test@example.com",
        license_key: "TEST-LICENSE-KEY-#{Time.now.to_i}",
        hardware_id: "test-hardware-#{Time.now.to_i}"
      }
      
      request = Net::HTTP::Post.new(uri)
      request['Content-Type'] = 'application/json'
      request.body = data.to_json
      
      response = http.request(request)
      
      if response.code == '200'
        result = JSON.parse(response.body)
        if result['success']
          puts "✅ License registration test passed"
          @test_results << { test: 'License Registration', status: 'PASS' }
        else
          puts "❌ License registration test failed: #{result['message']}"
          @test_results << { test: 'License Registration', status: 'FAIL', error: result['message'] }
        end
      else
        puts "❌ License registration test failed: HTTP #{response.code}"
        @test_results << { test: 'License Registration', status: 'FAIL', error: "HTTP #{response.code}" }
      end
    rescue => e
      puts "❌ License registration test error: #{e.message}"
      @test_results << { test: 'License Registration', status: 'ERROR', error: e.message }
    end
  end

  def test_dashboard
    puts "\n4. Testing Dashboard..."
    begin
      uri = URI("#{@server_url}/dashboard")
      response = Net::HTTP.get_response(uri)
      
      if response.code == '200'
        if response.body.include?('ProGran3 Dashboard')
          puts "✅ Dashboard test passed"
          @test_results << { test: 'Dashboard', status: 'PASS' }
        else
          puts "❌ Dashboard test failed: Content not found"
          @test_results << { test: 'Dashboard', status: 'FAIL', error: 'Content not found' }
        end
      else
        puts "❌ Dashboard test failed: HTTP #{response.code}"
        @test_results << { test: 'Dashboard', status: 'FAIL', error: "HTTP #{response.code}" }
      end
    rescue => e
      puts "❌ Dashboard test error: #{e.message}"
      @test_results << { test: 'Dashboard', status: 'ERROR', error: e.message }
    end
  end

  def test_error_handling
    puts "\n5. Testing Error Handling..."
    begin
      # Test invalid endpoint
      uri = URI("#{@server_url}/api/nonexistent")
      response = Net::HTTP.get_response(uri)
      
      if response.code == '404'
        puts "✅ Error handling test passed (404 as expected)"
        @test_results << { test: 'Error Handling', status: 'PASS' }
      else
        puts "❌ Error handling test failed: Expected 404, got #{response.code}"
        @test_results << { test: 'Error Handling', status: 'FAIL', error: "Expected 404, got #{response.code}" }
      end
    rescue => e
      puts "❌ Error handling test error: #{e.message}"
      @test_results << { test: 'Error Handling', status: 'ERROR', error: e.message }
    end
  end

  def show_results
    puts "\n" + "=" * 50
    puts "📊 Test Results Summary"
    puts "=" * 50
    
    passed = @test_results.count { |r| r[:status] == 'PASS' }
    failed = @test_results.count { |r| r[:status] == 'FAIL' }
    errors = @test_results.count { |r| r[:status] == 'ERROR' }
    total = @test_results.length
    
    puts "✅ Passed: #{passed}/#{total}"
    puts "❌ Failed: #{failed}/#{total}"
    puts "💥 Errors: #{errors}/#{total}"
    
    if failed > 0 || errors > 0
      puts "\n🔍 Failed Tests:"
      @test_results.each do |result|
        if result[:status] != 'PASS'
          puts "  - #{result[:test]}: #{result[:error]}"
        end
      end
    end
    
    puts "\n🎯 Next Steps:"
    puts "1. Check Vercel Dashboard for logs"
    puts "2. Check Supabase Dashboard for data"
    puts "3. Test plugin in SketchUp"
    puts "4. Review TESTING_GUIDE.md for detailed testing"
    
    puts "\n" + "=" * 50
    puts "🎉 Testing completed!"
  end
end

# Запуск тестів
if __FILE__ == $0
  tester = ProGran3Tester.new
  tester.run_all_tests
end
