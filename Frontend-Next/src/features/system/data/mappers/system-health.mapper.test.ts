import { describe, expect, it } from 'vitest';
import { toSystemHealth } from './system-health.mapper';

describe('toSystemHealth', () => {
  const now = new Date('2026-09-21T10:00:00Z');

  it('maps known statuses', () => {
    expect(toSystemHealth({ status: 'UP' }, now)).toEqual({ status: 'UP', checkedAt: now });
    expect(toSystemHealth({ status: 'DOWN' }, now).status).toBe('DOWN');
  });

  it('maps anything else to UNKNOWN', () => {
    expect(toSystemHealth({ status: 'OUT_OF_SERVICE' }, now).status).toBe('UNKNOWN');
    expect(toSystemHealth(undefined, now).status).toBe('UNKNOWN');
  });
});
