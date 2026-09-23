/** Backend PageResponse. */
export interface Page<T> {
  readonly content: readonly T[];
  readonly page: number;
  readonly size: number;
  readonly totalElements: number;
  readonly totalPages: number;
}

export function mapPage<S, T>(page: Page<S>, mapper: (item: S) => T): Page<T> {
  return { ...page, content: page.content.map(mapper) };
}

/** Builds a query string, skipping empty values. */
export function withQuery(
  url: string,
  params: Record<string, string | number | boolean | null | undefined>,
): string {
  const query = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== null && value !== '') query.set(key, String(value));
  }
  const text = query.toString();
  return text ? `${url}?${text}` : url;
}
