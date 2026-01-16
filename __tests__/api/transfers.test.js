/**
 * API Test Suite for Stock Transfer System
 * 
 * Tests cover:
 * - Successful transfers
 * - Validation errors
 * - Business rule failures
 * - Error handling
 * - GET endpoint functionality
 * - Data integrity
 */

import { createMocks } from 'node-mocks-http';
import handler from '@/pages/api/transfers/index';
import handlerById from '@/pages/api/transfers/[id]';
import { readJson, writeJsonAtomic } from '@/lib/dataStore';
import fs from 'fs/promises';
import path from 'path';

// Test data backup paths
const DATA_DIR = path.join(process.cwd(), 'data');
const BACKUP_DIR = path.join(process.cwd(), '__tests__', 'fixtures');

// Helper to backup and restore test data
async function backupData() {
  await fs.mkdir(BACKUP_DIR, { recursive: true });
  const files = ['products.json', 'warehouses.json', 'stock.json', 'transfers.json'];
  for (const file of files) {
    try {
      const src = path.join(DATA_DIR, file);
      const dest = path.join(BACKUP_DIR, file);
      await fs.copyFile(src, dest);
    } catch (error) {
      // File might not exist, that's ok
    }
  }
}

async function restoreData() {
  const files = ['products.json', 'warehouses.json', 'stock.json', 'transfers.json'];
  for (const file of files) {
    try {
      const src = path.join(BACKUP_DIR, file);
      const dest = path.join(DATA_DIR, file);
      await fs.copyFile(src, dest);
    } catch (error) {
      // If backup doesn't exist, try to restore from minimal defaults
      if (file === 'transfers.json') {
        await writeJsonAtomic(`data/${file}`, []);
      }
    }
  }
}

describe('Stock Transfer API - POST /api/transfers', () => {
  beforeAll(async () => {
    await backupData();
  });

  afterEach(async () => {
    await restoreData();
  });

  afterAll(async () => {
    await restoreData();
  });

  describe('1. Successful Transfer', () => {
    test('should create a valid transfer and update stock correctly', async () => {
      // Precondition: Product 1 has 250 units in warehouse 1, 150 in warehouse 2
      const initialStock = await readJson('data/stock.json');
      const initialSourceStock = initialStock.find(
        (s) => s.productId === 1 && s.warehouseId === 1
      );
      const initialDestStock = initialStock.find(
        (s) => s.productId === 1 && s.warehouseId === 2
      );

      expect(initialSourceStock.quantity).toBe(250);
      expect(initialDestStock.quantity).toBe(150);

      // Execute transfer: 50 units from warehouse 1 to warehouse 2
      const { req, res } = createMocks({
        method: 'POST',
        body: {
          productId: 1,
          fromWarehouseId: 1,
          toWarehouseId: 2,
          quantity: 50,
          note: 'Test transfer',
        },
      });

      await handler(req, res);

      expect(res._getStatusCode()).toBe(201);
      const response = JSON.parse(res._getData());

      // Verify transfer record
      expect(response.transfer).toMatchObject({
        productId: 1,
        fromWarehouseId: 1,
        toWarehouseId: 2,
        quantity: 50,
        status: 'completed',
        note: 'Test transfer',
      });
      expect(response.transfer.id).toBeDefined();
      expect(response.transfer.createdAt).toBeDefined();
      expect(response.transfer.productName).toBe('Bamboo Spork Set');
      expect(response.transfer.fromWarehouseName).toBe('Main Distribution Center');
      expect(response.transfer.toWarehouseName).toBe('West Coast Facility');

      // Verify stock was updated
      const updatedStock = await readJson('data/stock.json');
      const updatedSourceStock = updatedStock.find(
        (s) => s.productId === 1 && s.warehouseId === 1
      );
      const updatedDestStock = updatedStock.find(
        (s) => s.productId === 1 && s.warehouseId === 2
      );

      expect(updatedSourceStock.quantity).toBe(200); // 250 - 50
      expect(updatedDestStock.quantity).toBe(200); // 150 + 50

      // Verify transfer was saved
      const transfers = await readJson('data/transfers.json');
      const savedTransfer = transfers.find((t) => t.id === response.transfer.id);
      expect(savedTransfer).toBeDefined();
      expect(savedTransfer.quantity).toBe(50);
    });

    test('should create destination stock record if it does not exist', async () => {
      // Transfer product 1 from warehouse 1 to warehouse 3 (where it doesn't exist)
      const { req, res } = createMocks({
        method: 'POST',
        body: {
          productId: 1,
          fromWarehouseId: 1,
          toWarehouseId: 3,
          quantity: 25,
        },
      });

      await handler(req, res);

      expect(res._getStatusCode()).toBe(201);
      const updatedStock = await readJson('data/stock.json');
      const destStock = updatedStock.find(
        (s) => s.productId === 1 && s.warehouseId === 3
      );

      expect(destStock).toBeDefined();
      expect(destStock.quantity).toBe(25);
    });

    test('should remove source stock record if quantity reaches zero', async () => {
      // Transfer all remaining stock from source
      const initialStock = await readJson('data/stock.json');
      const sourceStock = initialStock.find(
        (s) => s.productId === 1 && s.warehouseId === 1
      );
      const transferQuantity = sourceStock.quantity;

      const { req, res } = createMocks({
        method: 'POST',
        body: {
          productId: 1,
          fromWarehouseId: 1,
          toWarehouseId: 2,
          quantity: transferQuantity,
        },
      });

      await handler(req, res);

      expect(res._getStatusCode()).toBe(201);
      const updatedStock = await readJson('data/stock.json');
      const removedStock = updatedStock.find(
        (s) => s.productId === 1 && s.warehouseId === 1
      );

      expect(removedStock).toBeUndefined(); // Record should be removed
    });
  });

  describe('2. Validation Errors', () => {
    test('should reject quantity = 0', async () => {
      const { req, res } = createMocks({
        method: 'POST',
        body: {
          productId: 1,
          fromWarehouseId: 1,
          toWarehouseId: 2,
          quantity: 0,
        },
      });

      await handler(req, res);

      expect(res._getStatusCode()).toBe(400);
      const response = JSON.parse(res._getData());
      expect(response.message).toContain('Validation failed');
      expect(response.errors).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            field: 'quantity',
            message: expect.stringContaining('positive integer'),
          }),
        ])
      );
    });

    test('should reject negative quantity', async () => {
      const { req, res } = createMocks({
        method: 'POST',
        body: {
          productId: 1,
          fromWarehouseId: 1,
          toWarehouseId: 2,
          quantity: -10,
        },
      });

      await handler(req, res);

      expect(res._getStatusCode()).toBe(400);
      const response = JSON.parse(res._getData());
      expect(response.errors).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ field: 'quantity' }),
        ])
      );
    });

    test('should reject non-integer quantity', async () => {
      const { req, res } = createMocks({
        method: 'POST',
        body: {
          productId: 1,
          fromWarehouseId: 1,
          toWarehouseId: 2,
          quantity: 10.5,
        },
      });

      await handler(req, res);

      expect(res._getStatusCode()).toBe(400);
    });

    test('should reject missing productId', async () => {
      const { req, res } = createMocks({
        method: 'POST',
        body: {
          fromWarehouseId: 1,
          toWarehouseId: 2,
          quantity: 10,
        },
      });

      await handler(req, res);

      expect(res._getStatusCode()).toBe(400);
      const response = JSON.parse(res._getData());
      expect(response.errors).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ field: 'productId' }),
        ])
      );
    });

    test('should reject missing fromWarehouseId', async () => {
      const { req, res } = createMocks({
        method: 'POST',
        body: {
          productId: 1,
          toWarehouseId: 2,
          quantity: 10,
        },
      });

      await handler(req, res);

      expect(res._getStatusCode()).toBe(400);
      const response = JSON.parse(res._getData());
      expect(response.errors).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ field: 'fromWarehouseId' }),
        ])
      );
    });

    test('should reject fromWarehouseId === toWarehouseId', async () => {
      const { req, res } = createMocks({
        method: 'POST',
        body: {
          productId: 1,
          fromWarehouseId: 1,
          toWarehouseId: 1,
          quantity: 10,
        },
      });

      await handler(req, res);

      expect(res._getStatusCode()).toBe(400);
      const response = JSON.parse(res._getData());
      expect(response.errors).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            field: 'toWarehouseId',
            message: expect.stringContaining('different'),
          }),
        ])
      );
    });
  });

  describe('3. Business Rule Failures', () => {
    test('should reject transfer when source stock is insufficient', async () => {
      const { req, res } = createMocks({
        method: 'POST',
        body: {
          productId: 1,
          fromWarehouseId: 1,
          toWarehouseId: 2,
          quantity: 10000, // More than available
        },
      });

      await handler(req, res);

      expect(res._getStatusCode()).toBe(409);
      const response = JSON.parse(res._getData());
      expect(response.message).toContain('Insufficient stock');
      expect(response.available).toBeDefined();
      expect(response.requested).toBe(10000);
    });

    test('should reject transfer when source stock record does not exist (treated as 0)', async () => {
      // Try to transfer product that doesn't exist in source warehouse
      const { req, res } = createMocks({
        method: 'POST',
        body: {
          productId: 1,
          fromWarehouseId: 3, // Product 1 not in warehouse 3
          toWarehouseId: 1,
          quantity: 10,
        },
      });

      await handler(req, res);

      expect(res._getStatusCode()).toBe(409);
      const response = JSON.parse(res._getData());
      expect(response.available).toBe(0);
    });

    test('should reject transfer when product does not exist', async () => {
      const { req, res } = createMocks({
        method: 'POST',
        body: {
          productId: 999, // Non-existent product
          fromWarehouseId: 1,
          toWarehouseId: 2,
          quantity: 10,
        },
      });

      await handler(req, res);

      expect(res._getStatusCode()).toBe(404);
      const response = JSON.parse(res._getData());
      expect(response.message).toContain('not found');
    });

    test('should reject transfer when fromWarehouse does not exist', async () => {
      const { req, res } = createMocks({
        method: 'POST',
        body: {
          productId: 1,
          fromWarehouseId: 999, // Non-existent warehouse
          toWarehouseId: 2,
          quantity: 10,
        },
      });

      await handler(req, res);

      expect(res._getStatusCode()).toBe(404);
      const response = JSON.parse(res._getData());
      expect(response.message).toContain('warehouse');
    });

    test('should reject transfer when toWarehouse does not exist', async () => {
      const { req, res } = createMocks({
        method: 'POST',
        body: {
          productId: 1,
          fromWarehouseId: 1,
          toWarehouseId: 999, // Non-existent warehouse
          quantity: 10,
        },
      });

      await handler(req, res);

      expect(res._getStatusCode()).toBe(404);
      const response = JSON.parse(res._getData());
      expect(response.message).toContain('warehouse');
    });
  });

  describe('4. Data Integrity', () => {
    test('should never create negative stock quantities', async () => {
      const initialStock = await readJson('data/stock.json');
      const sourceStock = initialStock.find(
        (s) => s.productId === 1 && s.warehouseId === 1
      );

      // Try to transfer more than available (should be rejected)
      const { req, res } = createMocks({
        method: 'POST',
        body: {
          productId: 1,
          fromWarehouseId: 1,
          toWarehouseId: 2,
          quantity: sourceStock.quantity + 100,
        },
      });

      await handler(req, res);

      expect(res._getStatusCode()).toBe(409);

      // Verify stock was NOT modified
      const finalStock = await readJson('data/stock.json');
      const finalSourceStock = finalStock.find(
        (s) => s.productId === 1 && s.warehouseId === 1
      );

      expect(finalSourceStock.quantity).toBe(sourceStock.quantity);
      expect(finalSourceStock.quantity).toBeGreaterThanOrEqual(0);
    });

    test('should not mutate unrelated stock records', async () => {
      const initialStock = await readJson('data/stock.json');
      const unrelatedStock = initialStock.find(
        (s) => s.productId === 2 && s.warehouseId === 1
      );

      const { req, res } = createMocks({
        method: 'POST',
        body: {
          productId: 1, // Different product
          fromWarehouseId: 1,
          toWarehouseId: 2,
          quantity: 10,
        },
      });

      await handler(req, res);

      expect(res._getStatusCode()).toBe(201);

      // Verify unrelated stock unchanged
      const finalStock = await readJson('data/stock.json');
      const finalUnrelatedStock = finalStock.find(
        (s) => s.productId === 2 && s.warehouseId === 1
      );

      expect(finalUnrelatedStock.quantity).toBe(unrelatedStock.quantity);
    });

    test('should maintain consistency between stock.json and transfers.json', async () => {
      const initialTransfers = await readJson('data/transfers.json');
      const initialStock = await readJson('data/stock.json');
      const sourceStock = initialStock.find(
        (s) => s.productId === 1 && s.warehouseId === 1
      );
      const destStock = initialStock.find(
        (s) => s.productId === 1 && s.warehouseId === 2
      );

      const transferQuantity = 30;
      const initialSourceQty = sourceStock ? sourceStock.quantity : 0;
      const initialDestQty = destStock ? destStock.quantity : 0;

      const { req, res } = createMocks({
        method: 'POST',
        body: {
          productId: 1,
          fromWarehouseId: 1,
          toWarehouseId: 2,
          quantity: transferQuantity,
        },
      });

      await handler(req, res);

      expect(res._getStatusCode()).toBe(201);

      // Verify transfer record exists
      const finalTransfers = await readJson('data/transfers.json');
      expect(finalTransfers.length).toBe(initialTransfers.length + 1);

      const transfer = finalTransfers[finalTransfers.length - 1];
      expect(transfer.quantity).toBe(transferQuantity);

      // Verify stock changes match transfer
      const finalStock = await readJson('data/stock.json');
      const finalSourceStock = finalStock.find(
        (s) => s.productId === 1 && s.warehouseId === 1
      );
      const finalDestStock = finalStock.find(
        (s) => s.productId === 1 && s.warehouseId === 2
      );

      const finalSourceQty = finalSourceStock ? finalSourceStock.quantity : 0;
      const finalDestQty = finalDestStock ? finalDestStock.quantity : 0;

      expect(finalSourceQty).toBe(initialSourceQty - transferQuantity);
      expect(finalDestQty).toBe(initialDestQty + transferQuantity);
    });
  });
});

describe('Stock Transfer API - GET /api/transfers', () => {
  beforeAll(async () => {
    await backupData();
  });

  afterEach(async () => {
    await restoreData();
  });

  afterAll(async () => {
    await restoreData();
  });

  test('should return transfers sorted newest first', async () => {
    // Create multiple transfers
    const transfers = await readJson('data/transfers.json');
    
    // Add test transfers with different timestamps
    const testTransfer1 = {
      id: 'test-1',
      createdAt: new Date('2024-01-01T10:00:00Z').toISOString(),
      status: 'completed',
      productId: 1,
      fromWarehouseId: 1,
      toWarehouseId: 2,
      quantity: 10,
      productName: 'Test Product',
      fromWarehouseName: 'Warehouse 1',
      toWarehouseName: 'Warehouse 2',
    };

    const testTransfer2 = {
      id: 'test-2',
      createdAt: new Date('2024-01-02T10:00:00Z').toISOString(),
      status: 'completed',
      productId: 2,
      fromWarehouseId: 2,
      toWarehouseId: 3,
      quantity: 20,
      productName: 'Test Product 2',
      fromWarehouseName: 'Warehouse 2',
      toWarehouseName: 'Warehouse 3',
    };

    transfers.push(testTransfer1, testTransfer2);
    await writeJsonAtomic('data/transfers.json', transfers);

    const { req, res } = createMocks({
      method: 'GET',
      query: {},
    });

    await handler(req, res);

    expect(res._getStatusCode()).toBe(200);
    const response = JSON.parse(res._getData());

    // Verify newest first
    expect(response.length).toBeGreaterThanOrEqual(2);
    const test2Index = response.findIndex((t) => t.id === 'test-2');
    const test1Index = response.findIndex((t) => t.id === 'test-1');
    expect(test2Index).toBeLessThan(test1Index);
  });

  test('should filter transfers by warehouseId (from or to)', async () => {
    const transfers = [
      {
        id: 'test-1',
        createdAt: new Date().toISOString(),
        status: 'completed',
        productId: 1,
        fromWarehouseId: 1,
        toWarehouseId: 2,
        quantity: 10,
        productName: 'Test',
        fromWarehouseName: 'WH1',
        toWarehouseName: 'WH2',
      },
      {
        id: 'test-2',
        createdAt: new Date().toISOString(),
        status: 'completed',
        productId: 2,
        fromWarehouseId: 2,
        toWarehouseId: 3,
        quantity: 20,
        productName: 'Test',
        fromWarehouseName: 'WH2',
        toWarehouseName: 'WH3',
      },
    ];
    await writeJsonAtomic('data/transfers.json', transfers);

    const { req, res } = createMocks({
      method: 'GET',
      query: { warehouseId: '2' },
    });

    await handler(req, res);

    expect(res._getStatusCode()).toBe(200);
    const response = JSON.parse(res._getData());

    // Should return both transfers (warehouse 2 is in from or to)
    expect(response.length).toBe(2);
    expect(response.every((t) => t.fromWarehouseId === 2 || t.toWarehouseId === 2)).toBe(true);
  });

  test('should filter transfers by productId', async () => {
    const transfers = [
      {
        id: 'test-1',
        createdAt: new Date().toISOString(),
        status: 'completed',
        productId: 1,
        fromWarehouseId: 1,
        toWarehouseId: 2,
        quantity: 10,
        productName: 'Test',
        fromWarehouseName: 'WH1',
        toWarehouseName: 'WH2',
      },
      {
        id: 'test-2',
        createdAt: new Date().toISOString(),
        status: 'completed',
        productId: 2,
        fromWarehouseId: 2,
        toWarehouseId: 3,
        quantity: 20,
        productName: 'Test',
        fromWarehouseName: 'WH2',
        toWarehouseName: 'WH3',
      },
    ];
    await writeJsonAtomic('data/transfers.json', transfers);

    const { req, res } = createMocks({
      method: 'GET',
      query: { productId: '1' },
    });

    await handler(req, res);

    expect(res._getStatusCode()).toBe(200);
    const response = JSON.parse(res._getData());

    expect(response.length).toBe(1);
    expect(response[0].productId).toBe(1);
  });

  test('should filter transfers by status', async () => {
    const transfers = [
      {
        id: 'test-1',
        createdAt: new Date().toISOString(),
        status: 'completed',
        productId: 1,
        fromWarehouseId: 1,
        toWarehouseId: 2,
        quantity: 10,
        productName: 'Test',
        fromWarehouseName: 'WH1',
        toWarehouseName: 'WH2',
      },
      {
        id: 'test-2',
        createdAt: new Date().toISOString(),
        status: 'failed',
        productId: 2,
        fromWarehouseId: 2,
        toWarehouseId: 3,
        quantity: 20,
        productName: 'Test',
        fromWarehouseName: 'WH2',
        toWarehouseName: 'WH3',
      },
    ];
    await writeJsonAtomic('data/transfers.json', transfers);

    const { req, res } = createMocks({
      method: 'GET',
      query: { status: 'completed' },
    });

    await handler(req, res);

    expect(res._getStatusCode()).toBe(200);
    const response = JSON.parse(res._getData());

    expect(response.every((t) => t.status === 'completed')).toBe(true);
  });

  test('should respect limit parameter (default 50, max 200)', async () => {
    // Create 250 transfers to test limit caps properly
    const transfers = Array.from({ length: 250 }, (_, i) => ({
      id: `test-${i}`,
      createdAt: new Date(Date.now() - i * 1000).toISOString(),
      status: 'completed',
      productId: 1,
      fromWarehouseId: 1,
      toWarehouseId: 2,
      quantity: 10,
      productName: 'Test',
      fromWarehouseName: 'WH1',
      toWarehouseName: 'WH2',
    }));
    await writeJsonAtomic('data/transfers.json', transfers);

    // Test default limit
    const { req: req1, res: res1 } = createMocks({
      method: 'GET',
      query: {},
    });
    await handler(req1, res1);
    expect(res1._getStatusCode()).toBe(200);
    const response1 = JSON.parse(res1._getData());
    expect(response1.length).toBe(50);

    // Test custom limit
    const { req: req2, res: res2 } = createMocks({
      method: 'GET',
      query: { limit: '25' },
    });
    await handler(req2, res2);
    expect(res2._getStatusCode()).toBe(200);
    const response2 = JSON.parse(res2._getData());
    expect(response2.length).toBe(25);

    // Test max limit (200) - should cap at 200 even if more available
    const { req: req3, res: res3 } = createMocks({
      method: 'GET',
      query: { limit: '500' }, // Should cap at 200
    });
    await handler(req3, res3);
    expect(res3._getStatusCode()).toBe(200);
    const response3 = JSON.parse(res3._getData());
    expect(response3.length).toBe(200);
  });
});

describe('Stock Transfer API - GET /api/transfers/[id]', () => {
  beforeAll(async () => {
    await backupData();
  });

  afterEach(async () => {
    await restoreData();
  });

  afterAll(async () => {
    await restoreData();
  });

  test('should return transfer by id', async () => {
    const testTransfer = {
      id: 'test-transfer-123',
      createdAt: new Date().toISOString(),
      status: 'completed',
      productId: 1,
      fromWarehouseId: 1,
      toWarehouseId: 2,
      quantity: 10,
      productName: 'Test Product',
      fromWarehouseName: 'Warehouse 1',
      toWarehouseName: 'Warehouse 2',
    };

    const transfers = await readJson('data/transfers.json');
    transfers.push(testTransfer);
    await writeJsonAtomic('data/transfers.json', transfers);

    const { req, res } = createMocks({
      method: 'GET',
      query: { id: 'test-transfer-123' },
    });

    await handlerById(req, res);

    expect(res._getStatusCode()).toBe(200);
    const response = JSON.parse(res._getData());
    expect(response.id).toBe('test-transfer-123');
    expect(response.quantity).toBe(10);
  });

  test('should return 404 for non-existent transfer', async () => {
    const { req, res } = createMocks({
      method: 'GET',
      query: { id: 'non-existent-id' },
    });

    await handlerById(req, res);

    expect(res._getStatusCode()).toBe(404);
    const response = JSON.parse(res._getData());
    expect(response.message).toContain('not found');
  });
});