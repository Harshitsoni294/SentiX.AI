// Utility for exporting text as PDF (A4, white pages)
// Uses jsPDF (https://github.com/parallax/jsPDF)
// Usage: exportMergedContentAsPdf('Title', 'Text content...')
import jsPDF from 'jspdf';

export function exportMergedContentAsPdf(title: string, content: string) {
  const doc = new jsPDF({ unit: 'mm', format: 'a4' });
  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 15;
  let y = 20;

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(18);
  doc.text(title, pageWidth / 2, y, { align: 'center' });
  y += 12;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(12);

  // Split text to fit A4 width
  const lines = doc.splitTextToSize(content, pageWidth - margin * 2);
  doc.text(lines, margin, y);

  doc.save('merged-content.pdf');
}
