'use client';

import React, { Component, ErrorInfo, ReactNode } from 'react';
import { Button } from './ui/Button';
import { AlertTriangle, RefreshCw, Home, Bug } from 'lucide-react';
import Link from 'next/link';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
  showDetails: boolean;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
    errorInfo: null,
    showDetails: false,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error, errorInfo: null, showDetails: false };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error:', error, errorInfo);
    this.setState({ errorInfo });
    
    // Call optional error handler
    this.props.onError?.(error, errorInfo);
    
    // Send error to Sentry in production
    if (process.env.NODE_ENV === 'production') {
      import('@/lib/monitoring/sentry').then(({ captureException }) => {
        captureException(error, {
          extra: {
            componentStack: errorInfo.componentStack,
          },
        });
      });
    }
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: null, errorInfo: null, showDetails: false });
  };

  private handleReload = () => {
    window.location.reload();
  };

  private toggleDetails = () => {
    this.setState(prev => ({ showDetails: !prev.showDetails }));
  };

  public render() {
    if (this.state.hasError) {
      // Custom fallback UI
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4 py-12">
          <div className="max-w-lg w-full">
            {/* Error Card */}
            <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
              {/* Header */}
              <div className="bg-gradient-to-r from-red-500 to-red-600 px-6 py-8 text-center">
                <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4">
                  <AlertTriangle className="w-8 h-8 text-white" />
                </div>
                <h1 className="text-2xl font-bold text-white">
                  Something Went Wrong
                </h1>
                <p className="text-red-100 mt-2">
                  We apologize for the inconvenience
                </p>
              </div>

              {/* Content */}
              <div className="px-6 py-6">
                <p className="text-gray-600 text-center mb-6">
                  The application encountered an unexpected error. You can try refreshing the page or return to the homepage.
                </p>

                {/* Error Message */}
                {this.state.error && (
                  <div className="mb-6 p-4 bg-red-50 border border-red-100 rounded-lg">
                    <p className="text-sm text-red-700 font-medium mb-1">Error Message:</p>
                    <p className="text-sm text-red-600 font-mono break-all">
                      {process.env.NODE_ENV === 'production'
                        ? 'An unexpected error occurred. Please try again.'
                        : this.state.error.message}
                    </p>
                  </div>
                )}

                {/* Action Buttons */}
                <div className="flex flex-col sm:flex-row gap-3 justify-center">
                  <Button 
                    onClick={this.handleReload}
                    className="bg-[#339999] hover:bg-[#2a8080]"
                  >
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Refresh Page
                  </Button>

                  <Button 
                    onClick={this.handleReset}
                    variant="outline"
                  >
                    Try Again
                  </Button>

                  <Link href="/">
                    <Button variant="ghost">
                      <Home className="w-4 h-4 mr-2" />
                      Go Home
                    </Button>
                  </Link>
                </div>

                {/* Show Details Toggle */}
                <div className="mt-6 text-center">
                  <button
                    onClick={this.toggleDetails}
                    className="text-sm text-gray-400 hover:text-gray-600 flex items-center justify-center gap-1 mx-auto transition-colors"
                  >
                    <Bug className="w-3 h-3" />
                    {this.state.showDetails ? 'Hide Technical Details' : 'Show Technical Details'}
                  </button>
                </div>

                {/* Technical Details */}
                {this.state.showDetails && this.state.errorInfo && (
                  <div className="mt-4 p-4 bg-gray-900 rounded-lg overflow-auto max-h-64">
                    {process.env.NODE_ENV === 'production' ? (
                      <p className="text-xs text-gray-300">Technical details are hidden in production for security.</p>
                    ) : (
                      <pre className="text-xs text-gray-300 font-mono whitespace-pre-wrap">
                        {this.state.errorInfo.componentStack}
                      </pre>
                    )}
                  </div>
                )}

                {/* Support Info */}
                <div className="mt-6 pt-6 border-t border-gray-100 text-center">
                  <p className="text-sm text-gray-400">
                    If this problem persists, please contact our support team
                  </p>
                  <a 
                    href="mailto:support@mdlooker.com" 
                    className="text-sm text-[#339999] hover:underline mt-1 inline-block"
                  >
                    support@mdlooker.com
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

// Hook for functional components to handle errors
export function useErrorHandler() {
  const [error, setError] = React.useState<Error | null>(null);

  React.useEffect(() => {
    if (error) {
      console.error('Error caught by useErrorHandler:', error);
    }
  }, [error]);

  return { error, setError, clearError: () => setError(null) };
}

// Error fallback component for specific sections
interface ErrorFallbackProps {
  error: Error;
  resetError: () => void;
  title?: string;
  description?: string;
}

export function ErrorFallback({ 
  error, 
  resetError, 
  title = 'Something went wrong',
  description = 'An error occurred while loading this section.'
}: ErrorFallbackProps) {
  return (
    <div className="p-6 bg-red-50 border border-red-100 rounded-lg">
      <div className="flex items-start gap-3">
        <AlertTriangle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
        <div className="flex-1">
          <h3 className="font-semibold text-red-800">{title}</h3>
          <p className="text-sm text-red-600 mt-1">{description}</p>
          {error.message && process.env.NODE_ENV !== 'production' && (
            <p className="text-xs text-red-500 mt-2 font-mono">{error.message}</p>
          )}
          <Button 
            onClick={resetError} 
            size="sm" 
            variant="outline"
            className="mt-3"
          >
            <RefreshCw className="w-3 h-3 mr-1" />
            Retry
          </Button>
        </div>
      </div>
    </div>
  );
}
