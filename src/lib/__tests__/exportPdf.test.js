/**
 * @jest-environment jsdom
 */

import { buildPdfTableData, exportToPdf } from '../exportPdf';

// Mock jsPDF and autoTable
const mockDoc = {
  setFontSize: jest.fn().mockReturnThis(),
  text: jest.fn().mockReturnThis(),
  setTextColor: jest.fn().mockReturnThis(),
  autoTable: jest.fn().mockReturnThis(),
  save: jest.fn(),
};

const mockJsPDF = jest.fn(() => mockDoc);

jest.mock('jspdf', () => ({
  __esModule: true,
  default: mockJsPDF,
}));

jest.mock('jspdf-autotable', () => ({
  __esModule: true,
  applyPlugin: jest.fn((jsPDF) => {
    // Simulate applying the plugin by adding autoTable to the prototype
    if (!jsPDF.prototype.autoTable) {
      jsPDF.prototype.autoTable = jest.fn().mockReturnThis();
    }
  }),
}));

describe('buildPdfTableData', () => {
  it('returns correct head and body arrays', () => {
    const columns = [
      { id: 'name', label: 'Product Name' },
      { id: 'sku', label: 'SKU' },
      { id: 'quantity', label: 'Quantity' },
    ];
    const rows = [
      { name: 'Product A', sku: 'SKU-001', quantity: 100 },
      { name: 'Product B', sku: 'SKU-002', quantity: 200 },
    ];

    const result = buildPdfTableData({ columns, rows });

    expect(result.head).toEqual([['Product Name', 'SKU', 'Quantity']]);
    expect(result.body).toEqual([
      ['Product A', 'SKU-001', 100],
      ['Product B', 'SKU-002', 200],
    ]);
  });

  it('formats dates as readable strings', () => {
    const columns = [{ id: 'date', label: 'Date' }];
    const date = new Date('2024-01-15T10:30:00Z');
    const rows = [{ date }];

    const result = buildPdfTableData({ columns, rows });

    // Date formatting depends on timezone, so check for date parts
    expect(result.body[0][0]).toMatch(/Jan.*15.*2024/);
    // Check that it's a formatted date string (contains time)
    expect(result.body[0][0]).toMatch(/\d{1,2}:\d{2}/);
  });

  it('handles null and undefined values as empty strings', () => {
    const columns = [
      { id: 'name', label: 'Name' },
      { id: 'sku', label: 'SKU' },
    ];
    const rows = [
      { name: 'Product A', sku: null },
      { name: undefined, sku: 'SKU-2' },
    ];

    const result = buildPdfTableData({ columns, rows });

    expect(result.body[0]).toEqual(['Product A', '']);
    expect(result.body[1]).toEqual(['', 'SKU-2']);
  });

  it('preserves numbers as numbers', () => {
    const columns = [
      { id: 'quantity', label: 'Quantity' },
      { id: 'price', label: 'Price' },
    ];
    const rows = [
      { quantity: 100, price: 29.99 },
      { quantity: 0, price: -10.5 },
    ];

    const result = buildPdfTableData({ columns, rows });

    expect(result.body[0][0]).toBe(100);
    expect(result.body[0][1]).toBe(29.99);
    expect(result.body[1][0]).toBe(0);
    expect(result.body[1][1]).toBe(-10.5);
  });

  it('converts non-numeric, non-date values to strings', () => {
    const columns = [{ id: 'value', label: 'Value' }];
    const rows = [
      { value: 'text' },
      { value: true },
      { value: false },
      { value: { nested: 'object' } },
    ];

    const result = buildPdfTableData({ columns, rows });

    expect(result.body[0][0]).toBe('text');
    expect(result.body[1][0]).toBe('true');
    expect(result.body[2][0]).toBe('false');
    expect(result.body[3][0]).toBe('[object Object]');
  });

  it('returns empty arrays for empty columns', () => {
    const result = buildPdfTableData({ columns: [], rows: [] });

    expect(result.head).toEqual([]);
    expect(result.body).toEqual([]);
  });

  it('handles empty rows array', () => {
    const columns = [
      { id: 'name', label: 'Name' },
      { id: 'sku', label: 'SKU' },
    ];
    const result = buildPdfTableData({ columns, rows: [] });

    expect(result.head).toEqual([['Name', 'SKU']]);
    expect(result.body).toEqual([]);
  });

  it('handles complex data types correctly', () => {
    const columns = [
      { id: 'name', label: 'Name' },
      { id: 'qty', label: 'Quantity' },
      { id: 'date', label: 'Date' },
      { id: 'note', label: 'Note' },
    ];
    const rows = [
      {
        name: 'Product A',
        qty: 100,
        date: new Date('2024-01-15T10:30:00Z'),
        note: 'Special order',
      },
    ];

    const result = buildPdfTableData({ columns, rows });

    expect(result.head[0]).toEqual(['Name', 'Quantity', 'Date', 'Note']);
    expect(result.body[0][0]).toBe('Product A');
    expect(result.body[0][1]).toBe(100);
    expect(typeof result.body[0][2]).toBe('string');
    expect(result.body[0][3]).toBe('Special order');
  });
});

describe('exportToPdf', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('creates a PDF document and calls save with filename', async () => {
    const columns = [{ id: 'name', label: 'Name' }];
    const rows = [{ name: 'Test Product' }];

    await exportToPdf({
      title: 'Test Export',
      columns,
      rows,
      filename: 'test-export',
    });

    const jsPDF = (await import('jspdf')).default;
    expect(jsPDF).toHaveBeenCalled();
    expect(mockDoc.save).toHaveBeenCalledWith('test-export.pdf');
  });

  it('adds title to PDF', async () => {
    const columns = [{ id: 'name', label: 'Name' }];
    const rows = [{ name: 'Test' }];

    await exportToPdf({
      title: 'My Report',
      columns,
      rows,
      filename: 'test',
    });

    expect(mockDoc.setFontSize).toHaveBeenCalledWith(18);
    expect(mockDoc.text).toHaveBeenCalledWith('My Report', 14, 20);
  });

  it('adds subtitle when provided', async () => {
    const columns = [{ id: 'name', label: 'Name' }];
    const rows = [{ name: 'Test' }];

    await exportToPdf({
      title: 'My Report',
      subtitle: 'Generated on 2024-01-15',
      columns,
      rows,
      filename: 'test',
    });

    expect(mockDoc.setFontSize).toHaveBeenCalledWith(12);
    expect(mockDoc.setTextColor).toHaveBeenCalledWith(100, 100, 100);
    expect(mockDoc.text).toHaveBeenCalledWith('Generated on 2024-01-15', 14, 30);
    expect(mockDoc.setTextColor).toHaveBeenCalledWith(0, 0, 0);
  });

  it('calls autoTable with correct parameters', async () => {
    const columns = [
      { id: 'name', label: 'Product Name' },
      { id: 'qty', label: 'Quantity' },
    ];
    const rows = [
      { name: 'Product A', qty: 100 },
      { name: 'Product B', qty: 200 },
    ];

    await exportToPdf({
      title: 'Test',
      columns,
      rows,
      filename: 'test',
    });

    expect(mockDoc.autoTable).toHaveBeenCalledWith(
      expect.objectContaining({
        startY: 25,
        head: [['Product Name', 'Quantity']],
        body: [
          ['Product A', 100],
          ['Product B', 200],
        ],
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
      })
    );
  });

  it('adjusts startY when subtitle is provided', async () => {
    const columns = [{ id: 'name', label: 'Name' }];
    const rows = [{ name: 'Test' }];

    await exportToPdf({
      title: 'Test',
      subtitle: 'Subtitle',
      columns,
      rows,
      filename: 'test',
    });

    expect(mockDoc.autoTable).toHaveBeenCalledWith(
      expect.objectContaining({
        startY: 35,
        margin: expect.objectContaining({
          top: 35,
        }),
      })
    );
  });

  it('uses default filename when not provided', async () => {
    const columns = [{ id: 'name', label: 'Name' }];
    const rows = [{ name: 'Test' }];

    await exportToPdf({
      title: 'Test',
      columns,
      rows,
    });

    expect(mockDoc.save).toHaveBeenCalledWith('export.pdf');
  });

  it('calls autoTable with correct margin settings', async () => {
    const columns = [{ id: 'name', label: 'Name' }];
    const rows = [{ name: 'Test' }];

    await exportToPdf({
      title: 'Test',
      columns,
      rows,
      filename: 'test',
    });

    expect(mockDoc.autoTable).toHaveBeenCalledWith(
      expect.objectContaining({
        margin: {
          top: 25,
          left: 14,
          right: 14,
        },
      })
    );
  });
});
