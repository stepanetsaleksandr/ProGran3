'use client';

import { useState, useEffect } from 'react';

export default function ComprehensiveDashboard() {
  const [plugins, setPlugins] = useState<any[]>([]);
  const [licenses, setLicenses] = useState<any[]>([]);
  const [userLicenses, setUserLicenses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');
  const [activeTab, setActiveTab] = useState<'plugins' | 'licenses' | 'users'>('users');
  const [showCreateLicense, setShowCreateLicense] = useState(false);
  const [newLicense, setNewLicense] = useState({
    license_key: '',
    max_activations: 1,
    days_valid: '' // Кількість днів (порожня = безстрокова)
  });

  const fetchData = async () => {
    try {
      setError('');
      setLoading(true);
      
      // Fetch plugins
      const pluginsResponse = await fetch('/api/plugins');
      if (pluginsResponse.ok) {
        const pluginsData = await pluginsResponse.json();
        if (pluginsData.success) {
          setPlugins(pluginsData.data.plugins || []);
        }
      }
      
      // Fetch licenses
      const licensesResponse = await fetch('/api/admin/licenses-simple');
      if (licensesResponse.ok) {
        const licensesData = await licensesResponse.json();
        if (licensesData.success) {
          setLicenses(licensesData.data.licenses || []);
        }
      }
      
      // Fetch user licenses from debug endpoint
      const userLicensesResponse = await fetch('/api/debug/check-user-licenses');
      if (userLicensesResponse.ok) {
        const userLicensesData = await userLicensesResponse.json();
        if (userLicensesData.success) {
          setUserLicenses(userLicensesData.userLicenses || []);
        }
      }
      
      
    } catch (error) {
      console.error('Error fetching data:', error);
      setError('Помилка з\'єднання з сервером: ' + (error as Error).message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const formatDate = (dateString: string) => {
    try {
    return new Date(dateString).toLocaleString('uk-UA');
    } catch {
      return dateString;
    }
  };

  const generateLicenseKey = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let result = '';
    for (let i = 0; i < 4; i++) {
      for (let j = 0; j < 4; j++) {
        result += chars.charAt(Math.floor(Math.random() * chars.length));
      }
      if (i < 3) result += '-';
    }
    return result;
  };

  const createLicense = async () => {
    try {
      // Автогенерація ключа якщо не введено
      const licenseData = {
        ...newLicense,
        license_key: newLicense.license_key || generateLicenseKey()
      };

      console.log('Creating license with data:', licenseData);

      // Використовуємо робочий endpoint
      const response = await fetch('/api/admin/licenses-simple', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(licenseData),
      });
      
      console.log('Response status:', response.status);
      
      if (response.ok) {
        const data = await response.json();
        console.log('Response data:', data);
        
        if (data.success) {
          setShowCreateLicense(false);
          setNewLicense({
            license_key: '',
            max_activations: 1,
            days_valid: ''
          });
          fetchData(); // Refresh data
          setError(''); // Clear any previous errors
        } else {
          setError('Помилка створення ліцензії: ' + (data.message || 'Невідома помилка'));
        }
      } else {
        const errorData = await response.json();
        setError('Помилка сервера: ' + (errorData.message || `HTTP ${response.status}`));
      }
    } catch (error) {
      console.error('Error creating license:', error);
      setError('Помилка створення ліцензії: ' + (error as Error).message);
    }
  };

  const blockLicense = async (licenseId: number) => {
    try {
      const response = await fetch(`/api/admin/block-license`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ license_id: licenseId }),
      });
      
      if (response.ok) {
        fetchData(); // Refresh data
      }
    } catch (error) {
      setError('Помилка блокування ліцензії: ' + (error as Error).message);
    }
  };

  const deleteLicense = async (licenseId: number, licenseKey: string) => {
    if (!confirm(`Ви впевнені, що хочете видалити ліцензію ${licenseKey}? Це також видалить всі її активації!`)) {
      return;
    }

    try {
      setError('');
      const response = await fetch(`/api/admin/licenses/${licenseId}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        const result = await response.json();
        if (result.success) {
          alert('Ліцензію успішно видалено!');
          fetchData(); // Оновлюємо дані
        } else {
          setError('Помилка видалення: ' + result.error);
        }
      } else {
        setError('Помилка видалення: HTTP ' + response.status);
      }
    } catch (err) {
      setError('Помилка видалення: ' + (err as Error).message);
    }
  };

  const blockPlugin = async (pluginId: string) => {
    try {
      const response = await fetch(`/api/admin/block-plugin`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ plugin_id: pluginId }),
      });
      
      if (response.ok) {
        fetchData(); // Refresh data
      }
    } catch (error) {
      setError('Помилка блокування плагіна: ' + (error as Error).message);
    }
  };

  return (
    <div style={{ 
      minHeight: '100vh', 
      backgroundColor: '#f5f5f5',
      fontFamily: 'Arial, sans-serif',
      padding: '20px'
    }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
        {/* Header */}
        <div style={{ 
          backgroundColor: 'white', 
          padding: '20px', 
          borderRadius: '8px', 
          marginBottom: '20px',
          boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
        }}>
          <h1 style={{ 
            fontSize: '28px', 
            fontWeight: 'bold', 
            color: '#333', 
            margin: '0 0 10px 0' 
          }}>
                ProGran3 Dashboard
              </h1>
          <p style={{ color: '#666', margin: '0 0 20px 0' }}>
            Повне управління плагінами та ліцензіями
          </p>
          
          {/* Tabs */}
          <div style={{ 
            display: 'flex', 
            gap: '10px', 
            marginBottom: '20px',
            borderBottom: '1px solid #e0e0e0'
          }}>
            <button
              onClick={() => setActiveTab('plugins')}
              style={{
                padding: '10px 20px',
                border: 'none',
                backgroundColor: activeTab === 'plugins' ? '#007bff' : '#f8f9fa',
                color: activeTab === 'plugins' ? 'white' : '#333',
                borderRadius: '4px 4px 0 0',
                cursor: 'pointer',
                fontSize: '14px'
              }}
            >
              🔌 Плагіни ({plugins.length})
            </button>
            <button
              onClick={() => setActiveTab('licenses')}
              style={{
                padding: '10px 20px',
                border: 'none',
                backgroundColor: activeTab === 'licenses' ? '#007bff' : '#f8f9fa',
                color: activeTab === 'licenses' ? 'white' : '#333',
                borderRadius: '4px 4px 0 0',
                cursor: 'pointer',
                fontSize: '14px'
              }}
            >
              Ліцензії ({licenses.length})
            </button>
            <button
              onClick={() => setActiveTab('users')}
              style={{
                padding: '10px 20px',
                border: 'none',
                backgroundColor: activeTab === 'users' ? '#007bff' : '#f8f9fa',
                color: activeTab === 'users' ? 'white' : '#333',
                borderRadius: '4px 4px 0 0',
                cursor: 'pointer',
                fontSize: '14px'
              }}
            >
              Користувачі ({userLicenses.length})
            </button>
            </div>
          
          <div style={{ display: 'flex', gap: '10px' }}>
            <button 
              onClick={fetchData}
              style={{
                backgroundColor: '#007bff',
                color: 'white',
                border: 'none',
                padding: '10px 20px',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '14px'
              }}
            >
              Оновити дані
            </button>
            {activeTab === 'licenses' && (
              <button 
                onClick={() => setShowCreateLicense(true)}
                style={{
                  backgroundColor: '#28a745',
                  color: 'white',
                  border: 'none',
                  padding: '10px 20px',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontSize: '14px'
                }}
              >
                Створити ліцензію
              </button>
            )}
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div style={{
            backgroundColor: '#f8d7da',
            color: '#721c24',
            padding: '15px',
            borderRadius: '4px',
            marginBottom: '20px',
            border: '1px solid #f5c6cb'
          }}>
            <strong>Помилка:</strong> {error}
            <br />
            <small>Перевірте налаштування змінних середовища в Vercel Dashboard</small>
          </div>
        )}

        {/* Loading */}
        {loading && (
          <div style={{
            backgroundColor: 'white',
            padding: '40px',
            borderRadius: '8px',
            textAlign: 'center',
            boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
          }}>
            <div style={{
              width: '40px',
              height: '40px',
              border: '4px solid #e0e0e0',
              borderTop: '4px solid #007bff',
              borderRadius: '50%',
              animation: 'spin 1s linear infinite',
              margin: '0 auto 20px'
            }}></div>
            <p style={{ color: '#666', fontSize: '16px' }}>Завантаження даних...</p>
                </div>
        )}

        {/* Stats */}
        {!loading && !error && (
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', 
            gap: '20px', 
            marginBottom: '20px' 
          }}>
            <div style={{ 
              backgroundColor: 'white', 
              padding: '20px', 
              borderRadius: '8px',
              boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
              textAlign: 'center'
            }}>
              <h3 style={{ margin: '0 0 10px 0', color: '#333' }}>Плагіни</h3>
              <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#007bff' }}>
                {plugins.length}
                </div>
              <div style={{ fontSize: '12px', color: '#666' }}>
                Активних: {plugins.filter(p => p.is_active && !p.is_blocked).length} | Заблокованих: {plugins.filter(p => p.is_blocked).length}
              </div>
            </div>
            <div style={{ 
              backgroundColor: 'white', 
              padding: '20px', 
              borderRadius: '8px',
              boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
              textAlign: 'center'
            }}>
              <h3 style={{ margin: '0 0 10px 0', color: '#333' }}>Ліцензії</h3>
              <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#28a745' }}>
                {licenses.length}
                </div>
              <div style={{ fontSize: '12px', color: '#666' }}>
                Активних: {licenses.filter(l => l.is_active).length}
              </div>
            </div>
            <div style={{ 
              backgroundColor: 'white', 
              padding: '20px', 
              borderRadius: '8px',
              boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
              textAlign: 'center'
            }}>
              <h3 style={{ margin: '0 0 10px 0', color: '#333' }}>Користувачі</h3>
              <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#dc3545' }}>
                {userLicenses.length}
                </div>
              <div style={{ fontSize: '12px', color: '#666' }}>
                Зареєстрованих
              </div>
            </div>
          </div>
        )}

        {/* Tab Content */}
        {!loading && (
          <div style={{ 
            backgroundColor: 'white', 
            borderRadius: '8px',
            boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
            overflow: 'hidden'
          }}>

            {/* Plugins Tab */}
            {activeTab === 'plugins' && (
              <>
                <div style={{ 
                  backgroundColor: '#007bff', 
                  color: 'white', 
                  padding: '15px 20px' 
                }}>
                  <h2 style={{ margin: '0', fontSize: '18px' }}>Список плагінів</h2>
                  <p style={{ margin: '5px 0 0 0', fontSize: '14px', opacity: 0.9 }}>
              {plugins.length} плагінів знайдено
            </p>
          </div>
          
          {plugins.length === 0 ? (
                  <div style={{ padding: '40px', textAlign: 'center', color: '#666' }}>
                    {error ? 'Плагіни не завантажені через помилку' : 'Плагіни не знайдені'}
            </div>
          ) : (
                  <div style={{ overflowX: 'auto' }}>
                    <table style={{ 
                      width: '100%', 
                      borderCollapse: 'collapse',
                      fontSize: '14px'
                    }}>
                      <thead style={{ backgroundColor: '#f8f9fa' }}>
                        <tr>
                          <th style={{ padding: '12px', textAlign: 'left', borderBottom: '1px solid #dee2e6' }}>
                      Користувач
                    </th>
                          <th style={{ padding: '12px', textAlign: 'left', borderBottom: '1px solid #dee2e6' }}>
                      Комп'ютер
                    </th>
                          <th style={{ padding: '12px', textAlign: 'left', borderBottom: '1px solid #dee2e6' }}>
                      SketchUp
                    </th>
                          <th style={{ padding: '12px', textAlign: 'left', borderBottom: '1px solid #dee2e6' }}>
                      Статус
                    </th>
                          <th style={{ padding: '12px', textAlign: 'left', borderBottom: '1px solid #dee2e6' }}>
                      Останній heartbeat
                    </th>
                          <th style={{ padding: '12px', textAlign: 'left', borderBottom: '1px solid #dee2e6' }}>
                      Дії
                    </th>
                  </tr>
                </thead>
                      <tbody>
                        {plugins.map((plugin, index) => (
                          <tr key={plugin.id || index} style={{ borderBottom: '1px solid #dee2e6' }}>
                            <td style={{ padding: '12px' }}>
                        <div>
                                <div style={{ fontWeight: 'bold', color: '#333' }}>
                                  {plugin.user_id || 'Невідомо'}
                          </div>
                                <div style={{ fontSize: '12px', color: '#666' }}>
                                  ID: {plugin.plugin_id || 'Невідомо'}
                          </div>
                        </div>
                      </td>
                            <td style={{ padding: '12px', color: '#333' }}>
                              {plugin.computer_name || 'Невідомо'}
                      </td>
                            <td style={{ padding: '12px', color: '#333' }}>
                              {plugin.system_info?.sketchup_version || 'Невідомо'}
                      </td>
                            <td style={{ padding: '12px' }}>
                              <span style={{
                                padding: '4px 8px',
                                borderRadius: '12px',
                                fontSize: '12px',
                                fontWeight: 'bold',
                                backgroundColor: plugin.is_blocked ? '#f8d7da' : (plugin.is_active ? '#d4edda' : '#f8d7da'),
                                color: plugin.is_blocked ? '#721c24' : (plugin.is_active ? '#155724' : '#721c24')
                              }}>
                                {plugin.is_blocked ? '🔴 Заблокований' : (plugin.is_active ? '🟢 Активний' : '🔴 Неактивний')}
                        </span>
                      </td>
                            <td style={{ padding: '12px', color: '#333' }}>
                              {plugin.last_heartbeat ? formatDate(plugin.last_heartbeat) : 'Невідомо'}
                      </td>
                            <td style={{ padding: '12px' }}>
                        <button
                                onClick={() => blockPlugin(plugin.plugin_id)}
                                style={{
                                  backgroundColor: plugin.is_blocked ? '#28a745' : '#dc3545',
                                  color: 'white',
                                  border: 'none',
                                  padding: '4px 8px',
                                  borderRadius: '4px',
                                  cursor: 'pointer',
                                  fontSize: '12px'
                                }}
                        >
                          {plugin.is_blocked ? 'Розблокувати' : 'Заблокувати'}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
              </>
            )}

            {/* Licenses Tab */}
            {activeTab === 'licenses' && (
              <>
                <div style={{ 
                  backgroundColor: '#28a745', 
                  color: 'white', 
                  padding: '15px 20px' 
                }}>
                  <h2 style={{ margin: '0', fontSize: '18px' }}>Управління ліцензіями</h2>
                  <p style={{ margin: '5px 0 0 0', fontSize: '14px', opacity: 0.9 }}>
                    {licenses.length} ліцензій знайдено
                  </p>
        </div>

                {licenses.length === 0 ? (
                  <div style={{ padding: '40px', textAlign: 'center', color: '#666' }}>
                    Ліцензії не знайдені
                  </div>
                ) : (
                  <div style={{ overflowX: 'auto' }}>
                    <table style={{ 
                      width: '100%', 
                      borderCollapse: 'collapse',
                      fontSize: '14px'
                    }}>
                      <thead style={{ backgroundColor: '#f8f9fa' }}>
                        <tr>
                          <th style={{ padding: '12px', textAlign: 'left', borderBottom: '1px solid #dee2e6' }}>
                            Ліцензія
                          </th>
                          <th style={{ padding: '12px', textAlign: 'left', borderBottom: '1px solid #dee2e6' }}>
                            Макс. активацій
                          </th>
                          <th style={{ padding: '12px', textAlign: 'left', borderBottom: '1px solid #dee2e6' }}>
                            Термін дії
                          </th>
                          <th style={{ padding: '12px', textAlign: 'left', borderBottom: '1px solid #dee2e6' }}>
                            Статус
                          </th>
                          <th style={{ padding: '12px', textAlign: 'left', borderBottom: '1px solid #dee2e6' }}>
                            Дії
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {licenses.map((license, index) => (
                          <tr key={license.id || index} style={{ borderBottom: '1px solid #dee2e6' }}>
                            <td style={{ padding: '12px' }}>
                              <div style={{ fontWeight: 'bold', color: '#333' }}>
                                {license.license_key || 'Невідомо'}
                              </div>
                            </td>
                            <td style={{ padding: '12px', color: '#333' }}>
                              {license.max_activations || 'Невідомо'}
                            </td>
                            <td style={{ padding: '12px', color: '#333' }}>
                              {license.days_valid ? `${license.days_valid} днів` : 'Без обмежень'}
                            </td>
                            <td style={{ padding: '12px' }}>
                              <span style={{
                                padding: '4px 8px',
                                borderRadius: '12px',
                                fontSize: '12px',
                                fontWeight: 'bold',
                                backgroundColor: license.is_active ? '#d4edda' : '#f8d7da',
                                color: license.is_active ? '#155724' : '#721c24'
                              }}>
                                {license.is_active ? '🟢 Активна' : '🔴 Неактивна'}
                              </span>
                            </td>
                            <td style={{ padding: '12px' }}>
                              <div style={{ display: 'flex', gap: '8px' }}>
                                <button
                                  onClick={() => blockLicense(license.id)}
                                  style={{
                                    backgroundColor: license.is_active ? '#dc3545' : '#28a745',
                                    color: 'white',
                                    border: 'none',
                                    padding: '4px 8px',
                                    borderRadius: '4px',
                                    cursor: 'pointer',
                                    fontSize: '12px'
                                  }}
                                >
                                  {license.is_active ? 'Заблокувати' : 'Активувати'}
                                </button>
                                <button
                                  onClick={() => deleteLicense(license.id, license.license_key)}
                                  style={{
                                    backgroundColor: '#dc3545',
                                    color: 'white',
                                    border: 'none',
                                    padding: '4px 8px',
                                    borderRadius: '4px',
                                    cursor: 'pointer',
                                    fontSize: '12px'
                                  }}
                                  title="Видалити ліцензію"
                                >
                                  🗑️ Видалити
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </>
            )}

            {/* Users Tab */}
            {activeTab === 'users' && (
              <>
                <div style={{ 
                  backgroundColor: '#dc3545', 
                  color: 'white', 
                  padding: '15px 20px' 
                }}>
                  <h2 style={{ margin: '0', fontSize: '18px' }}>Користувачі з ліцензіями</h2>
                  <p style={{ margin: '5px 0 0 0', fontSize: '14px', opacity: 0.9 }}>
                    {userLicenses.length} користувачів знайдено
                  </p>
                </div>
                
                {userLicenses.length === 0 ? (
                  <div style={{ padding: '40px', textAlign: 'center', color: '#666' }}>
                    Користувачі не знайдені
                  </div>
                ) : (
                  <div style={{ overflowX: 'auto' }}>
                    <table style={{ 
                      width: '100%', 
                      borderCollapse: 'collapse',
                      fontSize: '14px'
                    }}>
                      <thead style={{ backgroundColor: '#f8f9fa' }}>
                        <tr>
                          <th style={{ padding: '12px', textAlign: 'left', borderBottom: '1px solid #dee2e6' }}>
                            Email
                          </th>
                          <th style={{ padding: '12px', textAlign: 'left', borderBottom: '1px solid #dee2e6' }}>
                            Ліцензія
                          </th>
                          <th style={{ padding: '12px', textAlign: 'left', borderBottom: '1px solid #dee2e6' }}>
                            Hardware ID
                          </th>
                          <th style={{ padding: '12px', textAlign: 'left', borderBottom: '1px solid #dee2e6' }}>
                            Дата активації
                          </th>
                          <th style={{ padding: '12px', textAlign: 'left', borderBottom: '1px solid #dee2e6' }}>
                            Статус
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {userLicenses.map((userLicense, index) => (
                          <tr key={userLicense.id || index} style={{ borderBottom: '1px solid #dee2e6' }}>
                            <td style={{ padding: '12px' }}>
                              <div style={{ fontWeight: 'bold', color: '#333' }}>
                                {userLicense.email || 'Невідомо'}
                              </div>
                            </td>
                            <td style={{ padding: '12px', color: '#333' }}>
                              {userLicense.license_key || 'Невідомо'}
                            </td>
                            <td style={{ padding: '12px', color: '#333' }}>
                              {userLicense.hardware_id || 'Невідомо'}
                            </td>
                            <td style={{ padding: '12px', color: '#333' }}>
                              {userLicense.activated_at ? formatDate(userLicense.activated_at) : 'Невідомо'}
                            </td>
                            <td style={{ padding: '12px' }}>
                              <span style={{
                                padding: '4px 8px',
                                borderRadius: '12px',
                                fontSize: '12px',
                                fontWeight: 'bold',
                                backgroundColor: userLicense.is_active ? '#d4edda' : '#f8d7da',
                                color: userLicense.is_active ? '#155724' : '#721c24'
                              }}>
                                {userLicense.is_active ? '🟢 Активна' : '🔴 Неактивна'}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </>
            )}
          </div>
        )}

        {/* Create License Modal */}
        {showCreateLicense && (
          <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0,0,0,0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000
          }}>
            <div style={{
              backgroundColor: 'white',
              padding: '30px',
              borderRadius: '8px',
              maxWidth: '500px',
              width: '90%',
              maxHeight: '90vh',
              overflowY: 'auto'
            }}>
              <h2 style={{ margin: '0 0 20px 0', color: '#333' }}>Створити нову ліцензію</h2>
              
              <div style={{ marginBottom: '15px' }}>
                <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
                  Ключ ліцензії:
                </label>
                <div style={{ display: 'flex', gap: '10px' }}>
                  <input
                    type="text"
                    value={newLicense.license_key}
                    onChange={(e) => setNewLicense({...newLicense, license_key: e.target.value})}
                    style={{
                      flex: 1,
                      padding: '8px',
                      border: '1px solid #ddd',
                      borderRadius: '4px',
                      fontSize: '14px'
                    }}
                    placeholder="Введіть ключ ліцензії або залиште порожнім для автогенерації"
                  />
                  <button
                    type="button"
                    onClick={() => setNewLicense({...newLicense, license_key: generateLicenseKey()})}
                    style={{
                      backgroundColor: '#007bff',
                      color: 'white',
                      border: 'none',
                      padding: '8px 12px',
                      borderRadius: '4px',
                      cursor: 'pointer',
                      fontSize: '12px',
                      whiteSpace: 'nowrap'
                    }}
                  >
                    Генерувати
                  </button>
                </div>
                <small style={{ color: '#666', fontSize: '12px' }}>
                  Email буде отримано від клієнта при активації
                </small>
              </div>
              
              <div style={{ marginBottom: '15px' }}>
                <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
                  Максимальна кількість активацій:
                </label>
                <input
                  type="number"
                  value={newLicense.max_activations}
                  onChange={(e) => setNewLicense({...newLicense, max_activations: parseInt(e.target.value)})}
                  style={{
                    width: '100%',
                    padding: '8px',
                    border: '1px solid #ddd',
                    borderRadius: '4px',
                    fontSize: '14px'
                  }}
                  min="1"
                />
              </div>
              
              <div style={{ marginBottom: '15px' }}>
                <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
                  Кількість днів (залишити порожнім для безстрокової):
                </label>
                <input
                  type="number"
                  value={newLicense.days_valid || ''}
                  onChange={(e) => setNewLicense({...newLicense, days_valid: e.target.value})}
                  placeholder="Наприклад: 30, 90, 365"
                  min="1"
                  style={{
                    width: '100%',
                    padding: '8px',
                    border: '1px solid #ddd',
                    borderRadius: '4px',
                    fontSize: '14px'
                  }}
                />
                <small style={{ color: '#666', fontSize: '12px' }}>
                  Залишити порожнім для безстрокової ліцензії
                </small>
              </div>
              
              
              <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                <button
                  onClick={() => setShowCreateLicense(false)}
                  style={{
                    backgroundColor: '#6c757d',
                    color: 'white',
                    border: 'none',
                    padding: '10px 20px',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    fontSize: '14px'
                  }}
                >
                  Скасувати
                </button>
                <button
                  onClick={createLicense}
                  style={{
                    backgroundColor: '#28a745',
                    color: 'white',
                    border: 'none',
                    padding: '10px 20px',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    fontSize: '14px'
                  }}
                >
                  Створити ліцензію
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Footer */}
        <div style={{ 
          textAlign: 'center', 
          marginTop: '20px', 
          color: '#666', 
          fontSize: '14px' 
        }}>
          <p>ProGran3 Tracking Server - Повний дашборд</p>
          <p>Управління плагінами, ліцензіями та користувачами</p>
        </div>
      </div>

      <style jsx>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
