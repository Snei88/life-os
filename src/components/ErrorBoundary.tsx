import React from "react";

export class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean }
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error: any, errorInfo: any) {
    // Ignorar errores de extensiones de Chrome
    if (error?.message?.includes('removeChild') || 
        error?.stack?.includes('chrome-extension') ||
        error?.name?.includes('UserAuthError')) {
      console.warn('Error de extensión ignorado:', error);
      this.setState({ hasError: false }); // Recuperarse
      return;
    }
    console.error('Error real:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-[#0a0a0a] text-white">
          <div className="text-center">
            <h2 className="text-2xl font-bold mb-4">Algo salió mal</h2>
            <button 
              onClick={() => window.location.reload()}
              className="px-6 py-3 bg-orange-600 rounded-xl font-bold"
            >
              Recargar página
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}