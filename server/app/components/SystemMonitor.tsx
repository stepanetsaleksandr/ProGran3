'use client';

import { useState, useEffect } from 'react';

interface SystemInfo {
  id: string;
  fingerprint_hash: string;
  system_data: any;
  last_seen: string;
  created_at: string;
  licenses: {
    license_key: string;
    status: string;
    users: {
      email: string;
    };
  };
}

export default function SystemMonitor() {
  const [systems, setSystems] = useState<SystemInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [autoRefresh, setAutoRefresh] = useState(true);

  useEffect(() => {
    fetchSystems();
    
    // Auto-refresh кожні 30 секунд
    const interval = setInterval(() => {
      if (autoRefresh) {
        fetchSystems();
      }
    }, 30000);
    
    return () => clearInterval(interval);
  }, [autoRefresh]);

  const fetchSystems = async () => {
    try {
      setLoading(systems.length === 0); // Показуємо loading тільки при першому завантаженні
      setError(null);
      const response = await fetch('/api/systems');
      const data = await response.json();
      
      if (data.success) {
        setSystems(data.data || []);
      } else {
        setError(data.error || 'Помилка завантаження систем');
      }
    } catch (error) {
      console.error('Error fetching systems:', error);
      setError('Помилка підключення до сервера');
    } finally {
      setLoading(false);
    }
  };
  
  // Форматування часу
  const formatRelativeTime = (dateString: string): string => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);
    
    if (diffMins < 1) return 'Щойно';
    if (diffMins < 60) return `${diffMins} хв тому`;
    if (diffHours < 24) return `${diffHours} год тому`;
    return `${diffDays} дн тому`;
  };
  
  // Форматування тривалості сесії
  const formatDuration = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    
    if (hours > 0) return `${hours}год ${mins}хв`;
    if (mins > 0) return `${mins}хв`;
    return `${seconds}сек`;
  };
  
  // Статус активності
  const getActivityStatus = (lastSeen: string): { text: string; color: string } => {
    const diffMs = Date.now() - new Date(lastSeen).getTime();
    const diffMins = Math.floor(diffMs / 60000);
    
    if (diffMins < 15) return { text: 'Активна зараз', color: 'green' };
    if (diffMins < 60) return { text: 'Активна нещодавно', color: 'blue' };
    if (diffMins < 1440) return { text: 'Активна сьогодні', color: 'yellow' };
    return { text: 'Неактивна', color: 'red' };
  };

  if (loading) {
    return (
      <div className="text-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
        <p className="mt-2 text-gray-600">Завантаження систем...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-lg shadow">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-medium text-gray-900">Моніторинг систем</h2>
        </div>
        <div className="px-6 py-8 text-center">
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
            <p className="font-bold">Помилка завантаження</p>
            <p className="text-sm mt-1">{error}</p>
            <button 
              onClick={fetchSystems}
              className="mt-3 bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700"
            >
              Спробувати знову
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow">
      <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
        <h2 className="text-lg font-medium text-gray-900">Моніторинг систем</h2>
        <div className="flex items-center gap-4">
          <label className="flex items-center gap-2 text-sm text-gray-600">
            <input 
              type="checkbox" 
              checked={autoRefresh}
              onChange={(e) => setAutoRefresh(e.target.checked)}
              className="rounded border-gray-300"
            />
            Auto-refresh (30s)
          </label>
          <button
            onClick={fetchSystems}
            className="text-blue-600 hover:text-blue-800 text-sm font-medium"
          >
            Оновити
          </button>
        </div>
      </div>

      {systems.length === 0 ? (
        <div className="px-6 py-8 text-center">
          <div className="text-gray-500">
            <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z" />
            </svg>
            <h3 className="mt-2 text-sm font-medium text-gray-900">Немає систем</h3>
            <p className="mt-1 text-sm text-gray-500">Системи ще не підключені або не активні</p>
          </div>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Користувач / Система
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Версія плагіна
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Остання активність
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Статус
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {systems.map((system) => {
                const systemData = system.system_data || {};
                const activityStatus = getActivityStatus(system.last_seen);
                const isActive = activityStatus.color === 'green' || activityStatus.color === 'blue';
                
                return (
                  <tr key={system.id} className={isActive ? 'bg-green-50' : ''}>
                    <td className="px-6 py-4">
                      <div className="flex flex-col">
                        <div className="text-sm font-medium text-gray-900">
                          {system.licenses?.users?.email || 'Немає email'}
                        </div>
                        <div className="text-sm text-gray-500 font-mono">
                          PC: {system.fingerprint_hash.substring(0, 16)}...
                        </div>
                        <div className="text-xs text-gray-400 mt-1">
                          {systemData.platform || 'Unknown'} | SketchUp {systemData.sketchup_version || '?'}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {systemData.plugin_version || 'Unknown'}
                      </div>
                      {systemData.last_startup && (
                        <div className="text-xs text-gray-500 mt-1">
                          Старт: {formatRelativeTime(systemData.last_startup)}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col">
                        <div className="text-sm text-gray-900">
                          {formatRelativeTime(system.last_seen)}
                        </div>
                        <div className="text-xs text-gray-500 mt-1">
                          {new Date(system.last_seen).toLocaleString('uk-UA')}
                        </div>
                        {systemData.session_duration && (
                          <div className="text-xs text-blue-600 mt-1">
                            Сесія: {formatDuration(systemData.session_duration)}
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium
                        ${activityStatus.color === 'green' ? 'bg-green-100 text-green-800' :
                          activityStatus.color === 'blue' ? 'bg-blue-100 text-blue-800' :
                          activityStatus.color === 'yellow' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-red-100 text-red-800'}`}
                      >
                        <span className={`mr-1 h-2 w-2 rounded-full
                          ${activityStatus.color === 'green' ? 'bg-green-400 animate-pulse' :
                            activityStatus.color === 'blue' ? 'bg-blue-400' :
                            activityStatus.color === 'yellow' ? 'bg-yellow-400' :
                            'bg-red-400'}`}
                        ></span>
                        {activityStatus.text}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
      
      <div className="px-6 py-3 bg-gray-50 border-t border-gray-200 text-xs text-gray-500">
        <div className="flex justify-between items-center">
          <div>
            Всього систем: {systems.length} | 
            Активних: {systems.filter(s => getActivityStatus(s.last_seen).color === 'green' || getActivityStatus(s.last_seen).color === 'blue').length}
          </div>
          <div>
            Останнє оновлення: {new Date().toLocaleTimeString('uk-UA')}
          </div>
        </div>
      </div>
    </div>
  );
}
