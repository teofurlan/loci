import { TokenBucketLimiter } from './rate-limiter';

describe('TokenBucketLimiter', () => {
  const setup = (capacity = 3, windowMs = 600_000) => {
    let now = 1_000_000;
    const limiter = new TokenBucketLimiter({ capacity, windowMs, now: () => now });
    return { limiter, advance: (ms: number) => (now += ms) };
  };

  it('allows up to capacity requests in a burst, then blocks', () => {
    const { limiter } = setup(3);
    expect([1, 2, 3].map(() => limiter.take('a').allowed)).toEqual([true, true, true]);
    expect(limiter.take('a').allowed).toBe(false);
  });

  it('tracks keys independently', () => {
    const { limiter } = setup(1);
    expect(limiter.take('a').allowed).toBe(true);
    expect(limiter.take('b').allowed).toBe(true);
    expect(limiter.take('a').allowed).toBe(false);
  });

  it('reports seconds until the next token when blocked', () => {
    const { limiter, advance } = setup(2, 600_000); // one token per 300 s
    limiter.take('a');
    limiter.take('a');
    expect(limiter.take('a')).toEqual({ allowed: false, retryAfterSeconds: 300 });
    advance(100_000);
    expect(limiter.take('a')).toEqual({ allowed: false, retryAfterSeconds: 200 });
  });

  it('refills continuously and never beyond capacity', () => {
    const { limiter, advance } = setup(2, 600_000);
    limiter.take('a');
    limiter.take('a');
    advance(300_000);
    expect(limiter.take('a').allowed).toBe(true);
    expect(limiter.take('a').allowed).toBe(false);
    advance(10 * 600_000);
    expect([1, 2, 3].map(() => limiter.take('a').allowed)).toEqual([true, true, false]);
  });

  it('evicts idle keys so memory stays bounded', () => {
    let now = 0;
    const limiter = new TokenBucketLimiter({ capacity: 1, windowMs: 1000, now: () => now, maxKeys: 2 });
    limiter.take('a');
    limiter.take('b');
    now += 2000; // a and b are fully refilled, hence idle
    limiter.take('c');
    expect(limiter.size).toBeLessThanOrEqual(2);
  });
});
