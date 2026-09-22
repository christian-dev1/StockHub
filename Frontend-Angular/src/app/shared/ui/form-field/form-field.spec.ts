import { ChangeDetectionStrategy, Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideTranslateService } from '@ngx-translate/core';
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
});
