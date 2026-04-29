import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { IS_PUBLIC_KEY } from '../decorators/public.decorator';

@Injectable()
export class TenantGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (isPublic) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user) {
      throw new UnauthorizedException('Authentication required');
    }

    if (!user.organisationId) {
      throw new ForbiddenException('No organisation associated with user');
    }

    const requestedTenantId =
      request.params.tenantId ||
      request.query.organisationId ||
      request.body?.organisationId;

    if (requestedTenantId && requestedTenantId !== user.organisationId) {
      if (user.role !== 'admin') {
        throw new ForbiddenException(
          'Access to this organisation is forbidden',
        );
      }
    }

    return true;
  }
}
