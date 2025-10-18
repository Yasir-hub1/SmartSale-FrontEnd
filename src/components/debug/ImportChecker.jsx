import React, { useEffect } from 'react';

// Función para verificar imports problemáticos
const checkImports = () => {
  const problematicImports = [];
  
  // Verificar componentes comunes que podrían tener problemas
  const componentsToCheck = [
    'Layout',
    'OnlineStatusIndicator', 
    'SyncButton',
    'OfflineWarning',
    'ProtectedRoute',
    'LoginPage',
    'HomePage',
    'ProductsPage',
    'ClientsPage',
    'CartPage',
    'SalesPage',
    'DashboardPage',
    'ReportsPage',
    'PaymentPage'
  ];
  
  componentsToCheck.forEach(componentName => {
    try {
      // Intentar importar dinámicamente
      const component = require(`../${componentName}`);
      if (!component || typeof component === 'undefined') {
        problematicImports.push(componentName);
      }
    } catch (error) {
      problematicImports.push(`${componentName}: ${error.message}`);
    }
  });
  
  return problematicImports;
};

const ImportChecker = () => {
  useEffect(() => {
    console.log('🔍 Verificando imports...');
    const problems = checkImports();
    
    if (problems.length > 0) {
      console.error('❌ Problemas encontrados en imports:', problems);
    } else {
      console.log('✅ Todos los imports están correctos');
    }
  }, []);
  
  return null; // Este componente no renderiza nada
};

export default ImportChecker;
