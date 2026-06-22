/**
 * CafeOS QR Code Generator & PDF Exporter
 * 
 * Generates scannable QR codes for tables and exports them
 * as print-ready A6 PDF cards with café branding.
 */

import QRCode from 'qrcode';
import { jsPDF } from 'jspdf';
import JSZip from 'jszip';

/**
 * Generate a QR code as a data URL (PNG)
 * @param {string} data - The data to encode in the QR code
 * @returns {Promise<string>} Base64 data URL of the QR code image
 */
export async function generateQRDataUrl(data) {
  return await QRCode.toDataURL(data, {
    width: 300,
    margin: 2,
    color: {
      dark: '#0f172a',
      light: '#ffffff'
    },
    errorCorrectionLevel: 'H'
  });
}

/**
 * Build the QR URL for a specific table
 * @param {Object} table - Table object with id property
 * @param {Object} cafeProfile - Café profile with id property
 * @returns {string} The URL to encode in the QR code
 */
export function buildQRUrl(table, cafeProfile) {
  const baseUrl = window.location.origin;
  return `${baseUrl}/order?t=${table.id}`;
}

/**
 * Generate a single table QR card as a PDF document
 * @param {Object} table - Table object
 * @param {Object} cafeProfile - Café profile
 * @returns {Promise<jsPDF>} The generated PDF document
 */
async function createTablePdfCard(table, cafeProfile) {
  const qrUrl = buildQRUrl(table, cafeProfile);
  const qrDataUrl = await generateQRDataUrl(qrUrl);

  // A6 size: 105mm x 148mm
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: [105, 148]
  });

  const pageWidth = 105;

  // Background
  doc.setFillColor(255, 255, 255);
  doc.rect(0, 0, 105, 148, 'F');

  // Top accent bar
  doc.setFillColor(234, 88, 12); // orange-600
  doc.rect(0, 0, 105, 6, 'F');

  // Café name
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.setTextColor(15, 23, 42);
  doc.text(cafeProfile.name || 'CaféOS', pageWidth / 2, 22, { align: 'center' });

  // Subtitle
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(100, 116, 139);
  doc.text('Scan to Order · Dine-In', pageWidth / 2, 30, { align: 'center' });

  // Divider line
  doc.setDrawColor(226, 232, 240);
  doc.setLineWidth(0.3);
  doc.line(20, 35, 85, 35);

  // QR Code image (centered, 55x55mm)
  const qrSize = 55;
  const qrX = (pageWidth - qrSize) / 2;
  doc.addImage(qrDataUrl, 'PNG', qrX, 40, qrSize, qrSize);

  // Table name badge
  doc.setFillColor(241, 245, 249);
  doc.roundedRect(30, 100, 45, 14, 3, 3, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.setTextColor(15, 23, 42);
  doc.text(table.name || `Table ${table.id}`, pageWidth / 2, 109, { align: 'center' });

  // Table code
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(148, 163, 184);
  doc.text(`ID: ${table.table_code || table.id}`, pageWidth / 2, 120, { align: 'center' });

  // Bottom divider
  doc.setDrawColor(226, 232, 240);
  doc.line(20, 126, 85, 126);

  // Footer
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.setTextColor(148, 163, 184);
  doc.text('Powered by CaféOS', pageWidth / 2, 132, { align: 'center' });

  // Address (if available)
  if (cafeProfile.address) {
    doc.setFontSize(6);
    doc.text(cafeProfile.address.substring(0, 60), pageWidth / 2, 138, { align: 'center' });
  }

  // GSTIN (if available)
  if (cafeProfile.gstNumber) {
    doc.setFontSize(6);
    doc.text(`GSTIN: ${cafeProfile.gstNumber}`, pageWidth / 2, 143, { align: 'center' });
  }

  return doc;
}

/**
 * Generate and download a single table's QR card as PDF
 * @param {Object} table - Table object
 * @param {Object} cafeProfile - Café profile
 */
export async function generateSingleQRPdf(table, cafeProfile) {
  const doc = await createTablePdfCard(table, cafeProfile);
  const fileName = `CafeOS_QR_${(table.name || table.id).replace(/\s+/g, '_')}.pdf`;
  doc.save(fileName);
  return { success: true, fileName };
}

/**
 * Generate and download a bulk ZIP of all table QR cards
 * @param {Array} tables - Array of table objects
 * @param {Object} cafeProfile - Café profile
 */
export async function generateBulkQRZip(tables, cafeProfile) {
  const zip = new JSZip();
  const qrFolder = zip.folder('CafeOS_QR_Pack');

  for (const table of tables) {
    const doc = await createTablePdfCard(table, cafeProfile);
    const pdfBlob = doc.output('arraybuffer');
    const fileName = `QR_${(table.name || table.id).replace(/\s+/g, '_')}.pdf`;
    qrFolder.file(fileName, pdfBlob);
  }

  const zipBlob = await zip.generateAsync({ type: 'blob' });
  const url = URL.createObjectURL(zipBlob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `CafeOS_QR_Pack_${cafeProfile.name?.replace(/\s+/g, '_') || 'Cafe'}.zip`;
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);

  return { success: true, tableCount: tables.length };
}
