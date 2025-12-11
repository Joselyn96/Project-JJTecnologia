import { Injectable, inject } from '@angular/core';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { environment } from '../../environments/environment.development';
import { AuthService } from './auth.service';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Order } from './order.service';
import { CartItem } from './cart.service';

/**
 * Interface para los datos necesarios para generar una boleta
 */
export interface ReceiptData {
  order: Order;
  orderNumber: string;
  items: CartItem[];
  userEmail: string;
}

@Injectable({
  providedIn: 'root'
})
export class ReceiptService {
  private authService = inject(AuthService);

  constructor() {}

  /**
   * Genera el PDF de la boleta con todos los datos de la compra
   */
  generatePDF(data: ReceiptData): Blob {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.width;
    let yPos = 20;

    // ==========================================
    // 1. ENCABEZADO - Logo y datos de empresa
    // ==========================================
    const logoUrl = '/logo_navbar_blanco.png';
    doc.addImage(logoUrl, 'PNG', 15, yPos - 5, 30, 20); // Logo izquierda
    
    // Datos de empresa a la derecha
    const companyInfoX = pageWidth - 80;
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('JJ TECNOLOGIA E.I.R.L.', companyInfoX, yPos);
    
    yPos += 8;
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.text('RUC: 20611496347', companyInfoX, yPos);

    yPos += 4;
    doc.text('Miguel Iglesias Mza. C Lt. 5 A.H. Trebol Azul', companyInfoX, yPos);

    yPos += 4;
    doc.text('(Alt. A 2 Cdras Del Arco De Alemana)', companyInfoX, yPos);
    
    yPos += 4;
    doc.text('Lima - Lima - San Juan de Miraflores', companyInfoX, yPos);

    yPos += 10;
    doc.text('mkt.ventas@jjtecnologias.com | +51 986 753 834', pageWidth / 2, yPos, { align: 'center' });

    // Línea separadora
    yPos += 8;
    doc.setLineWidth(0.5);
    doc.line(15, yPos, pageWidth - 15, yPos);

    // ==========================================
    // 2. TÍTULO Y NÚMERO DE ORDEN
    // ==========================================
    yPos += 10;
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.text('BOLETA DE VENTA ELECTRÓNICA', pageWidth / 2, yPos, { align: 'center' });

    yPos += 10;
    doc.setFontSize(11);
    doc.setFont('helvetica', 'normal');
    doc.text(`Número de Orden: ${data.orderNumber}`, 15, yPos);

    yPos += 6;
    const orderDate = new Date(data.order.created_at);
    const formattedDate = orderDate.toLocaleDateString('es-PE', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
    doc.text(`Fecha: ${formattedDate}`, 15, yPos);

    // ==========================================
    // 3. DATOS DEL CLIENTE
    // ==========================================
    yPos += 12;
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('DATOS DEL CLIENTE', 15, yPos);

    yPos += 7;
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text(`Email: ${data.userEmail}`, 15, yPos);

    // ==========================================
    // 4. DIRECCIÓN DE ENVÍO
    // ==========================================
    yPos += 10;
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('DIRECCIÓN DE ENVÍO', 15, yPos);

    yPos += 7;
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text(data.order.shipping_address, 15, yPos);

    yPos += 5;
    doc.text(`${data.order.district}, ${data.order.province}, ${data.order.department}`, 15, yPos);

    if (data.order.reference) {
      yPos += 5;
      doc.text(`Referencia: ${data.order.reference}`, 15, yPos);
    }

    // ==========================================
    // 5. TABLA DE PRODUCTOS
    // ==========================================
    yPos += 12;
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('DETALLE DE PRODUCTOS', 15, yPos);

    yPos += 5;

    // Preparar datos de la tabla
    const tableData = data.items.map(item => [
      item.product.sku || 'N/A',
      item.product.name,
      item.quantity.toString(),
      `S/ ${item.product.price.toFixed(2)}`,
      `S/ ${(item.product.price * item.quantity).toFixed(2)}`
    ]);

    autoTable(doc, {
      startY: yPos,
      head: [['SKU', 'Producto', 'Cant.', 'Precio', 'Subtotal']],
      body: tableData,
      theme: 'striped',
      headStyles: {
        fillColor: [41, 128, 185],
        textColor: 255,
        fontSize: 10,
        fontStyle: 'bold'
      },
      bodyStyles: {
        fontSize: 9
      },
      columnStyles: {
        0: { cellWidth: 25 },
        1: { cellWidth: 70 },
        2: { cellWidth: 20, halign: 'center' },
        3: { cellWidth: 30, halign: 'right' },
        4: { cellWidth: 30, halign: 'right' }
      },
      margin: { left: 15, right: 15 }
    });

    // Obtener posición Y después de la tabla
    yPos = (doc as any).lastAutoTable.finalY + 10;

    // ==========================================
    // 6. RESUMEN DE PAGO
    // ==========================================
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('RESUMEN DE PAGO', 15, yPos);

    yPos += 7;
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');

    const summaryX = pageWidth - 80;
    doc.text('Subtotal:', summaryX, yPos);
    doc.text(`S/ ${data.order.subtotal.toFixed(2)}`, pageWidth - 15, yPos, { align: 'right' });

    yPos += 6;
    doc.text('Costo de Envío:', summaryX, yPos);
    doc.text(`S/ ${data.order.shipping_cost.toFixed(2)}`, pageWidth - 15, yPos, { align: 'right' });

    // Línea antes del total
    yPos += 3;
    doc.setLineWidth(0.3);
    doc.line(summaryX, yPos, pageWidth - 15, yPos);

    yPos += 7;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.text('TOTAL:', summaryX, yPos);
    doc.text(`S/ ${data.order.total.toFixed(2)}`, pageWidth - 15, yPos, { align: 'right' });

    yPos += 10;
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text(`Método de Pago: ${data.order.payment_method}`, 15, yPos);

    yPos += 10;
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text('Estado de Pago: PAGADO', 15, yPos);

    // ==========================================
    // 7. TÉRMINOS Y CONDICIONES
    // ==========================================
    yPos += 15;
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.text('TÉRMINOS Y CONDICIONES', 15, yPos);

    yPos += 6;
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.text('• Tiempo estimado de entrega: 3-5 días hábiles', 15, yPos);

    yPos += 5;
    doc.text('• Políticas de devolución: 30 días desde la recepción', 15, yPos);

    yPos += 5;
    doc.text('• Garantía: Según especificaciones del fabricante', 15, yPos);

    // ==========================================
    // 8. INFORMACIÓN DE CONTACTO
    // ==========================================
    yPos += 10;
    doc.setFontSize(9);
    doc.text('¿Tienes alguna consulta?', 15, yPos);

    yPos += 5;
    doc.text('Escríbenos a: mkt.ventas@jjtecnologias.com | WhatsApp: +51 986 753 834', 15, yPos);

    // ==========================================
    // 9. PIE DE PÁGINA
    // ==========================================
    const footerY = doc.internal.pageSize.height - 20;
    doc.setLineWidth(0.3);
    doc.line(15, footerY - 5, pageWidth - 15, footerY - 5);

    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.text('Gracias por tu compra', pageWidth / 2, footerY, { align: 'center' });

    // Retornar el PDF como Blob
    return doc.output('blob');
  }

  /**
   * Sube el PDF a Supabase Storage
   */
  async uploadToStorage(pdfBlob: Blob, orderNumber: string): Promise<string | null> {
    try {
      const date = new Date();
      const year = date.getFullYear();
      const month = (date.getMonth() + 1).toString().padStart(2, '0');

      // Ruta: receipts/2025/12/ORD-2025-0012.pdf
      const filePath = `${year}/${month}/${orderNumber}.pdf`;

      console.log('📤 Subiendo PDF a Storage:', filePath);

      const { data, error } = await this.authService.client.storage
        .from('receipts')
        .upload(filePath, pdfBlob, {
          contentType: 'application/pdf',
          upsert: false // No sobrescribir si ya existe
        });

      if (error) {
        console.error('❌ Error subiendo PDF:', error);
        return null;
      }

      // Obtener URL pública
      const { data: publicUrlData } = this.authService.client.storage
        .from('receipts')
        .getPublicUrl(filePath);

      console.log('✅ PDF subido exitosamente:', publicUrlData.publicUrl);
      return publicUrlData.publicUrl;

    } catch (error) {
      console.error('❌ Error inesperado subiendo PDF:', error);
      return null;
    }
  }

  /**
   * Genera el PDF, lo sube a Storage y retorna la URL
   */
  async generateAndSave(data: ReceiptData): Promise<string | null> {
    try {
      console.log('📄 Generando PDF de boleta...');

      // 1. Generar el PDF
      const pdfBlob = this.generatePDF(data);

      // 2. Subir a Storage
      const url = await this.uploadToStorage(pdfBlob, data.orderNumber);

      if (!url) {
        console.warn('⚠️ No se pudo subir el PDF, pero se generó correctamente');
      }

      return url;
    } catch (error) {
      console.error('❌ Error generando y guardando PDF:', error);
      return null;
    }
  }

  /**
   * Descarga el PDF automáticamente en el navegador
   */
  downloadPDF(url: string, orderNumber: string) {
    const link = document.createElement('a');
    link.href = url;
    link.download = `${orderNumber}.pdf`;
    link.target = '_blank';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    console.log('✅ PDF descargado:', orderNumber);
  }
}
