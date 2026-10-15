import { createHmac, timingSafeEqual } from 'node:crypto';

export type JwtClaims = {
  exp?: number;
  iat?: number;
  tenantId?: string;
  sub?: string;
  type?: string;
  planTier?: string;
  [key: string]: unknown;
};

type JwtHeader = {
  alg?: string;
  typ?: string;
};

export const DECODING_ALGORITHM = 'HS256';
export const ENCODING = 'base64url';
export const ENCODING_ALGORITHM = 'sha256';

export type SignJwtOptions = {
  /** Token lifetime in seconds. Defaults to one hour. */
  expiresInSeconds?: number;
  /** Override "now" (seconds since epoch); useful for deterministic tests. */
  nowSeconds?: number;
};

function encodeSegment(value: object): string {
  return Buffer.from(JSON.stringify(value)).toString(ENCODING);
}

/**
 * Signs an HS256 JWT. Kept dependency-free so the issuer and the
 * `JwtAuthGuard` verifier always agree on the wire format.
 */
export function signJwt(
  claims: JwtClaims,
  secret: string,
  options: SignJwtOptions = {},
): string {
  if (!secret) {
    throw new Error('Cannot sign a JWT without a secret');
  }

  const issuedAt = options.nowSeconds ?? Math.floor(Date.now() / 1000);
  const header: JwtHeader = { alg: DECODING_ALGORITHM, typ: 'JWT' };
  const payload: JwtClaims = {
    ...claims,
    iat: issuedAt,
    exp: issuedAt + (options.expiresInSeconds ?? 3600),
  };

  const encodedHeader = encodeSegment(header);
  const encodedPayload = encodeSegment(payload);
  const signature = createHmac('sha256', secret)
    .update(`${encodedHeader}.${encodedPayload}`)
    .digest(ENCODING);

  return `${encodedHeader}.${encodedPayload}.${signature}`;
}

/**
 * Verifies an HS256 JWT signature and expiry. Throws on any failure; callers
 * translate that into the appropriate HTTP error.
 */
export function verifyJwt(token: string, secret: string): JwtClaims {
  const [encodedHeader, encodedPayload, signature] = token.split('.');

  if (!secret || !encodedHeader || !encodedPayload || !signature) {
    throw new Error('Malformed token');
  }

  const header = JSON.parse(
    Buffer.from(encodedHeader, ENCODING).toString(),
  ) as JwtHeader;

  if (header.alg !== DECODING_ALGORITHM) {
    throw new Error('Unsupported JWT algorithm');
  }

  const expected = createHmac(ENCODING_ALGORITHM, secret)
    .update(`${encodedHeader}.${encodedPayload}`)
    .digest();
  const supplied = Buffer.from(signature, ENCODING);

  if (
    supplied.length !== expected.length ||
    !timingSafeEqual(supplied, expected)
  ) {
    throw new Error('Invalid JWT signature');
  }

  const claims = JSON.parse(
    Buffer.from(encodedPayload, ENCODING).toString(),
  ) as JwtClaims;

  if (claims.exp !== undefined && claims.exp <= Math.floor(Date.now() / 1000)) {
    throw new Error('JWT expired');
  }

  return claims;
}
