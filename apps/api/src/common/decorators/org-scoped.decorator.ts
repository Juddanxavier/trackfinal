import { createParamDecorator, ExecutionContext } from '@nestjs/common';

export interface OrgParams {
  organisationId: string;
  userId: string;
  role: string;
}

export const Org = createParamDecorator(
  (data: keyof OrgParams | undefined, ctx: ExecutionContext): OrgParams | string => {
    const request = ctx.switchToHttp().getRequest();
    const user = request.user;
    
    const orgParams: OrgParams = {
      organisationId: user?.organisationId || '',
      userId: user?.id || '',
      role: user?.role || '',
    };

    if (data) {
      return orgParams[data];
    }
    return orgParams;
  },
);

export const OrgId = createParamDecorator(
  (data: unknown, ctx: ExecutionContext): string => {
    const request = ctx.switchToHttp().getRequest();
    return request.user?.organisationId || '';
  },
);