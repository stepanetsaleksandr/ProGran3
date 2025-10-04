'use client';

import { useState } from 'react';
import { useLicenses } from '../hooks/useLicenses';
import { useDashboardContext } from '../context/DashboardContext';

export default function LicenseManager() {
  const { licenses, loading, error, createLicense, deleteLicense } = useLicenses();
  const { refreshDashboard } = useDashboardContext();
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newLicense, setNewLicense] = useState({
    duration_days: 30,
    description: ''
  });
  const [dbStatus, setDbStatus] = useState<string>('');



  const testConnection = async () => {
    try {
      setDbStatus('🔄 Тестування підключення...');
      // Simple test by fetching licenses
      const response = await fetch('/api/licenses');
      const data = await response.json();
      
      if (data.success) {
        setDbStatus('✅ Підключення працює');
        alert(`✅ Підключення до Supabase працює нормально!\n\nТаблиця licenses доступна:\n- Знайдено ${data.data.length} ліцензій`);
      } else {
        setDbStatus(`❌ Помилка підключення: ${data.error}`);
        alert(`❌ Помилка підключення: ${data.error}`);
      }
    } catch (error) {
      console.error('Error testing connection:', error);
      setDbStatus('❌ Помилка підключення');
      alert('Помилка при тестуванні підключення');
    }
  };


  const handleCreateLicense = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const success = await createLicense(newLicense);
    
    if (success) {
      setShowCreateForm(false);
      setNewLicense({ duration_days: 30, description: '' });
      // Refresh dashboard stats after creating license
      await refreshDashboard();
      alert('Ключ ліцензії успішно згенеровано!');
    }
  };

  const handleDeleteLicense = async (id: string) => {
    if (!confirm('Ви впевнені, що хочете видалити цю ліцензію?')) return;
    
    const success = await deleteLicense(id);
    
    if (success) {
      // Refresh dashboard stats after deleting license
      await refreshDashboard();
      alert('Ліцензію успішно видалено!');
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
          <form onSubmit={handleCreateLicense} className="space-y-4">
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
            {licenses.map((license) => (
              <tr key={license.id}>
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
                  {license.expires_at ? 
                    new Date(license.expires_at).toLocaleDateString() : 
                    license.activated_at && license.duration_days ? 
                      new Date(new Date(license.activated_at).getTime() + license.duration_days * 24 * 60 * 60 * 1000).toLocaleDateString() :
                      'N/A'
                  }
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
                      onClick={() => handleDeleteLicense(license.id)}
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
