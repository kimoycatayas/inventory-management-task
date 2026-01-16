# Stock Transfer System - Test Cases

This document contains comprehensive test cases for the Stock Transfer System (Task 2).

## Table of Contents
- [A) API Test Cases](#a-api-test-cases)
- [B) Data Integrity Tests](#b-data-integrity-tests)
- [C) UI Test Cases](#c-ui-test-cases)
- [D) Test Execution Instructions](#d-test-execution-instructions)

---

## A) API Test Cases

### A1. Successful Transfer

#### TC-API-001: Valid Transfer Creates Record and Updates Stock
**Preconditions:**
- Product ID 1 exists with 250 units in Warehouse 1
- Product ID 1 exists with 150 units in Warehouse 2
- Transfers.json is accessible

**Steps:**
1. Send POST request to `/api/transfers` with:
   ```json
   {
     "productId": 1,
     "fromWarehouseId": 1,
     "toWarehouseId": 2,
     "quantity": 50,
     "note": "Test transfer"
   }
   ```

**Expected Result:**
- Status code: 201
- Response contains transfer object with:
  - Valid UUID `id`
  - `status: "completed"`
  - Correct `productId`, `fromWarehouseId`, `toWarehouseId`, `quantity`
  - `productName`, `fromWarehouseName`, `toWarehouseName` populated
  - `createdAt` ISO timestamp
- Stock in Warehouse 1 for Product 1: 200 (250 - 50)
- Stock in Warehouse 2 for Product 1: 200 (150 + 50)
- Transfer record exists in `transfers.json`

---

#### TC-API-002: Transfer Creates Destination Stock Record If Missing
**Preconditions:**
- Product ID 1 exists in Warehouse 1 (250 units)
- Product ID 1 does NOT exist in Warehouse 3

**Steps:**
1. Send POST request to `/api/transfers` with:
   ```json
   {
     "productId": 1,
     "fromWarehouseId": 1,
     "toWarehouseId": 3,
     "quantity": 25
   }
   ```

**Expected Result:**
- Status code: 201
- New stock record created: `{productId: 1, warehouseId: 3, quantity: 25}`
- Source stock decreased by 25

---

#### TC-API-003: Transfer Removes Source Stock Record When Quantity Reaches Zero
**Preconditions:**
- Product ID 1 exists in Warehouse 1 with quantity X

**Steps:**
1. Send POST request transferring all X units to Warehouse 2

**Expected Result:**
- Status code: 201
- Stock record for Product 1 in Warehouse 1 is removed (not set to 0)
- Destination stock increased by X

---

### A2. Validation Errors

#### TC-API-004: Reject Quantity = 0
**Steps:**
1. POST `/api/transfers` with `quantity: 0`

**Expected Result:**
- Status code: 400
- Error message includes "Validation failed"
- Error array contains field `quantity` with message about positive integer

---

#### TC-API-005: Reject Negative Quantity
**Steps:**
1. POST `/api/transfers` with `quantity: -10`

**Expected Result:**
- Status code: 400
- Validation error for `quantity` field

---

#### TC-API-006: Reject Non-Integer Quantity
**Steps:**
1. POST `/api/transfers` with `quantity: 10.5`

**Expected Result:**
- Status code: 400
- Validation error indicating integer required

---

#### TC-API-007: Reject Missing Required Fields
**Steps:**
1. POST `/api/transfers` without `productId`
2. POST `/api/transfers` without `fromWarehouseId`
3. POST `/api/transfers` without `toWarehouseId`
4. POST `/api/transfers` without `quantity`

**Expected Result:**
- Each request returns status code: 400
- Error array contains specific missing field

---

#### TC-API-008: Reject From Warehouse Equals To Warehouse
**Steps:**
1. POST `/api/transfers` with `fromWarehouseId: 1, toWarehouseId: 1`

**Expected Result:**
- Status code: 400
- Error message indicates warehouses must be different

---

### A3. Business Rule Failures

#### TC-API-009: Reject Insufficient Stock
**Preconditions:**
- Product 1 has 250 units in Warehouse 1

**Steps:**
1. POST `/api/transfers` requesting 10000 units from Warehouse 1

**Expected Result:**
- Status code: 409
- Error message: "Insufficient stock"
- Response includes `available` and `requested` fields
- Stock unchanged

---

#### TC-API-010: Treat Missing Source Stock as Zero
**Preconditions:**
- Product 1 does not exist in Warehouse 3

**Steps:**
1. POST `/api/transfers` trying to transfer from Warehouse 3

**Expected Result:**
- Status code: 409
- `available: 0` in response

---

#### TC-API-011: Reject Non-Existent Product
**Steps:**
1. POST `/api/transfers` with `productId: 999`

**Expected Result:**
- Status code: 404
- Error message: "Product with ID 999 not found"

---

#### TC-API-012: Reject Non-Existent From Warehouse
**Steps:**
1. POST `/api/transfers` with `fromWarehouseId: 999`

**Expected Result:**
- Status code: 404
- Error message: "From warehouse with ID 999 not found"

---

#### TC-API-013: Reject Non-Existent To Warehouse
**Steps:**
1. POST `/api/transfers` with `toWarehouseId: 999`

**Expected Result:**
- Status code: 404
- Error message: "To warehouse with ID 999 not found"

---

### A4. Error Handling

#### TC-API-014: Handle Invalid JSON Body
**Steps:**
1. POST `/api/transfers` with malformed JSON body

**Expected Result:**
- Status code: 400 or 500
- Error message indicates parsing failure

---

#### TC-API-015: Handle File System Errors (Best Effort)
**Note:** This may require mocking file system failures

**Expected Result:**
- Status code: 500
- Error message indicates server error
- No partial writes to stock.json or transfers.json

---

### A5. GET /api/transfers

#### TC-API-016: Returns Transfers Sorted Newest First
**Preconditions:**
- Multiple transfers exist with different timestamps

**Steps:**
1. GET `/api/transfers`

**Expected Result:**
- Status code: 200
- Array sorted by `createdAt` descending (newest first)

---

#### TC-API-017: Filter by Warehouse ID
**Steps:**
1. GET `/api/transfers?warehouseId=2`

**Expected Result:**
- Status code: 200
- Only transfers where `fromWarehouseId = 2` OR `toWarehouseId = 2`

---

#### TC-API-018: Filter by Product ID
**Steps:**
1. GET `/api/transfers?productId=1`

**Expected Result:**
- Status code: 200
- Only transfers for `productId = 1`

---

#### TC-API-019: Filter by Status
**Steps:**
1. GET `/api/transfers?status=completed`

**Expected Result:**
- Status code: 200
- Only transfers with `status = "completed"`

---

#### TC-API-020: Respect Limit Parameter
**Preconditions:**
- More than 50 transfers exist

**Steps:**
1. GET `/api/transfers` (no limit)
2. GET `/api/transfers?limit=25`
3. GET `/api/transfers?limit=500`

**Expected Result:**
1. Returns 50 items (default)
2. Returns 25 items
3. Returns 200 items (max cap)

---

#### TC-API-021: GET Single Transfer by ID
**Steps:**
1. GET `/api/transfers/{valid-transfer-id}`

**Expected Result:**
- Status code: 200
- Returns single transfer object

---

#### TC-API-022: GET Non-Existent Transfer
**Steps:**
1. GET `/api/transfers/non-existent-id`

**Expected Result:**
- Status code: 404
- Error message: "Transfer not found"

---

## B) Data Integrity Tests

### B1. Stock Quantity Constraints

#### TC-DI-001: No Negative Stock Quantities
**Steps:**
1. Attempt transfer exceeding available stock

**Expected Result:**
- Transfer rejected (409)
- No stock records have `quantity < 0`
- All stock quantities remain >= 0

---

#### TC-DI-002: Stock Changes Match Transfer Quantity
**Steps:**
1. Record initial stock for Product 1 in Warehouses 1 and 2
2. Transfer 30 units from Warehouse 1 to 2
3. Verify stock changes

**Expected Result:**
- Source stock decreased by exactly 30
- Destination stock increased by exactly 30
- No other stock records modified

---

### B2. Transfer Record Consistency

#### TC-DI-003: Transfer Record Matches Stock Changes
**Steps:**
1. Execute valid transfer
2. Verify transfer record in `transfers.json`
3. Verify stock changes in `stock.json`

**Expected Result:**
- Transfer record `quantity` matches amount deducted/added
- Transfer `productId`, `fromWarehouseId`, `toWarehouseId` match stock updates
- Timestamp is recent (within last minute)

---

#### TC-DI-004: Unrelated Stock Records Unchanged
**Steps:**
1. Note quantity of Product 2 in Warehouse 1 (unrelated to transfer)
2. Transfer Product 1 from Warehouse 1 to Warehouse 2
3. Verify Product 2 stock unchanged

**Expected Result:**
- Product 2 quantity in Warehouse 1 unchanged

---

### B3. Atomic Operations

#### TC-DI-005: No Partial Writes on Failure
**Note:** This is best-effort with file-based storage

**Expected Result:**
- If transfer fails, neither `stock.json` nor `transfers.json` should have partial updates
- Either both files update successfully, or neither changes

---

## C) UI Test Cases

### C1. Transfer Form

#### TC-UI-001: Product Selection Shows Available Stock
**Preconditions:**
- Navigate to `/transfers`
- Products and warehouses loaded

**Steps:**
1. Select Product from dropdown
2. Select "From Warehouse"
3. Observe "Available stock" indicator

**Expected Result:**
- Available stock displays correct quantity for selected product + warehouse
- Updates when product or from warehouse changes

---

#### TC-UI-002: To Warehouse Disabled When Same as From
**Steps:**
1. Select "From Warehouse" = Warehouse 1
2. Attempt to select "To Warehouse"

**Expected Result:**
- "To Warehouse" dropdown disabled when "From Warehouse" is selected
- Warehouse 1 not available in "To Warehouse" dropdown

---

#### TC-UI-003: Submit Button Disabled Until Valid
**Steps:**
1. Observe submit button state with empty form
2. Fill form partially (missing required fields)
3. Fill form with invalid quantity
4. Fill form completely with valid data

**Expected Result:**
1. Submit disabled
2. Submit disabled
3. Submit disabled (if quantity exceeds available)
4. Submit enabled

---

#### TC-UI-004: Success Snackbar After Valid Transfer
**Steps:**
1. Complete valid transfer form
2. Click "Execute Transfer"
3. Wait for response

**Expected Result:**
- Success snackbar appears: "Transfer completed successfully! X units moved."
- Form resets (all fields cleared)
- Transfer appears in history table immediately

---

#### TC-UI-005: Loading State During Submission
**Steps:**
1. Fill valid transfer form
2. Click "Execute Transfer"
3. Observe button state during request

**Expected Result:**
- Button shows "Processing..." with spinner icon
- Button disabled during submission
- Button returns to normal after completion

---

### C2. Error States

#### TC-UI-006: Insufficient Stock Error Display
**Preconditions:**
- Product has 50 units in warehouse

**Steps:**
1. Select product and warehouse
2. Enter quantity: 100
3. Attempt to submit

**Expected Result:**
- Error snackbar: "Insufficient stock. Available: 50, Requested: 100"
- Form not submitted
- Stock unchanged

---

#### TC-UI-007: Validation Errors Shown Inline
**Steps:**
1. Enter quantity: 0
2. Enter quantity: -5
3. Enter quantity: 10.5
4. Leave required fields empty

**Expected Result:**
- Quantity field shows error state and helper text
- Submit button disabled
- Clear error messages

---

#### TC-UI-008: Retry After Error
**Steps:**
1. Trigger an error (e.g., insufficient stock)
2. Correct the issue (reduce quantity)
3. Submit again

**Expected Result:**
- Error clears
- Form allows resubmission
- Transfer succeeds

---

### C3. Transfer History Table

#### TC-UI-009: New Transfer Appears Immediately
**Steps:**
1. Execute a transfer
2. Observe history table

**Expected Result:**
- New transfer appears at top of table (newest first)
- All fields populated correctly
- Status chip shows "completed" (green)

---

#### TC-UI-010: Warehouse Filter Works
**Steps:**
1. Select "Filter by Warehouse" = Warehouse 1
2. Observe filtered results

**Expected Result:**
- Table shows only transfers involving Warehouse 1 (from or to)
- Filter persists when switching pages

---

#### TC-UI-011: Product Filter Works
**Steps:**
1. Select "Filter by Product" = Product 1
2. Observe filtered results

**Expected Result:**
- Table shows only transfers for Product 1
- Works in combination with warehouse filter

---

#### TC-UI-012: Pagination Behaves Correctly
**Preconditions:**
- More than 10 transfers exist

**Steps:**
1. Observe table with default 10 rows per page
2. Change to 25 rows per page
3. Navigate to page 2
4. Apply filter and observe pagination reset

**Expected Result:**
1. Shows first 10 transfers
2. Shows 25 transfers per page
3. Page 2 shows next set
4. Pagination resets to page 1 when filter changes

---

#### TC-UI-013: Status Chips Display Correctly
**Steps:**
1. View transfers with different statuses

**Expected Result:**
- "completed" status: green chip
- "failed" status: red chip (if applicable)
- Chip text matches status value

---

#### TC-UI-014: Table Columns Display Correct Data
**Steps:**
1. View transfer history table

**Expected Result:**
- Date/Time: Formatted locale string
- Product: Product name + ID
- Transfer: Shows "From → To" with arrow icon
- Quantity: Formatted number with commas
- Status: Colored chip
- Note: Shows note or "-" if empty

---

### C4. UX & Responsiveness

#### TC-UI-015: Mobile Layout Usability
**Steps:**
1. Open `/transfers` on mobile viewport (< 768px)
2. Interact with form
3. View history table

**Expected Result:**
- Form stacks vertically (not cramped)
- Table scrolls horizontally if needed
- All buttons and inputs accessible
- No horizontal scroll on main container

---

#### TC-UI-016: Sidebar Navigation Works
**Steps:**
1. Click "Transfers" in sidebar
2. Navigate to other pages and return

**Expected Result:**
- Transfers page loads correctly
- Sidebar highlights "Transfers" when active
- Navigation smooth and responsive

---

#### TC-UI-017: No UI Crash on Empty Data
**Preconditions:**
- No transfers exist yet

**Steps:**
1. Navigate to `/transfers`
2. Observe empty state

**Expected Result:**
- Info alert shown: "No transfers recorded yet..."
- Form still functional
- No console errors

---

#### TC-UI-018: Loading States During Data Fetch
**Steps:**
1. Navigate to `/transfers` (slow network simulation)
2. Observe loading indicators

**Expected Result:**
- Skeleton loaders shown for form and table
- No blank/unstyled content
- Smooth transition when data loads

---

#### TC-UI-019: Error Alert with Retry Button
**Steps:**
1. Simulate API error (network failure)
2. Observe error handling

**Expected Result:**
- Error alert displayed at top of page
- "Retry" button present
- Clicking retry refetches data

---

## D) Test Execution Instructions

### Automated Tests (Jest)

**Setup:**
```bash
npm install --save-dev jest @testing-library/react @testing-library/jest-dom jest-environment-node node-mocks-http
```

**Run Tests:**
```bash
npm test
```

**Run with Coverage:**
```bash
npm test -- --coverage
```

### Manual QA Testing

**Prerequisites:**
1. Start development server: `npm run dev`
2. Open browser to `http://localhost:3000/transfers`
3. Have initial test data available (products, warehouses, stock)

**Test Execution Checklist:**
- [ ] Complete all API test cases (TC-API-001 to TC-API-022)
- [ ] Complete all Data Integrity tests (TC-DI-001 to TC-DI-005)
- [ ] Complete all UI test cases (TC-UI-001 to TC-UI-019)
- [ ] Verify no console errors
- [ ] Verify no negative stock quantities in `data/stock.json`
- [ ] Verify all transfers in `data/transfers.json` match actual stock changes

**Test Data Backup:**
Before running destructive tests, backup your data files:
```bash
cp data/stock.json data/stock.json.backup
cp data/transfers.json data/transfers.json.backup
```

---

## Bug Reporting

If bugs are discovered during testing, document them with:
1. Test case ID
2. Steps to reproduce
3. Expected vs actual behavior
4. Screenshots/logs (if applicable)
5. Severity (Critical, High, Medium, Low)