import { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Error no controlado en la aplicación:', error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-[#f6f6f7] flex items-center justify-center p-4 font-sans text-center">
          <div className="bg-white p-6 rounded-3xl border border-stone-200 max-w-md w-full shadow-xl">
            <span className="text-4xl">💈</span>
            <h2 className="text-base font-bold text-zinc-900 mt-3">
              Recuperando la Aplicación
            </h2>
            <p className="text-xs text-zinc-500 mt-1 mb-3 leading-relaxed">
              Ocurrió un detalle al procesar la vista.
            </p>

            {this.state.error && (
              <div className="mb-4 p-3 bg-rose-50 border border-rose-200 rounded-xl text-left">
                <div className="text-xs font-bold text-rose-800 break-words font-mono">
                  {this.state.error.name}: {this.state.error.message}
                </div>
                {this.state.error.stack && (
                  <pre className="text-[10px] text-rose-600/80 mt-1.5 overflow-x-auto max-h-32 font-mono whitespace-pre-wrap">
                    {this.state.error.stack.split('\n').slice(0, 5).join('\n')}
                  </pre>
                )}
              </div>
            )}

            <div className="space-y-2">
              <button
                onClick={() => {
                  this.setState({ hasError: false, error: undefined });
                }}
                className="w-full bg-[#78350f] hover:bg-[#92400e] text-white font-bold text-xs py-3 px-4 rounded-xl cursor-pointer shadow-sm transition-all"
              >
                Reintentar Cargar
              </button>

              <button
                onClick={async () => {
                  try {
                    localStorage.clear();
                    sessionStorage.clear();
                    await fetch('/api/agenda', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({ reset: true }),
                    }).catch(() => {});
                  } catch {
                    // ignore
                  }
                  window.location.reload();
                }}
                className="w-full bg-stone-100 hover:bg-stone-200 text-zinc-700 font-bold text-xs py-2.5 px-4 rounded-xl cursor-pointer transition-all"
              >
                Limpiar Caché y Recargar
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
