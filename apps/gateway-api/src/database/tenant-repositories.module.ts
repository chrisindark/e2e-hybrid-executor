import { Global, Module, Provider, Type } from '@nestjs/common';
import { getDataSourceToken, getRepositoryToken } from '@nestjs/typeorm';
import { DataSource, EntityTarget } from 'typeorm';

import { PromotionCandidate } from '../shared/promotion-candidate.entity';
import { Run } from '../shared/run.entity';
import { Tenant } from '../shared/tenant.entity';
import { TestDefinition } from '../shared/test-definition.entity';
import { TestStep } from '../shared/test-step.entity';
import { StepAttempt } from '../shared/test-step-attempt.entity';
import { TestVersion } from '../shared/test-version.entity';
import { TraceEvent } from '../shared/trace-event.entity';
import { createTenantRepository } from './tenant-repository';
import { TenantTransactionService } from './tenant-transaction.service';

/** Tables whose rows are isolated by RLS. */
const TENANT_ENTITIES: Type<unknown>[] = [
  TestDefinition,
  TestStep,
  TestVersion,
  Run,
  StepAttempt,
  TraceEvent,
  PromotionCandidate,
];

function tenantRepositoryProvider(entity: Type<unknown>): Provider {
  return {
    provide: getRepositoryToken(entity),
    useFactory: (dataSource: DataSource) =>
      createTenantRepository(dataSource, entity as EntityTarget<object>),
    inject: [getDataSourceToken()],
  };
}

/**
 * Replaces `TypeOrmModule.forFeature(...)` with repositories that resolve
 * against the request's tenant connection. Global so feature modules keep
 * injecting `@InjectRepository(...)` unchanged.
 */
@Global()
@Module({
  providers: [
    ...TENANT_ENTITIES.map(tenantRepositoryProvider),
    {
      // `tenants` is not RLS-isolated, so it uses a plain repository.
      provide: getRepositoryToken(Tenant),
      useFactory: (dataSource: DataSource) => dataSource.getRepository(Tenant),
      inject: [getDataSourceToken()],
    },
    TenantTransactionService,
  ],
  exports: [
    ...TENANT_ENTITIES.map((entity) => getRepositoryToken(entity)),
    getRepositoryToken(Tenant),
    TenantTransactionService,
  ],
})
export class TenantRepositoriesModule {}
