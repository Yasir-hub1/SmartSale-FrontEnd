import api from './api';
import simplePdfService from './simplePdfService';

class PDFService {
  constructor() {
    this.baseURL = '/sales';
  }

  /**
   * Descargar PDF de nota de venta
   * @param {string} saleId - ID de la venta
   * @param {boolean} regenerate - Regenerar PDF si existe
   * @returns {Promise<Blob>} - Archivo PDF
   */
  async downloadSaleReceipt(saleId, regenerate = false) {
    try {
      const params = regenerate ? { regenerate: 'true' } : {};
      const response = await api.get(`${this.baseURL}/${saleId}/receipt/download/`, {
        params,
        responseType: 'blob'
      });
      
      return response.data;
    } catch (error) {
      console.error('Error descargando PDF:', error);
      throw error;
    }
  }

  /**
   * Obtener información del comprobante
   * @param {string} saleId - ID de la venta
   * @returns {Promise<Object>} - Información del comprobante
   */
  async getReceiptInfo(saleId) {
    try {
      const response = await api.get(`${this.baseURL}/${saleId}/receipt/info/`);
      return response.data;
    } catch (error) {
      console.error('Error obteniendo información del comprobante:', error);
      throw error;
    }
  }

  /**
   * Crear enlace de descarga para el PDF
   * @param {string} saleId - ID de la venta
   * @param {string} filename - Nombre del archivo
   * @returns {string} - URL de descarga
   */
  createDownloadLink(saleId, filename = null) {
    const baseUrl = process.env.REACT_APP_API_URL || 'http://localhost:8000';
    const defaultFilename = `nota_venta_${saleId.slice(0, 8)}.pdf`;
    return `${baseUrl}/api/v1/sales/${saleId}/receipt/download/?filename=${filename || defaultFilename}`;
  }

  /**
   * Descargar PDF y abrir en nueva ventana
   * @param {string} saleId - ID de la venta
   * @param {string} filename - Nombre del archivo
   */
  async downloadAndOpen(saleId, filename = null) {
    try {
      // Intentar descargar desde el backend primero
      try {
        const pdfBlob = await this.downloadSaleReceipt(saleId);
        const url = window.URL.createObjectURL(pdfBlob);
        const link = document.createElement('a');
        link.href = url;
        link.download = filename || `nota_venta_${saleId.slice(0, 8)}.pdf`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
        return;
      } catch (backendError) {
        console.warn('Error descargando desde backend, usando generación frontend:', backendError);
      }
      
      // Si falla el backend, generar en el frontend
      await this.generateFrontendPDF(saleId, filename);
    } catch (error) {
      console.error('Error descargando y abriendo PDF:', error);
      throw error;
    }
  }

  /**
   * Generar PDF en el frontend
   * @param {string} saleId - ID de la venta
   * @param {string} filename - Nombre del archivo
   */
  async generateFrontendPDF(saleId, filename = null) {
    try {
      // Intentar obtener datos del backend
      try {
        const response = await api.get(`${this.baseURL}/${saleId}/data/`);
        const saleData = response.data.sale;
        
        if (saleData) {
          // Preparar datos para el PDF
          const sale = {
            id: saleData.id,
            subtotal: saleData.subtotal,
            tax: saleData.tax,
            discount: saleData.discount,
            total: saleData.total,
            status: saleData.status,
            payment_status: saleData.payment_status,
            total_items: saleData.total_items,
            notes: saleData.notes
          };
          
          const items = saleData.items.map(item => ({
            product: { name: item.product_name },
            product_name: item.product_name,
            quantity: item.quantity,
            price: item.price
          }));
          
          const client = saleData.client;
          
          // Generar PDF con datos reales
          await simplePdfService.downloadSaleReceipt(sale, items, client, filename);
          return;
        }
      } catch (backendError) {
        console.warn('Error obteniendo datos del backend, usando datos mock:', backendError);
      }
      
      // Si falla el backend, usar datos mock
      const mockSale = {
        id: saleId,
        subtotal: 50.00,
        tax: 8.00,
        discount: 0,
        total: 58.00,
        status: 'completed',
        payment_status: 'paid',
        total_items: 1,
        notes: `Compra realizada - NV-${saleId.slice(0, 8)}`
      };
      
      const mockItems = [{
        product: { name: 'Producto Test' },
        product_name: 'Producto Test',
        quantity: 1,
        price: 50.00
      }];
      
      const mockClient = {
        name: 'Cliente Anónimo',
        email: 'anonimo@tienda.com',
        phone: '000-000-0000'
      };
      
      // Generar PDF con datos mock
      await simplePdfService.downloadSaleReceipt(mockSale, mockItems, mockClient, filename);
    } catch (error) {
      console.error('Error generando PDF en frontend:', error);
      throw error;
    }
  }

  /**
   * Generar PDF con datos específicos de la venta
   * @param {Object} saleData - Datos de la venta del agente
   * @param {string} filename - Nombre del archivo
   */
  async generatePDFWithData(saleData, filename = null) {
    try {
      // Extraer información del mensaje del agente
      const agentMessage = saleData.message || '';
      console.log('Mensaje del agente:', agentMessage);
      
      // Buscar patrones en el mensaje del agente
      const totalMatch = agentMessage.match(/\$(\d+\.?\d*)/);
      const quantityMatch = agentMessage.match(/(\d+)\s+unidades/);
      const totalPaidMatch = agentMessage.match(/Total pagado: \$(\d+\.?\d*)/);
      
      // Calcular datos basados en el mensaje del agente
      let totalFromMessage = 0;
      let quantityFromMessage = 1;
      
      if (totalMatch) {
        totalFromMessage = parseFloat(totalMatch[1]);
      }
      
      if (quantityMatch) {
        quantityFromMessage = parseInt(quantityMatch[1]);
      }
      
      // Si tenemos el total pagado, usarlo como subtotal
      let finalTotal = totalFromMessage;
      if (totalPaidMatch) {
        finalTotal = parseFloat(totalPaidMatch[1]);
        totalFromMessage = finalTotal; // Subtotal = Total (sin impuestos)
      }
      
      const unitPrice = totalFromMessage / quantityFromMessage;
      
      console.log('Datos extraídos:', {
        totalFromMessage,
        quantityFromMessage,
        unitPrice,
        finalTotal
      });
      
      // Preparar datos para el PDF basados en los datos del agente
      const sale = {
        id: saleData.sale_id,
        subtotal: totalFromMessage,
        discount: 0,
        total: finalTotal,
        status: 'completed',
        payment_status: 'paid',
        total_items: quantityFromMessage,
        notes: `Compra realizada - ${saleData.payment_method || 'efectivo'}`
      };
      
      // Crear UN SOLO item con la cantidad correcta
      const items = [{
        product: { name: 'Producto Test' },
        product_name: 'Producto Test',
        quantity: quantityFromMessage, // Cantidad total correcta
        price: unitPrice // Precio unitario correcto
      }];
      
      const client = {
        name: 'Cliente Anónimo',
        email: 'anonimo@tienda.com',
        phone: '000-000-0000'
      };
      
      console.log('Datos para PDF:', { sale, items, client });
      
      // Generar PDF con datos específicos
      await simplePdfService.downloadSaleReceipt(sale, items, client, filename);
    } catch (error) {
      console.error('Error generando PDF con datos específicos:', error);
      throw error;
    }
  }

  /**
   * Verificar si el PDF está disponible
   * @param {string} saleId - ID de la venta
   * @returns {Promise<boolean>} - True si el PDF está disponible
   */
  async isPDFAvailable(saleId) {
    try {
      const info = await this.getReceiptInfo(saleId);
      return info.pdf_url !== null;
    } catch (error) {
      console.error('Error verificando disponibilidad del PDF:', error);
      return false;
    }
  }
}

const pdfService = new PDFService();
export default pdfService;
