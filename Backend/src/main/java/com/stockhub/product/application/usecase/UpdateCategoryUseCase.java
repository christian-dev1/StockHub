package com.stockhub.product.application.usecase;

import com.stockhub.audit.AuditEntry;
import com.stockhub.audit.AuditRecorder;
import com.stockhub.product.application.command.CategoryCommand;
import com.stockhub.product.application.dto.CategoryView;
import com.stockhub.product.domain.model.Category;
import com.stockhub.product.domain.repository.CategoryRepository;
import com.stockhub.product.domain.repository.ProductRepository;
import java.util.HashMap;
import java.util.Map;
import java.util.UUID;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class UpdateCategoryUseCase {

    private final CategoryRepository categories;
    private final ProductRepository products;
    private final CategoryAccess access;
    private final AuditRecorder audit;

    UpdateCategoryUseCase(CategoryRepository categories, ProductRepository products, CategoryAccess access,
                          AuditRecorder audit) {
        this.categories = categories;
        this.products = products;
        this.access = access;
        this.audit = audit;
    }

    @Transactional
    public CategoryView execute(UUID categoryId, CategoryCommand command, long version) {
        Category category = access.load(categoryId, version);
        access.requireUniqueName(command.name(), categoryId);
        Map<String, Object> before = snapshot(category);
        category.rename(command.name(), command.description());
        Category parent = access.parent(command.parentId());
        category.moveUnder(parent, categories.hasChildren(category.companyId(), categoryId));
        categories.save(category);
        audit.record(AuditEntry.of("CATEGORY_UPDATED", "Category", categoryId).change(before, snapshot(category)));
        return CategoryView.from(category, parent == null ? null : parent.name(),
                products.countByCategory(category.companyId(), categoryId));
    }

    private static Map<String, Object> snapshot(Category c) {
        Map<String, Object> snapshot = new HashMap<>();
        snapshot.put("name", c.name());
        snapshot.put("description", c.description());
        snapshot.put("parentId", c.parentId());
        return snapshot;
    }
}
