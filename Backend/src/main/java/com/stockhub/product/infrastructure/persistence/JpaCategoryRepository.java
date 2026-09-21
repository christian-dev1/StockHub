package com.stockhub.product.infrastructure.persistence;

import com.stockhub.product.domain.model.Category;
import com.stockhub.product.domain.repository.CategoryRepository;
import java.time.Instant;
import java.util.Collection;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.springframework.orm.ObjectOptimisticLockingFailureException;
import org.springframework.stereotype.Repository;

@Repository
class JpaCategoryRepository implements CategoryRepository {

    private final CategoryJpaRepository jpa;

    JpaCategoryRepository(CategoryJpaRepository jpa) {
        this.jpa = jpa;
    }

    @Override
    public void save(Category category) {
        CategoryJpaEntity e = existingOrNew(category);
        e.name = category.name();
        e.description = category.description();
        e.parentId = category.parentId();
        e.active = true;
        jpa.saveAndFlush(e);
    }

    /** Soft delete; the unique name index ignores deleted rows so the name can be reused. */
    @Override
    public void delete(Category category) {
        CategoryJpaEntity e = existingOrNew(category);
        e.deletedAt = Instant.now();
        e.active = false;
        jpa.saveAndFlush(e);
    }

    @Override
    public Optional<Category> findById(UUID companyId, UUID id) {
        return jpa.findByIdAndCompanyIdAndDeletedAtIsNull(id, companyId).map(JpaCategoryRepository::toDomain);
    }

    @Override
    public Optional<Category> findByName(UUID companyId, String name) {
        return jpa.findByName(companyId, name.strip()).map(JpaCategoryRepository::toDomain);
    }

    @Override
    public boolean existsByName(UUID companyId, String name, UUID excludedId) {
        return jpa.existsByName(companyId, name, excludedId);
    }

    @Override
    public boolean hasChildren(UUID companyId, UUID categoryId) {
        return jpa.existsByCompanyIdAndParentIdAndDeletedAtIsNull(companyId, categoryId);
    }

    @Override
    public List<Category> findAll(UUID companyId) {
        return jpa.findByCompanyIdAndDeletedAtIsNull(companyId).stream().map(JpaCategoryRepository::toDomain).toList();
    }

    @Override
    public List<Category> findByIds(UUID companyId, Collection<UUID> ids) {
        return jpa.findByCompanyIdAndIdInAndDeletedAtIsNull(companyId, ids).stream()
                .map(JpaCategoryRepository::toDomain).toList();
    }

    private CategoryJpaEntity existingOrNew(Category category) {
        CategoryJpaEntity e = jpa.findById(category.id()).orElse(null);
        if (e == null) {
            e = new CategoryJpaEntity();
            e.id = category.id();
            e.companyId = category.companyId();
            return e;
        }
        if (e.version != category.version() || !e.companyId.equals(category.companyId())) {
            throw new ObjectOptimisticLockingFailureException(CategoryJpaEntity.class, category.id());
        }
        return e;
    }

    private static Category toDomain(CategoryJpaEntity e) {
        return new Category(e.id, e.companyId, e.name, e.description, e.parentId, e.version);
    }
}
