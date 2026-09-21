package com.stockhub.supplier.application.usecase;

import com.stockhub.shared.security.CurrentUserProvider;
import com.stockhub.supplier.domain.exception.SupplierErrors;
import com.stockhub.supplier.domain.model.Supplier;
import com.stockhub.supplier.domain.repository.SupplierRepository;
import java.util.UUID;
import org.springframework.dao.OptimisticLockingFailureException;
import org.springframework.stereotype.Component;

@Component
class SupplierAccess {

    private final SupplierRepository suppliers;
    private final CurrentUserProvider currentUser;

    SupplierAccess(SupplierRepository suppliers, CurrentUserProvider currentUser) {
        this.suppliers = suppliers;
        this.currentUser = currentUser;
    }

    UUID companyId() {
        return currentUser.require().requireCompanyId();
    }

    Supplier load(UUID supplierId) {
        return suppliers.findById(companyId(), supplierId).orElseThrow(() -> SupplierErrors.notFound(supplierId));
    }

    Supplier load(UUID supplierId, long expectedVersion) {
        Supplier supplier = load(supplierId);
        if (supplier.version() != expectedVersion) {
            throw new OptimisticLockingFailureException("Supplier " + supplierId + " was modified concurrently");
        }
        return supplier;
    }

    void requireUniqueCode(String code, UUID excludedId) {
        if (code != null && !code.isBlank() && suppliers.existsByCode(companyId(), code.strip(), excludedId)) {
            throw SupplierErrors.codeAlreadyUsed();
        }
    }
}
