'use client';

import { useState, useEffect } from 'react';

interface License {
  id: string;
  license_key: string;
  duration_days: number;
  description: string;
  status: 'generated' | 'activated';
  created_at: string;
  activated_at: string | null;
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
      const response = await fetch('/api/licenses/keys');
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
          activated_at: null,
          users: null
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
              onClick={checkDatabase}
              className="bg-gray-600 text-white px-4 py-2 rounded-md hover:bg-gray-700"
            >
              Перевірити БД
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
                    license.status === 'activated' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                  }`}>
                    {license.status === 'activated' ? 'Активовано' : 'Неактивовано'}
                  </span>
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
