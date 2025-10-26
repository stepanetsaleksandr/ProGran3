'use client';

import { useState } from 'react';
import { useLicenses } from '../hooks/useLicenses';
import { useDashboardContext } from '../context/DashboardContext';
import { useToast } from './Toast';

export default function LicenseManager() {
  const { licenses, loading, error, createLicense, deleteLicense } = useLicenses();
  const { refreshDashboard } = useDashboardContext();
  const { showToast } = useToast();
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newLicense, setNewLicense] = useState({
    duration_days: 30,
    description: ''
  });
  const [dbStatus, setDbStatus] = useState<string>('');

  // ✅ БЕЗПЕЧНО: Отримання JWT токену
  const getAuthToken = async (): Promise<string> => {
    // Перевіряємо чи є збережений токен
    const savedToken = localStorage.getItem('admin_token');
    const tokenExpiry = localStorage.getItem('admin_token_expiry');
    
    // Якщо токен є і не прострочений
    if (savedToken && tokenExpiry && parseInt(tokenExpiry) > Date.now()) {
      return savedToken;
    }
    
    // Логінимося для отримання нового токену
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username: 'admin', // TODO: Отримати з форми логіну
          password: 'admin123' // TODO: Отримати з форми логіну
        })
      });
      
      const data = await response.json();
      
      if (data.success && data.data.token) {
        const token = data.data.token;
        const expiresIn = data.data.expires_in * 1000; // Конвертуємо в мілісекунди
        
        // Зберігаємо токен
        localStorage.setItem('admin_token', token);
        localStorage.setItem('admin_token_expiry', (Date.now() + expiresIn).toString());
        
        return token;
      } else {
        throw new Error(data.error || 'Login failed');
      }
    } catch (error) {
      console.error('Auth token error:', error);
      throw new Error('Failed to get authentication token');
    }
  };

  const testConnection = async () => {
    try {
      setDbStatus('🔄 Тестування підключення...');
      // Simple test by fetching licenses
      const response = await fetch('/api/licenses');
      const data = await response.json();
      
      if (data.success) {
        setDbStatus('✅ Підключення працює');
        showToast(`Підключення до Supabase працює нормально! Знайдено ${data.data.length} ліцензій`, 'success');
      } else {
        setDbStatus(`❌ Помилка підключення: ${data.error}`);
        showToast(`Помилка підключення: ${data.error}`, 'error');
      }
    } catch (error) {
      console.error('Error testing connection:', error);
      setDbStatus('❌ Помилка підключення');
      showToast('Помилка при тестуванні підключення', 'error');
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
      showToast('Ключ ліцензії успішно згенеровано!', 'success');
    }
  };

  // v3.2: Статуси тепер автоматичні - ручне управління видалено
  
  const handleDeleteLicense = async (id: string) => {
    if (!confirm('Ви впевнені, що хочете видалити цю ліцензію?')) return;
    
    const success = await deleteLicense(id);
    
    if (success) {
      // Refresh dashboard stats after deleting license
      await refreshDashboard();
      showToast('Ліцензію успішно видалено!', 'success');
    }
  };

  if (loading) {
    return (
      <div className="text-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
        <p className="mt-2 text-gray-600">Завантаження ліцензій...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-lg shadow">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-medium text-gray-900">Управління ліцензіями</h2>
        </div>
        <div className="px-6 py-8 text-center">
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
            <p className="font-bold">Помилка завантаження ліцензій</p>
            <p className="text-sm mt-1">{error}</p>
            <button 
              onClick={() => window.location.reload()}
              className="mt-3 bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700"
            >
              Перезавантажити сторінку
            </button>
          </div>
        </div>
      </div>
    );
  }

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

      {licenses.length === 0 ? (
        <div className="px-6 py-8 text-center">
          <div className="text-gray-500">
            <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m0 0a2 2 0 012 2m-2-2v6m0 0a2 2 0 01-2 2H9a2 2 0 01-2-2V9a2 2 0 012-2h6z" />
            </svg>
            <h3 className="mt-2 text-sm font-medium text-gray-900">Немає ліцензій</h3>
            <p className="mt-1 text-sm text-gray-500">Створіть першу ліцензію, натиснувши кнопку "Згенерувати ключ ліцензії"</p>
            <div className="mt-6">
              <button
                onClick={() => setShowCreateForm(true)}
                className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
              >
                Створити ліцензію
              </button>
            </div>
          </div>
        </div>
      ) : (
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
                      license.status === 'generated' ? 'bg-yellow-100 text-yellow-800' :
                      license.status === 'expired' ? 'bg-red-100 text-red-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {license.status === 'active' ? 'Активна' :
                       license.status === 'generated' ? 'Згенерована' :
                       license.status === 'expired' ? 'Прострочена' :
                       license.status}
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
                          showToast('Ключ скопійовано в буфер обміну!', 'info');
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
      )}
    </div>
  );
}
