/**
 * CSV Export Utility
 * Provides functions to export data to CSV format with proper escaping
 */

/**
 * Escapes a CSV field according to RFC 4180
 * - Fields containing comma, quote, or newline must be quoted
 * - Quotes within fields are doubled
 * - Empty/null/undefined values become empty strings
 * @param {string|number|null|undefined} value - The value to escape
 * @returns {string} Escaped CSV field
 */
function escapeCsvField(value) {
  // Handle null/undefined
  if (value === null || value === undefined) {
    return '';
  }

  // Convert to string
  const str = String(value);

  // Check if field needs quoting (contains comma, quote, or newline)
  const needsQuoting = str.includes(',') || str.includes('"') || str.includes('\n') || str.includes('\r');

  if (needsQuoting) {
    // Double internal quotes and wrap in quotes
    return `"${str.replace(/"/g, '""')}"`;
  }

  return str;
}

/**
 * Builds a CSV string from columns and rows (pure function, no side effects)
 * @param {Object} params - Export parameters
 * @param {Array<{id: string, label: string}>} params.columns - Column definitions
 * @param {Array<Object>} params.rows - Array of row objects
 * @returns {string} CSV string
 */
export function buildCsvString({ columns, rows }) {
  if (!columns || columns.length === 0) {
    return '';
  }

  // Build header row from column labels
  const headerRow = columns.map((col) => escapeCsvField(col.label)).join(',');

  // Build data rows
  const dataRows = rows.map((row) => {
    return columns
      .map((col) => {
        const value = row[col.id];
        // Format dates as ISO strings if they're Date objects
        if (value instanceof Date) {
          return escapeCsvField(value.toISOString());
        }
        // Keep raw numeric values (no currency symbols)
        return escapeCsvField(value);
      })
      .join(',');
  });

  // Combine header and data rows
  return [headerRow, ...dataRows].join('\n');
}

/**
 * Exports data to CSV and triggers browser download
 * @param {Object} params - Export parameters
 * @param {string} params.filename - Filename for the download (without .csv extension)
 * @param {Array<{id: string, label: string}>} params.columns - Column definitions
 * @param {Array<Object>} params.rows - Array of row objects
 */
export function exportToCsv({ filename, columns, rows }) {
  if (typeof window === 'undefined') {
    throw new Error('exportToCsv can only be called in a browser environment');
  }

  const csvString = buildCsvString({ columns, rows });

  // Create blob with UTF-8 BOM for Excel compatibility
  const blob = new Blob(['\uFEFF' + csvString], { type: 'text/csv;charset=utf-8;' });

  // Create download link
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  link.setAttribute('href', url);
  link.setAttribute('download', `${filename || 'export'}.csv`);
  link.style.visibility = 'hidden';

  // Trigger download
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  // Clean up
  URL.revokeObjectURL(url);
}
