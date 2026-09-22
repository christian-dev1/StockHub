export type ImportAction = 'CREATE' | 'UPDATE' | 'ERROR';

export interface ImportIssue {
  /** Canonical column (sku, name, salePrice…), or null for a whole-row problem. */
  readonly column: string | null;
  readonly code: string;
  readonly message: string;
}

export interface ImportRow {
  readonly rowNumber: number;
  readonly action: ImportAction;
  readonly sku: string | null;
  readonly name: string | null;
  readonly issues: readonly ImportIssue[];
}

/** Result of the preview step: nothing has been written yet. */
export interface ImportPreview {
  readonly jobId: string;
  readonly fileName: string;
  readonly totalRows: number;
  readonly createCount: number;
  readonly updateCount: number;
  readonly errorCount: number;
  readonly categoriesToCreate: readonly string[];
  readonly rows: readonly ImportRow[];
  readonly expiresAt: Date;
}

export interface ImportResult {
  readonly created: number;
  readonly updated: number;
  readonly categoriesCreated: number;
}

/** The commit is all-or-nothing: it is only offered for a clean, unexpired, non-empty preview. */
export function canCommit(preview: ImportPreview, now: Date = new Date()): boolean {
  return (
    preview.errorCount === 0 &&
    preview.createCount + preview.updateCount > 0 &&
    preview.expiresAt.getTime() > now.getTime()
  );
}
