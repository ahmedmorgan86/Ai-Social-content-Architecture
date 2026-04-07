import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCcw } from 'lucide-react';
import { cn } from '../lib/utils';

interface Props {
  children: ReactNode;
  theme?: string;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error:', error, errorInfo);
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: null });
    window.location.reload();
  };

  public render() {
    if (this.state.hasError) {
      let errorMessage = 'حدث خطأ غير متوقع. يرجى المحاولة مرة أخرى.';
      let isFirestoreError = false;

      try {
        if (this.state.error?.message) {
          const parsed = JSON.parse(this.state.error.message);
          if (parsed.error && parsed.operationType) {
            isFirestoreError = true;
            if (parsed.error.includes('permission-denied')) {
              errorMessage = 'عذراً، ليس لديك الصلاحيات الكافية لإتمام هذه العملية أو الوصول إلى هذه البيانات.';
            } else {
              errorMessage = `خطأ في قاعدة البيانات: ${parsed.error}`;
            }
          }
        }
      } catch (e) {
        // Not a JSON error message
      }

      return (
        <div className={cn(
          "min-h-[400px] flex flex-col items-center justify-center p-8 text-center space-y-6 rounded-[2.5rem] border",
          this.props.theme === 'light' ? 'bg-white border-zinc-200' : 'bg-zinc-950 border-zinc-800'
        )}>
          <div className={cn(
            "p-4 rounded-full",
            isFirestoreError ? "bg-amber-500/10 text-amber-500" : "bg-red-500/10 text-red-500"
          )}>
            <AlertTriangle className="w-12 h-12" />
          </div>
          
          <div className="space-y-2">
            <h2 className={cn("text-2xl font-black tracking-tighter", this.props.theme === 'light' ? 'text-zinc-950' : 'text-zinc-100')}>
              {isFirestoreError ? 'خطأ في الصلاحيات' : 'عذراً، حدث خطأ ما'}
            </h2>
            <p className={cn("text-sm font-medium max-w-md mx-auto", this.props.theme === 'light' ? 'text-zinc-500' : 'text-zinc-400')}>
              {errorMessage}
            </p>
          </div>

          <button
            onClick={this.handleReset}
            className={cn(
              "flex items-center gap-2 px-6 py-3 rounded-2xl font-bold transition-all",
              this.props.theme === 'light' ? 'bg-zinc-950 text-white hover:bg-zinc-800' : 'bg-zinc-100 text-zinc-950 hover:bg-zinc-200'
            )}
          >
            <RefreshCcw className="w-4 h-4" />
            إعادة المحاولة
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
