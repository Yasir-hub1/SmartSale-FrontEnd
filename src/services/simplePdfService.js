import jsPDF from 'jspdf';

class SimplePDFService {
  constructor() {
    this.doc = null;
  }

  /**
   * Generar PDF simple de nota de venta
   * @param {Object} saleData - Datos de la venta
   * @param {Array} items - Items de la venta
   * @param {Object} client - Datos del cliente
   * @returns {Blob} - Archivo PDF
   */
  generateSaleReceipt(saleData, items, client) {
    // Crear nuevo documento PDF
    this.doc = new jsPDF();
    
    let yPosition = 20;
    
    // Encabezado
    yPosition = this.addHeader(yPosition, saleData);
    
    // Información de la empresa
    yPosition = this.addCompanyInfo(yPosition);
    
    // Información del cliente
    yPosition = this.addClientInfo(yPosition, client);
    
    // Detalles de la venta
    yPosition = this.addSaleDetails(yPosition, saleData);
    
    // Productos
    yPosition = this.addProducts(yPosition, items);
    
    // Totales
    yPosition = this.addTotals(yPosition, saleData);
    
    // Pie de página
    this.addFooter(yPosition);
    
    // Generar blob
    return this.doc.output('blob');
  }

  addHeader(yPosition, saleData) {
    // Título
    this.doc.setFontSize(20);
    this.doc.setFont('helvetica', 'bold');
    this.doc.text('NOTA DE VENTA', 105, yPosition, { align: 'center' });
    yPosition += 15;
    
    // Número de venta
    this.doc.setFontSize(12);
    this.doc.setFont('helvetica', 'normal');
    this.doc.text(`Número de Venta: ${saleData.id || 'N/A'}`, 20, yPosition);
    yPosition += 8;
    
    // Fecha
    const now = new Date();
    const dateStr = now.toLocaleDateString('es-MX') + ' ' + now.toLocaleTimeString('es-MX');
    this.doc.text(`Fecha: ${dateStr}`, 20, yPosition);
    yPosition += 20;
    
    return yPosition;
  }

  addCompanyInfo(yPosition) {
    this.doc.setFontSize(14);
    this.doc.setFont('helvetica', 'bold');
    this.doc.text('SmartSales365', 20, yPosition);
    yPosition += 8;
    
    this.doc.setFontSize(10);
    this.doc.setFont('helvetica', 'normal');
    this.doc.text('Sistema de Gestión de Ventas', 20, yPosition);
    yPosition += 6;
    this.doc.text('Email: info@SmartSales365.com', 20, yPosition);
    yPosition += 6;
    this.doc.text('Teléfono: +52 55 1234 5678', 20, yPosition);
    yPosition += 20;
    
    return yPosition;
  }

  addClientInfo(yPosition, client) {
    this.doc.setFontSize(12);
    this.doc.setFont('helvetica', 'bold');
    this.doc.text('INFORMACIÓN DEL CLIENTE', 20, yPosition);
    yPosition += 10;
    
    this.doc.setFontSize(10);
    this.doc.setFont('helvetica', 'normal');
    this.doc.text(`Nombre: ${client.name || 'Cliente Anónimo'}`, 20, yPosition);
    yPosition += 6;
    this.doc.text(`Email: ${client.email || 'anonimo@tienda.com'}`, 20, yPosition);
    yPosition += 6;
    this.doc.text(`Teléfono: ${client.phone || '000-000-0000'}`, 20, yPosition);
    yPosition += 15;
    
    return yPosition;
  }

  addSaleDetails(yPosition, saleData) {
    this.doc.setFontSize(12);
    this.doc.setFont('helvetica', 'bold');
    this.doc.text('DETALLES DE LA VENTA', 20, yPosition);
    yPosition += 10;
    
    this.doc.setFontSize(10);
    this.doc.setFont('helvetica', 'normal');
    
    const statusMap = {
      'pending': 'Pendiente',
      'completed': 'Completada',
      'cancelled': 'Cancelada',
      'refunded': 'Reembolsada'
    };
    
    const paymentStatusMap = {
      'pending': 'Pendiente',
      'paid': 'Pagado',
      'failed': 'Fallido',
      'refunded': 'Reembolsado'
    };
    
    this.doc.text(`Estado: ${statusMap[saleData.status] || saleData.status || 'Completada'}`, 20, yPosition);
    yPosition += 6;
    this.doc.text(`Estado de Pago: ${paymentStatusMap[saleData.payment_status] || saleData.payment_status || 'Pagado'}`, 20, yPosition);
    yPosition += 6;
    this.doc.text(`Total de Items: ${saleData.total_items || 1}`, 20, yPosition);
    yPosition += 6;
    
    if (saleData.notes) {
      this.doc.text(`Notas: ${saleData.notes}`, 20, yPosition);
      yPosition += 6;
    }
    
    yPosition += 10;
    return yPosition;
  }

  addProducts(yPosition, items) {
    this.doc.setFontSize(12);
    this.doc.setFont('helvetica', 'bold');
    this.doc.text('PRODUCTOS', 20, yPosition);
    yPosition += 15;
    
    // Encabezados de la tabla
    this.doc.setFontSize(10);
    this.doc.setFont('helvetica', 'bold');
    this.doc.text('Producto', 20, yPosition);
    this.doc.text('Cantidad', 80, yPosition);
    this.doc.text('Precio Unit.', 120, yPosition);
    this.doc.text('Subtotal', 160, yPosition);
    yPosition += 8;
    
    // Línea separadora
    this.doc.line(20, yPosition, 190, yPosition);
    yPosition += 5;
    
    // Productos
    this.doc.setFont('helvetica', 'normal');
    items.forEach(item => {
      const productName = item.product?.name || item.product_name || 'Producto';
      const quantity = item.quantity || 1;
      const price = item.price || 0;
      const subtotal = price * quantity;
      
      this.doc.text(productName, 20, yPosition);
      this.doc.text(quantity.toString(), 80, yPosition);
      this.doc.text(`$${price.toFixed(2)}`, 120, yPosition);
      this.doc.text(`$${subtotal.toFixed(2)}`, 160, yPosition);
      yPosition += 8;
    });
    
    yPosition += 10;
    return yPosition;
  }

  addTotals(yPosition, saleData) {
    const subtotal = saleData.subtotal || 0;
    const discount = saleData.discount || 0;
    const total = saleData.total || (subtotal - discount);
    
    this.doc.setFontSize(12);
    this.doc.setFont('helvetica', 'bold');
    this.doc.text('TOTALES', 20, yPosition);
    yPosition += 15;
    
    this.doc.setFontSize(10);
    this.doc.setFont('helvetica', 'normal');
    this.doc.text(`Subtotal:`, 120, yPosition);
    this.doc.text(`$${subtotal.toFixed(2)}`, 160, yPosition);
    yPosition += 8;
    
    if (discount > 0) {
      this.doc.text(`Descuento:`, 120, yPosition);
      this.doc.text(`-$${discount.toFixed(2)}`, 160, yPosition);
      yPosition += 8;
    }
    
    // Línea separadora
    this.doc.line(120, yPosition, 190, yPosition);
    yPosition += 5;
    
    // Total
    this.doc.setFontSize(12);
    this.doc.setFont('helvetica', 'bold');
    this.doc.text(`TOTAL:`, 120, yPosition);
    this.doc.text(`$${total.toFixed(2)}`, 160, yPosition);
    yPosition += 20;
    
    return yPosition;
  }

  addFooter(yPosition) {
    const pageHeight = this.doc.internal.pageSize.getHeight();
    
    // Línea separadora
    this.doc.setDrawColor(200, 200, 200);
    this.doc.line(20, yPosition, 190, yPosition);
    yPosition += 10;
    
    // Mensaje de agradecimiento
    this.doc.setFontSize(12);
    this.doc.setFont('helvetica', 'bold');
    this.doc.text('¡Gracias por su compra!', 20, yPosition);
    yPosition += 8;
    
    // Información del sistema
    this.doc.setFontSize(8);
    this.doc.setFont('helvetica', 'normal');
    this.doc.text('Este documento es una nota de venta generada automáticamente por SmartSales365', 20, yPosition);
    
    // Número de página
    const pageCount = this.doc.internal.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      this.doc.setPage(i);
      this.doc.setFontSize(8);
      this.doc.text(`Página ${i} de ${pageCount}`, 190, pageHeight - 10, { align: 'right' });
    }
  }

  /**
   * Descargar PDF
   * @param {Object} saleData - Datos de la venta
   * @param {Array} items - Items de la venta
   * @param {Object} client - Datos del cliente
   * @param {string} filename - Nombre del archivo
   */
  async downloadSaleReceipt(saleData, items, client, filename = null) {
    try {
      const pdfBlob = this.generateSaleReceipt(saleData, items, client);
      
      // Crear enlace de descarga
      const url = window.URL.createObjectURL(pdfBlob);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename || `nota_venta_${saleData.id?.slice(0, 8) || 'venta'}.pdf`;
      
      // Descargar
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      // Limpiar URL
      window.URL.revokeObjectURL(url);
      
      return true;
    } catch (error) {
      console.error('Error generando PDF:', error);
      throw error;
    }
  }
}

const simplePdfService = new SimplePDFService();
export default simplePdfService;
