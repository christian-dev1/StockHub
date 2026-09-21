package com.stockhub.product.presentation.response;

import com.stockhub.product.application.dto.CategoryView;
import java.util.UUID;

public record CategoryResponse(UUID id, String name, String description, UUID parentId, String parentName,
                               long productCount, long version) {

    public static CategoryResponse from(CategoryView v) {
        return new CategoryResponse(v.id(), v.name(), v.description(), v.parentId(), v.parentName(), v.productCount(),
                v.version());
    }
}
