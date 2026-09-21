package com.stockhub.product.application.usecase;

import com.stockhub.audit.AuditEntry;
import com.stockhub.audit.AuditRecorder;
import com.stockhub.product.application.command.CategoryCommand;
import com.stockhub.product.application.dto.CategoryView;
import com.stockhub.product.domain.model.Category;
import com.stockhub.product.domain.repository.CategoryRepository;
import java.util.Map;
import java.util.UUID;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class CreateCategoryUseCase {

    private final CategoryRepository categories;
    private final CategoryAccess access;
    private final AuditRecorder audit;

    CreateCategoryUseCase(CategoryRepository categories, CategoryAccess access, AuditRecorder audit) {
        this.categories = categories;
        this.access = access;
        this.audit = audit;
    }

    @Transactional
    public CategoryView execute(CategoryCommand command) {
        Category category = create(access.companyId(), command);
        audit.record(AuditEntry.of("CATEGORY_CREATED", "Category", category.id())
                .change(null, Map.of("name", category.name())));
        Category parent = access.parent(category.parentId());
        return CategoryView.from(category, parent == null ? null : parent.name(), 0);
    }

    /** Also used by the product import to create missing categories. */
    Category create(UUID companyId, CategoryCommand command) {
        access.requireUniqueName(command.name(), null);
        Category category = Category.create(companyId, command.name(), command.description());
        category.moveUnder(access.parent(command.parentId()), false);
        categories.save(category);
        return category;
    }
}
