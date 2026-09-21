import { toQueryParams } from './page';

describe('toQueryParams', () => {
  it('serializes pagination, sort and non-empty filters only', () => {
    expect(
      toQueryParams(
        { page: 1, size: 20, sort: { field: 'name', direction: 'desc' } },
        { q: 'al', status: null, role: '' },
      ),
    ).toEqual({ page: '1', size: '20', sort: 'name,desc', q: 'al' });
  });
});
