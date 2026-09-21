package com.stockhub.supplier.application.usecase;

import com.stockhub.shared.domain.page.PageResult;
import com.stockhub.supplier.SupplierApi;
import com.stockhub.supplier.SupplierSummary;
import com.stockhub.supplier.application.dto.SupplierView;
import com.stockhub.supplier.application.query.SupplierSearchQuery;
import com.stockhub.supplier.domain.model.Supplier;
import com.stockhub.supplier.domain.repository.SupplierRepository;
import java.util.Collection;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;
import java.util.function.Function;
import java.util.stream.Collectors;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@Transactional(readOnly = true)
public class SupplierQueries implements SupplierApi {

    private final SupplierRepository suppliers;
    private final SupplierAccess access;

    SupplierQueries(SupplierRepository suppliers, SupplierAccess access) {
        this.suppliers = suppliers;
        this.access = access;
    }

    public PageResult<SupplierView> search(SupplierSearchQuery query) {
        return suppliers.search(access.companyId(), query.text(), query.active(), query.page()).map(SupplierView::from);
    }

    public SupplierView get(UUID supplierId) {
        return SupplierView.from(access.load(supplierId));
    }

    @Override
    public Optional<SupplierSummary> find(UUID companyId, UUID supplierId) {
        return suppliers.findById(companyId, supplierId).map(SupplierQueries::toSummary);
    }

    @Override
    public Optional<SupplierSummary> findByCode(UUID companyId, String code) {
        return suppliers.findByCode(companyId, code).map(SupplierQueries::toSummary);
    }

    @Override
    public Map<UUID, SupplierSummary> findByIds(UUID companyId, Collection<UUID> supplierIds) {
        if (supplierIds.isEmpty()) {
            return Map.of();
        }
        return suppliers.findByIds(companyId, supplierIds).stream()
                .map(SupplierQueries::toSummary)
                .collect(Collectors.toUnmodifiableMap(SupplierSummary::id, Function.identity()));
    }

    private static SupplierSummary toSummary(Supplier s) {
        return new SupplierSummary(s.id(), s.code(), s.name(), s.isActive(), s.leadTimeDays());
    }
}
