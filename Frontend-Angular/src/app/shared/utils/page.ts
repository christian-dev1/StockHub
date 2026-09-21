/** Server page as returned by every paginated endpoint. */
export interface Page<T> {
  readonly content: readonly T[];
  readonly page: number;
  readonly size: number;
  readonly totalElements: number;
  readonly totalPages: number;
}

export interface PageRequest {
  readonly page: number;
  readonly size: number;
  readonly sort?: { readonly field: string; readonly direction: 'asc' | 'desc' } | null;
}

export function mapPage<A, B>(page: Page<A>, mapper: (item: A) => B): Page<B> {
  return { ...page, content: page.content.map(mapper) };
}

/** Builds HttpParams-compatible query values, skipping empty filters. */
export function toQueryParams(
  request: PageRequest,
  filters: Record<string, string | number | boolean | null | undefined> = {},
): Record<string, string> {
  const params: Record<string, string> = { page: String(request.page), size: String(request.size) };
  if (request.sort) {
    params['sort'] = `${request.sort.field},${request.sort.direction}`;
  }
  for (const [key, value] of Object.entries(filters)) {
    if (value !== null && value !== undefined && value !== '') {
      params[key] = String(value);
    }
  }
  return params;
}
