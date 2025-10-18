import React from 'react';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { 
      hasError: false, 
      error: null, 
      errorInfo: null 
    };
  }

  static getDerivedStateFromError(error) {
    // Actualizar el state para mostrar la UI de error
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    console.error('🚨 Error Boundary caught an error:', error);
    console.error('📊 Error Info:', errorInfo);
    
    this.setState({
      error: error,
      errorInfo: errorInfo
    });
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          padding: '20px',
          border: '2px solid #ef4444',
          borderRadius: '8px',
          backgroundColor: '#fef2f2',
          margin: '20px'
        }}>
          <h2 style={{ color: '#dc2626', marginBottom: '16px' }}>
            🚨 Error Detectado
          </h2>
          <p style={{ marginBottom: '16px' }}>
            Ha ocurrido un error en la aplicación. Por favor, recarga la página.
          </p>
          {this.state.error && (
            <details style={{ marginBottom: '16px' }}>
              <summary style={{ cursor: 'pointer', fontWeight: 'bold' }}>
                Ver detalles del error
              </summary>
              <pre style={{ 
                backgroundColor: '#f3f4f6', 
                padding: '12px', 
                borderRadius: '4px',
                overflow: 'auto',
                fontSize: '12px',
                marginTop: '8px'
              }}>
                {this.state.error.toString()}
                {this.state.errorInfo && this.state.errorInfo.componentStack && (
                  <div style={{ marginTop: '8px' }}>
                    <strong>Component Stack:</strong>
                    {this.state.errorInfo.componentStack}
                  </div>
                )}
              </pre>
            </details>
          )}
          <button 
            onClick={() => window.location.reload()}
            style={{
              backgroundColor: '#3b82f6',
              color: 'white',
              border: 'none',
              padding: '8px 16px',
              borderRadius: '4px',
              cursor: 'pointer'
            }}
          >
            Recargar Página
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
