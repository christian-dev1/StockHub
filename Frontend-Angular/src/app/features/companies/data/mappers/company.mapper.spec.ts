import { toProfilePayload } from './company.mapper';

describe('toProfilePayload', () => {
  it('trims values, nulls blanks and upper-cases the country', () => {
    expect(
      toProfilePayload({
        name: ' Alpha ',
        legalName: '',
        email: ' a@b.cm ',
        phone: null,
        addressLine: '  ',
        city: 'Douala',
        country: 'cm',
      }),
    ).toEqual({
      name: 'Alpha',
      legalName: null,
      email: 'a@b.cm',
      phone: null,
      addressLine: null,
      city: 'Douala',
      country: 'CM',
    });
  });
});
