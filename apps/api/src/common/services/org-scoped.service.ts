import { Injectable, Logger, ForbiddenException } from '@nestjs/common';
import { Role, isAdminRole } from '../enums/role.enum';

export interface UserContext {
  id: string;
  role: string;
  organisationId: string | null;
}

export type OrgFilter = {
  organisationId: string;
};

@Injectable()
export class OrgScopedService {
  private readonly logger = new Logger(OrgScopedService.name);

  getOrgId(user: UserContext): string {
    if (!user.organisationId && !isAdminRole(user.role)) {
      throw new ForbiddenException('Organisation ID is required');
    }
    return user.organisationId || '';
  }

  buildOrgFilter(
    user: UserContext,
    additionalFilter?: Partial<OrgFilter>,
  ): OrgFilter {
    const orgId = this.getOrgId(user);
    return {
      organisationId: orgId,
      ...additionalFilter,
    };
  }

  canAccessOrg(user: UserContext, targetOrgId: string): boolean {
    if (isAdminRole(user.role)) {
      return true;
    }
    return user.organisationId === targetOrgId;
  }
}
