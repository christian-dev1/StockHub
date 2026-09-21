package com.stockhub.supplier.domain.repository;

import com.stockhub.shared.domain.page.PageQuery;
import com.stockhub.shared.domain.page.PageResult;
import com.stockhub.supplier.domain.model.Supplier;
import java.util.Collection;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface SupplierRepository {

    void save(Supplier supplier);

    Optional<Supplier> findById(UUID companyId, UUID id);

    Optional<Supplier> findByCode(UUID companyId, String code);

    List<Supplier> findByIds(UUID companyId, Collection<UUID> ids);

    boolean existsByCode(UUID companyId, String code, UUID excludedId);

    PageResult<Supplier> search(UUID companyId, String text, Boolean active, PageQuery page);
}
