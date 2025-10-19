import React, { useState, useEffect, useRef } from 'react';
import { FaRobot, FaMicrophone, FaMicrophoneSlash, FaPaperPlane, FaSpinner, FaTimes } from 'react-icons/fa';
import aiAgentService from '../../services/aiAgentService';
import { useErrorHandler } from '../../hooks/useErrorHandler';
import './AIAgentChat.css';

const AIAgentChat = ({ isOpen, onClose, cartId, onProductsFound, onCartUpdated }) => {
  const { handleApiError, handleSuccess } = useErrorHandler();
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [suggestions, setSuggestions] = useState([]);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    if (isOpen) {
      loadInitialSuggestions();
      inputRef.current?.focus();
    }
  }, [isOpen]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const loadInitialSuggestions = async () => {
    try {
      const response = await aiAgentService.getSuggestions(cartId);
      if (response.success) {
        setSuggestions(response.suggestions);
      }
    } catch (error) {
      console.error('Error cargando sugerencias:', error);
    }
  };

  const addMessage = (content, isUser = false, type = 'text') => {
    const message = {
      id: Date.now() + Math.random(),
      content,
      isUser,
      type,
      timestamp: new Date()
    };
    setMessages(prev => [...prev, message]);
  };

  const sendMessage = async (message = inputMessage) => {
    if (!message.trim() || isLoading) return;

    const userMessage = message.trim();
    addMessage(userMessage, true);
    setInputMessage('');
    setIsLoading(true);

    try {
      const response = await aiAgentService.sendMessage(userMessage, cartId);
      
      if (response.success) {
        addMessage(response.response, false);
        
        // Procesar acciones del agente
        if (response.actions && response.actions.length > 0) {
          await processAgentActions(response.actions);
        }
      } else {
        addMessage(response.response || 'Lo siento, no pude procesar tu solicitud.', false);
      }
    } catch (error) {
      handleApiError(error, 'Enviar mensaje al agente');
      addMessage('Lo siento, hubo un error al procesar tu mensaje.', false);
    } finally {
      setIsLoading(false);
    }
  };

  const processAgentActions = async (actions) => {
    for (const action of actions) {
      try {
        const result = await aiAgentService.executeAction(action, cartId);
        
        if (result.success) {
          switch (action.type) {
            case 'search_products':
              if (result.results && result.results.length > 0) {
                onProductsFound?.(result.results);
                addMessage(`Encontré ${result.results.length} productos que coinciden con tu búsqueda.`, false);
              } else {
                addMessage('No encontré productos que coincidan con tu búsqueda.', false);
              }
              break;
              
            case 'add_to_cart':
              if (result.message) {
                addMessage(result.message, false);
                // Forzar actualización del carrito visual
                if (onCartUpdated) {
                  onCartUpdated();
                }
              }
              break;
              
            case 'show_cart':
              if (result.cart) {
                const cart = result.cart;
                if (cart.items.length > 0) {
                  addMessage(`Tu carrito tiene ${cart.total_items} productos por un total de $${cart.final_total.toFixed(2)}.`, false);
                } else {
                  addMessage('Tu carrito está vacío.', false);
                }
              }
              break;
              
            case 'checkout':
              if (result.success) {
                addMessage(result.message, false);
                // Abrir modal de checkout solo para tarjetas
                if (result.action === 'open_checkout_modal') {
                  // Notificar al componente padre para abrir el modal de checkout
                  if (onCartUpdated) {
                    onCartUpdated();
                  }
                  // Emitir evento personalizado para abrir el modal
                  window.dispatchEvent(new CustomEvent('openCheckoutModal'));
                } else {
                  // Para efectivo y transferencia, limpiar carrito automáticamente
                  if (onCartUpdated) {
                    onCartUpdated();
                  }
                }
              } else {
                addMessage(result.error || 'Error procesando el pago', false);
              }
              break;
          }
        } else {
          addMessage(result.error || 'No pude ejecutar esa acción.', false);
        }
      } catch (error) {
        console.error('Error procesando acción:', action, error);
        addMessage('Hubo un error al ejecutar esa acción.', false);
      }
    }
  };

  const startVoiceRecording = async () => {
    if (isListening) return;

    if (!aiAgentService.isVoiceSupported()) {
      handleApiError({ message: 'Tu navegador no soporta grabación de voz' }, 'Grabación de voz');
      return;
    }

    try {
      setIsListening(true);
      addMessage('🎤 Escuchando... Di tu comando', false);
      
      const result = await aiAgentService.startVoiceRecording();
      if (!result.success) {
        throw new Error(result.error);
      }

      // Configurar callback para cuando termine la grabación
      aiAgentService.onRecordingComplete = async (audioBlob) => {
        try {
          setIsLoading(true);
          addMessage('🔄 Procesando tu comando de voz...', false);
          
          const response = await aiAgentService.processVoiceCommand(audioBlob, cartId);
          
          if (response.success) {
            const transcription = response.transcription || 'Comando de voz procesado';
            addMessage(`🎤 Dijiste: "${transcription}"`, true);
            addMessage(response.response, false);
            
            if (response.actions && response.actions.length > 0) {
              await processAgentActions(response.actions);
            }
          } else {
            addMessage('No pude entender tu comando de voz. Inténtalo de nuevo.', false);
          }
        } catch (error) {
          handleApiError(error, 'Procesar comando de voz');
          addMessage('Error procesando tu comando de voz.', false);
        } finally {
          setIsLoading(false);
          setIsListening(false);
        }
      };

    } catch (error) {
      handleApiError(error, 'Iniciar grabación');
      setIsListening(false);
    }
  };

  const stopVoiceRecording = () => {
    if (isListening) {
      aiAgentService.stopVoiceRecording();
      setIsListening(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const handleSuggestionClick = (suggestion) => {
    setInputMessage(suggestion);
    sendMessage(suggestion);
  };

  if (!isOpen) return null;

  return (
    <div className="ai-agent-chat-overlay">
      <div className="ai-agent-chat">
        <div className="chat-header">
          <div className="agent-info">
            <FaRobot className="agent-icon" />
            <div>
              <h3>Asistente Inteligente</h3>
              <p>Puedo ayudarte a buscar productos y realizar compras</p>
            </div>
          </div>
          <button onClick={onClose} className="close-btn">
            <FaTimes />
          </button>
        </div>

        <div className="chat-messages">
          {messages.length === 0 && (
            <div className="welcome-message">
              <div className="agent-avatar">
                <FaRobot />
              </div>
              <div className="welcome-content">
                <h4>¡Hola! 👋</h4>
                <p>Soy tu asistente de compras. Puedo ayudarte a:</p>
                <ul>
                  <li>🔍 Buscar productos</li>
                  <li>🛒 Agregar al carrito</li>
                  <li>💰 Ver el total</li>
                  <li>💳 Procesar el pago</li>
                </ul>
                <p>Escribe o habla conmigo para comenzar.</p>
              </div>
            </div>
          )}

          {messages.map(message => (
            <div key={message.id} className={`message ${message.isUser ? 'user' : 'agent'}`}>
              <div className="message-avatar">
                {message.isUser ? '👤' : '🤖'}
              </div>
              <div className="message-content">
                <div className="message-text">
                  {message.content}
                </div>
                <div className="message-time">
                  {message.timestamp.toLocaleTimeString()}
                </div>
              </div>
            </div>
          ))}

          {isLoading && (
            <div className="message agent">
              <div className="message-avatar">🤖</div>
              <div className="message-content">
                <div className="message-text">
                  <FaSpinner className="spinner" />
                  Pensando...
                </div>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {suggestions.length > 0 && messages.length === 0 && (
          <div className="suggestions">
            <h4>Sugerencias:</h4>
            <div className="suggestion-chips">
              {suggestions.map((suggestion, index) => (
                <button
                  key={index}
                  className="suggestion-chip"
                  onClick={() => handleSuggestionClick(suggestion)}
                >
                  {suggestion}
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="chat-input">
          <div className="input-container">
            <textarea
              ref={inputRef}
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Escribe tu mensaje o usa el micrófono..."
              disabled={isLoading}
              rows="1"
            />
            <div className="input-actions">
              {isListening ? (
                <button
                  onClick={stopVoiceRecording}
                  className="voice-btn listening"
                  title="Detener grabación"
                >
                  <FaMicrophoneSlash />
                </button>
              ) : (
                <button
                  onClick={startVoiceRecording}
                  className="voice-btn"
                  disabled={isLoading}
                  title="Grabar comando de voz"
                >
                  <FaMicrophone />
                </button>
              )}
              <button
                onClick={() => sendMessage()}
                disabled={!inputMessage.trim() || isLoading}
                className="send-btn"
                title="Enviar mensaje"
              >
                <FaPaperPlane />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AIAgentChat;
