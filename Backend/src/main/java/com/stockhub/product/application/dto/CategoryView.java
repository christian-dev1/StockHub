package com.stockhub.product.application.dto;

import com.stockhub.product.domain.model.Category;
import java.util.UUID;

public record CategoryView(UUID id, String name, String description, UUID parentId, String parentName,
                           long productCount, long version) {

    public static CategoryView from(Category c, String parentName, long productCount) {
        return new CategoryView(c.id(), c.name(), c.description(), c.parentId(), parentName, productCount, c.version());
    }
}
