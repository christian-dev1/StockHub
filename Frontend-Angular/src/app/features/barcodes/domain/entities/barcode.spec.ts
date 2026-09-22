import { LabelRequest, labelRequestProblem, labelsPerPage } from './barcode';

const request = (overrides: Partial<LabelRequest>): LabelRequest => ({
  items: [{ productId: 'p', copies: 2 }],
  layout: 'A4_3X8',
  showPrice: true,
  startPosition: 0,
  ...overrides,
});

describe('label rules', () => {
  it('counts labels per sheet', () => {
    expect(labelsPerPage('A4_3X8')).toBe(24);
    expect(labelsPerPage('A4_4X10')).toBe(40);
  });

  it('applies the backend limits', () => {
    expect(labelRequestProblem(request({}))).toBeNull();
    expect(labelRequestProblem(request({ items: [] }))).toBe('empty');
    expect(labelRequestProblem(request({ items: [{ productId: 'p', copies: 0 }] }))).toBe('empty');
    expect(labelRequestProblem(request({ items: [{ productId: 'p', copies: 501 }] }))).toBe(
      'copies',
    );
    expect(
      labelRequestProblem(
        request({ items: [1, 2, 3].map((i) => ({ productId: `p${i}`, copies: 400 })) }),
      ),
    ).toBe('tooMany');
    expect(labelRequestProblem(request({ startPosition: 24 }))).toBe('start');
  });
});
