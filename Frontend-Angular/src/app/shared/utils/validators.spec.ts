import { FormControl } from '@angular/forms';
import { passwordStrength } from './validators';

describe('passwordStrength', () => {
  const check = (value: string) => passwordStrength(new FormControl(value));

  it('accepts letters + digits with 10+ characters', () => {
    expect(check('Correct7Horse')).toBeNull();
  });

  it('rejects short, letters-only or digits-only passwords', () => {
    expect(check('short1')).toEqual({ passwordLength: { min: 10, max: 128 } });
    expect(check('onlyletterspassword')).toEqual({ passwordWeak: true });
    expect(check('12345678901')).toEqual({ passwordWeak: true });
  });

  it('leaves empty values to the required validator', () => {
    expect(check('')).toBeNull();
  });
});
