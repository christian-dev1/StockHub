package com.stockhub.supplier.application.usecase;

import com.stockhub.audit.AuditEntry;
import com.stockhub.audit.AuditRecorder;
import com.stockhub.supplier.application.dto.SupplierView;
import com.stockhub.supplier.domain.model.Supplier;
import com.stockhub.supplier.domain.repository.SupplierRepository;
import java.util.UUID;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/** An inactive supplier keeps its history but can no longer be chosen for new products or orders. */
@Service
public class ChangeSupplierStatusUseCase {

    private final SupplierRepository suppliers;
    private final SupplierAccess access;
    private final AuditRecorder audit;

    ChangeSupplierStatusUseCase(SupplierRepository suppliers, SupplierAccess access, AuditRecorder audit) {
        this.suppliers = suppliers;
        this.access = access;
        this.audit = audit;
    }

    @Transactional
    public SupplierView deactivate(UUID supplierId) {
        Supplier supplier = access.load(supplierId);
        supplier.deactivate();
        return persist(supplier, "SUPPLIER_DISABLED");
    }

    @Transactional
    public SupplierView activate(UUID supplierId) {
        Supplier supplier = access.load(supplierId);
        supplier.activate();
        return persist(supplier, "SUPPLIER_ENABLED");
    }

    private SupplierView persist(Supplier supplier, String action) {
        suppliers.save(supplier);
        audit.record(AuditEntry.of(action, "Supplier", supplier.id()));
        return SupplierView.from(supplier);
    }
}
