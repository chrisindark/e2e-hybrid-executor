import { format } from 'winston';

export const correlationPrinter = format((info) => {
  const correlationId: unknown = info.correlationId;

  if (correlationId !== undefined && correlationId !== '') {
    info.message = `[${String(correlationId)}] ${String(info.message)}`;
  }

  return info;
});
