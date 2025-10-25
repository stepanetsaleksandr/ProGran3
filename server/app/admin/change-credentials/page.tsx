'use client';

import { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import ChangeCredentialsInstructions from '../../components/ChangeCredentialsInstructions';

export default function ChangeCredentialsPage() {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newUsername, setNewUsername] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [instructions, setInstructions] = useState<any>(null);
  const { logout } = useAuth();

  const validatePassword = (password: string) => {
    const checks = {
      length: password.length >= 20,
      uppercase: /[A-Z]/.test(password),
      lowercase: /[a-z]/.test(password),
      numbers: /[0-9]/.test(password),
      symbols: /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)
    };
    
    const passed = Object.values(checks).filter(Boolean).length;
    
    return {
      valid: passed >= 4,
      checks,
      score: passed
    };
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      // Валідація
      if (newPassword !== confirmPassword) {
        setError('Паролі не співпадають');
        return;
      }

      const validation = validatePassword(newPassword);
      if (!validation.valid) {
        setError('Пароль не відповідає вимогам безпеки');
        return;
      }

      if (newUsername.length < 8) {
        setError('Логін повинен містити мінімум 8 символів');
        return;
      }

      // API запит для зміни облікових даних
      const response = await fetch('/api/admin/change-credentials', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('admin_token')}`
        },
        body: JSON.stringify({
          currentPassword,
          newUsername,
          newPassword,
          confirmPassword
        })
      });

      const data = await response.json();

      if (data.success) {
        setSuccess('Облікові дані готові до оновлення! Перевірте інструкції нижче.');
        setInstructions(data.data);
      } else {
        setError(data.error || 'Помилка при зміні облікових даних');
      }
      
    } catch (err) {
      setError('Помилка при зміні облікових даних');
    } finally {
      setLoading(false);
    }
  };

  const passwordValidation = validatePassword(newPassword);

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <div className="mx-auto h-12 w-12 flex items-center justify-center rounded-full bg-red-100">
            <svg className="h-6 w-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          </div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Зміна облікових даних
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Оновіть логін та пароль адміністратора
          </p>
        </div>

        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="space-y-4">
            <div>
              <label htmlFor="currentPassword" className="block text-sm font-medium text-gray-700">
                Поточний пароль
              </label>
              <input
                id="currentPassword"
                name="currentPassword"
                type="password"
                required
                className="mt-1 relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-red-500 focus:border-red-500 focus:z-10 sm:text-sm"
                placeholder="Введіть поточний пароль"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                disabled={loading}
              />
            </div>

            <div>
              <label htmlFor="newUsername" className="block text-sm font-medium text-gray-700">
                Новий логін
              </label>
              <input
                id="newUsername"
                name="newUsername"
                type="text"
                required
                className="mt-1 relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-red-500 focus:border-red-500 focus:z-10 sm:text-sm"
                placeholder="Введіть новий логін (мін. 8 символів)"
                value={newUsername}
                onChange={(e) => setNewUsername(e.target.value)}
                disabled={loading}
              />
            </div>

            <div>
              <label htmlFor="newPassword" className="block text-sm font-medium text-gray-700">
                Новий пароль
              </label>
              <input
                id="newPassword"
                name="newPassword"
                type="password"
                required
                className="mt-1 relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-red-500 focus:border-red-500 focus:z-10 sm:text-sm"
                placeholder="Введіть новий пароль (мін. 20 символів)"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                disabled={loading}
              />
              
              {/* Валідація паролю */}
              {newPassword && (
                <div className="mt-2 text-xs">
                  <div className="grid grid-cols-2 gap-2">
                    <div className={`flex items-center ${passwordValidation.checks.length ? 'text-green-600' : 'text-red-600'}`}>
                      <span className="mr-1">{passwordValidation.checks.length ? '✅' : '❌'}</span>
                      Довжина ≥20
                    </div>
                    <div className={`flex items-center ${passwordValidation.checks.uppercase ? 'text-green-600' : 'text-red-600'}`}>
                      <span className="mr-1">{passwordValidation.checks.uppercase ? '✅' : '❌'}</span>
                      Великі літери
                    </div>
                    <div className={`flex items-center ${passwordValidation.checks.lowercase ? 'text-green-600' : 'text-red-600'}`}>
                      <span className="mr-1">{passwordValidation.checks.lowercase ? '✅' : '❌'}</span>
                      Малі літери
                    </div>
                    <div className={`flex items-center ${passwordValidation.checks.numbers ? 'text-green-600' : 'text-red-600'}`}>
                      <span className="mr-1">{passwordValidation.checks.numbers ? '✅' : '❌'}</span>
                      Цифри
                    </div>
                    <div className={`flex items-center ${passwordValidation.checks.symbols ? 'text-green-600' : 'text-red-600'}`}>
                      <span className="mr-1">{passwordValidation.checks.symbols ? '✅' : '❌'}</span>
                      Символи
                    </div>
                    <div className="flex items-center">
                      <span className="mr-1">📊</span>
                      Бал: {passwordValidation.score}/5
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700">
                Підтвердження паролю
              </label>
              <input
                id="confirmPassword"
                name="confirmPassword"
                type="password"
                required
                className="mt-1 relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-red-500 focus:border-red-500 focus:z-10 sm:text-sm"
                placeholder="Підтвердіть новий пароль"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                disabled={loading}
              />
            </div>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-md text-sm">
              {error}
            </div>
          )}

          {success && (
            <div className="bg-green-50 border border-green-200 text-green-600 px-4 py-3 rounded-md text-sm">
              {success}
            </div>
          )}

          <div className="flex space-x-4">
            <button
              type="submit"
              disabled={loading}
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Зміна...' : 'Змінити облікові дані'}
            </button>
            
            <button
              type="button"
              onClick={logout}
              className="group relative w-full flex justify-center py-2 px-4 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
            >
              Вийти
            </button>
          </div>
        </form>

        <div className="text-center">
          <p className="text-xs text-gray-500">
            ⚠️ Зміна облікових даних потребує оновлення коду та environment variables
          </p>
        </div>
      </div>

      {/* Інструкції після успішної зміни */}
      {instructions && (
        <ChangeCredentialsInstructions 
          instructions={instructions.instructions}
          code={instructions.code}
        />
      )}
    </div>
  );
}
