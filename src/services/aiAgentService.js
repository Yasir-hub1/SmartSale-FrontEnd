/**
 * Servicio para el Agente Inteligente
 * Maneja comunicación con OpenAI y procesamiento de voz
 */
import api from './api';

class AIAgentService {
  constructor() {
    this.baseURL = '/ai';
    this.isListening = false;
    this.mediaRecorder = null;
    this.audioChunks = [];
    this.stream = null;
    this.onRecordingComplete = null;
  }

  /**
   * Envía mensaje de texto al agente
   */
  async sendMessage(message, cartId = '') {
    try {
      const response = await api.post(`${this.baseURL}/chat/`, {
        message,
        cart_id: cartId
      });
      return response.data;
    } catch (error) {
      console.error('Error enviando mensaje al agente:', error);
      throw error;
    }
  }

  /**
   * Procesa comando de voz
   */
  async processVoiceCommand(audioBlob, cartId = '') {
    try {
      // Validar que el audio no esté vacío
      if (!audioBlob || audioBlob.size === 0) {
        throw new Error('No se grabó audio válido');
      }

      // Convertir audio a formato compatible
      const wavBlob = await this.convertAudioToWav(audioBlob);
      
      const formData = new FormData();
      formData.append('audio', wavBlob, 'voice-command.wav');
      formData.append('cart_id', cartId);

      console.log(`[AIAgentService] Enviando audio de ${wavBlob.size} bytes`);

      const response = await api.post(`${this.baseURL}/voice/`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        timeout: 30000, // 30 segundos para procesamiento de voz
      });
      
      console.log('[AIAgentService] Respuesta recibida:', response.data);
      return response.data;
    } catch (error) {
      console.error('Error procesando comando de voz:', error);
      
      // Manejar diferentes tipos de errores
      if (error.code === 'ECONNABORTED') {
        throw new Error('El procesamiento de voz está tardando demasiado. Inténtalo de nuevo.');
      } else if (error.response?.status === 413) {
        throw new Error('El archivo de audio es demasiado grande. Graba un mensaje más corto.');
      } else if (error.response?.status === 400) {
        throw new Error('Formato de audio no válido. Inténtalo de nuevo.');
      } else if (error.response?.status >= 500) {
        throw new Error('Error del servidor. Inténtalo más tarde.');
      }
      
      throw error;
    }
  }

  /**
   * Ejecuta acción del agente
   */
  async executeAction(action, cartId = '') {
    try {
      const response = await api.post(`${this.baseURL}/action/`, {
        action,
        cart_id: cartId
      });
      return response.data;
    } catch (error) {
      console.error('Error ejecutando acción:', error);
      throw error;
    }
  }

  /**
   * Obtiene sugerencias del agente
   */
  async getSuggestions(cartId = '') {
    try {
      const response = await api.get(`${this.baseURL}/suggestions/`, {
        params: { cart_id: cartId }
      });
      return response.data;
    } catch (error) {
      console.error('Error obteniendo sugerencias:', error);
      throw error;
    }
  }

  /**
   * Inicia grabación de voz
   */
  async startVoiceRecording() {
    try {
      if (this.isListening) {
        return { success: false, error: 'Ya está grabando' };
      }

      // Verificar permisos de micrófono
      const permission = await navigator.permissions.query({ name: 'microphone' });
      if (permission.state === 'denied') {
        return { success: false, error: 'Permisos de micrófono denegados' };
      }

      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          sampleRate: 44100,
          channelCount: 1
        } 
      });

      // Detectar el mejor formato soportado
      let mimeType = 'audio/webm;codecs=opus';
      if (!MediaRecorder.isTypeSupported(mimeType)) {
        mimeType = 'audio/webm';
        if (!MediaRecorder.isTypeSupported(mimeType)) {
          mimeType = 'audio/mp4';
        }
      }

      this.mediaRecorder = new MediaRecorder(stream, {
        mimeType: mimeType,
        audioBitsPerSecond: 128000
      });

      this.audioChunks = [];
      this.stream = stream;

      this.mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          this.audioChunks.push(event.data);
        }
      };

      this.mediaRecorder.onstop = () => {
        const audioBlob = new Blob(this.audioChunks, { type: mimeType });
        console.log(`[AIAgentService] Audio grabado: ${audioBlob.size} bytes, tipo: ${mimeType}`);
        this.onRecordingComplete?.(audioBlob);
        this.cleanup();
      };

      this.mediaRecorder.onerror = (event) => {
        console.error('Error en MediaRecorder:', event.error);
        this.cleanup();
      };

      this.mediaRecorder.start(100); // Grabar en chunks de 100ms
      this.isListening = true;

      return { success: true };
    } catch (error) {
      console.error('Error iniciando grabación:', error);
      this.cleanup();
      
      let errorMessage = 'Error iniciando grabación';
      if (error.name === 'NotAllowedError') {
        errorMessage = 'Permisos de micrófono denegados';
      } else if (error.name === 'NotFoundError') {
        errorMessage = 'No se encontró micrófono';
      } else if (error.name === 'NotSupportedError') {
        errorMessage = 'Grabación de audio no soportada';
      }
      
      return { success: false, error: errorMessage };
    }
  }

  /**
   * Limpia recursos de grabación
   */
  cleanup() {
    if (this.stream) {
      this.stream.getTracks().forEach(track => track.stop());
      this.stream = null;
    }
    this.mediaRecorder = null;
    this.audioChunks = [];
    this.isListening = false;
  }

  /**
   * Detiene grabación de voz
   */
  stopVoiceRecording() {
    if (this.mediaRecorder && this.isListening) {
      this.mediaRecorder.stop();
      return { success: true };
    }
    return { success: false, error: 'No hay grabación activa' };
  }

  /**
   * Verifica si el navegador soporta reconocimiento de voz
   */
  isVoiceSupported() {
    return 'mediaDevices' in navigator && 'getUserMedia' in navigator.mediaDevices;
  }

  /**
   * Convierte audio a formato compatible
   */
  async convertAudioToWav(audioBlob) {
    try {
      // Crear AudioContext para procesar el audio
      const audioContext = new (window.AudioContext || window.webkitAudioContext)();
      const arrayBuffer = await audioBlob.arrayBuffer();
      const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
      
      // Convertir a WAV
      const wavBlob = this.audioBufferToWav(audioBuffer);
      return wavBlob;
    } catch (error) {
      console.error('Error convirtiendo audio:', error);
      return audioBlob; // Retornar original si falla la conversión
    }
  }

  /**
   * Convierte AudioBuffer a WAV
   */
  audioBufferToWav(buffer) {
    const length = buffer.length;
    const sampleRate = buffer.sampleRate;
    const arrayBuffer = new ArrayBuffer(44 + length * 2);
    const view = new DataView(arrayBuffer);

    // WAV header
    const writeString = (offset, string) => {
      for (let i = 0; i < string.length; i++) {
        view.setUint8(offset + i, string.charCodeAt(i));
      }
    };

    writeString(0, 'RIFF');
    view.setUint32(4, 36 + length * 2, true);
    writeString(8, 'WAVE');
    writeString(12, 'fmt ');
    view.setUint32(16, 16, true);
    view.setUint16(20, 1, true);
    view.setUint16(22, 1, true);
    view.setUint32(24, sampleRate, true);
    view.setUint32(28, sampleRate * 2, true);
    view.setUint16(32, 2, true);
    view.setUint16(34, 16, true);
    writeString(36, 'data');
    view.setUint32(40, length * 2, true);

    // Convertir datos
    const channelData = buffer.getChannelData(0);
    let offset = 44;
    for (let i = 0; i < length; i++) {
      const sample = Math.max(-1, Math.min(1, channelData[i]));
      view.setInt16(offset, sample < 0 ? sample * 0x8000 : sample * 0x7FFF, true);
      offset += 2;
    }

    return new Blob([arrayBuffer], { type: 'audio/wav' });
  }

  /**
   * Procesa respuesta del agente y ejecuta acciones
   */
  async processAgentResponse(response, cartId = '') {
    const actions = response.actions || [];
    const results = [];

    for (const action of actions) {
      try {
        const result = await this.executeAction(action, cartId);
        results.push({ action, result });
      } catch (error) {
        console.error('Error ejecutando acción:', action, error);
        results.push({ action, error: error.message });
      }
    }

    return results;
  }
}

const aiAgentService = new AIAgentService();
export default aiAgentService;
