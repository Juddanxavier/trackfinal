<!-- gitnexus:start -->
# GitNexus — Code Intelligence

This project is indexed by GitNexus as **trackfinal** (4295 symbols, 10051 relationships, 237 execution flows). Use the GitNexus MCP tools to understand code, assess impact, and navigate safely.

> If any GitNexus tool warns the index is stale, run `npx gitnexus analyze` in terminal first.

## Always Do

- **MUST run impact analysis before editing any symbol.** Before modifying a function, class, or method, run `gitnexus_impact({target: "symbolName", direction: "upstream"})` and report the blast radius (direct callers, affected processes, risk level) to the user.
- **MUST run `gitnexus_detect_changes()` before committing** to verify your changes only affect expected symbols and execution flows.
- **MUST warn the user** if impact analysis returns HIGH or CRITICAL risk before proceeding with edits.
- When exploring unfamiliar code, use `gitnexus_query({query: "concept"})` to find execution flows instead of grepping. It returns process-grouped results ranked by relevance.
- When you need full context on a specific symbol — callers, callees, which execution flows it participates in — use `gitnexus_context({name: "symbolName"})`.

## Never Do

- NEVER edit a function, class, or method without first running `gitnexus_impact` on it.
- NEVER ignore HIGH or CRITICAL risk warnings from impact analysis.
- NEVER rename symbols with find-and-replace — use `gitnexus_rename` which understands the call graph.
- NEVER commit changes without running `gitnexus_detect_changes()` to check affected scope.

## Resources

| Resource | Use for |
|----------|---------|
| `gitnexus://repo/trackfinal/context` | Codebase overview, check index freshness |
| `gitnexus://repo/trackfinal/clusters` | All functional areas |
| `gitnexus://repo/trackfinal/processes` | All execution flows |
| `gitnexus://repo/trackfinal/process/{name}` | Step-by-step execution trace |

## CLI

| Task | Read this skill file |
|------|---------------------|
| Understand architecture / "How does X work?" | `.claude/skills/gitnexus/gitnexus-exploring/SKILL.md` |
| Blast radius / "What breaks if I change X?" | `.claude/skills/gitnexus/gitnexus-impact-analysis/SKILL.md` |
| Trace bugs / "Why is X failing?" | `.claude/skills/gitnexus/gitnexus-debugging/SKILL.md` |
| Rename / extract / split / refactor | `.claude/skills/gitnexus/gitnexus-refactoring/SKILL.md` |
| Tools, resources, schema reference | `.claude/skills/gitnexus/gitnexus-guide/SKILL.md` |
| Index, status, clean, wiki CLI commands | `.claude/skills/gitnexus/gitnexus-cli/SKILL.md` |

<!-- gitnexus:end -->

# Project Status

## Goal
Reduce codebase complexity, adopt RHF + Zod, add test coverage, and clean up for production readiness.

## In Progress

- **Brand palette**: Green → Blue (GT Express). Updated `globals.css` `:root` and `.dark` — primary, accent, chart, ring, sidebar all use blue tones
- **Theme toggle**: Unlocked dark-locked layouts (`app/layout.tsx`, `(protected)/layout.tsx`). Toggle cycles dark → light → system. Button already existed in `site-header.tsx`
- Sidebar nav section grouping / collapsible sections
- Typography hierarchy improvements (card titles, section labels)
- Branded empty states per entity
- Card spacing / breathing room

## Progress

### Session 2 — Admin UI/UX todo (all done)
- **NavUser**: Replaced hardcoded test user with real `authUser` from `useAuth()`. Added `<SidebarFooter>` with user dropdown (Profile, Settings, Notifications, Help, Logout). Avatar shows initials
- **Page layouts**: Standardized 10 pages to `text-3xl font-bold tracking-tight` headings and `p-6` padding
- **Hooks** created in `lib/hooks/`:
  - `useRefetchOnFocus` — auto-refetch on tab focus
  - `useUnsavedChanges` — `beforeunload` warning
  - `useUndoAction` — toast with undo button
  - `useKeyboardShortcuts` — global `g+d`/`g+s` etc.
  - `useQuery` — reusable data-fetching hook
- **Breadcrumbs** component + applied to 5 nested pages
- **DataTable**: Added `renderMobileCard` prop for mobile card view
- **Autofocus** on 3 dialog forms
- **Keyboard shortcuts** provider in protected layout
- **Refetch-on-focus** on dashboard, shipments, quotes, users, invitations
- **Mobile card views** on shipments, quotes, users, invitations tables
- **Undo toast** on shipments delete (restore via API)
- **Unsaved changes** on profile edit form
- **Favicon**: Inline SVG "GT" favicon
- Lint clean, Prettier clean

### Session 1 — Core refactoring
- Refactored `apps/admin/lib/api.ts`: `fetch` cyclomatic 31→13
- Refactored `data-table.tsx`: extracted `DataTableHeader`, `DataTableBody`, `DataTablePagination`, `useTableState`
- Refactored `shipments.service.ts` (`create`, cognitive 42): extracted 4 helpers
- Split `shipments/page.tsx` 1487→671 LOC (extracted 3 dialogs)
- Split `organisations/page.tsx` 941→423 LOC (extracted 2 dialogs)
- Fixed circular DB schema deps: extracted `relations.ts`
- Refactored `reports.service.ts` `getCarrierAnalytics`: 150→55 LOC
- Refactored `tracking-sync.service.ts`: cognitive 45→7
- Fixed `PUT /users/me` → `PATCH /auth/profile`
- 12 Zod schemas in `lib/validation.ts`
- 12 forms converted to RHF + Zod
- 44 `console.error` → `toast.error`
- Unified TS, ESLint, Prettier versions across workspace
- Split `seventeen-track.service.ts` 1109→4 sub-services
- Split `gajantraders/app/page.tsx` 1197→566 (5 sections)
- Restored `middleware.ts` with cookie-based auth
- 108 API Jest tests + 6 admin Playwright E2E
- Replaced `console.log` with NestJS `Logger` (12 files)
- Adopted `@react-email/components` for email templates (8 components)
- Redesigned `EmailLayout` — accent bar + logo, no emoji
- Restored `POST /auth/register`
- Fixed `BranchFormDialog` edit population
- Scoped staff dashboard to branchId
- Added Next.js rewrite proxy for `/api/*` → `localhost:4000`

## Relevant Files
- `apps/admin/app/globals.css` — Brand palette (blue), light/dark CSS variables
- `apps/admin/app/layout.tsx` — Root layout (no `className="dark"`)
- `apps/admin/app/(protected)/layout.tsx` — Protected layout (no `className="dark"`)
- `apps/admin/components/site-header.tsx` — Theme toggle (dark/light/system cycle)
- `apps/admin/components/theme-provider.tsx` — next-themes wrapper with `enableSystem`
- `apps/admin/components/nav-user.tsx` — Sidebar user dropdown with proper links/avatars
- `apps/admin/components/data-table.tsx` — Mobile card view via `renderMobileCard`
- `apps/admin/components/breadcrumbs.tsx` — Nav breadcrumb component
- `apps/admin/components/keyboard-shortcuts-provider.tsx` — Global keyboard nav
- `apps/admin/lib/hooks/*.ts` — 5 reusable hooks
