import { describe, expect, it } from 'vitest';
import { amplifyAxis } from '../src/config/index.js';

describe('amplifyAxis', () => {
  it('returns ~0 within horizontal dead zone', () => {
    expect(amplifyAxis(0.005, 'x')).toBeCloseTo(0, 5);
  });

  it('amplifies movement beyond the dead zone', () => {
    const amplified = amplifyAxis(0.12, 'x');
    expect(amplified).toBeGreaterThan(0.02);
  });

  it('clamps to maximum range', () => {
    const amplified = amplifyAxis(2, 'y');
    expect(amplified).toBeLessThanOrEqual(0.52);
  });
});
