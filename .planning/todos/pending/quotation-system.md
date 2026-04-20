---
title: Quotation System
date: 2026-04-19
priority: high
status: completed
---

# Quotation System ✅

## Implemented

### Quote Entity Schema
| Field | Type | Description |
|-------|------|-------------|
| id | UUID | Primary key |
| organisationId | UUID | Organisation |
| userId | UUID | Customer who created |
| assignedToId | UUID | Staff assigned |
| originCountry | text | Origin country |
| destinationCountry | text | Destination country |
| status | enum | pending, quoted, accepted, rejected |
| weight | numeric | Weight in kg |
| email | text | Contact email |
| phone | text | Contact phone |
| remarks | text | Additional notes |
| price | numeric | Quoted price |
| createdAt | timestamp | Creation date |
| updatedAt | timestamp | Update date |

### API Endpoints
| Method | Endpoint | Role | Description |
|-------|----------|------|-------------|
| POST | `/api/quotes` | All | Create quote request |
| GET | `/api/quotes/me` | All | View own quotes |
| GET | `/api/quotes` | admin, staff | View organisation quotes |
| GET | `/api/quotes/pending` | admin, staff | View pending quotes |
| PATCH | `/api/quotes/:id` | admin, staff | Update quote (status, price) |

### Key Features
- Auto-assign to first staff on create
- Staff/Admin can update status and price
- Customer can view own quotes only

---

## Created Files
```
backend/src/
├── database/schema/quotes.ts      # Quote schema
└── modules/quotes/
    ├── quotes.module.ts          # Module
    ├── quotes.controller.ts     # Controller
    ├── quotes.service.ts     # Service
    └── dto/quotes.dto.ts      # DTOs
```