package com.stockhub.product.application.usecase;

import com.stockhub.product.domain.exception.ProductErrors;
import com.stockhub.product.domain.model.Category;
import com.stockhub.product.domain.repository.CategoryRepository;
import com.stockhub.shared.domain.exception.InvalidInputException;
import com.stockhub.shared.security.CurrentUserProvider;
import java.util.UUID;
import org.springframework.dao.OptimisticLockingFailureException;
import org.springframework.stereotype.Component;

@Component
class CategoryAccess {

    private final CategoryRepository categories;
    private final CurrentUserProvider currentUser;

    CategoryAccess(CategoryRepository categories, CurrentUserProvider currentUser) {
        this.categories = categories;
        this.currentUser = currentUser;
    }

    UUID companyId() {
        return currentUser.require().requireCompanyId();
    }

    Category load(UUID categoryId) {
        return categories.findById(companyId(), categoryId).orElseThrow(() -> ProductErrors.categoryNotFound(categoryId));
    }

    Category load(UUID categoryId, long expectedVersion) {
        Category category = load(categoryId);
        if (category.version() != expectedVersion) {
            throw new OptimisticLockingFailureException("Category " + categoryId + " was modified concurrently");
        }
        return category;
    }

    /** Resolves the requested parent; an unknown parent is a validation error, not a 404 of the category. */
    Category parent(UUID parentId) {
        if (parentId == null) {
            return null;
        }
        return categories.findById(companyId(), parentId).orElseThrow(() ->
                new InvalidInputException("parentId", "CATEGORY_PARENT_UNKNOWN",
                        "The parent category does not exist."));
    }

    void requireUniqueName(String name, UUID excludedId) {
        if (name != null && categories.existsByName(companyId(), name.strip(), excludedId)) {
            throw ProductErrors.categoryNameAlreadyUsed();
        }
    }
}
