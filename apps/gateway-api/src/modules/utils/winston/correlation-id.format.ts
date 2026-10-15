import { RequestContext } from '@repo/telemetry';
import type { FormatWrap } from 'logform';
import { format } from 'winston';

export const correlationIdFormat: FormatWrap = format((info) => {
  try {
    const context = RequestContext.getOptional();
    const correlationId = context?.correlationId;
    const tenantId = context?.tenantId;

    if (correlationId !== undefined && correlationId !== '') {
      info.correlationId = correlationId;
    }

    if (tenantId !== undefined && tenantId !== '' && tenantId !== 'anonymous') {
      info.tenantId = tenantId;
    }
  } catch (error) {
    console.error('Error while applying correlationIdFormat:', error);
  }

  return info;
});
