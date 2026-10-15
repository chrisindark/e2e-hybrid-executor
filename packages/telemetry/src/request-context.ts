import { AsyncLocalStorage } from 'async_hooks';
import { TenantContext } from '@repo/types';

const storage = new AsyncLocalStorage<TenantContext>();

export const RequestContext = {
  run<T>(ctx: TenantContext, callback: () => T): T {
    return storage.run(ctx, callback);
  },

  get(): TenantContext {
    const ctx = storage.getStore();
    if (!ctx) {
      throw new Error(
        'Tenant context is not established in this asynchronous execution frame.',
      );
    }
    return ctx;
  },

  getOptional(): TenantContext | undefined {
    return storage.getStore();
  },

  getTenantId(): string {
    return this.get().tenantId;
  },
};

export { storage as requestContextStorage };
