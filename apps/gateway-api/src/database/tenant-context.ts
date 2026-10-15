import { AsyncLocalStorage } from 'node:async_hooks';

import type { EntityManager } from 'typeorm';

/**
 * The tenant a unit of work belongs to, plus the `EntityManager` bound to the
 * connection where `app.tenant_id` has been set. Repositories resolve against
 * this manager so that PostgreSQL RLS, not `WHERE tenant_id = ...`, does the
 * filtering.
 */
export interface TenantScope {
  readonly tenantId: string;
  readonly manager: EntityManager;
}

const tenantScopeStorage = new AsyncLocalStorage<TenantScope>();

/** Runs `work` with `scope` active for every await it performs. */
export function runInTenantScope<T>(scope: TenantScope, work: () => T): T {
  return tenantScopeStorage.run(scope, work);
}

export function getTenantScope(): TenantScope | undefined {
  return tenantScopeStorage.getStore();
}

/** The tenant of the current unit of work, if any. */
export function currentTenantId(): string | undefined {
  return tenantScopeStorage.getStore()?.tenantId;
}
