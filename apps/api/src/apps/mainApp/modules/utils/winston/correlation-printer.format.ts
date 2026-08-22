import { format } from 'winston';

export const correlationPrinter = format((info) => {
  if (info.correlationId) {
    info.message = `[${String(info.correlationId)}] ${String(info.message)}`;
  }

  return info;
});
