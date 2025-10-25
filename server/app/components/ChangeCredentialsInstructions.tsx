'use client';

import { useState } from 'react';

interface InstructionsProps {
  instructions: {
    step1: string;
    step2: string;
    step3: string;
    step4: string;
    newCredentials: {
      username: string;
      password: string;
    };
  };
  code: {
    typescript: string;
  };
}

export default function ChangeCredentialsInstructions({ instructions, code }: InstructionsProps) {
  const [showCode, setShowCode] = useState(false);
  const [copied, setCopied] = useState('');

  const copyToClipboard = async (text: string, type: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(type);
      setTimeout(() => setCopied(''), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  return (
    <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-6">
      <h3 className="text-lg font-semibold text-blue-900 mb-4">
        📋 Інструкції для оновлення облікових даних
      </h3>
      
      <div className="space-y-4">
        <div className="bg-white p-4 rounded border">
          <h4 className="font-medium text-gray-900 mb-2">🔧 Крок 1: Оновіть Environment Variables</h4>
          <div className="space-y-2">
            <div className="flex items-center justify-between bg-gray-100 p-2 rounded">
              <code className="text-sm">{instructions.step2}</code>
              <button
                onClick={() => copyToClipboard(instructions.step2, 'step2')}
                className="ml-2 px-2 py-1 bg-blue-500 text-white text-xs rounded hover:bg-blue-600"
              >
                {copied === 'step2' ? '✅' : '📋'}
              </button>
            </div>
            <div className="flex items-center justify-between bg-gray-100 p-2 rounded">
              <code className="text-sm">{instructions.step3}</code>
              <button
                onClick={() => copyToClipboard(instructions.step3, 'step3')}
                className="ml-2 px-2 py-1 bg-blue-500 text-white text-xs rounded hover:bg-blue-600"
              >
                {copied === 'step3' ? '✅' : '📋'}
              </button>
            </div>
          </div>
        </div>

        <div className="bg-white p-4 rounded border">
          <h4 className="font-medium text-gray-900 mb-2">🚀 Крок 2: Деплой</h4>
          <div className="flex items-center justify-between bg-gray-100 p-2 rounded">
            <code className="text-sm">{instructions.step4}</code>
            <button
              onClick={() => copyToClipboard(instructions.step4, 'step4')}
              className="ml-2 px-2 py-1 bg-blue-500 text-white text-xs rounded hover:bg-blue-600"
            >
              {copied === 'step4' ? '✅' : '📋'}
            </button>
          </div>
        </div>

        <div className="bg-white p-4 rounded border">
          <h4 className="font-medium text-gray-900 mb-2">🔑 Нові облікові дані</h4>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Логін:</span>
              <div className="flex items-center">
                <code className="text-sm font-mono bg-gray-100 px-2 py-1 rounded">
                  {instructions.newCredentials.username}
                </code>
                <button
                  onClick={() => copyToClipboard(instructions.newCredentials.username, 'username')}
                  className="ml-2 px-2 py-1 bg-blue-500 text-white text-xs rounded hover:bg-blue-600"
                >
                  {copied === 'username' ? '✅' : '📋'}
                </button>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Пароль:</span>
              <div className="flex items-center">
                <code className="text-sm font-mono bg-gray-100 px-2 py-1 rounded">
                  {'*'.repeat(instructions.newCredentials.password.length)}
                </code>
                <button
                  onClick={() => copyToClipboard(instructions.newCredentials.password, 'password')}
                  className="ml-2 px-2 py-1 bg-blue-500 text-white text-xs rounded hover:bg-blue-600"
                >
                  {copied === 'password' ? '✅' : '📋'}
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white p-4 rounded border">
          <div className="flex items-center justify-between mb-2">
            <h4 className="font-medium text-gray-900">💻 Код для оновлення</h4>
            <button
              onClick={() => setShowCode(!showCode)}
              className="px-3 py-1 bg-gray-500 text-white text-xs rounded hover:bg-gray-600"
            >
              {showCode ? 'Сховати' : 'Показати'}
            </button>
          </div>
          
          {showCode && (
            <div className="relative">
              <pre className="bg-gray-900 text-green-400 p-4 rounded text-sm overflow-x-auto">
                <code>{code.typescript}</code>
              </pre>
              <button
                onClick={() => copyToClipboard(code.typescript, 'code')}
                className="absolute top-2 right-2 px-2 py-1 bg-blue-500 text-white text-xs rounded hover:bg-blue-600"
              >
                {copied === 'code' ? '✅' : '📋'}
              </button>
            </div>
          )}
        </div>

        <div className="bg-yellow-50 border border-yellow-200 p-4 rounded">
          <h4 className="font-medium text-yellow-900 mb-2">⚠️ Важливо!</h4>
          <ul className="text-sm text-yellow-800 space-y-1">
            <li>• Збережіть нові облікові дані в безпечному місці</li>
            <li>• Після деплою протестуйте нові облікові дані</li>
            <li>• Старі облікові дані перестануть працювати</li>
            <li>• Рекомендується змінювати паролі регулярно</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
