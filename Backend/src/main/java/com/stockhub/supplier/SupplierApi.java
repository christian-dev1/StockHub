package com.stockhub.supplier;

import java.util.Collection;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;

/** Public API of the suppliers module. Every lookup is scoped by company. */
public interface SupplierApi {

    Optional<SupplierSummary> find(UUID companyId, UUID supplierId);

    Optional<SupplierSummary> findByCode(UUID companyId, String code);

    Map<UUID, SupplierSummary> findByIds(UUID companyId, Collection<UUID> supplierIds);
}
