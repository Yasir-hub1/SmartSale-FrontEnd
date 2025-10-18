// Página de reportes
import React, { useState } from 'react';
import { FaFileAlt, FaMicrophone, FaDownload, FaSync } from 'react-icons/fa';
import { useOffline } from '../context/OfflineContext';
import './ReportsPage.css';

const ReportsPage = () => {
  const { isOfflineMode } = useOffline();
  const [isListening, setIsListening] = useState(false);
  const [reportPrompt, setReportPrompt] = useState('');

  const handleVoiceInput = () => {
    setIsListening(!isListening);
    // Aquí se implementaría el reconocimiento de voz
  };

  const handleGenerateReport = () => {
    if (!reportPrompt.trim()) return;
    // Aquí se implementaría la generación de reportes
    console.log('Generando reporte:', reportPrompt);
  };

  return (
    <div className="reports-page">
      <div className="page-header">
        <div className="header-left">
          <h1>Reportes Inteligentes</h1>
          <p>Genera reportes con IA usando texto o voz</p>
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

          <div className="format-selector">
            <label>Formato:</label>
            <select>
              <option value="screen">Pantalla</option>
              <option value="pdf">PDF</option>
              <option value="excel">Excel</option>
            </select>
          </div>

          <button
            className="generate-btn"
            onClick={handleGenerateReport}
            disabled={!reportPrompt.trim()}
          >
            <FaSync />
            Generar Reporte
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
        <div className="empty-state">
          <div className="empty-icon">
            <FaFileAlt />
          </div>
          <h4>No hay reportes generados</h4>
          <p>Genera tu primer reporte para verlo aquí</p>
        </div>
      </div>
    </div>
  );
};

export default ReportsPage;
