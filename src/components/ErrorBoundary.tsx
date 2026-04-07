import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw, ShieldAlert } from 'lucide-react';

interface ErrorBoundaryProps {
  children?: ReactNode;
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
      errorInfo: null
    };
  }

  public static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    // Update state so the next render will show the fallback UI.
    return { hasError: true, error, errorInfo: null };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('7orus Intercepted Uncaught Error:', error, errorInfo);
    this.setState({
      error,
      errorInfo
    });
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-[#050505] flex items-center justify-center p-4 font-mono text-[#0f0] relative overflow-hidden" dir="ltr">
          {/* Background Grid & Glow */}
          <div className="absolute inset-0 bg-[linear-gradient(rgba(0,255,0,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(0,255,0,0.03)_1px,transparent_1px)] bg-[size:20px_20px] pointer-events-none"></div>
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-power-red/5 rounded-full blur-[100px] pointer-events-none"></div>

          <div className="max-w-3xl w-full border border-power-red/30 bg-[#0a0a0a]/90 backdrop-blur-xl p-8 rounded-2xl shadow-[0_0_40px_rgba(229,62,62,0.15)] relative z-10">
            <div className="absolute top-0 left-0 w-full h-1 bg-power-red animate-pulse"></div>
            
            <div className="flex items-start gap-5 mb-8">
              <div className="w-16 h-16 rounded-2xl bg-power-red/10 border border-power-red/20 flex items-center justify-center shrink-0 shadow-[0_0_15px_rgba(229,62,62,0.2)]">
                <ShieldAlert className="text-power-red" size={32} />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-power-red tracking-wider mb-1">7ORUS CRITICAL INTERCEPT</h1>
                <p className="text-sm text-crisp-white/60">A fatal exception occurred in the UI layer. 7orus has isolated the crash to prevent system corruption.</p>
              </div>
            </div>

            <div className="bg-[#000] p-5 rounded-xl border border-power-red/20 mb-8 overflow-hidden relative">
              <div className="absolute top-0 left-0 w-full h-full bg-[linear-gradient(rgba(229,62,62,0.02)_1px,transparent_1px)] bg-[size:100%_4px] pointer-events-none"></div>
              <h3 className="text-power-red/80 text-xs font-bold mb-2 uppercase tracking-widest flex items-center gap-2">
                <AlertTriangle size={12} />
                Error Trace
              </h3>
              <div className="overflow-x-auto">
                <code className="text-power-red/90 text-sm whitespace-pre-wrap">
                  {this.state.error?.toString()}
                </code>
              </div>
              
              {this.state.errorInfo && (
                <div className="mt-4 pt-4 border-t border-power-red/10 overflow-x-auto">
                  <code className="text-power-red/50 text-xs whitespace-pre-wrap">
                    {this.state.errorInfo.componentStack}
                  </code>
                </div>
              )}
            </div>

            <div className="flex justify-end">
              <button
                onClick={() => window.location.reload()}
                className="group flex items-center gap-2 bg-power-red/10 hover:bg-power-red text-power-red hover:text-white border border-power-red/30 px-6 py-3 rounded-xl transition-all duration-300 font-bold text-sm shadow-[0_0_15px_rgba(229,62,62,0.2)] hover:shadow-[0_0_25px_rgba(229,62,62,0.5)]"
              >
                <RefreshCw size={16} className="group-hover:rotate-180 transition-transform duration-500" />
                Reboot Zomra OS
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
