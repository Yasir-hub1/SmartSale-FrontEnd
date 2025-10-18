// Hook para reconocimiento de voz
import { useState, useEffect, useCallback, useRef } from 'react';

const useVoiceRecognition = (options = {}) => {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [interimTranscript, setInterimTranscript] = useState('');
  const [isSupported, setIsSupported] = useState(false);
  const [error, setError] = useState(null);
  const [confidence, setConfidence] = useState(0);
  
  const recognitionRef = useRef(null);
  const timeoutRef = useRef(null);

  const {
    language = 'es-ES',
    continuous = true,
    interimResults = true,
    maxAlternatives = 1,
    timeout = 10000, // 10 segundos
    onResult = null,
    onError = null,
    onStart = null,
    onEnd = null
  } = options;

  // Verificar soporte del navegador
  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    
    if (SpeechRecognition) {
      setIsSupported(true);
      recognitionRef.current = new SpeechRecognition();
      setupRecognition();
    } else {
      setIsSupported(false);
      setError('Reconocimiento de voz no soportado en este navegador');
    }

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.abort();
      }
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  // Configurar reconocimiento
  const setupRecognition = useCallback(() => {
    if (!recognitionRef.current) return;

    const recognition = recognitionRef.current;
    
    recognition.continuous = continuous;
    recognition.interimResults = interimResults;
    recognition.lang = language;
    recognition.maxAlternatives = maxAlternatives;

    recognition.onstart = () => {
      setIsListening(true);
      setError(null);
      setTranscript('');
      setInterimTranscript('');
      onStart?.();
    };

    recognition.onresult = (event) => {
      let finalTranscript = '';
      let interimTranscript = '';

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i];
        const confidence = result[0]?.confidence || 0;
        
        setConfidence(confidence);

        if (result.isFinal) {
          finalTranscript += result[0].transcript;
        } else {
          interimTranscript += result[0].transcript;
        }
      }

      if (finalTranscript) {
        setTranscript(prev => prev + finalTranscript);
        onResult?.(finalTranscript, confidence);
      }

      if (interimTranscript) {
        setInterimTranscript(interimTranscript);
      }
    };

    recognition.onerror = (event) => {
      console.error('[VoiceRecognition] Error:', event.error);
      
      let errorMessage = 'Error en reconocimiento de voz';
      
      switch (event.error) {
        case 'no-speech':
          errorMessage = 'No se detectó habla. Intenta de nuevo.';
          break;
        case 'audio-capture':
          errorMessage = 'No se pudo acceder al micrófono.';
          break;
        case 'not-allowed':
          errorMessage = 'Permisos de micrófono denegados.';
          break;
        case 'network':
          errorMessage = 'Error de red.';
          break;
        case 'aborted':
          errorMessage = 'Reconocimiento cancelado.';
          break;
        default:
          errorMessage = `Error: ${event.error}`;
      }
      
      setError(errorMessage);
      setIsListening(false);
      onError?.(event.error, errorMessage);
    };

    recognition.onend = () => {
      setIsListening(false);
      onEnd?.();
    };
  }, [continuous, interimResults, language, maxAlternatives, onResult, onError, onStart, onEnd]);

  // Iniciar reconocimiento
  const startListening = useCallback(() => {
    if (!isSupported || !recognitionRef.current) {
      setError('Reconocimiento de voz no disponible');
      return;
    }

    if (isListening) {
      console.log('[VoiceRecognition] Ya está escuchando');
      return;
    }

    try {
      setError(null);
      recognitionRef.current.start();
      
      // Timeout automático
      if (timeout > 0) {
        timeoutRef.current = setTimeout(() => {
          stopListening();
        }, timeout);
      }
    } catch (error) {
      console.error('[VoiceRecognition] Error iniciando:', error);
      setError('Error al iniciar reconocimiento de voz');
    }
  }, [isSupported, isListening, timeout]);

  // Detener reconocimiento
  const stopListening = useCallback(() => {
    if (!recognitionRef.current || !isListening) return;

    try {
      recognitionRef.current.stop();
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
    } catch (error) {
      console.error('[VoiceRecognition] Error deteniendo:', error);
    }
  }, [isListening]);

  // Abortar reconocimiento
  const abortListening = useCallback(() => {
    if (!recognitionRef.current) return;

    try {
      recognitionRef.current.abort();
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
    } catch (error) {
      console.error('[VoiceRecognition] Error abortando:', error);
    }
  }, []);

  // Limpiar transcripción
  const resetTranscript = useCallback(() => {
    setTranscript('');
    setInterimTranscript('');
    setError(null);
    setConfidence(0);
  }, []);

  // Obtener transcripción completa
  const getFullTranscript = useCallback(() => {
    return transcript + interimTranscript;
  }, [transcript, interimTranscript]);

  // Verificar si el texto contiene palabras clave
  const containsKeywords = useCallback((keywords) => {
    const fullText = getFullTranscript().toLowerCase();
    return keywords.some(keyword => fullText.includes(keyword.toLowerCase()));
  }, [getFullTranscript]);

  // Extraer números del texto
  const extractNumbers = useCallback(() => {
    const text = getFullTranscript();
    const numbers = text.match(/\d+/g);
    return numbers ? numbers.map(Number) : [];
  }, [getFullTranscript]);

  // Extraer productos del texto (para comandos de carrito)
  const extractProducts = useCallback((productList = []) => {
    const text = getFullTranscript().toLowerCase();
    const foundProducts = [];
    
    productList.forEach(product => {
      if (text.includes(product.name.toLowerCase()) || 
          text.includes(product.sku.toLowerCase())) {
        foundProducts.push(product);
      }
    });
    
    return foundProducts;
  }, [getFullTranscript]);

  return {
    // Estado
    isListening,
    transcript,
    interimTranscript,
    isSupported,
    error,
    confidence,
    
    // Acciones
    startListening,
    stopListening,
    abortListening,
    resetTranscript,
    
    // Utilidades
    getFullTranscript,
    containsKeywords,
    extractNumbers,
    extractProducts,
    
    // Estado combinado
    isReady: isSupported && !isListening && !error,
    hasError: !!error,
    hasTranscript: !!(transcript || interimTranscript)
  };
};

export default useVoiceRecognition;
