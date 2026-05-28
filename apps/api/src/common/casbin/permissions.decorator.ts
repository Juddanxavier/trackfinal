import { SetMetadata } from '@nestjs/common';

export const PERMISSIONS_KEY = 'permissions';
export type Permission = { resource: string; action: string };

export const Require = (...permissions: Permission[]) =>
  SetMetadata(PERMISSIONS_KEY, permissions);