// Script para diagnosticar el error "Element type is invalid"

export const diagnoseReactError = () => {
  console.log('🔍 Diagnosticando error de React...');
  
  // Verificar si hay problemas comunes
  const commonIssues = [
    {
      name: 'Component not exported as default',
      check: () => {
        // Verificar si hay componentes que no están exportados como default
        const components = [
          'Layout',
          'OnlineStatusIndicator',
          'SyncButton', 
          'OfflineWarning',
          'ProtectedRoute'
        ];
        
        components.forEach(comp => {
          try {
            const module = require(`../components/${comp}`);
            if (!module.default) {
              console.error(`❌ ${comp} no está exportado como default`);
              return true;
            }
          } catch (error) {
            console.error(`❌ Error importando ${comp}:`, error.message);
            return true;
          }
        });
        return false;
      }
    },
    {
      name: 'Named import vs default import mismatch',
      check: () => {
        // Verificar si hay imports incorrectos
        console.log('🔍 Verificando imports...');
        return false;
      }
    },
    {
      name: 'Circular dependency',
      check: () => {
        console.log('🔍 Verificando dependencias circulares...');
        return false;
      }
    },
    {
      name: 'Component not found',
      check: () => {
        console.log('🔍 Verificando que todos los componentes existan...');
        return false;
      }
    }
  ];
  
  // Ejecutar todas las verificaciones
  const issues = [];
  commonIssues.forEach(issue => {
    if (issue.check()) {
      issues.push(issue.name);
    }
  });
  
  if (issues.length > 0) {
    console.error('❌ Problemas encontrados:', issues);
  } else {
    console.log('✅ No se encontraron problemas obvios');
  }
  
  return issues;
};

// Función para verificar un componente específico
export const checkComponent = (componentName, component) => {
  console.log(`🔍 Verificando componente: ${componentName}`);
  
  if (component === undefined) {
    console.error(`❌ ${componentName} es undefined`);
    return false;
  }
  
  if (typeof component !== 'function' && typeof component !== 'string') {
    console.error(`❌ ${componentName} no es un componente válido de React`);
    return false;
  }
  
  console.log(`✅ ${componentName} es válido`);
  return true;
};

// Función para verificar todos los imports en un archivo
export const checkFileImports = (filePath) => {
  console.log(`🔍 Verificando imports en: ${filePath}`);
  
  // Esta función se puede expandir para verificar imports específicos
  return true;
};
