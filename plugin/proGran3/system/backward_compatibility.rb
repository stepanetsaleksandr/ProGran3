# plugin/proGran3/system/backward_compatibility.rb
# Backward compatibility aliases для старих назв класів

# Завантажуємо нові модулі
require_relative 'core/session_manager'
require_relative 'core/data_storage'
require_relative 'network/network_client'
require_relative 'utils/device_identifier'
require_relative 'core/config_manager'
require_relative 'monitoring/analytics'
require_relative 'utils/time_sync'
require_relative 'utils/endpoint_validator'

module ProGran3
  module Security
    # Alias для старих назв класів
    LicenseManager = ProGran3::System::Core::SessionManager
    LicenseStorage = ProGran3::System::Core::DataStorage
    ApiClient = ProGran3::System::Network::NetworkClient
    HardwareFingerprint = ProGran3::System::Utils::DeviceIdentifier
    SecretManager = ProGran3::System::Core::ConfigManager
    Telemetry = ProGran3::System::Monitoring::Analytics
    TimeValidator = ProGran3::System::Utils::TimeSync
    ServerValidator = ProGran3::System::Utils::EndpointValidator
  end
end
