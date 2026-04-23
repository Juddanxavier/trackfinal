# Shipment Module Phase Plan

## Overview
Build a full CRUD shipment management interface for the admin dashboard, following existing patterns from quotes and users modules.

## Phase Scope
**Full CRUD + List Page**: Shipments list, create, edit, view details, filters, pagination

---

## 1. Backend Analysis

### Existing Shipment API Routes
```
POST   /api/shipments                    - Create shipment (admin/staff)
GET    /api/shipments                    - List all (admin/staff)
GET    /api/shipments/:id                - Get by ID
PATCH  /api/shipments/:id                - Update shipment
GET    /api/shipments/customer/:userId   - Get by customer (paginated)
POST   /api/shipments/:id/refresh-tracking - Refresh tracking data
POST   /api/shipments/detect-carrier     - Auto-detect carrier
GET    /api/shipments/carriers           - List carriers
GET    /api/shipments/carriers/search     - Search carriers
GET    /api/shipments/public/track/:code - Public tracking (white label)
```

### Backend Gaps Identified
1. **Missing pagination** on `GET /api/shipments` - returns all records
2. **Missing search/filter** on list endpoint
3. **Missing stats endpoint** for dashboard cards

### Recommended Backend Enhancements
```typescript
// New endpoints to add
GET /api/shipments?page=1&limit=10&search=&status=&sortBy=&sortOrder=
GET /api/shipments/stats  // { total, pending, in_transit, delivered, cancelled }
DELETE /api/shipments/:id // Soft delete with reason
```

---

## 2. Frontend Architecture

### Folder Structure (follows existing pattern)
```
admin/
├── app/
│   └── shipments/
│       ├── page.tsx           // List page
│       ├── [id]/
│       │   └── page.tsx       // Detail page
│       └── create/
│           └── page.tsx       // Create form
├── components/
│   └── shipments/
│       ├── shipments-stats-cards.tsx
│       ├── shipments-table.tsx
│       ├── shipment-form.tsx
│       └── shipment-detail.tsx
└── lib/
    └── api.ts                 // Already exists
```

### Component Patterns (from quotes page)
- Use `SearchTabs` for status filtering (pending, in_transit, delivered, cancelled)
- Use `Pagination` component
- Use `Table` with `SortableTableHead`
- Use `DropdownMenu` for row actions
- Use `api.get/post/patch/delete` from `@/lib/api`
- Use `useAuth` for `selectedOrganisation`

---

## 3. Data Models

### Shipment Interface (Frontend)
```typescript
interface Shipment {
  id: string
  organisationId: string
  userId: string
  assignedToId?: string
  trackingNumber: string
  whiteLabelTrackingCode: string
  carrierCode: string
  recipientName: string
  recipientEmail?: string
  recipientPhone?: string
  recipientAddress?: string
  originCountry: string
  destinationCountry: string
  status: 'pending' | 'in_transit' | 'delivered' | 'cancelled'
  goodsType: string
  weight?: string
  track17Data?: any
  createdAt: string
  updatedAt: string
}

interface ShipmentStats {
  total: number
  pending: number
  in_transit: number
  delivered: number
  cancelled: number
}
```

---

## 4. UI/UX Specification

### List Page (`/shipments`)
```
┌─────────────────────────────────────────────────────────────┐
│ Shipments                                    [+ New Shipment]│
├─────────────────────────────────────────────────────────────┤
│ Stats Cards: [Total: XX] [Pending: XX] [In Transit: XX]    │
│             [Delivered: XX] [Cancelled: XX]                │
├─────────────────────────────────────────────────────────────┤
│ [Search...] [All ▼]                                        │
├─────────────────────────────────────────────────────────────┤
│ # | Tracking # | Carrier | Recipient | Route | Status    │
│ 1 | ABC123     | DHL    | John Doe  | US→UK | ● Pending    │
│ 2 | DEF456     | UPS    | Jane Doe  | CN→US | ○ In Transit│
├─────────────────────────────────────────────────────────────┤
│ [Prev] Page 1 of X [Next]  [10/per ▼]                      │
└─────────────────────────────────────────────────────────────┘
```

### Create Page (`/shipments/create`)
```
┌─────────────────────────────────────────────────────────────┐
│ ← New Shipment                                              │
├─────────────────────────────────────────────────────────────┤
│ Tracking Number * [________________________] [Detect]      │
│ Carrier *        [________________________] [Search...]     │
│                                                                
│ Recipient Details                                            │
│ Name *        [________________________]                    │
│ Email         [________________________]                    │
│ Phone         [________________________]                    │
│ Address       [________________________]                    │
│                                                                
│ Shipment Info                                                │
│ Origin Country *    [___________]                            │
│ Destination *       [___________]                            │
│ Goods Type      [General ▼]                                  │
│ Weight (kg)     [___________]                                 │
│                                                                
│ [Cancel]                                      [Create]       │
└─────────────────────────────────────────────────────────────┘
```

### Detail Page (`/shipments/[id]`)
```
┌─────────────────────────────────────────────────────────────┐
│ ← Shipment Details                    [Edit] [Refresh]     │
├─────────────────────────────────────────────────────────────┤
│ Tracking: ABC123456        Carrier: DHL                     │
│ Status: ● In Transit        White Label Code: WL-XXXXXXXX   │
├─────────────────────────────────────────────────────────────┤
│ Recipient: John Doe                                          │
│ Email: john@example.com  Phone: +1 234 567 890              │
│ Address: 123 Main St, New York, US                          │
├─────────────────────────────────────────────────────────────┤
│ Route: United States → United Kingdom                        │
│ Goods: Electronics (5.2 kg)                                 │
├─────────────────────────────────────────────────────────────┤
│ Tracking Timeline                                            │
│ ─────────────────────                                        │
│ ● 2024-01-15 Delivered - Package delivered                  │
│ ○ 2024-01-14 Out for delivery                                │
│ ○ 2024-01-13 Arrived at destination hub                     │
│ ○ 2024-01-12 In transit                                      │
└─────────────────────────────────────────────────────────────┘
```

---

## 5. Implementation Tasks

### Backend Enhancements (if needed)
- [ ] Add pagination to `GET /api/shipments`
- [ ] Add search/filter support
- [ ] Add `GET /api/shipments/stats` endpoint
- [ ] Add soft delete endpoint

### Frontend Development
- [ ] Add shipments route in sidebar navigation
- [ ] Create shipments list page (`/shipments`)
- [ ] Create shipments stats cards component
- [ ] Create shipments table with sorting
- [ ] Create create shipment page (`/shipments/create`)
- [ ] Create shipment detail page (`/shipments/[id]`)
- [ ] Create shipment form component (reusable)
- [ ] Add carrier search/detect functionality

---

## 6. Dependencies

### Already Available (shadcn components)
- Button, Input, Select, Table, Pagination
- Badge, Card, Tabs, Checkbox
- DropdownMenu, Dialog, Sheet
- Label, Avatar, Tooltip

### New Components Needed
- Maybe none - reuse existing UI components

---

## 7. API Integration

### Frontend API Calls
```typescript
// List with pagination
GET /shipments?page=1&limit=10&search=&status=&organisationId=

// Get stats
GET /shipments/stats?organisationId=

// Create
POST /shipments { ... }

// Update
PATCH /shipments/:id { ... }

// Delete
DELETE /shipments/:id

// Refresh tracking
POST /shipments/:id/refresh-tracking

// Detect carrier
POST /shipments/detect-carrier { trackingNumber }

// Get carriers
GET /shipments/carriers
GET /shipments/carriers/search?q=
```

---

## 8. Followed Patterns

| Pattern | Source |
|---------|--------|
| API client | `admin/lib/api.ts` |
| List page structure | `app/quotes/page.tsx` |
| Stats cards | `components/quote-stats-cards.tsx` |
| Search/filter | `components/search-tabs.tsx` |
| Table with sorting | `components/data-table.tsx` |
| Form handling | Similar to create patterns |
| Auth context | `useAuth` hook |

---

## 9. Success Criteria

1. ✅ Shipments list loads with pagination
2. ✅ Filter by status works (pending, in_transit, delivered, cancelled)
3. ✅ Search by tracking number, recipient works
4. ✅ Sorting on all columns works
5. ✅ Stats cards show correct counts
6. ✅ Create shipment form validates and submits
7. ✅ Edit shipment updates correctly
8. ✅ Delete shipment works with confirmation
9. ✅ Detail page shows all shipment info + tracking timeline
10. ✅ Carrier detection works from frontend
