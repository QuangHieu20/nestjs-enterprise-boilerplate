import { registerAs } from '@nestjs/config';

export interface ThrottlerConfig {
  ttl: number; // window in milliseconds
  limit: number; // max requests per window
}

// Global rate-limit tier. Sensitive routes (login/register) tighten this in
// auth.controller.ts; @SkipThrottle() opts a route out entirely.
export default registerAs('throttler', (): ThrottlerConfig => ({
  ttl: parseInt(process.env.RATE_LIMIT_TTL ?? '60000', 10),
  limit: parseInt(process.env.RATE_LIMIT_MAX ?? '100', 10),
}));
