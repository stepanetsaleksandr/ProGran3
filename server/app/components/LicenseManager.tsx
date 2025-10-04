'use client';

import { useState, useEffect } from 'react';

interface License {
  id: string;
  license_key: string;
  duration_days: number;
  description: string;
  status: 'generated' | 'activated' | 'active' | 'expired' | 'revoked';
  created_at: string;
  activated_at: string | null;
  expires_at: string | null;
  updated_at: string | null;
  users: {
    email: string;
    name: string;
  } | null;
}

export default function LicenseManager() {
  const [licenses, setLicenses] = useState<License[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newLicense, setNewLicense] = useState({
    duration_days: 30,
    description: ''
  });
  const [generatedKeys, setGeneratedKeys] = useState<License[]>([]);
  const [dbSetup, setDbSetup] = useState(false);
  const [dbStatus, setDbStatus] = useState<string>('');

  useEffect(() => {
    fetchLicenses();
  }, []);

  const fetchLicenses = async () => {
    try {
      const response = await fetch('/api/licenses');
      const data = await response.json();
      if (data.success) {
        setLicenses(data.data);
        setDbSetup(true);
      } else {
        setDbSetup(false);
      }
    } catch (error) {
      console.error('Error fetching licenses:', error);
      setDbSetup(false);
    } finally {
      setLoading(false);
    }
  };

  const setupDatabase = async () => {
    try {
      const response = await fetch('/api/setup-db', { method: 'POST' });
      const data = await response.json();
      if (data.success) {
        alert('База даних налаштована успішно!');
        fetchLicenses();
      } else {
        alert(`Помилка: ${data.error}`);
      }
    } catch (error) {
      console.error('Error setting up database:', error);
      alert('Помилка при налаштуванні бази даних');
    }
  };

  const checkDatabase = async () => {
    try {
      const response = await fetch('/api/check-db');
      const data = await response.json();
      if (data.success) {
        setDbStatus('✅ База даних працює');
        alert('База даних працює нормально!');
      } else {
        setDbStatus(`❌ Помилка: ${data.error}`);
        alert(`Помилка БД: ${data.error}`);
      }
    } catch (error) {
      console.error('Error checking database:', error);
      setDbStatus('❌ Помилка підключення');
      alert('Помилка при перевірці бази даних');
    }
  };

  const checkState = async () => {
    try {
      const response = await fetch('/api/check-state');
      const data = await response.json();
      if (data.success) {
        const state = data.data;
        let message = 'Стан бази даних:\n\n';
        
        if (state.license_keys?.exists) {
          message += `📋 license_keys: ${state.license_keys.count || 0} записів\n`;
        } else {
          message += `📋 license_keys: не існує\n`;
        }
        
        if (state.licenses?.exists) {
          message += `🔑 licenses: ${state.licenses.count || 0} записів\n`;
          message += `📝 description: ${state.licenses.has_description ? '✅' : '❌'}\n`;
          message += `⏰ expires_at: ${state.licenses.has_expires_at ? '✅' : '❌'}\n`;
          message += `🔄 updated_at: ${state.licenses.has_updated_at ? '✅' : '❌'}\n`;
        } else {
          message += `🔑 licenses: не існує\n`;
        }
        
        alert(message);
        setDbStatus('✅ Стан перевірено');
      } else {
        setDbStatus(`❌ Помилка: ${data.error}`);
        alert(`Помилка перевірки стану: ${data.error}`);
      }
    } catch (error) {
      console.error('Error checking state:', error);
      setDbStatus('❌ Помилка перевірки стану');
      alert('Помилка при перевірці стану бази даних');
    }
  };

  const testConnection = async () => {
    try {
      setDbStatus('🔄 Тестування підключення...');
      const response = await fetch('/api/test-connection');
      const data = await response.json();
      
      if (data.success) {
        setDbStatus('✅ Підключення працює');
        alert('✅ Підключення до Supabase працює нормально!\n\nОбидві таблиці доступні:\n- license_keys ✅\n- licenses ✅');
      } else {
        setDbStatus(`❌ Помилка підключення: ${data.error}`);
        alert(`❌ Помилка підключення: ${data.error}\n\nДеталі: ${data.details}`);
      }
    } catch (error) {
      console.error('Error testing connection:', error);
      setDbStatus('❌ Помилка підключення');
      alert('Помилка при тестуванні підключення');
    }
  };

  const migrateDatabase = async () => {
    if (!confirm('Ви впевнені, що хочете мігрувати базу даних? Це перенесе дані з license_keys в licenses та оновить структуру.')) return;
    
    try {
      setDbStatus('🔄 Крок 1: Додавання полів...');
      
      // Step 1: Add columns
      const step1Response = await fetch('/api/simple-migrate-step1', { method: 'POST' });
      const step1Data = await step1Response.json();
      
      if (!step1Data.success) {
        setDbStatus(`❌ Помилка кроку 1: ${step1Data.error}`);
        alert(`Помилка кроку 1: ${step1Data.error}`);
        return;
      }
      
      setDbStatus('🔄 Крок 2: Перенесення даних...');
      
      // Step 2: Migrate data
      const step2Response = await fetch('/api/simple-migrate-step2', { method: 'POST' });
      const step2Data = await step2Response.json();
      
      if (!step2Data.success) {
        setDbStatus(`❌ Помилка кроку 2: ${step2Data.error}`);
        alert(`Помилка кроку 2: ${step2Data.error}`);
        return;
      }
      
      setDbStatus('✅ Міграція завершена успішно');
      alert(`Міграція завершена успішно!\n\nКрок 1: ✅ Поля додані\nКрок 2: ✅ Перенесено ${step2Data.migrated_count} записів з license_keys в licenses.`);
      fetchLicenses(); // Refresh the list
      
    } catch (error) {
      console.error('Error migrating database:', error);
      setDbStatus('❌ Помилка міграції');
      alert('Помилка при міграції бази даних');
    }
  };

  const createLicense = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      console.log('Creating license with data:', newLicense);
      const response = await fetch('/api/licenses/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newLicense)
      });
      const data = await response.json();
      console.log('Response:', data);
      
      if (data.success) {
        // Add the generated key to local state
        const newKey: License = {
          id: data.data.id,
          license_key: data.data.license_key,
          duration_days: data.data.duration_days,
          description: data.data.description,
          status: data.data.status,
          created_at: data.data.created_at,
          activated_at: data.data.activated_at || null,
          expires_at: data.data.expires_at || null,
          updated_at: data.data.updated_at || null,
          users: data.data.users || null
        };
        setGeneratedKeys(prev => [newKey, ...prev]);
        
        setShowCreateForm(false);
        setNewLicense({ duration_days: 30, description: '' });
        fetchLicenses();
        alert(`Ключ ліцензії успішно згенеровано!\n\nКлюч: ${data.data.license_key}`);
      } else {
        alert(`Помилка: ${data.error}`);
        console.error('API Error:', data);
      }
    } catch (error) {
      console.error('Error creating license:', error);
      alert('Помилка при створенні ключа ліцензії');
    }
  };

  const deleteLicense = async (id: string) => {
    if (!confirm('Ви впевнені, що хочете видалити цю ліцензію?')) return;
    
    try {
      console.log('Deleting license with ID:', id);
      
      // Try to delete from database using new API
      const response = await fetch('/api/delete-license', { 
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id })
      });
      const data = await response.json();
      
      console.log('Delete response:', data);
      
      if (data.success) {
        // Remove from local state as well
        setLicenses(prev => prev.filter(license => license.id !== id));
        setGeneratedKeys(prev => prev.filter(key => key.id !== id));
        alert('Ліцензію успішно видалено з бази даних!');
      } else {
        // If database deletion fails, remove from local state only
        setGeneratedKeys(prev => prev.filter(key => key.id !== id));
        alert(`Помилка видалення з БД: ${data.error}. Видалено з локального сховища.`);
      }
    } catch (error) {
      console.error('Error deleting license:', error);
      // Fallback: remove from local state
      setGeneratedKeys(prev => prev.filter(key => key.id !== id));
      alert('Помилка при видаленні. Видалено з локального сховища!');
    }
  };

  if (loading) return <div className="text-center py-8">Завантаження...</div>;

  return (
    <div className="bg-white rounded-lg shadow">
      <div className="px-6 py-4 border-b border-gray-200">
        <div className="flex justify-between items-center">
          <h2 className="text-lg font-medium text-gray-900">Управління ліцензіями</h2>
          <div className="flex space-x-2">
            <button
              onClick={testConnection}
              className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700"
            >
              Тест підключення
            </button>
            <button
              onClick={checkState}
              className="bg-purple-600 text-white px-4 py-2 rounded-md hover:bg-purple-700"
            >
              Стан БД
            </button>
            <button
              onClick={checkDatabase}
              className="bg-gray-600 text-white px-4 py-2 rounded-md hover:bg-gray-700"
            >
              Перевірити БД
            </button>
            <button
              onClick={migrateDatabase}
              className="bg-orange-600 text-white px-4 py-2 rounded-md hover:bg-orange-700"
            >
              Мігрувати БД
            </button>
            {!dbSetup && (
              <button
                onClick={setupDatabase}
                className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700"
              >
                Налаштувати БД
              </button>
            )}
            <button
              onClick={() => setShowCreateForm(true)}
              className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
            >
              Згенерувати ключ ліцензії
            </button>
          </div>
        </div>
        {dbStatus && (
          <div className="mt-2 text-sm text-gray-600">
            {dbStatus}
          </div>
        )}
      </div>

      {showCreateForm && (
        <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
          <form onSubmit={createLicense} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Термін дії (днів)</label>
                <input
                  type="number"
                  min="1"
                  value={newLicense.duration_days}
                  onChange={(e) => setNewLicense({ ...newLicense, duration_days: parseInt(e.target.value) || 1 })}
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Опис</label>
                <input
                  type="text"
                  value={newLicense.description}
                  onChange={(e) => setNewLicense({ ...newLicense, description: e.target.value })}
                  placeholder="Наприклад: Річна ліцензія для користувача"
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>
            <div className="flex justify-end space-x-3">
              <button
                type="button"
                onClick={() => setShowCreateForm(false)}
                className="px-4 py-2 text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300"
              >
                Скасувати
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                Згенерувати ключ
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Ключ ліцензії</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Термін</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Опис</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Статус</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Закінчується</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Користувач</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Створено</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Дії</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {[...generatedKeys, ...licenses].map((license) => (
              <tr key={license.id} className={generatedKeys.some(gk => gk.id === license.id) ? 'bg-green-50' : ''}>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-mono text-gray-900">
                  {license.license_key}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">
                    {license.duration_days} днів
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {license.description || 'N/A'}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                    license.status === 'active' ? 'bg-green-100 text-green-800' :
                    license.status === 'activated' ? 'bg-blue-100 text-blue-800' :
                    license.status === 'generated' ? 'bg-yellow-100 text-yellow-800' :
                    license.status === 'expired' ? 'bg-red-100 text-red-800' :
                    'bg-gray-100 text-gray-800'
                  }`}>
                    {license.status === 'active' ? 'Активна' :
                     license.status === 'activated' ? 'Активована' :
                     license.status === 'generated' ? 'Згенерована' :
                     license.status === 'expired' ? 'Прострочена' :
                     license.status === 'revoked' ? 'Відкликана' : license.status}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {license.expires_at ? new Date(license.expires_at).toLocaleDateString() : 'N/A'}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {license.users?.email || 'N/A'}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {new Date(license.created_at).toLocaleDateString()}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  <div className="flex space-x-2">
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(license.license_key);
                        alert('Ключ скопійовано в буфер обміну!');
                      }}
                      className="text-blue-600 hover:text-blue-800 text-xs px-2 py-1 border border-blue-300 rounded"
                      title="Копіювати ключ"
                    >
                      📋
                    </button>
                    <button
                      onClick={() => deleteLicense(license.id)}
                      className="text-red-600 hover:text-red-800 text-xs px-2 py-1 border border-red-300 rounded"
                      title="Видалити ліцензію"
                    >
                      🗑️
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
