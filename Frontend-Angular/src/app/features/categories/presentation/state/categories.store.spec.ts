import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import {
  DeleteCategoryUseCase,
  ListCategoriesUseCase,
  SaveCategoryUseCase,
} from '../../domain/use-cases/category.use-cases';
import { CategoriesStore } from './categories.store';

describe('CategoriesStore', () => {
  it('reloads the tree after every change', () => {
    const list = vi.fn().mockReturnValue(of([]));
    const save = { create: vi.fn().mockReturnValue(of({ id: 'c' })), update: vi.fn() };
    const remove = vi.fn().mockReturnValue(of(undefined));
    TestBed.configureTestingModule({
      providers: [
        CategoriesStore,
        { provide: ListCategoriesUseCase, useValue: { execute: list } },
        { provide: SaveCategoryUseCase, useValue: save },
        { provide: DeleteCategoryUseCase, useValue: { execute: remove } },
      ],
    });
    const store = TestBed.inject(CategoriesStore);
    store.load();
    store.save({ name: 'A', description: null, parentId: null }, null).subscribe();
    store.delete({ id: 'c' } as never).subscribe();
    expect(save.create).toHaveBeenCalled();
    expect(list).toHaveBeenCalledTimes(3);
  });
});
