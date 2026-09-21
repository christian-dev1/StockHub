package com.stockhub.product.domain.repository;

import com.stockhub.product.domain.model.Category;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface CategoryRepository {

    void save(Category category);

    void delete(Category category);

    Optional<Category> findById(UUID companyId, UUID id);

    Optional<Category> findByName(UUID companyId, String name);

    boolean existsByName(UUID companyId, String name, UUID excludedId);

    boolean hasChildren(UUID companyId, UUID categoryId);

    List<Category> findAll(UUID companyId);

    List<Category> findByIds(UUID companyId, java.util.Collection<UUID> ids);
}
