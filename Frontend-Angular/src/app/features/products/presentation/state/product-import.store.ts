import { Injectable, computed, inject, signal } from '@angular/core';
import { Observable, tap } from 'rxjs';
import { AppError } from '../../../../core/errors/app-error';
import { importFileProblem } from '../../../../shared/utils/files';
import { toAppError } from '../../../../shared/utils/resource-state';
import { ImportPreview, ImportResult, canCommit } from '../../domain/entities/product-import';
import { ProductImportUseCase } from '../../domain/use-cases/product.use-cases';

export type ImportStep = 'file' | 'preview' | 'done';

/**
 * Bulk import workflow: choose a file, preview it (nothing written), review
 * the errors, then commit the whole file at once. The commit is never
 * offered for a preview with errors.
 */
@Injectable()
export class ProductImportStore {
  private readonly imports = inject(ProductImportUseCase);

  readonly step = signal<ImportStep>('file');
  readonly file = signal<File | null>(null);
  readonly fileProblem = signal<'type' | 'size' | null>(null);
  readonly createMissingCategories = signal(false);
  readonly preview = signal<ImportPreview | null>(null);
  readonly result = signal<ImportResult | null>(null);
  readonly busy = signal(false);
  readonly error = signal<AppError | null>(null);

  readonly committable = computed(() => {
    const preview = this.preview();
    return !!preview && canCommit(preview);
  });
  readonly validRows = computed(() => {
    const preview = this.preview();
    return preview ? preview.createCount + preview.updateCount : 0;
  });

  choose(file: File | null): void {
    this.error.set(null);
    const problem = file ? importFileProblem(file) : null;
    this.fileProblem.set(problem);
    this.file.set(problem ? null : file);
  }

  analyse(): Observable<ImportPreview> | null {
    const file = this.file();
    if (!file) return null;
    this.busy.set(true);
    this.error.set(null);
    return this.imports.preview(file, this.createMissingCategories()).pipe(
      tap({
        next: (preview) => {
          this.preview.set(preview);
          this.step.set('preview');
          this.busy.set(false);
        },
        error: (error: unknown) => {
          this.error.set(toAppError(error));
          this.busy.set(false);
        },
      }),
    );
  }

  commit(): Observable<ImportResult> | null {
    const preview = this.preview();
    if (!preview || !canCommit(preview)) return null;
    this.busy.set(true);
    this.error.set(null);
    return this.imports.commit(preview.jobId).pipe(
      tap({
        next: (result) => {
          this.result.set(result);
          this.step.set('done');
          this.busy.set(false);
        },
        error: (error: unknown) => {
          this.error.set(toAppError(error));
          this.busy.set(false);
        },
      }),
    );
  }

  template(): Observable<Blob> {
    return this.imports.template();
  }

  restart(): void {
    this.step.set('file');
    this.file.set(null);
    this.fileProblem.set(null);
    this.preview.set(null);
    this.result.set(null);
    this.error.set(null);
  }
}
