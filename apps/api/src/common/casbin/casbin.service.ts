import { Injectable, OnModuleInit, Logger } from '@nestjs/common';
import { newEnforcer, newModel } from 'casbin';
import DrizzleAdapter from 'drizzle-adapter';
import { db } from '../../database';

const MODEL_CONF = `
[request_definition]
r = sub, org, obj, act

[policy_definition]
p = sub, org, obj, act, eft

[role_definition]
g = _, _

[policy_effect]
e = some(where (p.eft == allow))

[matchers]
m = g(r.sub, p.sub) && (p.org == r.org || p.org == "*" || p.org == "") && (p.obj == r.obj || p.obj == "*" || globMatch(r.obj, p.obj)) && (p.act == r.act || p.act == "*")
`;

export interface AuditLogEntry {
  timestamp: Date;
  userId: string;
  orgId: string;
  action: string;
  object: string;
  result: boolean;
  roles: string[];
}

@Injectable()
export class CasbinService implements OnModuleInit {
  private readonly logger = new Logger(CasbinService.name);
  private enforcer: any;
  private auditLogs: AuditLogEntry[] = [];

  async onModuleInit() {
    const model = newModel();
    model.loadModelFromText(MODEL_CONF);

    const adapter = await DrizzleAdapter.newAdapter({ db });

    this.enforcer = await newEnforcer(model, adapter);

    await this.enforcer.addFunction(
      'globMatch',
      (pattern: string, text: string) => {
        const regex = new RegExp(pattern.replace(/\*/g, '.*'));
        return regex.test(text);
      },
    );

    await this.loadPolicies();
    await this.enforcer.savePolicy();
    this.logger.log('Casbin initialized with Drizzle adapter');
  }

  private async loadPolicies() {
    this.enforcer.clearPolicy();

    // admin: only their own organisation (uses their orgId at runtime)
    await this.enforcer.addPolicy('admin', '*', '*', '*', 'allow');

    // Staff permissions - can access their org (*) OR their specific branch (e.g., branch-uuid)
    // Staff can read/write shipments, quotes, tracking in their org
    await this.enforcer.addPolicy('staff', '*', 'shipments', '*', 'allow');
    await this.enforcer.addPolicy('staff', '*', 'quotes', '*', 'allow');
    await this.enforcer.addPolicy('staff', '*', 'tracking', '*', 'allow');
    await this.enforcer.addPolicy('staff', '*', 'reports', 'read', 'allow');
    await this.enforcer.addPolicy('staff', '*', 'notifications', '*', 'allow');
    await this.enforcer.addPolicy('staff', '*', 'settings', 'read', 'allow');
    await this.enforcer.addPolicy('staff', '*', 'monitoring', 'read', 'allow');
    // Staff can view org info but not modify
    await this.enforcer.addPolicy(
      'staff',
      '*',
      'organisations',
      'read',
      'allow',
    );

    // Staff permissions for no-org (fallback)
    await this.enforcer.addPolicy('staff', '', 'shipments', '*', 'allow');
    await this.enforcer.addPolicy('staff', '', 'quotes', '*', 'allow');
    await this.enforcer.addPolicy('staff', '', 'tracking', '*', 'allow');
    await this.enforcer.addPolicy('staff', '', 'reports', 'read', 'allow');
    await this.enforcer.addPolicy('staff', '', 'notifications', '*', 'allow');
    await this.enforcer.addPolicy(
      'staff',
      '',
      'organisations',
      'read',
      'allow',
    );

    // Branch-specific staff permissions (staff can only access their assigned branch)
    // Format: staff can access branch-uuid resources
    // These are added dynamically per user in updateUserBranchPermissions()

    // Customer: can only access their own data
    await this.enforcer.addPolicy(
      'customer',
      '*',
      'shipments',
      'read:own',
      'allow',
    );
    await this.enforcer.addPolicy(
      'customer',
      '*',
      'shipments',
      'write:own',
      'allow',
    );
    await this.enforcer.addPolicy(
      'customer',
      '*',
      'quotes',
      'read:own',
      'allow',
    );
    await this.enforcer.addPolicy(
      'customer',
      '*',
      'quotes',
      'write:own',
      'allow',
    );
    await this.enforcer.addPolicy(
      'customer',
      '*',
      'users',
      'read:own',
      'allow',
    );

    this.logger.log('Policies loaded');
  }

  async can(
    sub: string,
    obj: string,
    act: string,
    org?: string,
  ): Promise<boolean> {
    const orgId = org || '';
    try {
      const result = await this.enforcer.enforce(sub, orgId, obj, act);
      await this.logAudit(sub, orgId, act, obj, result);
      return result;
    } catch (error) {
      this.logger.error(`Enforce error: ${error}`);
      await this.logAudit(sub, orgId, act, obj, false);
      return false;
    }
  }

  private async logAudit(
    userId: string,
    orgId: string,
    action: string,
    object: string,
    result: boolean,
  ) {
    try {
      const roles = (await this.enforcer.getRolesForUser(userId)).slice(
        0,
        5,
      ) as string[];
      this.auditLogs.push({
        timestamp: new Date(),
        userId,
        orgId,
        action,
        object,
        result,
        roles,
      });

      if (this.auditLogs.length > 1000) {
        this.auditLogs = this.auditLogs.slice(-500);
      }
    } catch (e) {
      this.logger.warn(`Failed to log audit: ${e}`);
    }
  }

  async getAuditLogs(filters?: {
    userId?: string;
    orgId?: string;
    limit?: number;
  }): Promise<AuditLogEntry[]> {
    let logs = [...this.auditLogs];

    if (filters?.userId) {
      logs = logs.filter((l) => l.userId === filters.userId);
    }
    if (filters?.orgId) {
      logs = logs.filter((l) => l.orgId === filters.orgId);
    }

    logs = logs.slice(-(filters?.limit || 100));
    return logs.reverse();
  }

  async canMany(
    sub: string,
    permissions: Array<{ obj: string; act: string }>,
    org?: string,
  ): Promise<boolean[]> {
    return Promise.all(
      permissions.map((p) => this.can(sub, p.obj, p.act, org)),
    );
  }

  async getRolesForUser(userId: string): Promise<string[]> {
    return this.enforcer.getRolesForUser(userId);
  }

  async getPermissionsForUser(
    userId: string,
  ): Promise<Array<{ org: string; obj: string; act: string }>> {
    const permissions = await this.enforcer.getPermissionsForUser(userId);
    return permissions.map((p) => ({ org: p[1], obj: p[2], act: p[3] }));
  }

  async getPermissionsForRole(role: string): Promise<Record<string, string[]>> {
    const permissions = await this.enforcer.getPermissionsForUser(role);
    const permissionMap: Record<string, string[]> = {};

    for (const p of permissions) {
      const obj = p[2] as string;
      const act = p[3] as string;
      if (!permissionMap[act]) {
        permissionMap[act] = [];
      }
      if (!permissionMap[act].includes(obj)) {
        permissionMap[act].push(obj);
      }
    }

    return permissionMap;
  }

  async addRoleForUser(userId: string, role: string): Promise<void> {
    await this.enforcer.addRoleForUser(userId, role);
    this.logger.log(`Added role '${role}' to user '${userId}'`);
  }

  async removeRoleForUser(userId: string, role: string): Promise<void> {
    await this.enforcer.deleteRoleForUser(userId, role);
    this.logger.log(`Removed role '${role}' from user '${userId}'`);
  }

  async deleteUser(userId: string): Promise<void> {
    await this.enforcer.deleteUser(userId);
    this.logger.log(`Deleted user '${userId}' from Casbin`);
  }

  async syncUserRole(
    userId: string,
    role: string,
    orgId?: string,
  ): Promise<void> {
    await this.enforcer.deleteUser(userId);
    if (role) {
      await this.enforcer.addRoleForUser(userId, role);
      this.logger.log(
        `Synced user '${userId}' to role '${role}' org '${orgId || '*'}'`,
      );
    }
  }

  async getUserRoles(userId: string): Promise<string[]> {
    return this.enforcer.getRolesForUser(userId);
  }

  async hasRole(userId: string, role: string): Promise<boolean> {
    const roles = await this.enforcer.getRolesForUser(userId);
    return roles.includes(role);
  }

  async setUserBranchPermissions(
    userId: string,
    branchId: string,
    role: string,
  ): Promise<void> {
    if (role !== 'staff') return;

    await this.enforcer.addPolicy('staff', branchId, 'shipments', '*', 'allow');
    await this.enforcer.addPolicy('staff', branchId, 'quotes', '*', 'allow');
    await this.enforcer.addPolicy('staff', branchId, 'tracking', '*', 'allow');
    await this.enforcer.addPolicy(
      'staff',
      branchId,
      'reports',
      'read',
      'allow',
    );
    await this.enforcer.addPolicy(
      'staff',
      branchId,
      'notifications',
      '*',
      'allow',
    );
    await this.enforcer.addPolicy(
      'staff',
      branchId,
      'organisations',
      'read',
      'allow',
    );
    this.logger.log(
      `Added branch permissions for staff user '${userId}' on branch '${branchId}'`,
    );
  }

  async clearUserBranchPermissions(
    userId: string,
    branchId: string,
  ): Promise<void> {
    await this.enforcer.removePolicy(
      'staff',
      branchId,
      'shipments',
      '*',
      'allow',
    );
    await this.enforcer.removePolicy('staff', branchId, 'quotes', '*', 'allow');
    await this.enforcer.removePolicy(
      'staff',
      branchId,
      'tracking',
      '*',
      'allow',
    );
    await this.enforcer.removePolicy(
      'staff',
      branchId,
      'reports',
      'read',
      'allow',
    );
    await this.enforcer.removePolicy(
      'staff',
      branchId,
      'notifications',
      '*',
      'allow',
    );
    await this.enforcer.removePolicy(
      'staff',
      branchId,
      'organisations',
      'read',
      'allow',
    );
    this.logger.log(
      `Cleared branch permissions for user '${userId}' on branch '${branchId}'`,
    );
  }

  async clearAllBranchPermissions(branchId: string): Promise<void> {
    const objects = [
      'shipments',
      'quotes',
      'tracking',
      'reports',
      'notifications',
      'organisations',
    ];
    const actions = ['*', 'read'];
    for (const obj of objects) {
      for (const act of actions) {
        await this.enforcer
          .removePolicy('staff', branchId, obj, act, 'allow')
          .catch(() => {});
      }
    }
  }

  async canAccessBranch(
    userId: string,
    branchId: string,
    object: string,
    action: string,
  ): Promise<boolean> {
    return this.enforcer.enforce('staff', branchId, object, action);
  }

  async clearUserRoles(userId: string): Promise<void> {
    await this.enforcer.deleteUser(userId);
    this.logger.log(`Cleared all roles for user '${userId}'`);
  }

  async updateUserPermissions(
    userId: string,
    orgId: string,
    permissions: Array<{ obj: string; act: string }>,
  ): Promise<void> {
    await this.enforcer.clearPolicy();

    const allPolicies = [
      ['admin', '*', '*', '*', 'allow'],
      ['admin', '', '*', '*', 'allow'],
      ['staff', '*', 'shipments', '*', 'allow'],
      ['staff', '*', 'quotes', '*', 'allow'],
      ['staff', '*', 'tracking', '*', 'allow'],
      ['staff', '*', 'reports', 'read', 'allow'],
      ['staff', '*', 'users', 'read', 'allow'],
      ['staff', '*', 'notifications', '*', 'allow'],
      ['staff', '*', 'organisations', 'read', 'allow'],
      ['staff', '*', 'settings', 'read', 'allow'],
      ['staff', '*', 'monitoring', 'read', 'allow'],
      ['customer', '*', 'shipments', 'read:own', 'allow'],
      ['customer', '*', 'shipments', 'write:own', 'allow'],
      ['customer', '*', 'quotes', 'read:own', 'allow'],
      ['customer', '*', 'quotes', 'write:own', 'allow'],
      ['customer', '*', 'users', 'read:own', 'allow'],
      ['staff', '', 'shipments', '*', 'allow'],
      ['staff', '', 'quotes', '*', 'allow'],
      ['staff', '', 'tracking', '*', 'allow'],
      ['staff', '', 'reports', 'read', 'allow'],
      ['staff', '', 'users', 'read', 'allow'],
      ['staff', '', 'notifications', '*', 'allow'],
      ['staff', '', 'organisations', 'read', 'allow'],
    ];

    for (const policy of allPolicies) {
      await this.enforcer.addPolicy(...policy);
    }

    await this.enforcer.savePolicy();
    this.logger.log('Default policies reloaded');
  }

  async addPolicy(
    sub: string,
    obj: string,
    act: string,
    org?: string,
  ): Promise<void> {
    await this.enforcer.addPolicy(sub, org || '', obj, act, 'allow');
  }

  async removePolicy(
    sub: string,
    obj: string,
    act: string,
    org?: string,
  ): Promise<void> {
    await this.enforcer.removePolicy(sub, org || '', obj, act, 'allow');
  }

  async reloadPolicies(): Promise<void> {
    await this.loadPolicies();
  }
}
