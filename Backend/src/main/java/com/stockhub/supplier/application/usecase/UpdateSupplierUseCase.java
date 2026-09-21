package com.stockhub.supplier.application.usecase;

import com.stockhub.audit.AuditEntry;
import com.stockhub.audit.AuditRecorder;
import com.stockhub.supplier.application.command.SupplierCommand;
import com.stockhub.supplier.application.dto.SupplierView;
import com.stockhub.supplier.domain.model.Supplier;
import com.stockhub.supplier.domain.repository.SupplierRepository;
import java.util.UUID;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class UpdateSupplierUseCase {

    private final SupplierRepository suppliers;
    private final SupplierAccess access;
    private final AuditRecorder audit;

    UpdateSupplierUseCase(SupplierRepository suppliers, SupplierAccess access, AuditRecorder audit) {
        this.suppliers = suppliers;
        this.access = access;
        this.audit = audit;
    }

    @Transactional
    public SupplierView execute(UUID supplierId, SupplierCommand command, long version) {
        Supplier supplier = access.load(supplierId, version);
        access.requireUniqueCode(command.code(), supplierId);
        var before = SupplierView.from(supplier).auditSnapshot();
        supplier.update(command.code(), command.name(), command.contact(),
                command.taxId(), command.leadTimeDays(), command.notes());
        suppliers.save(supplier);
        SupplierView view = SupplierView.from(supplier);
        audit.record(AuditEntry.of("SUPPLIER_UPDATED", "Supplier", supplierId).change(before, view.auditSnapshot()));
        return view;
    }
}
