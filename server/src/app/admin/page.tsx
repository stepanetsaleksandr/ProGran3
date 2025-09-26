'use client';

import { useState, useEffect } from 'react';

export default function AdminDashboard() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');

  const fetchData = async () => {
    try {
      setError('');
      setLoading(true);
      
      const response = await fetch('/api/debug/all-info');
      if (response.ok) {
        const result = await response.json();
        if (result.success) {
          setData(result.data);
        } else {
          setError('Failed to fetch data: ' + result.error);
        }
      } else {
        setError('Failed to fetch data: HTTP ' + response.status);
      }
    } catch (err) {
      setError('Error: ' + (err as Error).message);
    } finally {
      setLoading(false);
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

  useEffect(() => {
    fetchData();
  }, []);

  if (loading) {
    return (
      <div style={{ padding: '20px', textAlign: 'center' }}>
        <h1>Завантаження даних...</h1>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ padding: '20px' }}>
        <h1>Помилка</h1>
        <p style={{ color: 'red' }}>{error}</p>
        <button onClick={fetchData} style={{ padding: '10px 20px', marginTop: '10px' }}>
          Спробувати знову
        </button>
      </div>
    );
  }

  if (!data) {
    return (
      <div style={{ padding: '20px' }}>
        <h1>Немає даних</h1>
      </div>
    );
  }

  return (
    <div style={{ padding: '20px', fontFamily: 'Arial, sans-serif' }}>
      <h1 style={{ color: '#333', marginBottom: '30px' }}>🔧 Адміністративний дашборд ProGran3</h1>
      
      {/* Статистика */}
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', 
        gap: '20px', 
        marginBottom: '30px' 
      }}>
        <div style={{ 
          background: '#f8f9fa', 
          padding: '20px', 
          borderRadius: '8px', 
          border: '1px solid #dee2e6' 
        }}>
          <h3 style={{ margin: '0 0 10px 0', color: '#495057' }}>Плагіни</h3>
          <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#007bff' }}>
            {data.summary.total_plugins}
          </div>
          <div style={{ fontSize: '14px', color: '#6c757d' }}>
            Активних: {data.summary.active_plugins} | Заблокованих: {data.summary.blocked_plugins}
          </div>
        </div>
        
        <div style={{ 
          background: '#f8f9fa', 
          padding: '20px', 
          borderRadius: '8px', 
          border: '1px solid #dee2e6' 
        }}>
          <h3 style={{ margin: '0 0 10px 0', color: '#495057' }}>Ліцензії</h3>
          <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#28a745' }}>
            {data.summary.total_licenses}
          </div>
          <div style={{ fontSize: '14px', color: '#6c757d' }}>
            Активних: {data.summary.active_licenses}
          </div>
        </div>
        
        <div style={{ 
          background: '#f8f9fa', 
          padding: '20px', 
          borderRadius: '8px', 
          border: '1px solid #dee2e6' 
        }}>
          <h3 style={{ margin: '0 0 10px 0', color: '#495057' }}>Активації</h3>
          <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#ffc107' }}>
            {data.summary.total_activations}
          </div>
          <div style={{ fontSize: '14px', color: '#6c757d' }}>
            Загальна кількість активацій
          </div>
        </div>
      </div>

      {/* Плагіни */}
      <div style={{ marginBottom: '30px' }}>
        <h2 style={{ color: '#333', marginBottom: '20px' }}>📱 Плагіни ({data.plugins.length})</h2>
        <div style={{ 
          background: 'white', 
          border: '1px solid #dee2e6', 
          borderRadius: '8px', 
          overflow: 'hidden' 
        }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: '#f8f9fa' }}>
                <th style={{ padding: '12px', textAlign: 'left', borderBottom: '1px solid #dee2e6' }}>
                  Plugin ID
                </th>
                <th style={{ padding: '12px', textAlign: 'left', borderBottom: '1px solid #dee2e6' }}>
                  Користувач
                </th>
                <th style={{ padding: '12px', textAlign: 'left', borderBottom: '1px solid #dee2e6' }}>
                  Комп'ютер
                </th>
                <th style={{ padding: '12px', textAlign: 'left', borderBottom: '1px solid #dee2e6' }}>
                  Останній heartbeat
                </th>
                <th style={{ padding: '12px', textAlign: 'left', borderBottom: '1px solid #dee2e6' }}>
                  Статус
                </th>
              </tr>
            </thead>
            <tbody>
              {data.plugins.map((plugin: any) => (
                <tr key={plugin.id}>
                  <td style={{ padding: '12px', color: '#333' }}>
                    {plugin.plugin_id}
                  </td>
                  <td style={{ padding: '12px', color: '#333' }}>
                    {plugin.user_id}
                  </td>
                  <td style={{ padding: '12px', color: '#333' }}>
                    {plugin.computer_name}
                  </td>
                  <td style={{ padding: '12px', color: '#333' }}>
                    {plugin.last_heartbeat ? new Date(plugin.last_heartbeat).toLocaleString() : 'Ніколи'}
                  </td>
                  <td style={{ padding: '12px' }}>
                    <span style={{
                      padding: '4px 8px',
                      borderRadius: '12px',
                      fontSize: '12px',
                      fontWeight: 'bold',
                      backgroundColor: plugin.is_blocked ? '#dc3545' : (plugin.is_active ? '#28a745' : '#6c757d'),
                      color: 'white'
                    }}>
                      {plugin.is_blocked ? 'ЗАБЛОКОВАНО' : (plugin.is_active ? 'АКТИВНИЙ' : 'НЕАКТИВНИЙ')}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Ліцензії */}
      <div style={{ marginBottom: '30px' }}>
        <h2 style={{ color: '#333', marginBottom: '20px' }}>🔑 Ліцензії ({data.licenses.length})</h2>
        <div style={{ 
          background: 'white', 
          border: '1px solid #dee2e6', 
          borderRadius: '8px', 
          overflow: 'hidden' 
        }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: '#f8f9fa' }}>
                <th style={{ padding: '12px', textAlign: 'left', borderBottom: '1px solid #dee2e6' }}>
                  Ключ ліцензії
                </th>
                <th style={{ padding: '12px', textAlign: 'left', borderBottom: '1px solid #dee2e6' }}>
                  Тип
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
                  Створено
                </th>
                <th style={{ padding: '12px', textAlign: 'left', borderBottom: '1px solid #dee2e6' }}>
                  Дії
                </th>
              </tr>
            </thead>
            <tbody>
              {data.licenses.map((license: any) => (
                <tr key={license.id}>
                  <td style={{ padding: '12px', color: '#333', fontFamily: 'monospace' }}>
                    {license.license_key}
                  </td>
                  <td style={{ padding: '12px', color: '#333' }}>
                    {license.license_type}
                  </td>
                  <td style={{ padding: '12px', color: '#333' }}>
                    {license.max_activations}
                  </td>
                  <td style={{ padding: '12px', color: '#333' }}>
                    {license.expires_at ? new Date(license.expires_at).toLocaleDateString() : 'Безстрокова'}
                  </td>
                  <td style={{ padding: '12px' }}>
                    <span style={{
                      padding: '4px 8px',
                      borderRadius: '12px',
                      fontSize: '12px',
                      fontWeight: 'bold',
                      backgroundColor: license.is_active ? '#28a745' : '#dc3545',
                      color: 'white'
                    }}>
                      {license.is_active ? 'АКТИВНА' : 'НЕАКТИВНА'}
                    </span>
                  </td>
                  <td style={{ padding: '12px', color: '#333' }}>
                    {new Date(license.created_at).toLocaleDateString()}
                  </td>
                  <td style={{ padding: '12px' }}>
                    <button
                      onClick={() => deleteLicense(license.id, license.license_key)}
                      style={{
                        padding: '6px 12px',
                        backgroundColor: '#dc3545',
                        color: 'white',
                        border: 'none',
                        borderRadius: '4px',
                        cursor: 'pointer',
                        fontSize: '12px'
                      }}
                      title="Видалити ліцензію"
                    >
                      🗑️ Видалити
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Активації ліцензій */}
      <div style={{ marginBottom: '30px' }}>
        <h2 style={{ color: '#333', marginBottom: '20px' }}>👥 Активації ліцензій ({data.user_licenses.length})</h2>
        <div style={{ 
          background: 'white', 
          border: '1px solid #dee2e6', 
          borderRadius: '8px', 
          overflow: 'hidden' 
        }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: '#f8f9fa' }}>
                <th style={{ padding: '12px', textAlign: 'left', borderBottom: '1px solid #dee2e6' }}>
                  Email
                </th>
                <th style={{ padding: '12px', textAlign: 'left', borderBottom: '1px solid #dee2e6' }}>
                  Ключ ліцензії
                </th>
                <th style={{ padding: '12px', textAlign: 'left', borderBottom: '1px solid #dee2e6' }}>
                  Hardware ID
                </th>
                <th style={{ padding: '12px', textAlign: 'left', borderBottom: '1px solid #dee2e6' }}>
                  Активовано
                </th>
                <th style={{ padding: '12px', textAlign: 'left', borderBottom: '1px solid #dee2e6' }}>
                  Останній heartbeat
                </th>
                <th style={{ padding: '12px', textAlign: 'left', borderBottom: '1px solid #dee2e6' }}>
                  Статус
                </th>
              </tr>
            </thead>
            <tbody>
              {data.user_licenses.map((userLicense: any) => (
                <tr key={userLicense.id}>
                  <td style={{ padding: '12px', color: '#333' }}>
                    {userLicense.email}
                  </td>
                  <td style={{ padding: '12px', color: '#333', fontFamily: 'monospace' }}>
                    {userLicense.license_key}
                  </td>
                  <td style={{ padding: '12px', color: '#333', fontFamily: 'monospace' }}>
                    {userLicense.hardware_id}
                  </td>
                  <td style={{ padding: '12px', color: '#333' }}>
                    {new Date(userLicense.activated_at).toLocaleString()}
                  </td>
                  <td style={{ padding: '12px', color: '#333' }}>
                    {userLicense.last_heartbeat ? new Date(userLicense.last_heartbeat).toLocaleString() : 'Ніколи'}
                  </td>
                  <td style={{ padding: '12px' }}>
                    <span style={{
                      padding: '4px 8px',
                      borderRadius: '12px',
                      fontSize: '12px',
                      fontWeight: 'bold',
                      backgroundColor: userLicense.is_active ? '#28a745' : '#dc3545',
                      color: 'white'
                    }}>
                      {userLicense.is_active ? 'АКТИВНА' : 'НЕАКТИВНА'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div style={{ textAlign: 'center', marginTop: '30px' }}>
        <button 
          onClick={fetchData} 
          style={{ 
            padding: '10px 20px', 
            backgroundColor: '#007bff', 
            color: 'white', 
            border: 'none', 
            borderRadius: '4px', 
            cursor: 'pointer' 
          }}
        >
          🔄 Оновити дані
        </button>
      </div>
    </div>
  );
}
