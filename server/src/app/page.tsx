import { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'ProGran3 Tracking Server',
  description: 'Server for tracking ProGran3 plugin activity',
};

export default function Home() {
  return (
    <div className="min-h-screen bg-red-500 flex items-center justify-center p-4">
      <div className="bg-yellow-400 p-8 rounded-xl shadow-xl max-w-2xl w-full">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            ProGran3 Tracking Server
          </h1>
          <p className="text-gray-600">
            Моніторинг активності плагінів ProGran3
          </p>
        </div>
        
        <div className="space-y-6">
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-green-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-green-800">
                  Сервер працює успішно!
                </p>
              </div>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h3 className="font-semibold text-blue-800 mb-2">API Endpoints</h3>
              <ul className="space-y-2 text-sm">
                <li className="flex items-center">
                  <span className="font-mono bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs">
                    POST /api/heartbeat
                  </span>
                  <span className="text-blue-600 ml-2">Відстеження активності</span>
                </li>
                <li className="flex items-center">
                  <span className="font-mono bg-green-100 text-green-800 px-2 py-1 rounded text-xs">
                    GET /api/plugins
                  </span>
                  <span className="text-green-600 ml-2">Статистика плагінів</span>
                </li>
              </ul>
            </div>
            
            <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
              <h3 className="font-semibold text-purple-800 mb-2">Швидкі дії</h3>
              <div className="space-y-2">
                <Link 
                  href="/dashboard" 
                  className="block w-full bg-purple-600 text-white text-center py-2 px-4 rounded-lg hover:bg-purple-700 transition-colors"
                >
                  Перейти до Dashboard
                </Link>
                <a 
                  href="/api/plugins" 
                  target="_blank"
                  className="block w-full bg-gray-600 text-white text-center py-2 px-4 rounded-lg hover:bg-gray-700 transition-colors"
                >
                  Перевірити API
                </a>
              </div>
            </div>
          </div>
          
          <div className="text-center">
            <p className="text-xs text-gray-500">
              Побудовано з Next.js 14 + TypeScript + Supabase
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
