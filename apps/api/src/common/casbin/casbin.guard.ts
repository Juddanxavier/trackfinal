import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { IS_PUBLIC_KEY } from '../decorators/public.decorator';
import { CasbinService } from './casbin.service';

@Injectable()
export class CasbinGuard implements CanActivate {
  constructor(
    private casbinService: CasbinService,
    private reflector: Reflector,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (isPublic) {
      return true;
    }

    const httpRequest = context.switchToHttp().getRequest();
    const user = httpRequest?.user as
      | { id?: string; role?: string; organisationId?: string }
      | undefined;

    if (!user?.id) {
      throw new UnauthorizedException('Authentication required');
    }

    if (!user.organisationId) {
      if (user.role !== 'admin') {
        throw new ForbiddenException('No organisation associated with user');
      }
    }

    const requiredPermissions = this.reflector.getAllAndOverride<
      Array<{ resource: string; action: string }>
    >('permissions', [context.getHandler(), context.getClass()]);

    if (!requiredPermissions || requiredPermissions.length === 0) {
      return true;
    }

    const role = user.role || 'customer';
    const results = await Promise.all(
      requiredPermissions.map(async (perm) => {
        const obj = perm.resource.includes(':id')
          ? perm.resource.replace(':id', httpRequest.params?.id || '')
          : perm.resource;
        return this.casbinService.can(role, obj, perm.action);
      }),
    );

    if (!results.some(Boolean)) {
      throw new ForbiddenException('Insufficient permissions');
    }

    return true;
  }
}
