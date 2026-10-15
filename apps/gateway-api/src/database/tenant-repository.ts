import type { DataSource, EntityTarget, Repository } from 'typeorm';

import { getTenantScope } from './tenant-context';

/**
 * A `Repository` that resolves against the tenant-scoped `EntityManager` for
 * the current unit of work, falling back to the default manager when there is
 * none.
 *
 * The fallback is intentional and safe: with the runtime role connected,
 * `app.tenant_id` is unset outside a tenant scope, so `current_tenant_id()`
 * returns NULL and the RLS policies filter *everything* out. Non-tenant code
 * fails closed rather than leaking another tenant's rows.
 *
 * Services keep injecting a normal-looking repository; only the provider
 * changes. The proxy resolves lazily on every access, so a repository captured
 * at construction time still follows the request's connection.
 */
export function createTenantRepository<T extends object>(
  dataSource: DataSource,
  entity: EntityTarget<T>,
): Repository<T> {
  const resolve = (): Repository<T> =>
    (getTenantScope()?.manager ?? dataSource.manager).getRepository(entity);

  return new Proxy({} as Repository<T>, {
    get(_target, property) {
      const repository = resolve();
      const value = Reflect.get(repository, property);

      return typeof value === 'function'
        ? (value as (...args: unknown[]) => unknown).bind(repository)
        : value;
    },
  });
}
