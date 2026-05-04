'use client';

import { useEffect } from 'react';

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('Dashboard error:', error);
  }, [error]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full mx-auto p-8 text-center">
        <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg className="w-8 h-8 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
          </svg>
        </div>
        <h2 className="text-xl font-bold text-gray-900 mb-2">Dashboard Error</h2>
        <p className="text-gray-600 mb-4 text-sm">
          Something went wrong while loading the dashboard. Please try again.
        </p>
        <div className="flex flex-col gap-3">
          <button
            onClick={() => reset()}
            className="w-full px-4 py-2 bg-[#339999] text-white rounded-lg hover:bg-[#2a8080] transition-colors font-medium"
          >
            Try Again
          </button>
          <button
            onClick={() => {
              localStorage.clear();
              sessionStorage.clear();
              document.cookie = 'demo_session=; path=/; max-age=0';
              window.location.href = '/auth/login';
            }}
            className="w-full px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
          >
            Clear Session & Re-login
          </button>
          <a
            href="/"
            className="text-sm text-[#339999] hover:underline"
          >
            Back to Home
          </a>
        </div>
        {error.message && (
          <details className="mt-4 text-left">
            <summary className="text-xs text-gray-400 cursor-pointer hover:text-gray-600">
              Error Details
            </summary>
            <pre className="mt-2 text-xs text-red-600 bg-red-50 p-3 rounded-lg overflow-auto max-h-32">
              {error.message}
            </pre>
          </details>
        )}
      </div>
    </div>
  );
}
