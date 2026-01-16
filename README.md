# Multi-Warehouse Inventory Management System

## Overview

Enhance the existing Multi-Warehouse Inventory Management System built with Next.js and Material-UI (MUI) for GreenSupply Co, a sustainable product distribution company. The current system is functional but needs significant improvements to be production-ready.

## 🎯 Business Context

GreenSupply Co distributes eco-friendly products across multiple warehouse locations throughout North America. They need to efficiently track inventory across warehouses, manage stock movements, monitor inventory values, and prevent stockouts. This system is critical for their daily operations and customer satisfaction.

## 🛠️ Tech Stack

- [Next.js](https://nextjs.org/) - React framework
- [Material-UI (MUI)](https://mui.com/) - UI component library
- [React](https://reactjs.org/) - JavaScript library
- JSON file storage (for this assessment)

## 📋 Current Features (Already Implemented)

The basic system includes:

- ✅ Products management (CRUD operations)
- ✅ Warehouse management (CRUD operations)
- ✅ Stock level tracking per warehouse
- ✅ Basic dashboard with inventory overview
- ✅ Navigation between pages
- ✅ Data persistence using JSON files

**⚠️ Note:** The current UI is intentionally basic. We want to see YOUR design skills and creativity.

---

## 🚀 Your Tasks (Complete ALL 3)

---

## Task 1: Redesign & Enhance the Dashboard

**Objective:** Transform the basic dashboard into a professional, insightful command center for warehouse operations.

### Requirements:

Redesign the dashboard to provide warehouse managers with actionable insights at a glance. Your implementation should include:

- **Modern, professional UI** appropriate for a sustainable/eco-friendly company
- **Key business metrics** (inventory value, stock levels, warehouse counts, etc.)
- **Data visualizations** using a charting library of your choice
- **Enhanced inventory overview** with improved usability
- **Fully responsive design** that works across all device sizes
- **Proper loading states** and error handling

Focus on creating an interface that balances visual appeal with practical functionality for daily warehouse operations.

---

## Task 2: Implement Stock Transfer System

**Objective:** Build a complete stock transfer workflow with proper business logic, validation, and data integrity.

### Requirements:

**A. Stock Transfer System**

Build a complete stock transfer system that allows moving inventory between warehouses. Your implementation should include:

- Data persistence for transfer records (create `data/transfers.json`)
- API endpoints for creating and retrieving transfers
- Proper validation and error handling
- Stock level updates across warehouses
- Transfer history tracking

Design the data structure, API contracts, and business logic as you see fit for a production system.

**B. Transfer Page UI**

Create a `/transfers` page that provides:

- A form to initiate stock transfers between warehouses
- Transfer history view
- Appropriate error handling and user feedback

Design the interface to be intuitive for warehouse managers performing daily operations.

---

## Task 3: Build Low Stock Alert & Reorder System

**Objective:** Create a practical system that helps warehouse managers identify and act on low stock situations.

### Requirements:

Build a low stock alert and reorder recommendation system that helps warehouse managers proactively manage inventory levels.

**Key Functionality:**

- Identify products that need reordering based on current stock levels and reorder points
- Categorize inventory by stock status (critical, low, adequate, overstocked)
- Provide actionable reorder recommendations
- Allow managers to track and update alert status
- Integrate alerts into the main dashboard

**Implementation Details:**

- Create an `/alerts` page for viewing and managing alerts
- Calculate stock across all warehouses
- Persist alert tracking data (create `data/alerts.json`)
- Design appropriate status workflows and user actions

Use your judgment to determine appropriate thresholds, calculations, and user workflows for a production inventory management system.

---

## 📦 Getting Started

### Prerequisites

- Node.js (v16 or higher recommended)
- Modern web browser (Chrome, Firefox, Safari, or Edge)
- Screen recording software for video submission (Loom, OBS, QuickTime, etc.)

### Installation

```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Open browser to http://localhost:3000
```

### Project Structure

```
inventory-management-task/
├── data/                  # JSON data files
├── src/
│   └── pages/            # Next.js pages and API routes
└── package.json
```

The existing codebase includes product, warehouse, and stock management features. Explore the code to understand the current implementation before starting your tasks.

---

## 📝 Submission Requirements

### 1. Code Submission

- Push your code to **your own GitHub repository** (fork or new repo)
- Clear commit history showing your progression
- Update `package.json` with any new dependencies
- Application must run with: `npm install && npm run dev`

### 2. Video Walkthrough (5-10 minutes) - REQUIRED ⚠️

Record a video demonstration covering:

**Feature Demo (4-5 minutes)**

- Redesigned dashboard walkthrough (demonstrate responsiveness)
- Stock transfer workflow (show both successful and error scenarios)
- Alert system functionality

**Code Explanation (3-4 minutes)**

- Key technical decisions and approach
- Most challenging aspects and solutions
- Code structure highlights

**Reflection (1-2 minutes)**

- What you're proud of
- Known limitations or trade-offs
- What you'd improve with more time

**Format:** Upload to YouTube (unlisted), Loom, or similar platform. Include link in your README.

### 3. Update This README

Add an implementation summary at the bottom with:

- Your name and completion time
- Features completed
- Key technical decisions
- Known limitations
- Testing instructions
- Video walkthrough link
- Any new dependencies added

---

## ⏰ Timeline

**Deadline:** 3 days (72 hours) from receiving this assignment

Submit:

1. GitHub repository link
2. Video walkthrough link
3. Updated README with implementation notes

**Estimated effort:** 15-18 hours total

**Note:** This timeline reflects real-world project constraints. Manage your time effectively and prioritize core functionality over bonus features.

---

## 🏆 Optional Enhancements

If you have extra time, consider adding:

- Live deployment (Vercel/Netlify)
- Dark mode
- Export functionality (CSV/PDF)
- Keyboard shortcuts
- Advanced filtering
- Accessibility features
- Unit tests
- TypeScript
- Additional features you think add value

**Important:** Complete all 3 core tasks before attempting bonuses. Quality of required features matters more than quantity of extras.

---

## 🤔 Frequently Asked Questions

**Q: Can I use additional libraries?**
A: Yes! Add them to package.json and document your reasoning.

**Q: What if I encounter technical blockers?**
A: Document the issue, explain what you tried, and move forward with the next task. Include this in your video explanation.

**Q: Can I modify the existing data structure?**
A: You can add fields, but don't break the existing structure that other features depend on.

**Q: What if I can't complete everything?**
A: Submit what you have with clear documentation. Quality over quantity.

**Q: How will my submission be used?**
A: This is solely for technical assessment. Your code will not be used commercially.

---

## 🚀 Final Notes

This assessment is designed to simulate real-world development scenarios. We're looking for:

- Clean, maintainable code
- Thoughtful problem-solving
- Professional UI/UX
- Proper error handling
- Good communication skills (via your video)

Do your best work, document your decisions, and show us how you approach building production applications.

Good luck! 💪

---

**Setup issues?** Verify Node.js is installed and you're using a modern browser. If problems persist, document them in your submission.

---

## 📊 Implementation Summary

### Developer Information

- **Name:** Elisha Kim Catayas
- **Completion Time:** 6 hours

### Features Completed

#### ✅ Core Tasks (All 3 Completed)

**Task 1: Redesigned & Enhanced Dashboard**

- Modern, professional UI with warm color palette (#F6F5EF background, #141414 sidebar)
- Comprehensive KPI cards displaying key business metrics (total inventory value, units, products, warehouses)
- Interactive data visualizations using Recharts (area charts with gradient fills)
- Responsive sidebar navigation with collapsible functionality
- Real-time inventory overview table with search, filtering, sorting, and pagination
- Low stock alerts integration on dashboard
- Loading states and error handling throughout
- Fully responsive design for all device sizes

**Task 2: Stock Transfer System**

- Complete stock transfer workflow with form validation
- API endpoints for creating and retrieving transfers (`/api/transfers`)
- Automatic stock level updates across source and destination warehouses
- Transfer history table with filtering, sorting, and pagination
- Comprehensive error handling (insufficient stock, validation errors, same warehouse prevention)
- Data persistence using `data/transfers.json`
- Export functionality (CSV/PDF) for transfer history
- Real-time stock validation before transfer execution

**Task 3: Low Stock Alert & Reorder System**

- Automatic alert generation based on reorder points
- Multi-warehouse stock aggregation for accurate inventory assessment
- Stock status categorization (Critical, Low, Adequate, Overstocked)
- Automatic reorder quantity recommendations
- Alert status workflow (active → acknowledged → resolved/dismissed)
- Dedicated `/alerts` page with comprehensive management interface
- Dashboard integration showing critical alerts
- Alert persistence using `data/alerts.json`
- Filtering and sorting capabilities for alert management

#### ✅ Optional Enhancements Completed

- **Dark Mode:** Full theme switching with persistent user preference (localStorage)
- **Export Functionality:** CSV and PDF export for dashboard, transfers, and alerts
- **Keyboard Shortcuts:** Global shortcuts for navigation (g+h, g+p, g+w, g+t) and search (/) with help modal
- **Advanced Filtering:** Warehouse-specific filtering, timeframe selection, and search across all pages
- **Unit Tests:** Jest test suite for stock transfer API endpoints with data backup/restore

### Key Technical Decisions

1. **Architecture & State Management**

   - Maintained Pages Router (no migration to App Router) to preserve existing structure
   - Custom hooks (`useDashboardData`, `useKeyboardShortcuts`) for reusable logic
   - Context API for theme mode management across the application

2. **UI/UX Design**

   - Implemented persistent sidebar navigation replacing traditional AppBar for modern dashboard feel
   - Warm, eco-friendly color palette with dark mode support
   - Minimal chart design using area charts with thin strokes and soft gradients
   - Embedded KPIs within cards rather than standalone tiles for better hierarchy

3. **Data Visualization**

   - Chose Recharts for its React-native API and responsive design capabilities
   - Area charts over bar charts for more elegant, modern appearance
   - Theme-aware chart colors that adapt to light/dark mode

4. **Business Logic**

   - Stock status categorization based on percentage of reorder point (0-25% critical, 26-50% low, 51-150% adequate, >150% overstocked)
   - Atomic stock updates during transfers to prevent race conditions
   - Comprehensive validation at both API and UI levels

5. **Export Functionality**

   - Dynamic imports for jsPDF to avoid SSR issues
   - RFC 4180 compliant CSV export with proper escaping
   - UTF-8 BOM for Excel compatibility in CSV exports

6. **Testing Strategy**
   - Jest for API endpoint testing with automatic data backup/restore
   - Manual test cases documented in `TEST-CASES.md`
   - Test fixtures stored separately to protect production data

### Known Limitations

1. **Data Persistence**

   - JSON file storage is not suitable for production (no concurrent access handling, no transactions)
   - No database connection pooling or query optimization
   - File-based storage may have performance issues with large datasets

2. **Concurrency**

   - No locking mechanism for simultaneous stock updates (could lead to race conditions in production)
   - Multiple users modifying the same data simultaneously may cause inconsistencies

3. **Error Recovery**

   - Limited rollback capabilities if partial operations fail
   - No audit trail for data changes beyond transfer records

4. **Performance**

   - All data loaded into memory (not suitable for very large inventories)
   - No pagination at API level for large datasets
   - Chart rendering may slow with extensive historical data

5. **Security**

   - No authentication or authorization (all operations are open)
   - No input sanitization beyond basic validation
   - API endpoints are publicly accessible

6. **Accessibility**

   - Keyboard shortcuts help modal exists but could be more comprehensive
   - Some color contrast ratios may not meet WCAG AAA standards
   - Screen reader support could be enhanced

7. **Browser Compatibility**
   - Export functionality relies on modern browser APIs (Blob, URL.createObjectURL)
   - Dark mode uses CSS custom properties that may not work in older browsers

### Testing Instructions

#### Automated Tests

```bash
# Install dependencies (if not already installed)
npm install

# Run all tests
npm test

# Run tests with coverage report
npm test -- --coverage

# Run tests in watch mode
npm test -- --watch

# Run specific test file
npm test -- transfers.test.js
```

**Test Coverage:**

- Stock transfer API endpoints (`__tests__/api/transfers.test.js`)
- Validation logic and business rules
- Data integrity checks
- Error handling scenarios

**Note:** Tests automatically backup and restore data files from `__tests__/fixtures/` to ensure test isolation.

#### Manual Testing

1. **Start Development Server**

   ```bash
   npm run dev
   ```

2. **Dashboard Testing**

   - Navigate to `http://localhost:3000`
   - Verify KPI cards display correct values
   - Test chart interactions and responsiveness
   - Test search, filtering, and sorting in inventory table
   - Verify dark mode toggle functionality
   - Test keyboard shortcuts (press `?` for help)

3. **Stock Transfer Testing**

   - Navigate to `/transfers`
   - Create a transfer with valid data
   - Verify stock levels update in both warehouses
   - Test validation (insufficient stock, same warehouse, negative quantities)
   - Test transfer history filtering and export

4. **Alert System Testing**

   - Navigate to `/alerts`
   - Verify alerts are generated based on reorder points
   - Test alert status updates (acknowledge, resolve, dismiss)
   - Verify dashboard integration shows critical alerts
   - Test filtering and sorting

5. **Export Functionality**
   - Test CSV export on dashboard, transfers, and alerts pages
   - Test PDF export on all pages
   - Verify exported files open correctly in Excel/PDF viewers

**Comprehensive Manual Test Cases:** See `TEST-CASES.md` for detailed test scenarios.

### Video Walkthrough Link

**To be followed** - Video walkthrough will be uploaded and linked here.

### New Dependencies Added

#### Production Dependencies

- **recharts** (`^2.12.7`) - React charting library for data visualizations
- **jspdf** (`^4.0.0`) - PDF generation library
- **jspdf-autotable** (`^5.0.7`) - Table plugin for jsPDF

#### Development Dependencies

- **jest** (`^30.2.0`) - JavaScript testing framework
- **jest-environment-jsdom** (`^30.2.0`) - JSDOM environment for Jest
- **jest-environment-node** (`^30.2.0`) - Node environment for Jest
- **node-mocks-http** (`^1.17.2`) - HTTP request/response mocking for API tests

**Total New Dependencies:** 7 packages (3 production, 4 development)
