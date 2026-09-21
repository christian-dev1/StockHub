import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideTranslateService } from '@ngx-translate/core';
import { AppError } from '../../../core/errors/app-error';
import { CellTemplate, DataTable, SortState, TableColumn } from './data-table';

interface Row {
  id: string;
  name: string;
}

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [DataTable, CellTemplate],
  template: `
    <app-data-table
      caption="Things"
      [columns]="columns"
      [rows]="rows()"
      [rowKey]="key"
      [loading]="loading()"
      [error]="error()"
      [total]="rows().length"
      [sort]="sort"
      emptyTitle="Nothing here"
      (sortChange)="onSort($event)"
    >
      <ng-template appCell="name" let-row
        ><strong class="name">{{ row.name }}</strong></ng-template
      >
    </app-data-table>
  `,
})
class Host {
  columns: TableColumn[] = [{ key: 'name', header: 'Name', sortable: true, primary: true }];
  rows = signal<Row[]>([]);
  loading = signal(false);
  error = signal<AppError | null>(null);
  sort: SortState = { field: 'name', direction: 'asc' };
  sorted: SortState | null = null;
  onSort(sort: SortState): void {
    this.sorted = sort;
  }
  key = (r: Row) => r.id;
}

describe('DataTable', () => {
  beforeEach(() =>
    TestBed.configureTestingModule({ imports: [Host], providers: [provideTranslateService()] }),
  );

  it('shows the empty state when there are no rows', async () => {
    const fixture = TestBed.createComponent(Host);
    await fixture.whenStable();
    expect((fixture.nativeElement as HTMLElement).textContent).toContain('Nothing here');
  });

  it('renders rows with custom cell templates and aria-sort', async () => {
    const fixture = TestBed.createComponent(Host);
    fixture.componentInstance.rows.set([{ id: '1', name: 'Alpha' }]);
    await fixture.whenStable();
    const el = fixture.nativeElement as HTMLElement;
    expect(el.querySelector('table .name')?.textContent).toBe('Alpha');
    expect(el.querySelector('th')?.getAttribute('aria-sort')).toBe('ascending');
  });

  it('toggles sort direction when a sortable header is clicked', async () => {
    const fixture = TestBed.createComponent(Host);
    fixture.componentInstance.rows.set([{ id: '1', name: 'Alpha' }]);
    await fixture.whenStable();
    (fixture.nativeElement as HTMLElement).querySelector<HTMLButtonElement>('th button')?.click();
    expect(fixture.componentInstance.sorted).toEqual({ field: 'name', direction: 'desc' });
  });

  it('shows an error state with the request id', async () => {
    const fixture = TestBed.createComponent(Host);
    fixture.componentInstance.error.set({
      kind: 'server',
      status: 500,
      code: 'INTERNAL_ERROR',
      message: '',
      fieldErrors: [],
      requestId: 'req-42',
    });
    await fixture.whenStable();
    const alert = (fixture.nativeElement as HTMLElement).querySelector('[role="alert"]');
    expect(alert?.textContent).toContain('req-42');
  });
});
