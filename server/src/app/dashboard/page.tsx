'use client';

import { useState, useEffect } from 'react';

interface Plugin {
  id: number;
  plugin_id: string;
  plugin_name: string;
  version: string;
  user_id: string;
  computer_name: string;
  system_info: {
    os: string;
    architecture: string;
    ruby_version: string;
    sketchup_version: string;
  };
  ip_address: string;
  last_heartbeat: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

interface Stats {
  total_plugins: number;
  active_plugins: number;
  recent_plugins: number;
}

export default function Dashboard() {
  const [plugins, setPlugins] = useState<Plugin[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [lastUpdate, setLastUpdate] = useState<string>('');

  const fetchData = async () => {
    try {
      const response = await fetch('/api/plugins');
      const data = await response.json();
      
      if (data.success) {
        setPlugins(data.data.plugins);
        setStats(data.data.stats);
        setLastUpdate(data.data.last_updated);
      }
    } catch (error) {
      // Handle error silently - could be network issue or server problem
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    // Оновлюємо дані кожні 10 секунд
    const interval = setInterval(fetchData, 10000);
    return () => clearInterval(interval);
  }, []);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('uk-UA');
  };

  const getStatusColor = (isActive: boolean, lastHeartbeat: string) => {
    const now = new Date();
    const lastBeat = new Date(lastHeartbeat);
    const diffMinutes = (now.getTime() - lastBeat.getTime()) / (1000 * 60);
    
    if (diffMinutes > 3) return 'bg-red-100 text-red-800 border-red-200'; // Неактивний > 3 хв
    if (diffMinutes > 2) return 'bg-yellow-100 text-yellow-800 border-yellow-200'; // Попередження > 2 хв
    return 'bg-green-100 text-green-800 border-green-200'; // Активний < 2 хв
  };

  const getStatusText = (isActive: boolean, lastHeartbeat: string) => {
    const now = new Date();
    const lastBeat = new Date(lastHeartbeat);
    const diffMinutes = (now.getTime() - lastBeat.getTime()) / (1000 * 60);
    
    if (diffMinutes > 3) return 'Неактивний';
    if (diffMinutes > 2) return 'Попередження';
    return 'Активний';
  };

  const getStatusIcon = (isActive: boolean, lastHeartbeat: string) => {
    const now = new Date();
    const lastBeat = new Date(lastHeartbeat);
    const diffMinutes = (now.getTime() - lastBeat.getTime()) / (1000 * 60);
    
    if (diffMinutes > 3) return '🔴';
    if (diffMinutes > 2) return '🟡';
    return '🟢';
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Завантаження даних...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-bold text-gray-900 mb-2">
                ProGran3 Dashboard
              </h1>
              <p className="text-gray-600 text-lg">
                Моніторинг активності плагінів ProGran3
              </p>
              <p className="text-sm text-gray-500 mt-2">
                Останнє оновлення: {formatDate(lastUpdate)}
              </p>
            </div>
            <div className="flex space-x-4">
              <button 
                onClick={fetchData}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center"
              >
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                Оновити
              </button>
              <a 
                href="/"
                className="bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition-colors flex items-center"
              >
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
                Назад
              </a>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                  </svg>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Всього плагінів</p>
                  <p className="text-2xl font-semibold text-gray-900">{stats.total_plugins}</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center">
                <div className="p-2 bg-green-100 rounded-lg">
                  <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Активних</p>
                  <p className="text-2xl font-semibold text-gray-900">{stats.active_plugins}</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center">
                <div className="p-2 bg-yellow-100 rounded-lg">
                  <svg className="w-6 h-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Недавніх</p>
                  <p className="text-2xl font-semibold text-gray-900">{stats.recent_plugins}</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Plugins Table */}
        <div className="bg-white rounded-xl shadow-lg overflow-hidden">
          <div className="px-6 py-4 bg-gradient-to-r from-blue-600 to-purple-600">
            <h2 className="text-xl font-semibold text-white">Активні плагіни</h2>
            <p className="text-blue-100 text-sm mt-1">
              {plugins.length} плагінів знайдено
            </p>
          </div>
          
          {plugins.length === 0 ? (
            <div className="px-6 py-12 text-center">
              <p className="text-gray-500">Плагіни не знайдені</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Користувач
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Комп'ютер
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      SketchUp
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Статус
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Останній heartbeat
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      IP адреса
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {plugins.map((plugin) => (
                    <tr key={plugin.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {plugin.user_id}
                          </div>
                          <div className="text-sm text-gray-500">
                            ID: {plugin.plugin_id}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {plugin.computer_name}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {plugin.system_info.sketchup_version}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getStatusColor(plugin.is_active, plugin.last_heartbeat)}`}>
                          <span className="mr-1">{getStatusIcon(plugin.is_active, plugin.last_heartbeat)}</span>
                          {getStatusText(plugin.is_active, plugin.last_heartbeat)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {formatDate(plugin.last_heartbeat)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {plugin.ip_address}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Auto-refresh indicator */}
        <div className="mt-4 text-center">
          <p className="text-sm text-gray-500">
            Автоматичне оновлення кожні 10 секунд
          </p>
        </div>
      </div>
    </div>
  );
}
