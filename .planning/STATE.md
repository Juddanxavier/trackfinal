# Project State

## Accumulated Context

### Roadmap Evolution
- Phase 15 added: lets build in app notification system for bell notification
- Phase 15 context gathered: 2026-04-19
- Phase 15 plans 15-01 and 15-02 completed: 2026-04-19

### Session Notes
- Triggers: Both entity + system
- Delivery: WebSocket via EventsGateway
- Scope: Organisation-scoped
- API scope: CRUD + WebSocket events

### Completed Requirements
- NOTIF-01: Notification model with id, organisationId, userId, titleKey, data, isRead, createdAt, expiresAt
- NOTIF-02: Template-based content with JSON metadata
- NOTIF-03: Read/unread state management
- NOTIF-04: 30-day auto-expiry
- NOTIF-05: Real-time WebSocket delivery
- NOTIF-06: Organisation-scoped queries
