// pages/api/transfers/index.js
import { readJson, writeJsonAtomic, generateId } from '@/lib/dataStore';

export default async function handler(req, res) {
  try {
    if (req.method === 'GET') {
      // GET /api/transfers?warehouseId=1&productId=2&status=completed&limit=50
      const { warehouseId, productId, status, limit = '50' } = req.query;
      
      let transfers = await readJson('data/transfers.json');
      
      // Filter by warehouse (from or to)
      if (warehouseId) {
        const warehouseIdNum = parseInt(warehouseId);
        transfers = transfers.filter(
          (t) => t.fromWarehouseId === warehouseIdNum || t.toWarehouseId === warehouseIdNum
        );
      }
      
      // Filter by product
      if (productId) {
        const productIdNum = parseInt(productId);
        transfers = transfers.filter((t) => t.productId === productIdNum);
      }
      
      // Filter by status
      if (status) {
        transfers = transfers.filter((t) => t.status === status);
      }
      
      // Sort newest first
      transfers.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      
      // Apply limit (max 200)
      const limitNum = Math.min(parseInt(limit) || 50, 200);
      transfers = transfers.slice(0, limitNum);
      
      res.status(200).json(transfers);
    } else if (req.method === 'POST') {
      // POST /api/transfers
      const { productId, fromWarehouseId, toWarehouseId, quantity, note } = req.body;
      
      // Validation
      const errors = [];
      
      // Validate productId
      if (!productId || typeof productId !== 'number') {
        errors.push({ field: 'productId', message: 'Product ID is required and must be a number' });
      }
      
      // Validate warehouses
      if (!fromWarehouseId || typeof fromWarehouseId !== 'number') {
        errors.push({ field: 'fromWarehouseId', message: 'From warehouse ID is required and must be a number' });
      }
      if (!toWarehouseId || typeof toWarehouseId !== 'number') {
        errors.push({ field: 'toWarehouseId', message: 'To warehouse ID is required and must be a number' });
      }
      
      // Validate quantity
      if (!quantity || typeof quantity !== 'number' || quantity <= 0 || !Number.isInteger(quantity)) {
        errors.push({ field: 'quantity', message: 'Quantity must be a positive integer' });
      }
      
      // Validate from != to
      if (fromWarehouseId === toWarehouseId) {
        errors.push({ field: 'toWarehouseId', message: 'From and To warehouses must be different' });
      }
      
      if (errors.length > 0) {
        return res.status(400).json({ 
          message: 'Validation failed', 
          errors 
        });
      }
      
      // Load all required data
      const [products, warehouses, stock] = await Promise.all([
        readJson('data/products.json'),
        readJson('data/warehouses.json'),
        readJson('data/stock.json'),
      ]);
      
      // Validate product exists
      const product = products.find((p) => p.id === productId);
      if (!product) {
        return res.status(404).json({ 
          message: `Product with ID ${productId} not found` 
        });
      }
      
      // Validate warehouses exist
      const fromWarehouse = warehouses.find((w) => w.id === fromWarehouseId);
      if (!fromWarehouse) {
        return res.status(404).json({ 
          message: `From warehouse with ID ${fromWarehouseId} not found` 
        });
      }
      
      const toWarehouse = warehouses.find((w) => w.id === toWarehouseId);
      if (!toWarehouse) {
        return res.status(404).json({ 
          message: `To warehouse with ID ${toWarehouseId} not found` 
        });
      }
      
      // Check source stock availability
      const sourceStock = stock.find(
        (s) => s.productId === productId && s.warehouseId === fromWarehouseId
      );
      const availableQuantity = sourceStock ? sourceStock.quantity : 0;
      
      if (availableQuantity < quantity) {
        return res.status(409).json({ 
          message: `Insufficient stock. Available: ${availableQuantity}, Requested: ${quantity}`,
          available: availableQuantity,
          requested: quantity,
        });
      }
      
      // Calculate new stock levels in memory
      const newStock = [...stock];
      
      // Update source stock (subtract)
      const sourceStockIndex = newStock.findIndex(
        (s) => s.productId === productId && s.warehouseId === fromWarehouseId
      );
      if (sourceStockIndex !== -1) {
        const newQuantity = newStock[sourceStockIndex].quantity - quantity;
        if (newQuantity > 0) {
          newStock[sourceStockIndex] = { ...newStock[sourceStockIndex], quantity: newQuantity };
        } else {
          // Remove stock record if quantity becomes 0 or negative
          newStock.splice(sourceStockIndex, 1);
        }
      }
      
      // Update destination stock (add)
      const destStockIndex = newStock.findIndex(
        (s) => s.productId === productId && s.warehouseId === toWarehouseId
      );
      if (destStockIndex !== -1) {
        newStock[destStockIndex] = { 
          ...newStock[destStockIndex], 
          quantity: newStock[destStockIndex].quantity + quantity 
        };
      } else {
        // Create new stock record for destination
        const maxId = newStock.length > 0 ? Math.max(...newStock.map((s) => s.id)) : 0;
        newStock.push({
          id: maxId + 1,
          productId,
          warehouseId: toWarehouseId,
          quantity,
        });
      }
      
      // Create transfer record
      const transfer = {
        id: generateId(),
        createdAt: new Date().toISOString(),
        status: 'completed',
        productId,
        fromWarehouseId,
        toWarehouseId,
        quantity,
        note: note || null,
        createdBy: 'system', // Placeholder
        productName: product.name,
        fromWarehouseName: fromWarehouse.name,
        toWarehouseName: toWarehouse.name,
        meta: {
          reason: note || null,
          referenceNo: null,
        },
      };
      
      // Write stock.json first (critical update)
      await writeJsonAtomic('data/stock.json', newStock);
      
      // Then write transfer record
      const transfers = await readJson('data/transfers.json');
      transfers.push(transfer);
      await writeJsonAtomic('data/transfers.json', transfers);
      
      // Return transfer with updated stock summary
      res.status(201).json({
        transfer,
        stockSummary: {
          fromWarehouse: {
            warehouseId: fromWarehouseId,
            newQuantity: sourceStockIndex !== -1 && newStock.find(s => s.productId === productId && s.warehouseId === fromWarehouseId) 
              ? newStock.find(s => s.productId === productId && s.warehouseId === fromWarehouseId).quantity 
              : 0,
          },
          toWarehouse: {
            warehouseId: toWarehouseId,
            newQuantity: newStock.find(s => s.productId === productId && s.warehouseId === toWarehouseId).quantity,
          },
        },
      });
    } else {
      res.status(405).json({ message: 'Method Not Allowed' });
    }
  } catch (error) {
    console.error('Error in transfers API:', error);
    res.status(500).json({ 
      message: 'Internal server error', 
      error: process.env.NODE_ENV === 'development' ? error.message : undefined 
    });
  }
}