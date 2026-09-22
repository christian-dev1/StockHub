import { imageFileProblem, importFileProblem } from './files';

describe('file checks before upload', () => {
  it('accepts small PNG, JPEG and WebP pictures only', () => {
    expect(imageFileProblem(new File(['x'], 'a.png', { type: 'image/png' }))).toBeNull();
    expect(imageFileProblem(new File(['x'], 'a.svg', { type: 'image/svg+xml' }))).toBe('type');
    expect(
      imageFileProblem(
        new File([new Uint8Array(2 * 1024 * 1024 + 1)], 'a.jpg', { type: 'image/jpeg' }),
      ),
    ).toBe('size');
  });

  it('accepts CSV and XLSX import files', () => {
    expect(importFileProblem(new File(['a'], 'p.CSV'))).toBeNull();
    expect(importFileProblem(new File(['a'], 'p.xlsx'))).toBeNull();
    expect(importFileProblem(new File(['a'], 'p.xls'))).toBe('type');
    expect(importFileProblem(new File([], 'p.csv'))).toBe('size');
  });
});
