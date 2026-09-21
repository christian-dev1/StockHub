import { DestroyRef } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { Subject, of, throwError } from 'rxjs';
import { AppError } from '../../core/errors/app-error';
import { Page, PageRequest } from './page';
import { PagedList } from './paged-list';

const page = (content: string[], total = content.length): Page<string> => ({
  content,
  page: 0,
  size: 20,
  totalElements: total,
  totalPages: 1,
});

describe('PagedList', () => {
  const destroyRef = () => TestBed.inject(DestroyRef);

  it('loads, then resets to the first page when filters change', () => {
    const calls: [PageRequest, { q: string }][] = [];
    const list = new PagedList<string, { q: string }>(
      (r, f) => (calls.push([r, f]), of(page(['a', 'b'], 42))),
      { q: '' },
      destroyRef(),
    );

    list.changePage({ page: 2, size: 50 });
    list.applyFilters({ q: 'x' });

    expect(calls[1]).toEqual([{ page: 0, size: 50, sort: null }, { q: 'x' }]);
    expect(list.rows()).toEqual(['a', 'b']);
    expect(list.total()).toBe(42);
  });

  it('ignores stale responses (switchMap)', () => {
    const first = new Subject<Page<string>>();
    const second = new Subject<Page<string>>();
    const responses = [first, second];
    const list = new PagedList<string, object>(() => responses.shift()!, {}, destroyRef());

    list.load();
    list.load();
    second.next(page(['new']));
    first.next(page(['old']));

    expect(list.rows()).toEqual(['new']);
  });

  it('exposes errors and keeps loading false', () => {
    const error: AppError = {
      kind: 'server',
      status: 500,
      code: 'INTERNAL_ERROR',
      message: '',
      fieldErrors: [],
    };
    const list = new PagedList<string, object>(() => throwError(() => error), {}, destroyRef());
    list.load();
    expect(list.error()).toEqual(error);
    expect(list.loading()).toBe(false);
  });

  it('sorting goes back to the first page', () => {
    const requests: PageRequest[] = [];
    const list = new PagedList<string, object>(
      (r) => (requests.push(r), of(page([]))),
      {},
      destroyRef(),
    );
    list.changePage({ page: 3, size: 20 });
    list.changeSort({ field: 'name', direction: 'desc' });
    expect(requests.at(-1)).toEqual({
      page: 0,
      size: 20,
      sort: { field: 'name', direction: 'desc' },
    });
  });
});
