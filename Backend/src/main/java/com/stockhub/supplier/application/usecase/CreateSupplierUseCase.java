package com.stockhub.supplier.application.usecase;

import com.stockhub.audit.AuditEntry;
import com.stockhub.audit.AuditRecorder;
import com.stockhub.shared.application.SequenceGenerator;
import com.stockhub.supplier.application.command.SupplierCommand;
import com.stockhub.supplier.application.dto.SupplierView;
import com.stockhub.supplier.domain.model.Supplier;
import com.stockhub.supplier.domain.repository.SupplierRepository;
import java.util.UUID;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class CreateSupplierUseCase {

    private final SupplierRepository suppliers;
    private final SupplierAccess access;
    private final SequenceGenerator sequences;
    private final AuditRecorder audit;

    CreateSupplierUseCase(SupplierRepository suppliers, SupplierAccess access, SequenceGenerator sequences,
                          AuditRecorder audit) {
        this.suppliers = suppliers;
        this.access = access;
        this.sequences = sequences;
        this.audit = audit;
    }

    @Transactional
    public SupplierView execute(SupplierCommand command) {
        UUID companyId = access.companyId();
        String code = command.code() == null || command.code().isBlank() ? nextFreeCode(companyId) : command.code();
        access.requireUniqueCode(code, null);
        Supplier supplier = Supplier.create(companyId, code, command.name(), command.contact(),
                command.taxId(), command.leadTimeDays(), command.notes());
        suppliers.save(supplier);
        SupplierView view = SupplierView.from(supplier);
        audit.record(AuditEntry.of("SUPPLIER_CREATED", "Supplier", supplier.id()).change(null, view.auditSnapshot()));
        return view;
    }

    /** Skips generated codes that a user already chose manually. */
    private String nextFreeCode(UUID companyId) {
        String code;
        do {
            code = "SUP-%04d".formatted(sequences.next(companyId, "SUPPLIER"));
        } while (suppliers.existsByCode(companyId, code, null));
        return code;
    }
}
