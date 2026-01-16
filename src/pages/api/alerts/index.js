// pages/api/alerts/index.js
import { readJson, writeJsonAtomic, generateId } from '@/lib/dataStore';

/**
 * Calculate stock status based on total quantity and reorder point
 * @param {number} totalQuantity - Total stock across all warehouses
 * @param {number} reorderPoint - Product's reorder point
 * @returns {string} Status: 'critical', 'low', 'adequate', 'overstocked'
 */
function calculateStockStatus(totalQuantity, reorderPoint) {
  if (totalQuantity === 0) {
    return 'critical';
  }
  
  const percentage = (totalQuantity / reorderPoint) * 100;
  
  if (percentage <= 25) {
    return 'critical';
  } else if (percentage <= 50) {
    return 'low';
  } else if (percentage <= 150) {
    return 'adequate';
  } else {
    return 'overstocked';
  }
}

/**
 * Calculate recommended reorder quantity
 * @param {number} totalQuantity - Current total stock
 * @param {number} reorderPoint - Product's reorder point
 * @returns {number} Recommended reorder quantity
 */
function calculateReorderQuantity(totalQuantity, reorderPoint) {
  // Recommend ordering enough to reach 150% of reorder point
  const targetQuantity = Math.ceil(reorderPoint * 1.5);
  const recommended = Math.max(0, targetQuantity - totalQuantity);
  return recommended;
}

/**
 * Generate alerts for all products based on current stock levels
 */
async function generateAlerts() {
  const [products, stock, warehouses, existingAlerts] = await Promise.all([
    readJson('data/products.json'),
    readJson('data/stock.json'),
    readJson('data/warehouses.json'),
    readJson('data/alerts.json'),
  ]);

  const alerts = [];
  const alertMap = new Map(); // Track existing alerts by productId

  // Create map of existing alerts for quick lookup
  existingAlerts.forEach((alert) => {
    if (alert.status !== 'resolved' && alert.status !== 'dismissed') {
      alertMap.set(alert.productId, alert);
    }
  });

  // Calculate stock status for each product
  products.forEach((product) => {
    const productStock = stock.filter((s) => s.productId === product.id);
    const totalQuantity = productStock.reduce((sum, s) => sum + s.quantity, 0);
    const stockStatus = calculateStockStatus(totalQuantity, product.reorderPoint);

    // Only create alerts for critical, low, or overstocked items
    if (stockStatus === 'critical' || stockStatus === 'low' || stockStatus === 'overstocked') {
      const existingAlert = alertMap.get(product.id);
      
      // If alert already exists and status hasn't changed, keep it
      if (existingAlert && existingAlert.stockStatus === stockStatus) {
        alerts.push(existingAlert);
        return;
      }

      // Create new alert or update existing one
      const alert = {
        id: existingAlert?.id || generateId(),
        productId: product.id,
        productName: product.name,
        productSku: product.sku,
        productCategory: product.category,
        reorderPoint: product.reorderPoint,
        currentStock: totalQuantity,
        stockStatus,
        recommendedReorderQuantity: stockStatus === 'overstocked' ? 0 : calculateReorderQuantity(totalQuantity, product.reorderPoint),
        warehouses: productStock.map((s) => {
          const warehouse = warehouses.find((w) => w.id === s.warehouseId);
          return {
            warehouseId: s.warehouseId,
            warehouseName: warehouse?.name || 'Unknown',
            warehouseCode: warehouse?.code || '',
            quantity: s.quantity,
          };
        }),
        status: existingAlert?.status || 'active', // 'active', 'acknowledged', 'resolved', 'dismissed'
        createdAt: existingAlert?.createdAt || new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        acknowledgedAt: existingAlert?.acknowledgedAt || null,
        resolvedAt: existingAlert?.resolvedAt || null,
        notes: existingAlert?.notes || null,
      };

      alerts.push(alert);
    }
  });

  // Save alerts
  await writeJsonAtomic('data/alerts.json', alerts);

  return alerts;
}

export default async function handler(req, res) {
  try {
    if (req.method === 'GET') {
      // GET /api/alerts?status=active&stockStatus=critical&productId=1
      const { status, stockStatus, productId, regenerate } = req.query;

      // Regenerate alerts if requested
      if (regenerate === 'true') {
        const alerts = await generateAlerts();
        
        // Apply filters
        let filteredAlerts = alerts;
        
        if (status) {
          filteredAlerts = filteredAlerts.filter((a) => a.status === status);
        }
        
        if (stockStatus) {
          filteredAlerts = filteredAlerts.filter((a) => a.stockStatus === stockStatus);
        }
        
        if (productId) {
          const productIdNum = parseInt(productId);
          filteredAlerts = filteredAlerts.filter((a) => a.productId === productIdNum);
        }
        
        // Sort by priority: critical > low > overstocked, then by currentStock ascending
        filteredAlerts.sort((a, b) => {
          const priority = { critical: 0, low: 1, overstocked: 2 };
          if (priority[a.stockStatus] !== priority[b.stockStatus]) {
            return priority[a.stockStatus] - priority[b.stockStatus];
          }
          return a.currentStock - b.currentStock;
        });

        return res.status(200).json(filteredAlerts);
      }

      // Otherwise, read existing alerts
      let alerts = await readJson('data/alerts.json');

      // Apply filters
      if (status) {
        alerts = alerts.filter((a) => a.status === status);
      }

      if (stockStatus) {
        alerts = alerts.filter((a) => a.stockStatus === stockStatus);
      }

      if (productId) {
        const productIdNum = parseInt(productId);
        alerts = alerts.filter((a) => a.productId === productIdNum);
      }

      // Sort by priority: critical > low > overstocked, then by currentStock ascending
      alerts.sort((a, b) => {
        const priority = { critical: 0, low: 1, overstocked: 2 };
        if (priority[a.stockStatus] !== priority[b.stockStatus]) {
          return priority[a.stockStatus] - priority[b.stockStatus];
        }
        return a.currentStock - b.currentStock;
      });

      res.status(200).json(alerts);
    } else if (req.method === 'POST') {
      // POST /api/alerts - Regenerate alerts
      const alerts = await generateAlerts();
      res.status(200).json(alerts);
    } else {
      res.status(405).json({ message: 'Method Not Allowed' });
    }
  } catch (error) {
    console.error('Error in alerts API:', error);
    res.status(500).json({
      message: 'Internal server error',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
}
