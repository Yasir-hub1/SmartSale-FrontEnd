import React from 'react';
import { diagnoseReactError, checkComponent } from '../../utils/diagnoseError';

const ComponentValidator = ({ children, componentName }) => {
  // Verificar el componente antes de renderizarlo
  const isValid = checkComponent(componentName, children);
  
  if (!isValid) {
    return (
      <div style={{
        padding: '20px',
        border: '2px solid #ef4444',
        borderRadius: '8px',
        backgroundColor: '#fef2f2',
        margin: '10px'
      }}>
        <h3 style={{ color: '#dc2626', margin: '0 0 10px 0' }}>
          🚨 Componente Inválido: {componentName}
        </h3>
        <p style={{ margin: '0 0 10px 0' }}>
          Este componente no se puede renderizar correctamente.
        </p>
        <details>
          <summary style={{ cursor: 'pointer' }}>Ver detalles técnicos</summary>
          <pre style={{ 
            backgroundColor: '#f3f4f6', 
            padding: '10px', 
            borderRadius: '4px',
            fontSize: '12px',
            marginTop: '10px'
          }}>
            Component: {componentName}
            Type: {typeof children}
            Value: {String(children)}
          </pre>
        </details>
      </div>
    );
  }
  
  return children;
};

// Hook para validar componentes dinámicamente
export const useComponentValidator = () => {
  const validateComponent = (component, name) => {
    console.log(`🔍 Validando componente: ${name}`);
    
    if (component === undefined) {
      console.error(`❌ ${name} es undefined`);
      return false;
    }
    
    if (component === null) {
      console.error(`❌ ${name} es null`);
      return false;
    }
    
    if (typeof component !== 'function' && typeof component !== 'string') {
      console.error(`❌ ${name} no es un componente válido de React (tipo: ${typeof component})`);
      return false;
    }
    
    console.log(`✅ ${name} es válido`);
    return true;
  };
  
  return { validateComponent };
};

export default ComponentValidator;
