/**
 * Request path prefixes that should not produce access logs.
 * Health/metrics probes are high-frequency and add noise to production logs.
 */
export const HTTP_REQUESTS_SHOULD_NOT_LOG = ['/health', '/metrics'];
