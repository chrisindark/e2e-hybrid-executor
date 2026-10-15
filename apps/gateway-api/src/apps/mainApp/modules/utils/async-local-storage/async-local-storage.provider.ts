import { AsyncLocalStorage } from 'node:async_hooks';

import type { RequestContext } from './async-local-storage.type';

export const asyncLocalStorage = new AsyncLocalStorage<RequestContext>();
