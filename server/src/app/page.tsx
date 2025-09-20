import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'ProGran3 Tracking Server',
  description: 'Server for tracking ProGran3 plugin activity',
};

export default function Home() {
  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center">
      <div className="bg-white p-8 rounded-lg shadow-lg max-w-md w-full">
        <h1 className="text-3xl font-bold text-gray-900 mb-4 text-center">
          ProGran3 Tracking Server
        </h1>
        
        <div className="space-y-4">
          <div className="text-center">
            <p className="text-gray-600 mb-2">Server is running successfully!</p>
            <p className="text-sm text-gray-500">
              API endpoints are available at:
            </p>
          </div>
          
          <div className="bg-gray-50 p-4 rounded-lg">
            <h3 className="font-semibold text-gray-800 mb-2">Available Endpoints:</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <span className="font-mono bg-blue-100 px-2 py-1 rounded">
                  POST /api/heartbeat
                </span>
                <span className="text-gray-600 ml-2">Plugin activity tracking</span>
              </li>
              <li>
                <span className="font-mono bg-green-100 px-2 py-1 rounded">
                  GET /api/plugins
                </span>
                <span className="text-gray-600 ml-2">Plugin statistics</span>
              </li>
            </ul>
          </div>
          
          <div className="text-center">
            <p className="text-xs text-gray-400">
              Built with Next.js 14 + TypeScript + Vercel Postgres
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
