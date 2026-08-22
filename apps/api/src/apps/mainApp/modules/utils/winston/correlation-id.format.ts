import type { FormatWrap } from 'logform';
import { format } from 'winston';

import { asyncLocalStorage } from '../async-local-storage/async-local-storage.provider';

export const correlationIdFormat: FormatWrap = format((info) => {
  try {
    const store = asyncLocalStorage.getStore();

    if (store?.correlationId) {
      info.correlationId = store.correlationId;
    }
  } catch (error) {
    console.error('Error while applying correlationIdFormat:', error);
  }

  return info;
});
