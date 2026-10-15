/**
 * Canonical error envelope returned to API clients by the global exception
 * filters. Keeping a single shape makes error handling predictable for callers
 * (and for the web app) regardless of which filter produced the response.
 */
export interface ErrorResponseBody {
  statusCode: number;
  error: string;
  message: string | string[];
  path: string;
  method: string;
  timestamp: string;
  correlationId?: string;
}
