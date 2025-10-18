import React, { useEffect } from 'react';

const ComponentDebugger = ({ children, name }) => {
  useEffect(() => {
    console.log(`🔍 Componente ${name} montado`);
    
    return () => {
      console.log(`🔍 Componente ${name} desmontado`);
    };
  }, [name]);

  // Verificar si el componente hijo es válido
  if (children === undefined) {
    console.error(`❌ Componente ${name} es undefined`);
    return (
      <div style={{
        padding: '10px',
        border: '1px solid #ef4444',
        borderRadius: '4px',
        backgroundColor: '#fef2f2',
        margin: '5px'
      }}>
        <strong>Error:</strong> Componente {name} es undefined
      </div>
    );
  }

  if (children === null) {
    console.error(`❌ Componente ${name} es null`);
    return (
      <div style={{
        padding: '10px',
        border: '1px solid #ef4444',
        borderRadius: '4px',
        backgroundColor: '#fef2f2',
        margin: '5px'
      }}>
        <strong>Error:</strong> Componente {name} es null
      </div>
    );
  }

  if (typeof children !== 'function' && typeof children !== 'string' && typeof children !== 'object') {
    console.error(`❌ Componente ${name} no es válido (tipo: ${typeof children})`);
    return (
      <div style={{
        padding: '10px',
        border: '1px solid #ef4444',
        borderRadius: '4px',
        backgroundColor: '#fef2f2',
        margin: '5px'
      }}>
        <strong>Error:</strong> Componente {name} no es válido (tipo: {typeof children})
      </div>
    );
  }

  console.log(`✅ Componente ${name} es válido`);
  return children;
};

export default ComponentDebugger;
