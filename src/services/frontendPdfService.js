import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

class FrontendPDFService {
  constructor() {
    this.doc = null;
  }

  /**
   * Generar PDF de nota de venta
   * @param {Object} sale - Datos de la venta
   * @param {Array} items - Items de la venta
   * @param {Object} client - Datos del cliente
   * @returns {Blob} - Archivo PDF
   */
  generateSaleReceipt(sale, items, client) {
    // Crear nuevo documento PDF
    this.doc = new jsPDF();
    
    // Configurar página
    const pageWidth = this.doc.internal.pageSize.getWidth();
    const pageHeight = this.doc.internal.pageSize.getHeight();
    
    let yPosition = 20;
    
    // Encabezado
    yPosition = this.addHeader(yPosition);
    
    // Información de la empresa
    yPosition = this.addCompanyInfo(yPosition);
    
    // Información del cliente
    yPosition = this.addClientInfo(yPosition, client);
    
    // Detalles de la venta
    yPosition = this.addSaleDetails(yPosition, sale);
    
    // Tabla de productos
    yPosition = this.addProductsTable(yPosition, items);
    
    // Totales
    yPosition = this.addTotals(yPosition, sale);
    
    // Pie de página
    this.addFooter(yPosition);
    
    // Generar blob
    return this.doc.output('blob');
  }

  addHeader(yPosition) {
    // Título
    this.doc.setFontSize(20);
    this.doc.setFont('helvetica', 'bold');
    this.doc.text('NOTA DE VENTA', 105, yPosition, { align: 'center' });
    yPosition += 15;
    
    // Número de venta
    this.doc.setFontSize(12);
    this.doc.setFont('helvetica', 'normal');
    this.doc.text(`Número de Venta: ${this.doc.getTextWidth('Número de Venta: ')}`, 20, yPosition);
    this.doc.text(`NV-${this.doc.getTextWidth('NV-')}`, 20 + this.doc.getTextWidth('Número de Venta: '), yPosition);
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
    this.doc.text(`Nombre: ${client.name || 'N/A'}`, 20, yPosition);
    yPosition += 6;
    this.doc.text(`Email: ${client.email || 'N/A'}`, 20, yPosition);
    yPosition += 6;
    this.doc.text(`Teléfono: ${client.phone || 'N/A'}`, 20, yPosition);
    yPosition += 15;
    
    return yPosition;
  }

  addSaleDetails(yPosition, sale) {
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
    
    this.doc.text(`Estado: ${statusMap[sale.status] || sale.status}`, 20, yPosition);
    yPosition += 6;
    this.doc.text(`Estado de Pago: ${paymentStatusMap[sale.payment_status] || sale.payment_status}`, 20, yPosition);
    yPosition += 6;
    this.doc.text(`Total de Items: ${sale.total_items || 0}`, 20, yPosition);
    yPosition += 6;
    
    if (sale.notes) {
      this.doc.text(`Notas: ${sale.notes}`, 20, yPosition);
      yPosition += 6;
    }
    
    yPosition += 10;
    return yPosition;
  }

  addProductsTable(yPosition, items) {
    this.doc.setFontSize(12);
    this.doc.setFont('helvetica', 'bold');
    this.doc.text('PRODUCTOS', 20, yPosition);
    yPosition += 15;
    
    // Preparar datos para la tabla
    const tableData = items.map(item => [
      item.product?.name || item.product_name || 'Producto',
      item.quantity.toString(),
      `$${item.price?.toFixed(2) || '0.00'}`,
      `$${((item.price || 0) * item.quantity).toFixed(2)}`
    ]);
    
    // Crear tabla
    autoTable(this.doc, {
      startY: yPosition,
      head: [['Producto', 'Cantidad', 'Precio Unit.', 'Subtotal']],
      body: tableData,
      theme: 'grid',
      headStyles: {
        fillColor: [102, 126, 234],
        textColor: 255,
        fontStyle: 'bold'
      },
      alternateRowStyles: {
        fillColor: [248, 250, 252]
      },
      margin: { left: 20, right: 20 }
    });
    
    // Obtener la posición final de la tabla
    yPosition = this.doc.lastAutoTable.finalY + 15;
    
    return yPosition;
  }

  addTotals(yPosition, sale) {
    const subtotal = sale.subtotal || 0;
    const tax = sale.tax || (subtotal * 0.16);
    const discount = sale.discount || 0;
    const total = sale.total || (subtotal + tax - discount);
    
    // Crear tabla de totales
    const totalsData = [
      ['Subtotal:', `$${subtotal.toFixed(2)}`],
      ['Impuestos (16%):', `$${tax.toFixed(2)}`],
      ['Descuento:', `$${discount.toFixed(2)}`],
      ['TOTAL:', `$${total.toFixed(2)}`]
    ];
    
    autoTable(this.doc, {
      startY: yPosition,
      body: totalsData,
      theme: 'plain',
      columnStyles: {
        0: { halign: 'right', fontStyle: 'bold' },
        1: { halign: 'right', fontStyle: 'bold' }
      },
      styles: {
        fontSize: 12,
        cellPadding: 4
      },
      margin: { left: 120, right: 20 }
    });
    
    // Resaltar la fila del total
    this.doc.setFontSize(14);
    this.doc.setFont('helvetica', 'bold');
    this.doc.text('TOTAL:', 120, yPosition + 20);
    this.doc.text(`$${total.toFixed(2)}`, 170, yPosition + 20);
    
    yPosition += 40;
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
   * @param {Object} sale - Datos de la venta
   * @param {Array} items - Items de la venta
   * @param {Object} client - Datos del cliente
   * @param {string} filename - Nombre del archivo
   */
  async downloadSaleReceipt(sale, items, client, filename = null) {
    try {
      const pdfBlob = this.generateSaleReceipt(sale, items, client);
      
      // Crear enlace de descarga
      const url = window.URL.createObjectURL(pdfBlob);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename || `nota_venta_${sale.id?.slice(0, 8) || 'venta'}.pdf`;
      
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

const frontendPdfService = new FrontendPDFService();
export default frontendPdfService;
