// Página de reportes
import React, { useState, useEffect, useRef } from 'react';
import { FaFileAlt, FaMicrophone, FaDownload, FaSync, FaStop, FaPlay } from 'react-icons/fa';
import { useOffline } from '../context/OfflineContext';
import { useErrorHandler } from '../hooks/useErrorHandler';
import './ReportsPage.css';

const ReportsPage = () => {
  const { isOfflineMode } = useOffline();
  const { handleError } = useErrorHandler();
  
  // Estados principales
  const [isListening, setIsListening] = useState(false);
  const [reportPrompt, setReportPrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedReports, setGeneratedReports] = useState([]);
  const [selectedFormat, setSelectedFormat] = useState('screen');
  const [connectionStatus, setConnectionStatus] = useState('checking');
  
  // Referencias para reconocimiento de voz
  const recognitionRef = useRef(null);
  const isSupportedRef = useRef(false);

  // Verificar conexión al cargar
  useEffect(() => {
    handleTestConnection();
  }, []);

  // Inicializar reconocimiento de voz
  useEffect(() => {
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      recognitionRef.current = new SpeechRecognition();
      
      recognitionRef.current.continuous = false;
      recognitionRef.current.interimResults = false;
      recognitionRef.current.lang = 'es-ES';
      
      recognitionRef.current.onstart = () => {
        setIsListening(true);
      };
      
      recognitionRef.current.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        setReportPrompt(prev => prev + ' ' + transcript);
        setIsListening(false);
      };
      
      recognitionRef.current.onerror = (event) => {
        console.error('Error en reconocimiento de voz:', event.error);
        setIsListening(false);
        
        // No mostrar error si fue abortado intencionalmente
        if (event.error === 'aborted') {
          console.log('Reconocimiento abortado por el usuario');
          return;
        }
        
        let errorMessage = 'Error en el reconocimiento de voz';
        switch (event.error) {
          case 'no-speech':
            errorMessage = 'No se detectó voz. Intenta hablar más cerca del micrófono.';
            break;
          case 'audio-capture':
            errorMessage = 'No se pudo acceder al micrófono. Verifica los permisos.';
            break;
          case 'not-allowed':
            errorMessage = 'Permisos de micrófono denegados. Permite el acceso al micrófono.';
            break;
          case 'network':
            errorMessage = 'Error de red. Verifica tu conexión.';
            break;
          default:
            errorMessage = `Error: ${event.error}`;
        }
        handleError(errorMessage);
      };
      
      recognitionRef.current.onend = () => {
        setIsListening(false);
      };
      
      isSupportedRef.current = true;
    }
    
    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    };
  }, [handleError]);

  const handleVoiceInput = () => {
    if (!isSupportedRef.current) {
      handleError('Reconocimiento de voz no soportado en este navegador');
      return;
    }
    
    if (isListening) {
      try {
        recognitionRef.current.stop();
      } catch (error) {
        console.error('Error deteniendo grabación:', error);
        setIsListening(false);
      }
    } else {
      try {
        // Verificar si ya está iniciado
        if (recognitionRef.current && recognitionRef.current.state === 'started') {
          console.log('El reconocimiento ya está iniciado');
          return;
        }
        
        // Verificar si ya está escuchando
        if (isListening) {
          console.log('Ya está escuchando, ignorando solicitud');
          return;
        }
        
        recognitionRef.current.start();
      } catch (error) {
        console.error('Error iniciando grabación:', error);
        if (error.name === 'InvalidStateError') {
          console.log('El reconocimiento ya está iniciado, ignorando error');
          setIsListening(true);
        } else {
          handleError('Error iniciando el reconocimiento de voz: ' + error.message);
        }
      }
    }
  };

  const handleGenerateReport = async () => {
    if (!reportPrompt.trim()) return;
    
    setIsGenerating(true);
    try {
      // Verificar y renovar token si es necesario
      let token = localStorage.getItem('access_token');
      console.log('Token presente:', !!token);
      
      if (!token) {
        throw new Error('No hay token de autenticación. Por favor, inicia sesión nuevamente.');
      }
      
      // Intentar renovar el token si está expirado
      try {
        const refreshResponse = await fetch(`${process.env.REACT_APP_API_URL}/auth/refresh/`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            refresh: localStorage.getItem('refresh_token')
          })
        });
        
        if (refreshResponse.ok) {
          const refreshData = await refreshResponse.json();
          token = refreshData.access;
          localStorage.setItem('access_token', token);
          console.log('Token renovado exitosamente');
        }
      } catch (refreshError) {
        console.log('No se pudo renovar el token, usando el actual');
      }
      
      // SIEMPRE generar en formato 'screen' para obtener los datos
      const response = await fetch(`${process.env.REACT_APP_API_URL}/reports/generate/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          prompt: reportPrompt,
          format: 'screen' // Siempre screen para obtener datos
        })
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error('Error del servidor:', errorData);
        
        if (response.status === 401) {
          throw new Error('Sesión expirada. Por favor, inicia sesión nuevamente.');
        }
        
        throw new Error(errorData.detail || errorData.error || 'Error generando reporte');
      }
      
      const result = await response.json();
      console.log('Resultado del backend:', result);
      console.log('Cantidad de datos recibidos:', result.data ? result.data.length : 'No hay datos');
      
      // Agregar reporte a la lista (siempre en formato screen)
      const newReport = {
        id: Date.now(),
        prompt: reportPrompt,
        format: 'screen',
        generatedAt: new Date().toISOString(),
        data: result.data
      };
      
      setGeneratedReports(prev => [newReport, ...prev]);
      setReportPrompt('');
      
    } catch (error) {
      console.error('Error generando reporte:', error);
      alert('Error generando reporte: ' + error.message);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleTestConnection = async () => {
    try {
      console.log('Probando conexión con el backend...');
      setConnectionStatus('checking');
      const response = await fetch(`${process.env.REACT_APP_API_URL}/reports/test/`);
      
      if (response.ok) {
        const data = await response.json();
        console.log('Conexión exitosa:', data);
        setConnectionStatus('connected');
        console.log('✅ Conexión con el backend exitosa');
      } else {
        throw new Error(`Error ${response.status}: ${response.statusText}`);
      }
    } catch (error) {
      console.error('Error de conexión:', error);
      setConnectionStatus('error');
      console.error('❌ Error de conexión: ' + error.message);
    }
  };

  const handleExportPDF = (reportData) => {
    try {
      // Importar jsPDF dinámicamente
      import('jspdf').then(({ default: jsPDF }) => {
        import('jspdf-autotable').then(({ default: autoTable }) => {
          const doc = new jsPDF();
          
          // Título del reporte
          doc.setFontSize(16);
          doc.text('Reporte de Ventas', 14, 22);
          
          // Información del reporte
          doc.setFontSize(10);
          doc.text(`Generado: ${new Date().toLocaleString()}`, 14, 30);
          doc.text(`Total de registros: ${reportData.length}`, 14, 35);
          
          // Preparar datos para la tabla
          if (reportData.length > 0) {
            const headers = Object.keys(reportData[0]);
            const rows = reportData.map(row => Object.values(row));
            
            // Agregar tabla
            autoTable(doc, {
              head: [headers],
              body: rows,
              startY: 40,
              styles: { fontSize: 8 },
              headStyles: { fillColor: [66, 139, 202] }
            });
          }
          
          // Guardar PDF
          doc.save(`reporte_${Date.now()}.pdf`);
        });
      });
    } catch (error) {
      console.error('Error generando PDF:', error);
      alert('Error generando PDF: ' + error.message);
    }
  };

  const handleExportExcel = (reportData) => {
    try {
      // Importar XLSX dinámicamente
      import('xlsx').then((XLSX) => {
        // Crear workbook
        const wb = XLSX.utils.book_new();
        
        // Preparar datos
        if (reportData.length > 0) {
          const ws = XLSX.utils.json_to_sheet(reportData);
          XLSX.utils.book_append_sheet(wb, ws, 'Reporte');
        } else {
          // Crear hoja vacía con mensaje
          const ws = XLSX.utils.aoa_to_sheet([['No hay datos disponibles']]);
          XLSX.utils.book_append_sheet(wb, ws, 'Reporte');
        }
        
        // Guardar archivo
        XLSX.writeFile(wb, `reporte_${Date.now()}.xlsx`);
      });
    } catch (error) {
      console.error('Error generando Excel:', error);
      alert('Error generando Excel: ' + error.message);
    }
  };

  return (
    <div className="reports-page">
      <div className="page-header">
        <div className="header-left">
          <h1>Reportes Inteligentes</h1>
          <p>Genera reportes con IA usando texto o voz</p>
        </div>
        <div className="connection-status">
          <span className={`status-indicator ${connectionStatus}`}>
            {connectionStatus === 'checking' && '🔄 Verificando...'}
            {connectionStatus === 'connected' && '✅ Conectado'}
            {connectionStatus === 'error' && '❌ Error de conexión'}
          </span>
        </div>
      </div>

      {/* Indicador offline */}
      {isOfflineMode && (
        <div className="offline-indicator">
          <span>📱 Reportes con datos locales</span>
        </div>
      )}

      {/* Generador de reportes */}
      <div className="report-generator">
        <div className="generator-header">
          <h3>Generar Nuevo Reporte</h3>
          <p>Describe qué reporte necesitas o usa comandos de voz</p>
        </div>

        <div className="input-section">
          <div className="text-input">
            <textarea
              value={reportPrompt}
              onChange={(e) => setReportPrompt(e.target.value)}
              placeholder="Ejemplo: 'Muestra las ventas del mes de octubre agrupadas por producto'"
              rows={4}
            />
            <button
              className={`voice-btn ${isListening ? 'listening' : ''}`}
              onClick={handleVoiceInput}
            >
              <FaMicrophone />
              {isListening ? 'Escuchando...' : 'Usar Voz'}
            </button>
          </div>

          {/* Removido el selector de formato - siempre se genera en pantalla */}

          <button
            className="generate-btn"
            onClick={handleGenerateReport}
            disabled={!reportPrompt.trim() || isGenerating}
          >
            {isGenerating ? <FaSync className="spinning" /> : <FaSync />}
            {isGenerating ? 'Generando...' : 'Generar Reporte'}
          </button>
          
          <button
            className="test-btn"
            onClick={handleTestConnection}
            disabled={isGenerating}
          >
            Probar Conexión
          </button>
        </div>

        {/* Ejemplos de comandos */}
        <div className="command-examples">
          <h4>Ejemplos de comandos:</h4>
          <div className="examples-grid">
            <div className="example-card">
              <h5>Ventas</h5>
              <ul>
                <li>"Ventas del mes actual"</li>
                <li>"Top 10 productos más vendidos"</li>
                <li>"Comparar ventas por trimestre"</li>
              </ul>
            </div>
            <div className="example-card">
              <h5>Clientes</h5>
              <ul>
                <li>"Clientes con más compras"</li>
                <li>"Nuevos clientes este mes"</li>
                <li>"Segmentación de clientes"</li>
              </ul>
            </div>
            <div className="example-card">
              <h5>Productos</h5>
              <ul>
                <li>"Productos con stock bajo"</li>
                <li>"Rentabilidad por producto"</li>
                <li>"Productos sin ventas"</li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* Historial de reportes */}
      <div className="reports-history">
        <h3>Reportes Generados</h3>
        {generatedReports.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">
              <FaFileAlt />
            </div>
            <h4>No hay reportes generados</h4>
            <p>Genera tu primer reporte para verlo aquí</p>
          </div>
        ) : (
          <div className="reports-list">
            {generatedReports.map((report) => (
              <div key={report.id} className="report-card">
                <div className="report-header">
                  <div className="report-info">
                    <h4>Reporte #{report.id}</h4>
                    <p className="report-prompt">"{report.prompt}"</p>
                    <span className="report-format">{report.format.toUpperCase()}</span>
                    <span className="report-date">
                      {new Date(report.generatedAt).toLocaleString()}
                    </span>
                  </div>
                  <div className="report-actions">
                    <button 
                      className="export-btn pdf-btn"
                      onClick={() => handleExportPDF(report.data)}
                      title="Exportar a PDF"
                    >
                      <FaFileAlt />
                      PDF
                    </button>
                    <button 
                      className="export-btn excel-btn"
                      onClick={() => handleExportExcel(report.data)}
                      title="Exportar a Excel"
                    >
                      <FaDownload />
                      Excel
                    </button>
                  </div>
                </div>
                
                {report.format === 'screen' && report.data && (
                  <div className="report-preview">
                    <h5>Vista Previa: {report.data.length} registros</h5>
                    {report.data.length > 10 && (
                      <p style={{color: '#6b7280', fontSize: '0.875rem', margin: '8px 0'}}>
                        📊 Mostrando {report.data.length} registros. Desplázate para ver todos los datos.
                      </p>
                    )}
                    <div className="data-table">
                      {Array.isArray(report.data) ? (
                        <table>
                          <thead>
                            <tr>
                              {Object.keys(report.data[0] || {}).map(key => (
                                <th key={key}>{key}</th>
                              ))}
                            </tr>
                          </thead>
                          <tbody>
                            {report.data.map((row, index) => (
                              <tr key={index}>
                                {Object.values(row).map((value, i) => (
                                  <td key={i}>{value}</td>
                                ))}
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      ) : (
                        <pre>{JSON.stringify(report.data, null, 2)}</pre>
                      )}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default ReportsPage;
