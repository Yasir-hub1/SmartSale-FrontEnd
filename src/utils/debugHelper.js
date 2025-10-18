// Utilidad para debuggear problemas de React
export const debugComponent = (componentName, props) => {
  console.log(`🔍 Debugging ${componentName}:`, props);
  
  // Verificar si el componente es válido
  if (typeof componentName === 'undefined') {
    console.error(`❌ Component ${componentName} is undefined`);
    return false;
  }
  
  if (typeof componentName !== 'function' && typeof componentName !== 'string') {
    console.error(`❌ Component ${componentName} is not a valid React component`);
    return false;
  }
  
  console.log(`✅ Component ${componentName} is valid`);
  return true;
};

// Hook para detectar re-renders
export const useRenderCount = (componentName) => {
  const renderCount = React.useRef(0);
  renderCount.current += 1;
  
  console.log(`🔄 ${componentName} rendered ${renderCount.current} times`);
  
  return renderCount.current;
};

// Verificar imports problemáticos
export const checkImports = () => {
  const commonIssues = [
    'Component not exported as default',
    'Named import vs default import mismatch',
    'Circular dependency',
    'Component not found'
  ];
  
  console.log('🔍 Common import issues to check:', commonIssues);
};
