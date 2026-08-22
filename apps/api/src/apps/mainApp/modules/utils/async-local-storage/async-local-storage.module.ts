import { AsyncLocalStorage } from 'node:async_hooks';

import { Module } from '@nestjs/common';

import { asyncLocalStorage } from './async-local-storage.provider';

@Module({
  providers: [
    {
      provide: AsyncLocalStorage,
      useValue: asyncLocalStorage,
    },
  ],
  exports: [AsyncLocalStorage],
})
export class AsyncLocalStorageModule {}
