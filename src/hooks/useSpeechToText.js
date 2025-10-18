// Hook especializado para conversión de voz a texto
import { useState, useCallback } from 'react';
import useVoiceRecognition from './useVoiceRecognition';

const useSpeechToText = (options = {}) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [lastResult, setLastResult] = useState(null);
  const [commandHistory, setCommandHistory] = useState([]);

  const {
    onCommand = null,
    onError = null,
    autoProcess = true,
    commandKeywords = [],
    timeout = 5000
  } = options;

  // Configurar reconocimiento de voz
  const voiceRecognition = useVoiceRecognition({
    language: 'es-ES',
    continuous: false,
    interimResults: true,
    timeout,
    onResult: (transcript, confidence) => {
      if (autoProcess) {
        processTranscript(transcript, confidence);
      }
    },
    onError: (error, message) => {
      onError?.(error, message);
    }
  });

  // Procesar transcripción
  const processTranscript = useCallback((transcript, confidence) => {
    setIsProcessing(true);
    
    const result = {
      transcript,
      confidence,
      timestamp: new Date().toISOString(),
      processed: false
    };

    // Detectar comandos
    const detectedCommands = detectCommands(transcript);
    if (detectedCommands.length > 0) {
      result.commands = detectedCommands;
      result.processed = true;
      
      // Ejecutar comandos
      detectedCommands.forEach(command => {
        executeCommand(command, transcript);
      });
    }

    // Detectar palabras clave
    const keywords = detectKeywords(transcript);
    if (keywords.length > 0) {
      result.keywords = keywords;
    }

    // Detectar números
    const numbers = voiceRecognition.extractNumbers();
    if (numbers.length > 0) {
      result.numbers = numbers;
    }

    setLastResult(result);
    setCommandHistory(prev => [result, ...prev.slice(0, 9)]); // Mantener últimos 10

    onCommand?.(result);
    setIsProcessing(false);
  }, [onCommand, onError]);

  // Detectar comandos en el texto
  const detectCommands = useCallback((text) => {
    const commands = [];
    const lowerText = text.toLowerCase();

    // Comandos de carrito
    if (lowerText.includes('agregar') || lowerText.includes('añadir')) {
      commands.push({
        type: 'add_to_cart',
        action: 'add',
        confidence: 0.8
      });
    }

    if (lowerText.includes('quitar') || lowerText.includes('eliminar')) {
      commands.push({
        type: 'remove_from_cart',
        action: 'remove',
        confidence: 0.8
      });
    }

    if (lowerText.includes('ver carrito') || lowerText.includes('mostrar carrito')) {
      commands.push({
        type: 'view_cart',
        action: 'view',
        confidence: 0.9
      });
    }

    // Comandos de reportes
    if (lowerText.includes('reporte') || lowerText.includes('reportar')) {
      commands.push({
        type: 'generate_report',
        action: 'report',
        confidence: 0.8
      });
    }

    if (lowerText.includes('ventas') && lowerText.includes('reporte')) {
      commands.push({
        type: 'sales_report',
        action: 'sales_report',
        confidence: 0.9
      });
    }

    if (lowerText.includes('clientes') && lowerText.includes('reporte')) {
      commands.push({
        type: 'clients_report',
        action: 'clients_report',
        confidence: 0.9
      });
    }

    // Comandos de navegación
    if (lowerText.includes('ir a') || lowerText.includes('navegar a')) {
      commands.push({
        type: 'navigate',
        action: 'navigate',
        confidence: 0.7
      });
    }

    if (lowerText.includes('dashboard') || lowerText.includes('inicio')) {
      commands.push({
        type: 'navigate_dashboard',
        action: 'navigate',
        target: '/dashboard',
        confidence: 0.9
      });
    }

    if (lowerText.includes('productos')) {
      commands.push({
        type: 'navigate_products',
        action: 'navigate',
        target: '/products',
        confidence: 0.9
      });
    }

    if (lowerText.includes('clientes')) {
      commands.push({
        type: 'navigate_clients',
        action: 'navigate',
        target: '/clients',
        confidence: 0.9
      });
    }

    if (lowerText.includes('ventas')) {
      commands.push({
        type: 'navigate_sales',
        action: 'navigate',
        target: '/sales',
        confidence: 0.9
      });
    }

    // Comandos de búsqueda
    if (lowerText.includes('buscar') || lowerText.includes('encontrar')) {
      commands.push({
        type: 'search',
        action: 'search',
        confidence: 0.8
      });
    }

    // Comandos de ayuda
    if (lowerText.includes('ayuda') || lowerText.includes('comandos')) {
      commands.push({
        type: 'help',
        action: 'help',
        confidence: 0.9
      });
    }

    return commands;
  }, []);

  // Detectar palabras clave
  const detectKeywords = useCallback((text) => {
    const keywords = [];
    const lowerText = text.toLowerCase();

    // Palabras de cantidad
    const quantityWords = ['uno', 'dos', 'tres', 'cuatro', 'cinco', 'seis', 'siete', 'ocho', 'nueve', 'diez'];
    quantityWords.forEach(word => {
      if (lowerText.includes(word)) {
        keywords.push({ type: 'quantity', word, value: quantityWords.indexOf(word) + 1 });
      }
    });

    // Palabras de productos comunes
    const productWords = ['camisa', 'pantalón', 'zapato', 'laptop', 'teléfono', 'libro', 'café', 'agua'];
    productWords.forEach(word => {
      if (lowerText.includes(word)) {
        keywords.push({ type: 'product', word });
      }
    });

    // Palabras de colores
    const colorWords = ['rojo', 'azul', 'verde', 'amarillo', 'negro', 'blanco', 'gris'];
    colorWords.forEach(word => {
      if (lowerText.includes(word)) {
        keywords.push({ type: 'color', word });
      }
    });

    return keywords;
  }, []);

  // Ejecutar comando
  const executeCommand = useCallback((command, transcript) => {
    console.log('[SpeechToText] Ejecutando comando:', command);
    
    // Aquí se implementarían las acciones específicas
    // según el tipo de comando detectado
    switch (command.type) {
      case 'add_to_cart':
        // Lógica para agregar al carrito
        break;
      case 'remove_from_cart':
        // Lógica para quitar del carrito
        break;
      case 'view_cart':
        // Lógica para mostrar carrito
        break;
      case 'generate_report':
        // Lógica para generar reporte
        break;
      case 'navigate':
        // Lógica para navegación
        break;
      case 'search':
        // Lógica para búsqueda
        break;
      case 'help':
        // Lógica para mostrar ayuda
        break;
      default:
        console.log('[SpeechToText] Comando no reconocido:', command.type);
    }
  }, []);

  // Iniciar reconocimiento
  const startListening = useCallback(() => {
    voiceRecognition.startListening();
  }, [voiceRecognition]);

  // Detener reconocimiento
  const stopListening = useCallback(() => {
    voiceRecognition.stopListening();
  }, [voiceRecognition]);

  // Procesar texto manualmente
  const processText = useCallback((text) => {
    processTranscript(text, 1.0);
  }, [processTranscript]);

  // Limpiar historial
  const clearHistory = useCallback(() => {
    setCommandHistory([]);
    setLastResult(null);
  }, []);

  // Obtener comandos disponibles
  const getAvailableCommands = useCallback(() => {
    return [
      {
        category: 'Carrito',
        commands: [
          'Agregar [producto] al carrito',
          'Quitar [producto] del carrito',
          'Ver carrito',
          'Mostrar carrito'
        ]
      },
      {
        category: 'Navegación',
        commands: [
          'Ir a dashboard',
          'Ir a productos',
          'Ir a clientes',
          'Ir a ventas',
          'Ir a reportes'
        ]
      },
      {
        category: 'Reportes',
        commands: [
          'Generar reporte de ventas',
          'Generar reporte de clientes',
          'Mostrar reporte de productos'
        ]
      },
      {
        category: 'Búsqueda',
        commands: [
          'Buscar [producto]',
          'Encontrar [cliente]'
        ]
      },
      {
        category: 'Ayuda',
        commands: [
          'Mostrar ayuda',
          'Comandos disponibles'
        ]
      }
    ];
  }, []);

  return {
    // Estado del reconocimiento
    ...voiceRecognition,
    
    // Estado específico de procesamiento
    isProcessing,
    lastResult,
    commandHistory,
    
    // Acciones
    startListening,
    stopListening,
    processText,
    clearHistory,
    
    // Utilidades
    getAvailableCommands,
    detectCommands,
    detectKeywords
  };
};

export default useSpeechToText;
