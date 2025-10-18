import React from 'react';

class SimpleErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    console.error('🚨 Error capturado:', error);
    console.error('📊 Info del error:', errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          padding: '20px',
          border: '2px solid #ef4444',
          borderRadius: '8px',
          backgroundColor: '#fef2f2',
          margin: '20px',
          textAlign: 'center'
        }}>
          <h2 style={{ color: '#dc2626', marginBottom: '16px' }}>
            🚨 Error en la Aplicación
          </h2>
          <p style={{ marginBottom: '16px' }}>
            Ha ocurrido un error. Por favor, recarga la página.
          </p>
          <button 
            onClick={() => window.location.reload()}
            style={{
              backgroundColor: '#3b82f6',
              color: 'white',
              border: 'none',
              padding: '10px 20px',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '16px'
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

export default SimpleErrorBoundary;
