import type { FormatWrap } from 'logform';
import { format } from 'winston';

import { asyncLocalStorage } from '../async-local-storage/async-local-storage.provider';

export const correlationIdFormat: FormatWrap = format((info) => {
  try {
    const store = asyncLocalStorage.getStore();
    const correlationId = store?.correlationId;
    const tenantId = store?.tenantId;

    if (correlationId !== undefined && correlationId !== '') {
      info.correlationId = correlationId;
    }

    if (tenantId !== undefined && tenantId !== '') {
      info.tenantId = tenantId;
    }
  } catch (error) {
    console.error('Error while applying correlationIdFormat:', error);
  }

  return info;
});
