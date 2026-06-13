import { Injectable, Logger, ForbiddenException } from '@nestjs/common';
import { CasbinService } from '../casbin/casbin.service';
import { Role, isAdminRole } from '../enums/role.enum';

export interface UserContext {
  id: string;
  role: string;
  organisationId: string | null;
}

@Injectable()
export abstract class BaseService {
  protected readonly logger: Logger;
  protected casbinService: CasbinService;

  constructor(casbinService: CasbinService) {
    this.casbinService = casbinService;
    this.logger = new Logger(this.constructor.name);
  }

  protected getOrgId(user: UserContext): string | undefined {
    if (!user.organisationId && !isAdminRole(user.role)) {
      throw new ForbiddenException('Organisation ID is required');
    }
    return user.organisationId || undefined;
  }

  protected requireOrgId(user: UserContext): string {
    const orgId = this.getOrgId(user);
    if (!orgId) {
      throw new ForbiddenException('Organisation context required');
    }
    return orgId;
  }

  async checkPermission(
    user: UserContext,
    object: string,
    action: string,
  ): Promise<boolean> {
    const orgId = this.getOrgId(user);
    return this.casbinService.can(user.role, object, action, orgId || '');
  }

  async requirePermission(
    user: UserContext,
    object: string,
    action: string,
  ): Promise<void> {
    const hasPermission = await this.checkPermission(user, object, action);
    if (!hasPermission) {
      throw new ForbiddenException(`No permission to ${action} ${object}`);
    }
  }

  protected isAdmin(user: UserContext): boolean {
    return isAdminRole(user.role);
  }
}
