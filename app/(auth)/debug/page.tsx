'use client';

import { useCurrentUser } from '@/lib/auth';
import { useEffect, useState } from 'react';

export default function AuthDebug() {
  const { user, isLoading, isAuthenticated, userName, userEmail, orgName, orgType } = useCurrentUser();
  const [cookies, setCookies] = useState<string>('');
  const [localStorage, setLocalStorage] = useState<Record<string, string>>({});

  useEffect(() => {
    // Get cookies
    setCookies(document.cookie);
    
    // Get localStorage
    const localStorageData: Record<string, string> = {};
    for (let i = 0; i < window.localStorage.length; i++) {
      const key = window.localStorage.key(i);
      if (key) {
        localStorageData[key] = window.localStorage.getItem(key) || '';
      }
    }
    setLocalStorage(localStorageData);
  }, []);

  return (
    <div className="min-h-screen bg-gray-950 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-white mb-8">Authentication Debug</h1>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Auth State */}
          <div className="bg-gray-900 rounded-lg p-6">
            <h2 className="text-xl font-semibold text-white mb-4">Auth State</h2>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-400">Loading:</span>
                <span className={isLoading ? 'text-yellow-400' : 'text-green-400'}>
                  {isLoading ? 'Yes' : 'No'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Authenticated:</span>
                <span className={isAuthenticated ? 'text-green-400' : 'text-red-400'}>
                  {isAuthenticated ? 'Yes' : 'No'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">User ID:</span>
                <span className="text-white">{user?.id || 'None'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Name:</span>
                <span className="text-white">{userName || 'None'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Email:</span>
                <span className="text-white">{userEmail || 'None'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Role:</span>
                <span className="text-white">{user?.role || 'None'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Org Name:</span>
                <span className="text-white">{orgName || 'None'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Org Type:</span>
                <span className="text-white">{orgType || 'None'}</span>
              </div>
            </div>
          </div>

          {/* User Object */}
          <div className="bg-gray-900 rounded-lg p-6">
            <h2 className="text-xl font-semibold text-white mb-4">User Object</h2>
            <pre className="text-xs text-gray-300 overflow-auto max-h-64">
              {JSON.stringify(user, null, 2)}
            </pre>
          </div>

          {/* Cookies */}
          <div className="bg-gray-900 rounded-lg p-6">
            <h2 className="text-xl font-semibold text-white mb-4">Cookies</h2>
            <div className="text-xs text-gray-300 space-y-1">
              {cookies.split(';').map((cookie, i) => (
                <div key={i} className="break-all">
                  {cookie.trim()}
                </div>
              ))}
            </div>
          </div>

          {/* LocalStorage */}
          <div className="bg-gray-900 rounded-lg p-6">
            <h2 className="text-xl font-semibold text-white mb-4">LocalStorage</h2>
            <div className="text-xs text-gray-300 space-y-1">
              {Object.entries(localStorage).map(([key, value]) => (
                <div key={key} className="break-all">
                  <span className="text-yellow-400">{key}:</span> {value}
                </div>
              ))}
              {Object.keys(localStorage).length === 0 && (
                <div className="text-gray-500">No localStorage data</div>
              )}
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="mt-8 flex gap-4">
          <button
            onClick={() => window.location.href = '/signin'}
            className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-500"
          >
            Go to Sign In
          </button>
          <button
            onClick={() => window.location.href = '/clear-session'}
            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-500"
          >
            Clear Session
          </button>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-500"
          >
            Refresh Page
          </button>
        </div>
      </div>
    </div>
  );
}