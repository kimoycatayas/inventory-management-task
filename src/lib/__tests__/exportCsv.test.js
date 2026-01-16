/**
 * @jest-environment jsdom
 */

import { buildCsvString, exportToCsv } from '../exportCsv';

describe('buildCsvString', () => {
  it('produces correct header row from column labels', () => {
    const columns = [
      { id: 'name', label: 'Product Name' },
      { id: 'sku', label: 'SKU' },
      { id: 'quantity', label: 'Quantity' },
    ];
    const rows = [];

    const result = buildCsvString({ columns, rows });

    expect(result).toBe('Product Name,SKU,Quantity');
  });

  it('escapes commas in field values', () => {
    const columns = [{ id: 'name', label: 'Name' }];
    const rows = [{ name: 'Product, with comma' }];

    const result = buildCsvString({ columns, rows });

    expect(result).toBe('Name\n"Product, with comma"');
  });

  it('escapes quotes in field values by doubling them', () => {
    const columns = [{ id: 'name', label: 'Name' }];
    const rows = [{ name: 'Product "quoted" name' }];

    const result = buildCsvString({ columns, rows });

    expect(result).toBe('Name\n"Product ""quoted"" name"');
  });

  it('escapes newlines in field values', () => {
    const columns = [{ id: 'note', label: 'Note' }];
    const rows = [{ note: 'Line 1\nLine 2' }];

    const result = buildCsvString({ columns, rows });

    expect(result).toBe('Note\n"Line 1\nLine 2"');
  });

  it('handles empty values gracefully', () => {
    const columns = [
      { id: 'name', label: 'Name' },
      { id: 'sku', label: 'SKU' },
    ];
    const rows = [
      { name: 'Product 1', sku: null },
      { name: undefined, sku: 'SKU-2' },
      { name: '', sku: '' },
    ];

    const result = buildCsvString({ columns, rows });

    expect(result).toBe('Name,SKU\nProduct 1,\n,SKU-2\n,');
  });

  it('preserves numbers without formatting symbols', () => {
    const columns = [
      { id: 'quantity', label: 'Quantity' },
      { id: 'price', label: 'Price' },
    ];
    const rows = [
      { quantity: 100, price: 29.99 },
      { quantity: 0, price: 0 },
      { quantity: -5, price: -10.5 },
    ];

    const result = buildCsvString({ columns, rows });

    expect(result).toBe('Quantity,Price\n100,29.99\n0,0\n-5,-10.5');
  });

  it('formats dates as ISO strings', () => {
    const columns = [{ id: 'date', label: 'Date' }];
    const date = new Date('2024-01-15T10:30:00Z');
    const rows = [{ date }];

    const result = buildCsvString({ columns, rows });

    expect(result).toContain('2024-01-15');
    expect(result).toContain('T10:30:00');
  });

  it('handles multiple rows correctly', () => {
    const columns = [
      { id: 'name', label: 'Name' },
      { id: 'qty', label: 'Quantity' },
    ];
    const rows = [
      { name: 'Product A', qty: 10 },
      { name: 'Product B', qty: 20 },
      { name: 'Product C', qty: 30 },
    ];

    const result = buildCsvString({ columns, rows });

    const lines = result.split('\n');
    expect(lines).toHaveLength(4); // 1 header + 3 data rows
    expect(lines[0]).toBe('Name,Quantity');
    expect(lines[1]).toBe('Product A,10');
    expect(lines[2]).toBe('Product B,20');
    expect(lines[3]).toBe('Product C,30');
  });

  it('handles complex escaping scenarios', () => {
    const columns = [{ id: 'text', label: 'Text' }];
    const rows = [
      { text: 'Text with "quotes" and, commas' },
      { text: 'Multi\nline\ntext' },
      { text: 'Text with "quotes", commas, and\nnewlines' },
    ];

    const result = buildCsvString({ columns, rows });

    // Check that the result contains the expected escaped values
    expect(result).toContain('Text');
    expect(result).toContain('"Text with ""quotes"" and, commas"');
    expect(result).toContain('"Multi');
    expect(result).toContain('line');
    expect(result).toContain('text"');
    // Verify quotes are doubled
    expect(result).toContain('""quotes""');
  });

  it('returns empty string for empty columns', () => {
    const result = buildCsvString({ columns: [], rows: [] });
    expect(result).toBe('');
  });

  it('handles empty rows array', () => {
    const columns = [
      { id: 'name', label: 'Name' },
      { id: 'sku', label: 'SKU' },
    ];
    const result = buildCsvString({ columns, rows: [] });

    expect(result).toBe('Name,SKU');
  });
});

describe('exportToCsv', () => {
  beforeEach(() => {
    // Mock URL.createObjectURL and URL.revokeObjectURL
    global.URL.createObjectURL = jest.fn(() => 'blob:mock-url');
    global.URL.revokeObjectURL = jest.fn();

    // Mock document methods
    document.createElement = jest.fn((tag) => {
      const element = {
        setAttribute: jest.fn(),
        click: jest.fn(),
        style: {},
      };
      return element;
    });

    document.body.appendChild = jest.fn();
    document.body.removeChild = jest.fn();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('creates a download link and triggers download', () => {
    const columns = [{ id: 'name', label: 'Name' }];
    const rows = [{ name: 'Test Product' }];

    const linkElement = {
      setAttribute: jest.fn(),
      click: jest.fn(),
      style: {},
    };

    document.createElement.mockReturnValue(linkElement);

    exportToCsv({
      filename: 'test-export',
      columns,
      rows,
    });

    expect(document.createElement).toHaveBeenCalledWith('a');
    expect(linkElement.setAttribute).toHaveBeenCalledWith('href', 'blob:mock-url');
    expect(linkElement.setAttribute).toHaveBeenCalledWith('download', 'test-export.csv');
    expect(document.body.appendChild).toHaveBeenCalledWith(linkElement);
    expect(linkElement.click).toHaveBeenCalled();
    expect(document.body.removeChild).toHaveBeenCalledWith(linkElement);
    expect(global.URL.revokeObjectURL).toHaveBeenCalledWith('blob:mock-url');
  });

  it('uses default filename when not provided', () => {
    const columns = [{ id: 'name', label: 'Name' }];
    const rows = [{ name: 'Test' }];

    const linkElement = {
      setAttribute: jest.fn(),
      click: jest.fn(),
      style: {},
    };

    document.createElement.mockReturnValue(linkElement);

    exportToCsv({
      columns,
      rows,
    });

    expect(linkElement.setAttribute).toHaveBeenCalledWith('download', 'export.csv');
  });

  it('creates blob with UTF-8 BOM for Excel compatibility', () => {
    const columns = [{ id: 'name', label: 'Name' }];
    const rows = [{ name: 'Test' }];

    const linkElement = {
      setAttribute: jest.fn(),
      click: jest.fn(),
      style: {},
    };

    document.createElement.mockReturnValue(linkElement);

    // Mock Blob constructor
    const originalBlob = global.Blob;
    const blobInstances = [];
    global.Blob = jest.fn(function(...args) {
      blobInstances.push(args);
      return originalBlob ? new originalBlob(...args) : {};
    });

    exportToCsv({
      filename: 'test',
      columns,
      rows,
    });

    expect(global.Blob).toHaveBeenCalled();
    const blobCall = blobInstances[0];
    expect(blobCall[0][0]).toContain('\uFEFF');
    expect(blobCall[1]).toEqual({ type: 'text/csv;charset=utf-8;' });

    global.Blob = originalBlob;
  });
});
