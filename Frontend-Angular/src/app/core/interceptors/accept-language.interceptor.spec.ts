import { HttpClient, provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { API_ROUTES } from '../config/routes/api.routes';
import { LanguageStore } from '../i18n/language-store';
import { acceptLanguageInterceptor } from './accept-language.interceptor';

describe('acceptLanguageInterceptor', () => {
  let http: HttpClient;
  let backend: HttpTestingController;
  let injectedStore: boolean;

  beforeEach(() => {
    injectedStore = false;
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(withInterceptors([acceptLanguageInterceptor])),
        provideHttpClientTesting(),
        {
          provide: LanguageStore,
          useFactory: () => {
            injectedStore = true;
            return { language: () => 'en' };
          },
        },
      ],
    });
    http = TestBed.inject(HttpClient);
    backend = TestBed.inject(HttpTestingController);
  });

  it('adds the current language to API calls', () => {
    http.get(`${API_ROUTES.BASE}/company`).subscribe();
    expect(backend.expectOne(`${API_ROUTES.BASE}/company`).request.headers.get('Accept-Language')).toBe('en');
  });

  it('leaves translation files alone without touching the language store', () => {
    http.get('/i18n/fr.json').subscribe();
    expect(backend.expectOne('/i18n/fr.json').request.headers.has('Accept-Language')).toBe(false);
    expect(injectedStore).toBe(false);
  });
});
