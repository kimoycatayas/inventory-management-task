# Low Stock Alert & Reorder System

## Overview

The Low Stock Alert & Reorder System is a comprehensive inventory management feature that helps warehouse managers proactively identify and act on inventory situations requiring attention. The system automatically monitors stock levels across all warehouses, compares them against product reorder points, and provides actionable recommendations.

## Features

### 🎯 Core Functionality

- **Automatic Alert Generation**: Continuously monitors inventory levels and generates alerts when products fall below or exceed reorder point thresholds
- **Multi-Warehouse Aggregation**: Calculates total stock across all warehouse locations for accurate inventory assessment
- **Stock Status Categorization**: Classifies products into four status levels based on current stock vs. reorder point
- **Reorder Recommendations**: Automatically calculates recommended order quantities to reach optimal stock levels
- **Alert Status Workflow**: Track alerts through their lifecycle (active → acknowledged → resolved/dismissed)
- **Dashboard Integration**: Critical alerts prominently displayed on the main dashboard
- **Comprehensive Management**: Full alert management interface with filtering, sorting, and status updates

## Stock Status Categories

The system categorizes inventory into four status levels based on the percentage of current stock relative to the reorder point:

### Critical (0-25% of reorder point)
- **Color**: Red
- **Priority**: Highest
- **Action Required**: Immediate reordering needed
- **Example**: Product with reorder point of 100 and current stock of 20 units (20%)

### Low (26-50% of reorder point)
- **Color**: Orange/Warning
- **Priority**: High
- **Action Required**: Reordering should be planned soon
- **Example**: Product with reorder point of 100 and current stock of 40 units (40%)

### Adequate (51-150% of reorder point)
- **Color**: Green
- **Priority**: Normal
- **Action Required**: No action needed
- **Example**: Product with reorder point of 100 and current stock of 100 units (100%)

### Overstocked (>150% of reorder point)
- **Color**: Blue/Info
- **Priority**: Low
- **Action Required**: Consider reducing future orders
- **Example**: Product with reorder point of 100 and current stock of 200 units (200%)

## Reorder Recommendations

The system automatically calculates recommended reorder quantities using the following logic:

- **Target Stock Level**: 150% of the product's reorder point
- **Recommended Quantity**: `max(0, (reorderPoint × 1.5) - currentStock)`
- **For Overstocked Items**: No reorder recommendation (0 units)

### Example Calculation

```
Product: Bamboo Spork Set
Reorder Point: 100 units
Current Stock: 30 units
Target Stock: 100 × 1.5 = 150 units
Recommended Order: 150 - 30 = 120 units
```

## Alert Status Workflow

Alerts progress through the following statuses:

1. **Active** (Default)
   - Newly generated alert requiring attention
   - Displayed prominently in alerts list
   - Can be acknowledged, resolved, or dismissed

2. **Acknowledged**
   - Manager has reviewed the alert
   - Action may be in progress
   - Can be resolved or dismissed

3. **Resolved**
   - Issue has been addressed (e.g., order placed, stock replenished)
   - Alert remains in history for tracking
   - Can be filtered out of active views

4. **Dismissed**
   - Alert determined to be not actionable
   - Remains in history but excluded from active alerts
   - Can be filtered out of active views

## User Interface

### Alerts Page (`/alerts`)

The main alerts management interface provides:

#### Summary Cards
- **Active Alerts**: Count of alerts requiring attention
- **Critical Stock**: Count of products in critical status
- **Low Stock**: Count of products in low status
- **Overstocked**: Count of products exceeding optimal levels

#### Alerts Table
- **Product Information**: Name, SKU, and category
- **Stock Metrics**: Current stock, reorder point, and stock status
- **Recommendations**: Recommended reorder quantity
- **Warehouse Breakdown**: Stock distribution across warehouses
- **Alert Status**: Current workflow status
- **Actions**: Acknowledge, resolve, dismiss, or view product details

#### Filtering & Sorting
- Filter by alert status (active, acknowledged, resolved, dismissed)
- Filter by stock status (critical, low, overstocked)
- Automatic sorting by priority (critical → low → overstocked)
- Secondary sort by current stock (ascending)

#### Actions
- **Regenerate Alerts**: Manually refresh alerts based on current stock levels
- **Acknowledge**: Mark alert as reviewed
- **Resolve**: Mark alert as resolved with optional notes
- **Dismiss**: Dismiss alert with optional notes
- **View Product**: Navigate to product details page

### Dashboard Integration

The main dashboard (`/`) includes:

- **Active Alerts Card**: Quick view of active alerts count with link to alerts page
- **Critical Alerts Section**: Table showing top 5 critical alerts requiring immediate attention
- **Real-time Updates**: Alert counts update when data refreshes

## API Endpoints

### GET `/api/alerts`

Retrieve all alerts with optional filtering.

**Query Parameters:**
- `status` (optional): Filter by alert status (`active`, `acknowledged`, `resolved`, `dismissed`)
- `stockStatus` (optional): Filter by stock status (`critical`, `low`, `overstocked`)
- `productId` (optional): Filter by specific product ID
- `regenerate` (optional): Set to `true` to regenerate alerts before returning

**Example:**
```bash
# Get all active critical alerts
GET /api/alerts?status=active&stockStatus=critical

# Regenerate and get all alerts
GET /api/alerts?regenerate=true
```

**Response:**
```json
[
  {
    "id": "uuid",
    "productId": 1,
    "productName": "Bamboo Spork Set",
    "productSku": "ECO-UTN-001",
    "productCategory": "Utensils",
    "reorderPoint": 100,
    "currentStock": 20,
    "stockStatus": "critical",
    "recommendedReorderQuantity": 130,
    "warehouses": [
      {
        "warehouseId": 1,
        "warehouseName": "Main Distribution Center",
        "warehouseCode": "NDC-01",
        "quantity": 15
      },
      {
        "warehouseId": 2,
        "warehouseName": "West Coast Facility",
        "warehouseCode": "WCF-02",
        "quantity": 5
      }
    ],
    "status": "active",
    "createdAt": "2026-01-16T06:32:06.085Z",
    "updatedAt": "2026-01-16T06:32:06.085Z",
    "acknowledgedAt": null,
    "resolvedAt": null,
    "notes": null
  }
]
```

### POST `/api/alerts`

Regenerate all alerts based on current stock levels.

**Request Body:** None required

**Response:** Array of all alerts (same format as GET)

### GET `/api/alerts/[id]`

Retrieve a specific alert by ID.

**Response:** Single alert object

### PUT `/api/alerts/[id]`

Update an alert's status and notes.

**Request Body:**
```json
{
  "status": "acknowledged",  // Optional: "active", "acknowledged", "resolved", "dismissed"
  "notes": "Order placed with supplier"  // Optional: string or null
}
```

**Response:** Updated alert object

### DELETE `/api/alerts/[id]`

Dismiss an alert (marks as dismissed rather than deleting).

**Response:**
```json
{
  "message": "Alert dismissed"
}
```

## Data Structure

### Alert Object

```typescript
{
  id: string;                    // Unique alert identifier (UUID)
  productId: number;              // Product ID
  productName: string;             // Product name
  productSku: string;              // Product SKU
  productCategory: string;         // Product category
  reorderPoint: number;            // Product's reorder point threshold
  currentStock: number;            // Total stock across all warehouses
  stockStatus: string;             // "critical" | "low" | "adequate" | "overstocked"
  recommendedReorderQuantity: number;  // Recommended units to order
  warehouses: Array<{             // Stock breakdown by warehouse
    warehouseId: number;
    warehouseName: string;
    warehouseCode: string;
    quantity: number;
  }>;
  status: string;                 // "active" | "acknowledged" | "resolved" | "dismissed"
  createdAt: string;              // ISO 8601 timestamp
  updatedAt: string;              // ISO 8601 timestamp
  acknowledgedAt: string | null;  // ISO 8601 timestamp or null
  resolvedAt: string | null;      // ISO 8601 timestamp or null
  notes: string | null;           // Optional notes
}
```

### Data Persistence

Alerts are persisted in `data/alerts.json` as a JSON array. The file is automatically created if it doesn't exist.

## How It Works

### Alert Generation Process

1. **Stock Aggregation**: For each product, calculate total stock across all warehouses
2. **Status Calculation**: Compare total stock to reorder point to determine stock status
3. **Alert Creation**: Generate alert for products in critical, low, or overstocked status
4. **Recommendation Calculation**: Calculate recommended reorder quantity
5. **Warehouse Breakdown**: Include stock distribution across warehouses
6. **Persistence**: Save alerts to `data/alerts.json`

### Alert Updates

- Alerts are automatically regenerated when:
  - Stock levels change (via stock management or transfers)
  - User manually triggers regeneration
  - API is called with `regenerate=true` parameter

- Existing alerts are preserved if:
  - Product ID matches
  - Stock status hasn't changed
  - Alert status is not resolved or dismissed

- New alerts are created when:
  - Product stock status changes
  - Product didn't have an alert before

## Usage Examples

### Viewing Active Critical Alerts

1. Navigate to `/alerts` page
2. Filter by "Critical" stock status
3. Filter by "Active" alert status
4. Review recommended reorder quantities
5. Click "View Details" or product icon to see product information

### Acknowledging an Alert

1. Find the alert in the alerts table
2. Click the acknowledge icon (checkmark)
3. Optionally add notes
4. Click "Acknowledge"
5. Alert status changes to "acknowledged"

### Resolving an Alert

1. Find the alert in the alerts table
2. Click the resolve icon (checkmark)
3. Add notes about the resolution (e.g., "Order placed with supplier")
4. Click "Resolve"
5. Alert status changes to "resolved" and is filtered out of active views

### Regenerating Alerts

1. Click "Regenerate Alerts" button on alerts page
2. System recalculates all alerts based on current stock levels
3. New alerts are created for products that now meet criteria
4. Existing alerts are updated if stock status changed

## Integration Points

### Dashboard

- Active alerts count displayed in KPI card
- Critical alerts section shows top 5 critical items
- Click-through to full alerts page

### Product Management

- Alerts reference product IDs
- Quick navigation from alert to product details
- Product reorder points drive alert calculations

### Stock Management

- Stock changes automatically trigger alert regeneration
- Warehouse-specific stock displayed in alert details

### Transfers

- Stock transfers update total stock levels
- Alert regeneration reflects transfer impacts

## Best Practices

### For Warehouse Managers

1. **Daily Review**: Check active alerts daily, especially critical items
2. **Prioritize Critical**: Address critical alerts immediately
3. **Use Recommendations**: Follow recommended reorder quantities as starting point
4. **Add Notes**: Document actions taken for audit trail
5. **Resolve Promptly**: Mark alerts as resolved when orders are placed

### For System Administrators

1. **Monitor Alert Counts**: High alert counts may indicate systemic issues
2. **Review Reorder Points**: Ensure product reorder points are set appropriately
3. **Regular Regeneration**: Consider automated alert regeneration on schedule
4. **Data Cleanup**: Periodically archive or clean up resolved/dismissed alerts

## Technical Details

### Calculation Logic

```javascript
// Stock Status Calculation
const percentage = (totalQuantity / reorderPoint) * 100;

if (totalQuantity === 0) {
  status = 'critical';
} else if (percentage <= 25) {
  status = 'critical';
} else if (percentage <= 50) {
  status = 'low';
} else if (percentage <= 150) {
  status = 'adequate';
} else {
  status = 'overstocked';
}

// Reorder Recommendation
const targetQuantity = Math.ceil(reorderPoint * 1.5);
const recommended = Math.max(0, targetQuantity - totalQuantity);
```

### File Structure

```
src/
├── pages/
│   ├── alerts/
│   │   └── index.js          # Alerts management page
│   └── api/
│       └── alerts/
│           ├── index.js      # GET, POST endpoints
│           └── [id].js       # GET, PUT, DELETE endpoints
data/
└── alerts.json                # Alert persistence
```

## Troubleshooting

### Alerts Not Appearing

- **Check Stock Levels**: Ensure products have stock entries in `data/stock.json`
- **Verify Reorder Points**: Products must have `reorderPoint` set in `data/products.json`
- **Regenerate Alerts**: Click "Regenerate Alerts" button to refresh

### Incorrect Recommendations

- **Review Reorder Points**: Recommendations are based on 150% of reorder point
- **Check Stock Totals**: Verify stock aggregation across warehouses is correct
- **Recalculate**: Regenerate alerts after stock changes

### Alert Status Not Updating

- **Check API Response**: Verify PUT request returns updated alert
- **Refresh Page**: Reload alerts page to see updates
- **Check Data File**: Verify `data/alerts.json` is writable

## Future Enhancements

Potential improvements for future versions:

- **Email Notifications**: Send alerts via email for critical items
- **Custom Thresholds**: Allow per-product threshold customization
- **Alert History**: Track alert lifecycle and changes over time
- **Bulk Actions**: Acknowledge or resolve multiple alerts at once
- **Export Functionality**: Export alerts to CSV/PDF
- **Automated Regeneration**: Schedule-based alert regeneration
- **Alert Rules**: Custom rules for alert generation
- **Supplier Integration**: Link alerts to supplier ordering systems
- **Forecasting**: Predict when stock will reach critical levels
- **Multi-User**: Track who acknowledged/resolved alerts

## Support

For issues or questions about the alerts system:

1. Check this documentation
2. Review API responses for error messages
3. Verify data files are properly formatted
4. Check browser console for JavaScript errors
5. Review server logs for API errors

---

**Last Updated**: January 2026  
**Version**: 1.0.0
