/**
 * PDF Export Utility
 * Provides functions to export data to PDF format using jsPDF and jspdf-autotable
 * Note: jsPDF is dynamically imported to avoid SSR issues
 */

/**
 * Builds PDF table data structure from columns and rows (pure function, no side effects)
 * @param {Object} params - Export parameters
 * @param {Array<{id: string, label: string}>} params.columns - Column definitions
 * @param {Array<Object>} params.rows - Array of row objects
 * @returns {Object} Object with head and body arrays for autoTable
 */
export function buildPdfTableData({ columns, rows }) {
  if (!columns || columns.length === 0) {
    return { head: [], body: [] };
  }

  // Build header row from column labels
  const head = [columns.map((col) => col.label)];

  // Build data rows
  const body = rows.map((row) => {
    return columns.map((col) => {
      const value = row[col.id];
      // Format dates as readable strings if they're Date objects
      if (value instanceof Date) {
        return value.toLocaleString('en-US', {
          year: 'numeric',
          month: 'short',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
        });
      }
      // Convert null/undefined to empty string
      if (value === null || value === undefined) {
        return '';
      }
      // Keep numbers as-is, convert everything else to string
      return typeof value === 'number' ? value : String(value);
    });
  });

  return { head, body };
}

/**
 * Exports data to PDF and triggers browser download
 * @param {Object} params - Export parameters
 * @param {string} params.title - Main title for the PDF
 * @param {string} [params.subtitle] - Optional subtitle
 * @param {Array<{id: string, label: string}>} params.columns - Column definitions
 * @param {Array<Object>} params.rows - Array of row objects
 * @param {string} params.filename - Filename for the download (without .pdf extension)
 */
export async function exportToPdf({ title, subtitle, columns, rows, filename }) {
  if (typeof window === 'undefined') {
    throw new Error('exportToPdf can only be called in a browser environment');
  }

  // Dynamically import jsPDF and jspdf-autotable to avoid SSR issues
  // In jspdf-autotable v5+, we need to use applyPlugin to enable doc.autoTable
  const [{ default: jsPDF }, autoTableModule] = await Promise.all([
    import('jspdf'),
    import('jspdf-autotable'),
  ]);

  // Apply the plugin to enable doc.autoTable() method (required in v5+)
  if (autoTableModule.applyPlugin) {
    autoTableModule.applyPlugin(jsPDF);
  }

  // Create new PDF document
  const doc = new jsPDF();

  // Add title
  doc.setFontSize(18);
  doc.text(title, 14, 20);

  // Add subtitle if provided
  if (subtitle) {
    doc.setFontSize(12);
    doc.setTextColor(100, 100, 100);
    doc.text(subtitle, 14, 30);
    doc.setTextColor(0, 0, 0); // Reset to black
  }

  // Build table data
  const { head, body } = buildPdfTableData({ columns, rows });

  // Add table using autoTable
  doc.autoTable({
    startY: subtitle ? 35 : 25,
    head: head,
    body: body,
    theme: 'striped',
    headStyles: {
      fillColor: [66, 139, 202],
      textColor: 255,
      fontStyle: 'bold',
    },
    styles: {
      fontSize: 9,
      cellPadding: 3,
    },
    margin: { top: subtitle ? 35 : 25, left: 14, right: 14 },
  });

  // Save the PDF
  doc.save(`${filename || 'export'}.pdf`);
}
