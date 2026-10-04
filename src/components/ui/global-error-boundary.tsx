'use client';

import React, { Component, type ErrorInfo, type ReactNode } from 'react';
import { AlertTriangle, RefreshCw, Copy, Check, ChevronDown, ChevronUp } from 'lucide-react';

export interface GlobalErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode | ((props: { error: Error | null; reset: () => void }) => ReactNode);
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
  onReset?: () => void;
  title?: string;
  message?: string;
  viewName?: string;
  forceReload?: boolean;
  className?: string;
}

export interface GlobalErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
  copied: boolean;
  showDetails: boolean;
}

export interface GlobalErrorFallbackProps {
  error: Error | null;
  errorInfo?: ErrorInfo | null;
  title?: string;
  message?: string;
  viewName?: string;
  copied?: boolean;
  showDetails?: boolean;
  onReload: () => void;
  onCopyStack: () => void;
  onToggleDetails?: () => void;
  className?: string;
}

/**
 * Fallback presentation screen displayed when a rendering exception is caught.
 * Features luxury glassmorphic styling, non-leaking diagnostics, "Try Reloading",
 * and "Copy Error Stack" action controls.
 */
export function GlobalErrorFallback({
  error,
  errorInfo,
  title = 'System State Interruption',
  message = 'An unexpected error occurred while rendering this view. Your commitments and data remain safe.',
  viewName,
  copied = false,
  showDetails = false,
  onReload,
  onCopyStack,
  onToggleDetails,
  className = '',
}: GlobalErrorFallbackProps) {
  const [internalDetails, setInternalDetails] = React.useState(false);
  const isDetailsOpen = onToggleDetails ? showDetails : internalDetails;
  const toggleDetails = onToggleDetails || (() => setInternalDetails((prev) => !prev));

  const errorStack = error?.stack || error?.message || 'No stack trace available';

  return (
    <div
      role="alert"
      aria-live="assertive"
      className={`min-h-[360px] w-full flex items-center justify-center p-6 ${className}`}
    >
      <div className="w-full max-w-lg rounded-2xl bg-zinc-950/85 backdrop-blur-xl border border-zinc-800/80 p-6 sm:p-8 shadow-2xl text-center space-y-6 text-zinc-100">
        {/* Warning Icon with gold/amber ambient ring */}
        <div className="w-14 h-14 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-[#d4af37] flex items-center justify-center mx-auto shadow-[0_0_25px_rgba(212,175,55,0.15)]">
          <AlertTriangle className="w-7 h-7" />
        </div>

        {/* Title and Descriptive Message */}
        <div className="space-y-2">
          {viewName && (
            <span className="inline-block px-2.5 py-0.5 rounded-full text-[10px] font-mono uppercase tracking-wider bg-zinc-800/80 text-amber-300/90 border border-amber-500/20 mb-1">
              {viewName}
            </span>
          )}
          <h2 className="text-lg sm:text-xl font-semibold tracking-tight text-white">
            {title}
          </h2>
          <p className="text-xs sm:text-sm text-zinc-400 leading-relaxed max-w-md mx-auto">
            {message}
          </p>
        </div>

        {/* Error message pill */}
        {error?.message && (
          <div className="p-2.5 rounded-lg bg-red-950/30 border border-red-900/40 text-red-300/90 text-xs font-mono text-left max-w-md mx-auto overflow-hidden text-ellipsis whitespace-nowrap">
            <span className="font-semibold text-red-400">Error: </span>
            {error.message}
          </div>
        )}

        {/* Action Buttons: Try Reloading & Copy Error Stack */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-1">
          <button
            type="button"
            onClick={onReload}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 py-2.5 px-5 rounded-xl bg-zinc-100 text-zinc-950 hover:bg-zinc-200 text-xs font-semibold transition-all duration-200 shadow-sm cursor-pointer active:scale-[0.98]"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Try Reloading</span>
          </button>

          <button
            type="button"
            onClick={onCopyStack}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 py-2.5 px-5 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-zinc-200 hover:text-white border border-zinc-700/60 text-xs font-semibold transition-all duration-200 shadow-sm cursor-pointer active:scale-[0.98]"
          >
            {copied ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-400" />
                <span className="text-emerald-400">Copied!</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5 text-zinc-400" />
                <span>Copy Error Stack</span>
              </>
            )}
          </button>
        </div>

        {/* Expandable Diagnostic Details */}
        <div className="pt-2 border-t border-zinc-800/60">
          <button
            type="button"
            onClick={toggleDetails}
            className="text-[11px] font-mono text-zinc-500 hover:text-zinc-300 inline-flex items-center gap-1.5 transition-colors cursor-pointer select-none"
          >
            {isDetailsOpen ? (
              <>
                <ChevronUp className="w-3.5 h-3.5" />
                <span>Hide Diagnostics</span>
              </>
            ) : (
              <>
                <ChevronDown className="w-3.5 h-3.5" />
                <span>Show Diagnostics</span>
              </>
            )}
          </button>

          {isDetailsOpen && (
            <div className="mt-3 text-left p-3.5 rounded-xl bg-black/70 border border-zinc-800 text-xs font-mono text-zinc-300 max-h-48 overflow-y-auto whitespace-pre-wrap break-all select-text">
              <p className="text-[11px] font-semibold text-rose-400 mb-1">
                {error?.name || 'Error'}: {error?.message || 'Unknown error'}
              </p>
              <pre className="text-[10px] text-zinc-400 font-mono leading-relaxed whitespace-pre-wrap">
                {errorStack}
              </pre>
              {errorInfo?.componentStack && (
                <div className="mt-2 pt-2 border-t border-zinc-800/80">
                  <p className="text-[10px] text-amber-300/70 font-semibold mb-0.5">Component Stack:</p>
                  <pre className="text-[9px] text-zinc-500 font-mono leading-relaxed whitespace-pre-wrap">
                    {errorInfo.componentStack}
                  </pre>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/**
 * Class component GlobalErrorBoundary implementing componentDidCatch.
 * Gracefully catches UI rendering exceptions across views and sub-views,
 * preventing full white-screen crashes and presenting recovery actions.
 */
export class GlobalErrorBoundary extends Component<GlobalErrorBoundaryProps, GlobalErrorBoundaryState> {
  private copyTimeoutId: ReturnType<typeof setTimeout> | null = null;

  constructor(props: GlobalErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      copied: false,
      showDetails: false,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<GlobalErrorBoundaryState> {
    return {
      hasError: true,
      error,
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    this.setState({ errorInfo });

    // Non-leaking error logging
    console.error('PACT GlobalErrorBoundary caught error:', error?.message || 'Unknown error');

    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }
  }

  componentWillUnmount(): void {
    if (this.copyTimeoutId) {
      clearTimeout(this.copyTimeoutId);
    }
  }

  handleReload = (): void => {
    if (this.props.onReset) {
      this.props.onReset();
    }

    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
      copied: false,
      showDetails: false,
    });

    if (typeof window !== 'undefined' && typeof window.location?.reload === 'function') {
      window.location.reload();
    }
  };

  handleCopyStack = async (): Promise<void> => {
    const { error, errorInfo } = this.state;
    const diagnostics = [
      `Error: ${error?.message || 'Unknown error'}`,
      `Name: ${error?.name || 'Error'}`,
      `Digest: ${(error as { digest?: string })?.digest || 'N/A'}`,
      `Stack Trace:\n${error?.stack || 'No stack trace available'}`,
      errorInfo?.componentStack ? `Component Stack:\n${errorInfo.componentStack}` : '',
    ]
      .filter(Boolean)
      .join('\n\n');

    try {
      if (typeof navigator !== 'undefined' && navigator.clipboard && typeof navigator.clipboard.writeText === 'function') {
        await navigator.clipboard.writeText(diagnostics);
      }
    } catch (err) {
      console.warn('Failed to copy to clipboard via navigator.clipboard:', err);
    }

    this.setState({ copied: true });

    if (this.copyTimeoutId) {
      clearTimeout(this.copyTimeoutId);
    }
    this.copyTimeoutId = setTimeout(() => {
      this.setState({ copied: false });
    }, 2000);
  };

  toggleDetails = (): void => {
    this.setState((prevState) => ({ showDetails: !prevState.showDetails }));
  };

  render(): ReactNode {
    const { hasError, error, errorInfo, copied, showDetails } = this.state;
    const { children, fallback, title, message, viewName, className } = this.props;

    if (hasError) {
      if (fallback) {
        if (typeof fallback === 'function') {
          return fallback({ error, reset: this.handleReload });
        }
        return fallback;
      }

      return (
        <GlobalErrorFallback
          error={error}
          errorInfo={errorInfo}
          title={title}
          message={message}
          viewName={viewName}
          copied={copied}
          showDetails={showDetails}
          onReload={this.handleReload}
          onCopyStack={this.handleCopyStack}
          onToggleDetails={this.toggleDetails}
          className={className}
        />
      );
    }

    return children;
  }
}
