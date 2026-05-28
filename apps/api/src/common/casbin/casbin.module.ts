import { Global, Module } from '@nestjs/common';
import { CasbinService } from './casbin.service';
import { CasbinGuard } from './casbin.guard';

@Global()
@Module({
  providers: [CasbinService, CasbinGuard],
  exports: [CasbinService, CasbinGuard],
})
export class CasbinModule {}