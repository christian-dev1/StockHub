package com.stockhub.product.domain.model;

import com.stockhub.shared.domain.Ids;
import com.stockhub.shared.domain.Texts;
import com.stockhub.shared.domain.exception.BusinessRuleViolationException;
import java.util.Objects;
import java.util.UUID;

/**
 * A product category. Categories form a two-level tree (category and
 * sub-category), which keeps navigation and filtering simple.
 */
public final class Category {

    private final UUID id;
    private final UUID companyId;
    private String name;
    private String description;
    private UUID parentId;
    private final long version;

    public Category(UUID id, UUID companyId, String name, String description, UUID parentId, long version) {
        this.id = Objects.requireNonNull(id);
        this.companyId = Objects.requireNonNull(companyId);
        this.name = Texts.required(name, "name", 100, "CATEGORY");
        this.description = Texts.optional(description, "description", 500);
        this.parentId = parentId;
        this.version = version;
    }

    public static Category create(UUID companyId, String name, String description) {
        return new Category(Ids.newId(), companyId, name, description, null, 0);
    }

    public void rename(String newName, String newDescription) {
        this.name = Texts.required(newName, "name", 100, "CATEGORY");
        this.description = Texts.optional(newDescription, "description", 500);
    }

    /**
     * @param parent      the new parent, or {@code null} to make this a root category
     * @param hasChildren whether this category already has sub-categories
     */
    public void moveUnder(Category parent, boolean hasChildren) {
        if (parent == null) {
            parentId = null;
            return;
        }
        if (parent.id.equals(id)) {
            throw new BusinessRuleViolationException("CATEGORY_PARENT_INVALID", "A category cannot be its own parent.");
        }
        if (!parent.isRoot() || hasChildren) {
            throw new BusinessRuleViolationException("CATEGORY_DEPTH_EXCEEDED",
                    "Categories are limited to two levels (category and sub-category).");
        }
        parentId = parent.id;
    }

    public boolean isRoot() {
        return parentId == null;
    }

    public UUID id() { return id; }
    public UUID companyId() { return companyId; }
    public String name() { return name; }
    public String description() { return description; }
    public UUID parentId() { return parentId; }
    public long version() { return version; }
}
