/**
 * ErrorBoundary.tsx
 * 
 * PHASE 18: Production error boundary for graceful failure handling.
 * 
 * Catches React rendering errors and displays a fallback UI with recovery options.
 * Logs errors to console for debugging and can be extended to send to error tracking service.
 */

import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCcw, Home } from 'lucide-react';
import './ErrorBoundary.css';

interface ErrorBoundaryProps {
  children: ReactNode;
  /** Custom fallback UI (optional) */
  fallback?: (error: Error, reset: () => void) => ReactNode;
  /** Callback when error occurs */
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
  /** Context name for error reporting */
  context?: string;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    return {
      hasError: true,
      error,
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    const { context, onError } = this.props;

    // Log to console for debugging
    console.error(`[ErrorBoundary${context ? ` - ${context}` : ''}] Caught error:`, error);
    console.error('Component stack:', errorInfo.componentStack);

    // Store error info in state
    this.setState({ errorInfo });

    // Call custom error handler if provided
    if (onError) {
      onError(error, errorInfo);
    }

    // In production, you could send to error tracking service here
    if (import.meta.env.PROD) {
      // Example: sendToErrorTracking({ error, errorInfo, context });
    }
  }

  handleReset = (): void => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    });
  };

  handleReload = (): void => {
    window.location.reload();
  };

  handleGoHome = (): void => {
    window.location.href = '/';
  };

  render(): ReactNode {
    const { hasError, error, errorInfo } = this.state;
    const { children, fallback, context } = this.props;

    if (hasError && error) {
      // Use custom fallback if provided
      if (fallback) {
        return fallback(error, this.handleReset);
      }

      // Default error UI
      return (
        <div className="error-boundary">
          <div className="error-boundary-content">
            <div className="error-icon">
              <AlertTriangle size={64} />
            </div>

            <h1 className="error-title">Something Went Wrong</h1>

            <p className="error-message">
              {context && <strong>{context}: </strong>}
              {error.message || 'An unexpected error occurred'}
            </p>

            {import.meta.env.DEV && errorInfo && (
              <details className="error-details">
                <summary>Error Details (Development Mode)</summary>
                <div className="error-stack">
                  <h3>Error Stack:</h3>
                  <pre>{error.stack}</pre>

                  <h3>Component Stack:</h3>
                  <pre>{errorInfo.componentStack}</pre>
                </div>
              </details>
            )}

            <div className="error-actions">
              <button
                className="error-button error-button-primary"
                onClick={this.handleReset}
              >
                <RefreshCcw size={20} />
                <span>Try Again</span>
              </button>

              <button
                className="error-button"
                onClick={this.handleReload}
              >
                <RefreshCcw size={20} />
                <span>Reload Page</span>
              </button>

              <button
                className="error-button"
                onClick={this.handleGoHome}
              >
                <Home size={20} />
                <span>Go Home</span>
              </button>
            </div>

            <p className="error-help">
              If this problem persists, please contact support or try using a different browser.
            </p>
          </div>
        </div>
      );
    }

    return children;
  }
}

/**
 * Higher-order component to wrap any component with error boundary
 */
export function withErrorBoundary<P extends object>(
  Component: React.ComponentType<P>,
  context?: string
): React.FC<P> {
  return function WithErrorBoundary(props: P) {
    return (
      <ErrorBoundary context={context}>
        <Component {...props} />
      </ErrorBoundary>
    );
  };
}
