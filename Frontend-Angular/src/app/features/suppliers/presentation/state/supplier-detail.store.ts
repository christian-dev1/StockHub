import { DestroyRef, Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ResourceState } from '../../../../shared/utils/resource-state';
import { Supplier, SupplierDraft } from '../../domain/entities/supplier';
import {
  ChangeSupplierStatusUseCase,
  GetSupplierUseCase,
  SaveSupplierUseCase,
} from '../../domain/use-cases/supplier.use-cases';

@Injectable()
export class SupplierDetailStore {
  private readonly getSupplier = inject(GetSupplierUseCase);
  private readonly saveSupplier = inject(SaveSupplierUseCase);
  private readonly status = inject(ChangeSupplierStatusUseCase);

  readonly resource = new ResourceState<Supplier>(inject(DestroyRef));
  readonly supplier = this.resource.data;

  load(id: string): void {
    this.resource.load(this.getSupplier.execute(id));
  }

  save(draft: SupplierDraft): Observable<Supplier> {
    const supplier = this.resource.require();
    return this.resource.keep(this.saveSupplier.update(supplier.id, draft, supplier.version));
  }

  toggleStatus(): Observable<Supplier> {
    const supplier = this.resource.require();
    return this.resource.keep(
      supplier.active ? this.status.deactivate(supplier.id) : this.status.activate(supplier.id),
    );
  }
}
