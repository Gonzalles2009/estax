'use client'

import { useEffect } from 'react'

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error('Application error:', error)
    
    // Более детальное логирование для script errors
    if (error.message.includes('Script error')) {
      console.error('Script error details:', {
        message: error.message,
        stack: error.stack,
        digest: error.digest,
        userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : 'unknown',
        url: typeof window !== 'undefined' ? window.location.href : 'unknown'
      });
    }
  }, [error])

  // Глобальный обработчик window errors для script errors
  useEffect(() => {
    const handleWindowError = (event: ErrorEvent) => {
      console.error('Window error caught:', {
        message: event.message,
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno,
        error: event.error,
        type: 'window-error'
      });
    };

    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      console.error('Unhandled promise rejection:', {
        reason: event.reason,
        type: 'unhandled-rejection'
      });
    };

    if (typeof window !== 'undefined') {
      window.addEventListener('error', handleWindowError);
      window.addEventListener('unhandledrejection', handleUnhandledRejection);
      
      return () => {
        window.removeEventListener('error', handleWindowError);
        window.removeEventListener('unhandledrejection', handleUnhandledRejection);
      };
    }
  }, [])

  return (
    <div className="min-h-screen bg-cyber-dark flex items-center justify-center p-4">
      <div className="cyber-card max-w-md w-full text-center">
        <h2 className="text-xl font-cyber text-cyber-red mb-4">
          🚨 Произошла ошибка
        </h2>
        <p className="text-cyber-text mb-4">
          {error.message || 'Что-то пошло не так!'}
        </p>
        <div className="space-y-2">
          <button
            onClick={reset}
            className="cyber-button w-full"
          >
            🔄 Попробовать снова
          </button>
          <button
            onClick={() => window.location.href = '/'}
            className="cyber-button w-full bg-cyber-green/10 border-cyber-green text-cyber-green"
          >
            🏠 На главную
          </button>
        </div>
        
        {/* Показываем стек ошибки в dev режиме */}
        {process.env.NODE_ENV === 'development' && (
          <details className="mt-4 text-left">
            <summary className="text-cyber-cyan cursor-pointer">
              Детали ошибки (dev)
            </summary>
            <pre className="text-xs text-cyber-text-muted mt-2 overflow-auto">
              {error.stack}
            </pre>
          </details>
        )}
      </div>
    </div>
  )
} 