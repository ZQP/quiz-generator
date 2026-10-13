import { Component, ErrorInfo, ReactNode } from "react";
import { AlertTriangle, RefreshCw, RotateCcw } from "lucide-react";

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
    errorInfo: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error, errorInfo: null };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Uncaught application error:", error, errorInfo);
    this.setState({ errorInfo });
  }

  private handleReload = () => {
    window.location.reload();
  };

  private handleResetApp = () => {
    if (
      window.confirm(
        "Möchten Sie den Anwendungs-Zwischenspeicher wirklich zurücksetzen? Ihre gespeicherten Entwürfe bleiben in der Datenbank erhalten."
      )
    ) {
      try {
        localStorage.clear();
        sessionStorage.clear();
      } catch (e) {
        console.error("Failed to clear storage:", e);
      }
      window.location.reload();
    }
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-[#f3f8f7] flex items-center justify-center p-6 text-[#2d2c2e]">
          <div className="bg-white border border-[#bbd1cd] rounded-2xl shadow-xl max-w-xl w-full p-8 text-center">
            <div className="w-16 h-16 rounded-2xl bg-amber-100 text-amber-700 flex items-center justify-center mx-auto mb-4 shadow-sm">
              <AlertTriangle className="w-8 h-8" />
            </div>

            <h1 className="text-xl font-bold text-[#1b5c53] mb-2">
              Unerwarteter Anzeigefehler
            </h1>

            <p className="text-sm text-[#6e6c70] mb-6 leading-relaxed">
              Es ist ein Fehler beim Darstellen der Benutzeroberfläche aufgetreten.
              Die Anwendung wurde sicher angehalten, um Datenverlust zu verhindern.
            </p>

            {this.state.error && (
              <div className="bg-red-50/70 border border-red-200 rounded-lg p-3 text-left mb-6 font-mono text-xs text-red-800 break-all max-h-36 overflow-y-auto">
                <div className="font-semibold mb-1">Fehlermeldung:</div>
                {this.state.error.message || String(this.state.error)}
              </div>
            )}

            <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
              <button
                onClick={this.handleReload}
                className="w-full sm:w-auto px-5 py-2.5 rounded-lg bg-[#247a6d] hover:bg-[#1b5c53] text-white font-semibold text-sm flex items-center justify-center gap-2 transition-colors shadow-sm cursor-pointer"
              >
                <RefreshCw className="w-4 h-4" />
                <span>Anwendung neu laden</span>
              </button>

              <button
                onClick={this.handleResetApp}
                className="w-full sm:w-auto px-4 py-2.5 rounded-lg border border-[#bbd1cd] hover:bg-[#e3eeec] text-[#1b5c53] font-medium text-sm flex items-center justify-center gap-2 transition-colors cursor-pointer"
              >
                <RotateCcw className="w-4 h-4" />
                <span>Cache leeren & neustarten</span>
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
export default ErrorBoundary;
