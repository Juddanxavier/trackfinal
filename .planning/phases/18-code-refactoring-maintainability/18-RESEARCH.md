# RESEARCH.md - Phase 18: Code Refactoring for Maintainability

**Analysis Date:** 2026-04-21

## Problem Statement

The codebase has accumulated technical debt through rapid feature development. Key pain points:

1. **Mutable global state** - `api.ts` uses `let` variables with no synchronization
2. **Mixed concerns** - Data fetching logic embedded in UI components
3. **Duplicate patterns** - Nearly identical table/pagination code in users and quotes pages
4. **Missing types** - Inline interfaces, no centralized type definitions
5. **Backend mixed responsibilities** - Shipments service does too much in one file

## Current State Analysis

### File: admin/lib/api.ts (168 lines)

**Current Issues:**
- Lines 17-18: Mutable global state (`let csrfToken`, `let accessToken`)
- No request cancellation (AbortController created but not exposed)
- No TypeScript generics for response types
- Error sanitization hardcoded per-case (lines 70-85)
- No request queue or deduplication

**Impact:** Race conditions possible, stale tokens, memory leaks from listeners

### File: admin/app/users/page.tsx (250 lines)

**Current Issues:**
- Lines 41-56: Inline type definitions (User, Stats)
- Lines 80-108: Data fetching mixed with render logic (useEffect + useState)
- Lines 174-238: Table rendering duplicated in quotes/page.tsx
- No reusable hooks

**Impact:** Hard to maintain consistency across pages, type drift

### File: admin/app/quotes/page.tsx (235 lines)

**Current Issues:**
- Lines 127-132: Duplicate status variants object
- Lines 174-213: Identical table structure to users/page.tsx
- Lines 77-103: Duplicate fetch logic with different types

**Impact:** 80% duplicate code, two places to fix bugs

### File: backend/src/modules/shipments/shipments.service.ts (218 lines)

**Current Issues:**
- Lines 36: White label code generation (should be utility)
- Lines 190-208: Carrier detection (separate service)
- Lines 110-123: Pagination logic (should be utility)
- No comments explaining business logic

**Impact:** Hard to test, modify carrier logic, or reuse code

## Target Architecture

### Frontend (Higher Leverage)

**Goal:** Single responsibility components with clear interfaces

```
admin/
├── lib/
│   ├── api.ts                    # Refactored - TypeScript typed responses
│   └── types/                    # NEW - Centralized types
│       └── index.ts
├── hooks/
│   └── use-list-data.ts          # NEW - Reusable data fetching hook
├── components/
│   └── list-page.tsx             # NEW - Reusable list page template
```

**api.ts improvements:**
- Export typed API methods with generics
- Expose request cancellation
- Centralize error handling
- Add JSDoc comments

**New use-list-data.ts:**
- Generic pagination, search, filter
- Loading/error states
- Request deduplication

**New list-page.tsx:**
- Accepts columns, filters as props
- Reuses across users/quotes

### Backend

**Goal:** Separate concerns with single responsibility

```
backend/src/modules/shipments/
├── shipments.service.ts           # Core CRUD only
├── shipments.utils.ts           # White label code generation
├── carriers.service.ts        # Carrier detection
└── tracking.service.ts      # track17 integration
```

**shipments.service.ts after:**
- ~150 lines (from 218)
- Clear separation of concerns
- JSDoc on public methods

## Refactoring Patterns to Apply

### 1. Extract Types First
Create `@/lib/types` with all shared interfaces:
- User, Quote, Shipment types
- API response types
- Stats types

### 2. Extract Reusable Hook
Create `useListData<T>` for any paginated list:
- Accepts fetch function
- Returns loading, data, pagination state
- Handles URLSearchParams

### 3. Extract List Page Template
Create `ListPage<T>` accepting:
- columns: ColumnDef<T>[]
- filters: FilterOption[]
- fetchData: () => Promise<PaginatedResponse<T>>

### 4. Add Comments
For complex logic:
- White label code generation explained
- Carrier detection rationale
- Business rules documented

## Implementation Risks

| Risk | Mitigation |
|------|-----------|
| Breaking existing functionality | Test after each file, verify UI works |
| Missing edge cases | Compare before/after data shapes |
| Type drift | Centralized types, not inline |
| Performance regression | Keep memoization if needed |

## Resources Needed

- TanStack Table already installed (see data-table.tsx)
- Reusable pagination component exists
- SearchTabs component exists

## Conclusion

This refactoring moves code from:
- **Tightly coupled** to **loosely coupled**
- **Mutable** to **immutable where possible**
- **Duplicated** to **reusable**
- **Undocumented** to **commented**

The goal is maintainability through extraction and clarity, not feature changes.