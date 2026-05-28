# Casbin RBAC Model for Track

## Model Configuration (model.conf)

```
[request_definition]
r = sub, obj, act

[policy_definition]
p = sub, obj, act, eft

[role_definition]
g = _, _

[policy_effect]
e = some(where (p.eft == allow))

[matchers]
m = g(r.sub, p.sub) && (p.obj == r.obj || globMatch(r.obj, p.obj)) && (p.act == r.act || p.act == "*")
```

## Policy Examples (policies.csv)

### Organisation-scoped roles
```
# Global admin (superuser)
p, global_admin, *, *, allow

# Per-organisation admins
p, org:org_1:admin, *, *, allow
p, org:org_1:staff, shipments, read, allow
p, org:org_1:staff, shipments, write, allow
p, org:org_1:customer, shipments, read:own, allow
```

### Group assignments (users → roles)
```
# User 123 belongs to org_1 admin role
g, user_123, org:org_1:admin

# User 456 belongs to org_1 staff role
g, user_456, org:org_1:staff

# User 789 belongs to org_1 customer role
g, user_789, org:org_1:customer
```

## NestJS Implementation

```typescript
// casbin.service.ts
import { Enforcer } from 'casbin';
import { Injectable } from '@nestjs/common';

@Injectable()
export class CasbinService {
  constructor(private enforcer: Enforcer) {}

  async can(sub: string, obj: string, act: string): Promise<boolean> {
    // sub = "user_123"
    // obj = "shipments/123" (resource type + ID)
    // act = "read" | "write" | "delete"
    return this.enforcer.enforce(sub, obj, act);
  }

  async getRoles(userId: string): Promise<string[]> {
    return this.enforcer.getRolesForUser(userId);
  }
}
```

## Permission Strings

| Resource | Action | Meaning |
|----------|--------|---------|
| `shipments` | `read` | List shipments |
| `shipments/:id` | `read` | View single shipment |
| `shipments` | `write` | Create shipment |
| `shipments/:id` | `write` | Update shipment |
| `shipments/:id` | `delete` | Delete shipment |
| `quotes` | `read/write` | Manage quotes |
| `users` | `read/write` | Manage users |
| `reports` | `read` | View reports |
| `settings` | `read/write` | Organisation settings |

## Middleware Example

```typescript
// casbin.guard.ts
@Injectable()
export class CasbinGuard implements CanActivate {
  constructor(
    private casbinService: CasbinService,
    private reflector: Reflector,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const requiredPermission = this.reflector.get<string>(
      'permission',
      context.getHandler(),
    );
    if (!requiredPermission) return true;

    const request = context.switchToHttp().getRequest();
    const user = request.user;

    // Build permission key: resource:action:scope
    const [resource, action] = requiredPermission.split(':');
    const obj = request.params.id 
      ? `${resource}/${request.params.id}` 
      : resource;

    const hasPermission = await this.casbinService.can(
      user.id,
      obj,
      action,
    );

    if (!hasPermission) {
      throw new ForbiddenException('Insufficient permissions');
    }

    return true;
  }
}
```

## Usage in Controllers

```typescript
@Controller('shipments')
export class ShipmentsController {
  @Get()
  @Require('shipments:read')
  async findAll() { }

  @Post()
  @Require('shipments:write')
  async create() { }

  @Delete(':id')
  @Require('shipments:delete')
  async delete() { }
}
```