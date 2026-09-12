import { describe, expect, it } from 'vitest';
import {
  applyRateLimitEnvAliases,
  resolveRateLimitConfig,
} from '../../config/index.js';

describe('rate-limit env aliases', () => {
  it('maps RATE_LIMIT_MAX/WINDOW onto config.rateLimit.global when canonical unset', () => {
    const rateLimit = resolveRateLimitConfig({
      RATE_LIMIT_MAX: '7',
      RATE_LIMIT_WINDOW: '60000',
    });

    expect(rateLimit.global.max).toBe(7);
    expect(rateLimit.global.timeWindow).toBe('60000');
  });

  it('does not override canonical RATE_LIMIT_GLOBAL_* when set', () => {
    const rateLimit = resolveRateLimitConfig({
      RATE_LIMIT_GLOBAL_MAX: '100',
      RATE_LIMIT_GLOBAL_TIME_WINDOW: '15 minutes',
      RATE_LIMIT_MAX: '7',
      RATE_LIMIT_WINDOW: '60000',
    });

    expect(rateLimit.global.max).toBe(100);
    expect(rateLimit.global.timeWindow).toBe('15 minutes');
  });

  it('leaves generate/refine limits on their dedicated vars', () => {
    const rateLimit = resolveRateLimitConfig({
      RATE_LIMIT_MAX: '7',
      RATE_LIMIT_WINDOW: '60000',
      RATE_LIMIT_GENERATE_MAX: '9',
      RATE_LIMIT_REFINE_MAX: '11',
    });

    expect(rateLimit.global.max).toBe(7);
    expect(rateLimit.generate.max).toBe(9);
    expect(rateLimit.refine.max).toBe(11);
  });

  it('reports undocumented RATE_LIMIT_* keys', () => {
    const unknown = applyRateLimitEnvAliases({
      RATE_LIMIT_BOGUS: '1',
      RATE_LIMIT_MAX: '5',
    });

    expect(unknown).toContain('RATE_LIMIT_BOGUS');
    expect(unknown).not.toContain('RATE_LIMIT_MAX');
  });
});
