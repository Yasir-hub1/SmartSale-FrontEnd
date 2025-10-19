import React, { useState } from 'react';
import { FaDownload, FaFilePdf, FaSpinner } from 'react-icons/fa';
import pdfService from '../../services/pdfService';
import { useErrorHandler } from '../../hooks/useErrorHandler';
import './PDFDownloadButton.css';

const PDFDownloadButton = ({ 
  saleId, 
  receiptNumber, 
  saleData = null,
  filename = null, 
  variant = 'primary',
  size = 'medium',
  showIcon = true,
  showText = true,
  className = ''
}) => {
  const { handleApiError, handleSuccess } = useErrorHandler();
  const [isDownloading, setIsDownloading] = useState(false);

  const handleDownload = async () => {
    if (isDownloading) return;

    try {
      setIsDownloading(true);
      
      // Si tenemos datos de la venta, usarlos para generar el PDF
      if (saleData) {
        await pdfService.generatePDFWithData(saleData, filename);
      } else {
        // Descargar PDF normal
        await pdfService.downloadAndOpen(saleId, filename);
      }
      
      handleSuccess('PDF descargado exitosamente');
    } catch (error) {
      handleApiError(error, 'Descargar PDF');
    } finally {
      setIsDownloading(false);
    }
  };

  const getButtonText = () => {
    if (isDownloading) return 'Descargando...';
    if (receiptNumber) return `Descargar ${receiptNumber}`;
    return 'Descargar PDF';
  };

  const getButtonClasses = () => {
    const baseClasses = 'pdf-download-btn';
    const variantClasses = {
      primary: 'pdf-download-btn--primary',
      secondary: 'pdf-download-btn--secondary',
      outline: 'pdf-download-btn--outline',
      ghost: 'pdf-download-btn--ghost'
    };
    const sizeClasses = {
      small: 'pdf-download-btn--small',
      medium: 'pdf-download-btn--medium',
      large: 'pdf-download-btn--large'
    };
    
    return [
      baseClasses,
      variantClasses[variant] || variantClasses.primary,
      sizeClasses[size] || sizeClasses.medium,
      className
    ].filter(Boolean).join(' ');
  };

  return (
    <button
      onClick={handleDownload}
      disabled={isDownloading}
      className={getButtonClasses()}
      title={receiptNumber ? `Descargar nota de venta ${receiptNumber}` : 'Descargar PDF'}
    >
      {showIcon && (
        <span className="pdf-download-btn__icon">
          {isDownloading ? (
            <FaSpinner className="spinner" />
          ) : (
            <FaFilePdf />
          )}
        </span>
      )}
      
      {showText && (
        <span className="pdf-download-btn__text">
          {getButtonText()}
        </span>
      )}
      
      {!showText && (
        <span className="pdf-download-btn__text sr-only">
          {getButtonText()}
        </span>
      )}
    </button>
  );
};

export default PDFDownloadButton;
