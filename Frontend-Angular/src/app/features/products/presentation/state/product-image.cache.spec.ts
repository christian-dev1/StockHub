import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { ProductImageUseCase } from '../../domain/use-cases/product.use-cases';
import { ProductImageCache } from './product-image.cache';

describe('ProductImageCache', () => {
  let get: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    get = vi.fn().mockReturnValue(of(new Blob(['x'])));
    vi.spyOn(URL, 'createObjectURL').mockReturnValue('blob:1');
    vi.spyOn(URL, 'revokeObjectURL').mockImplementation(() => undefined);
    TestBed.configureTestingModule({
      providers: [ProductImageCache, { provide: ProductImageUseCase, useValue: { get } }],
    });
  });

  afterEach(() => vi.restoreAllMocks());

  it('loads a picture once, and not at all for products without one', () => {
    const cache = TestBed.inject(ProductImageCache);
    cache.ensure('p1', true);
    cache.ensure('p1', true);
    cache.ensure('p2', false);
    expect(get).toHaveBeenCalledTimes(1);
    expect(cache.image('p1')()).toEqual({ status: 'ready', url: 'blob:1' });
    expect(cache.image('p2')().status).toBe('none');
  });

  it('fetches again after a replacement and frees removed pictures', () => {
    const cache = TestBed.inject(ProductImageCache);
    cache.ensure('p1', true);
    cache.refresh('p1');
    expect(get).toHaveBeenCalledTimes(2);
    cache.clear('p1');
    expect(URL.revokeObjectURL).toHaveBeenCalled();
    expect(cache.image('p1')().status).toBe('none');
  });
});
