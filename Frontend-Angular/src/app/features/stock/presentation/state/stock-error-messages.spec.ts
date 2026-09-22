import { TestBed } from '@angular/core/testing';
import { TranslateService, provideTranslateService } from '@ngx-translate/core';
import { AppError } from '../../../../core/errors/app-error';
import { ErrorMessages } from '../../../../shared/utils/error-message';

const error = (code: string, message = 'Backend message'): AppError => ({
  kind: 'business',
  status: 422,
  code,
  message,
  fieldErrors: [],
});

/** Stock refusals reach the user in their language, never as a raw code. */
describe('stock error messages', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [provideTranslateService()] });
    const translate = TestBed.inject(TranslateService);
    translate.setTranslation('fr', {
      errors: {
        api: {
          INSUFFICIENT_STOCK: 'Stock insuffisant pour cette opération.',
          INVALID_TRANSFER: 'La source et la destination doivent être différentes.',
          BATCH_EXPIRED: 'Ce lot est expiré.',
          STOCK_CONFLICT: 'Le stock a été modifié simultanément.',
        },
        kind: { business: 'Opération impossible.' },
      },
    });
    translate.use('fr');
  });

  it.each([
    ['INSUFFICIENT_STOCK', 'Stock insuffisant pour cette opération.'],
    ['INVALID_TRANSFER', 'La source et la destination doivent être différentes.'],
    ['BATCH_EXPIRED', 'Ce lot est expiré.'],
    ['STOCK_CONFLICT', 'Le stock a été modifié simultanément.'],
  ])('translates %s', (code, expected) => {
    expect(TestBed.inject(ErrorMessages).of(error(code))).toBe(expected);
  });

  it('falls back to the localized backend message for an unknown business code', () => {
    expect(TestBed.inject(ErrorMessages).of(error('NEW_RULE', 'Règle non respectée'))).toBe(
      'Règle non respectée',
    );
  });
});
