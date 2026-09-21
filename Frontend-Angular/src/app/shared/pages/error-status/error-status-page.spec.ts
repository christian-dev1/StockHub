import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { provideTranslateService } from '@ngx-translate/core';
import { ErrorStatusPage } from './error-status-page';

describe('ErrorStatusPage', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [ErrorStatusPage],
      providers: [provideRouter([]), provideTranslateService()],
    });
  });

  it('renders the requested status with an accessible heading', async () => {
    const fixture = TestBed.createComponent(ErrorStatusPage);
    fixture.componentRef.setInput('status', 403);
    await fixture.whenStable();

    const element = fixture.nativeElement as HTMLElement;
    expect(element.textContent).toContain('403');
    expect(element.querySelector('h1')?.textContent).toContain('errors.page.403.title');
    expect(element.querySelector('section')?.getAttribute('aria-labelledby')).toBe('error-title');
  });
});
