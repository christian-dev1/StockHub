import { FormControl, FormGroup } from '@angular/forms';
import { applyServerErrors } from './server-errors';

describe('applyServerErrors', () => {
  it('attaches field errors to nested controls', () => {
    const form = new FormGroup({
      profile: new FormGroup({ name: new FormControl('') }),
      other: new FormControl(''),
    });
    const applied = applyServerErrors(form, {
      kind: 'conflict',
      status: 409,
      code: 'X',
      message: '',
      fieldErrors: [{ field: 'profile.name', code: 'X', message: 'Taken' }],
    });
    expect(applied).toBe(true);
    expect(form.get('profile.name')?.errors).toEqual({ server: 'Taken' });
    expect(form.get('profile.name')?.touched).toBe(true);
  });

  it('returns false when no field matches', () => {
    const form = new FormGroup({ a: new FormControl('') });
    expect(
      applyServerErrors(form, {
        kind: 'business',
        status: 422,
        code: 'X',
        message: '',
        fieldErrors: [],
      }),
    ).toBe(false);
  });
});
