# Testing Guide for Stock Transfer System

This guide explains how to run tests for the Stock Transfer System.

## Quick Start

### Install Dependencies

```bash
npm install --save-dev jest jest-environment-node node-mocks-http
```

**Note:** The Jest tests use Next.js's built-in Jest configuration. You may need to install `next` as a dev dependency if not already present.

### Run Tests

```bash
# Run all tests
npm test

# Run with coverage
npm test -- --coverage

# Run in watch mode
npm test -- --watch

# Run specific test file
npm test -- transfers.test.js
```

## Test Structure

### Automated Tests
- **Location:** `__tests__/api/transfers.test.js`
- **Type:** Jest API route tests
- **Coverage:** API endpoints, validation, business logic, data integrity

### Manual Test Cases
- **Location:** `TEST-CASES.md`
- **Type:** Comprehensive manual QA checklist
- **Coverage:** UI behavior, user experience, edge cases

## Test Data Management

The Jest tests automatically backup and restore your data files before and after each test run. This ensures:

1. Your production data is not modified
2. Tests run in isolation
3. Tests can be run repeatedly safely

**Backup Location:** `__tests__/fixtures/`

## Running Manual Tests

### Prerequisites
1. Development server running: `npm run dev`
2. Browser open to `http://localhost:3000/transfers`
3. Test data available (products, warehouses, stock)

### Test Execution
Follow the test cases in `TEST-CASES.md`:

1. **API Tests (A)**: Test API endpoints directly via HTTP requests (use Postman, curl, or browser DevTools)
2. **Data Integrity Tests (B)**: Verify JSON files after operations
3. **UI Tests (C)**: Test user interface interactions

### Backup Before Testing
Before running destructive manual tests:

```bash
cp data/stock.json data/stock.json.backup
cp data/transfers.json data/transfers.json.backup
cp data/products.json data/products.json.backup
cp data/warehouses.json data/warehouses.json.backup
```

Restore if needed:
```bash
cp data/*.backup data/
# Then rename files appropriately
```

## Test Coverage

### API Tests Cover:
- ✅ Successful transfers with stock updates
- ✅ Validation errors (quantity, missing fields, same warehouse)
- ✅ Business rule failures (insufficient stock, missing product/warehouse)
- ✅ Data integrity (no negative stock, consistency)
- ✅ GET endpoint filtering and pagination
- ✅ Single transfer retrieval

### Manual Tests Cover:
- ✅ Form validation and UX
- ✅ Error handling and feedback
- ✅ Transfer history table and filters
- ✅ Responsive design
- ✅ Edge cases and error recovery

## Troubleshooting

### Tests Fail with "Cannot find module '@/lib/dataStore'"
**Solution:** Ensure `jsconfig.json` has the path alias configured correctly.

### Tests Modify Production Data
**Solution:** The tests use backup/restore, but verify your `__tests__/fixtures/` directory has backups.

### API Tests Fail with File System Errors
**Solution:** Ensure you have write permissions in the `data/` and `__tests__/fixtures/` directories.

### Next.js Jest Configuration Issues
**Solution:** The `jest.config.js` uses Next.js's built-in Jest setup. If issues occur, try:

```bash
npm install --save-dev next jest jest-environment-node
```

## Continuous Integration

To run tests in CI/CD:

```yaml
# Example GitHub Actions
- name: Run Tests
  run: |
    npm install
    npm test -- --coverage
```

## Next Steps

After running tests:

1. Review test results and coverage
2. Document any bugs found
3. Update test cases if edge cases discovered
4. Add additional test cases as features evolve