import { ChangeDetectionStrategy, Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { FormControl } from '@angular/forms';
import { TranslateService, provideTranslateService } from '@ngx-translate/core';
import { applyServerErrors } from '../../utils/server-errors';
import { FormField } from './form-field';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [FormField],
  template: `<app-form-field label="Role" forId="user-role"
    ><span id="user-role"></span
  ></app-form-field>`,
})
class Host {}

describe('FormField', () => {
  beforeEach(() =>
    TestBed.configureTestingModule({ imports: [Host], providers: [provideTranslateService()] }),
  );

  it('exposes a label id that comboboxes can reference with aria-labelledby', async () => {
    const fixture = TestBed.createComponent(Host);
    await fixture.whenStable();
    const label = (fixture.nativeElement as HTMLElement).querySelector('label');
    expect(label?.id).toBe('user-role-label');
    expect(label?.getAttribute('for')).toBe('user-role');
  });

  it('may shrink inside grids so that wide controls cannot overflow', async () => {
    const fixture = TestBed.createComponent(Host);
    await fixture.whenStable();
    const host = (fixture.nativeElement as HTMLElement).querySelector('app-form-field');
    expect(host?.classList).toContain('min-w-0');
  });

  it('translates a backend field error by its code, falling back to its message', async () => {
    const control = new FormControl('');
    @Component({
      changeDetection: ChangeDetectionStrategy.OnPush,
      imports: [FormField],
      template: `<app-form-field label="SKU" forId="sku" [control]="control"
        ><input id="sku"
      /></app-form-field>`,
    })
    class ErrorHost {
      control = control;
    }
    TestBed.inject(TranslateService).setTranslation('fr', {
      errors: { api: { PRODUCT_SKU_ALREADY_EXISTS: 'Un produit utilise déjà ce SKU.' } },
    });
    TestBed.inject(TranslateService).use('fr');
    const fixture = TestBed.createComponent(ErrorHost);
    const form = new (await import('@angular/forms')).FormGroup({ sku: control });
    const error = (code: string, message: string) => ({
      kind: 'conflict' as const,
      status: 409,
      code,
      message: '',
      fieldErrors: [{ field: 'sku', code, message }],
    });

    applyServerErrors(
      form,
      error('PRODUCT_SKU_ALREADY_EXISTS', 'A product with this SKU already exists.'),
    );
    await fixture.whenStable();
    const text = () =>
      (fixture.nativeElement as HTMLElement).querySelector('[role="alert"]')?.textContent?.trim();
    expect(text()).toBe('Un produit utilise déjà ce SKU.');

    control.setErrors(null);
    applyServerErrors(form, error('UNKNOWN_CODE', 'Backend message'));
    await fixture.whenStable();
    expect(text()).toBe('Backend message');
  });
});
