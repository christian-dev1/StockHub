import { describe, expect, it, vi } from 'vitest';

vi.mock('@/core/i18n/navigation', () => ({ useRouter: vi.fn() }));

const { safeReturnUrl } = await import('./login-view');
const { passwordProblem } = await import('./change-password-view');

describe('safeReturnUrl', () => {
  it('accepts in-app paths only', () => {
    expect(safeReturnUrl('/sales')).toBe('/sales');
    expect(safeReturnUrl('//evil.example')).toBe('/');
    expect(safeReturnUrl('https://evil.example')).toBe('/');
    expect(safeReturnUrl(null)).toBe('/');
  });
});

describe('passwordProblem', () => {
  it('mirrors the backend password policy', () => {
    expect(passwordProblem('short1')).toBe('length');
    expect(passwordProblem('onlyletterspassword')).toBe('weak');
    expect(passwordProblem('Correct7Horse')).toBeNull();
  });
});
