'use client';

import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle } from 'lucide-react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

/**
 * ErrorBoundary component implementing Monitoring & Error Handling from section 16
 * - Catches React errors in child component tree
 * - Displays user-friendly error messages
 * - Logs detailed error information for monitoring
 */
export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
    errorInfo: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    // Update state so the next render will show the fallback UI
    return { hasError: true, error, errorInfo: null };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    // Log the error to an error reporting service
    console.error('Uncaught error:', error, errorInfo);
    
    // In production, you would send this to your error tracking service (e.g., Sentry)
    this.logErrorToService(error, errorInfo);
    
    this.setState({ errorInfo });
  }

  private logErrorToService(error: Error, errorInfo: ErrorInfo): void {
    // Implementation would connect to your error monitoring service
    // For example, with Sentry:
    /*
    Sentry.withScope((scope) => {
      scope.setExtras(errorInfo);
      Sentry.captureException(error);
    });
    */
    
    // For now, we'll just log to console with more context
    console.group('Error details for monitoring');
    console.error('Error name:', error.name);
    console.error('Error message:', error.message);
    console.error('Component stack:', errorInfo.componentStack);
    console.error('Timestamp:', new Date().toISOString());
    console.error('User agent:', navigator.userAgent);
    console.error('URL:', window.location.href);
    console.groupEnd();
  }

  private handleReset = (): void => {
    this.setState({ hasError: false, error: null, errorInfo: null });
  };

  public render(): ReactNode {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }
      
      // Default fallback UI
      return (
        <div className="rounded-md bg-red-50 p-4 my-4" role="alert">
          <div className="flex">
            <div className="flex-shrink-0">
              <AlertTriangle className="h-5 w-5 text-red-400" aria-hidden="true" />
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">An unexpected error occurred</h3>
              <div className="mt-2 text-sm text-red-700">
                <p>
                  {this.state.error?.message || 'Something went wrong. Please try again later.'}
                </p>
              </div>
              <div className="mt-4">
                <button
                  type="button"
                  onClick={this.handleReset}
                  className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-red-700 bg-red-100 hover:bg-red-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                >
                  Try again
                </button>
              </div>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
