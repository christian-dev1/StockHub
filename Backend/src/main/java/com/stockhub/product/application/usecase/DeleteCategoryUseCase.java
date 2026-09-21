package com.stockhub.product.application.usecase;

import com.stockhub.audit.AuditEntry;
import com.stockhub.audit.AuditRecorder;
import com.stockhub.product.domain.exception.ProductErrors;
import com.stockhub.product.domain.model.Category;
import com.stockhub.product.domain.repository.CategoryRepository;
import com.stockhub.product.domain.repository.ProductRepository;
import java.util.Map;
import java.util.UUID;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/** Soft-deletes an empty category (no products, no sub-categories). */
@Service
public class DeleteCategoryUseCase {

    private final CategoryRepository categories;
    private final ProductRepository products;
    private final CategoryAccess access;
    private final AuditRecorder audit;

    DeleteCategoryUseCase(CategoryRepository categories, ProductRepository products, CategoryAccess access,
                          AuditRecorder audit) {
        this.categories = categories;
        this.products = products;
        this.access = access;
        this.audit = audit;
    }

    @Transactional
    public void execute(UUID categoryId) {
        Category category = access.load(categoryId);
        UUID companyId = category.companyId();
        if (products.countByCategory(companyId, categoryId) > 0 || categories.hasChildren(companyId, categoryId)) {
            throw ProductErrors.categoryInUse();
        }
        categories.delete(category);
        audit.record(AuditEntry.of("CATEGORY_DELETED", "Category", categoryId)
                .change(Map.of("name", category.name()), null));
    }
}
