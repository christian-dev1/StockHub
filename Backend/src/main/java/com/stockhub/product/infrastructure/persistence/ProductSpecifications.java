package com.stockhub.product.infrastructure.persistence;

import com.stockhub.product.domain.repository.ProductSearchCriteria;
import com.stockhub.shared.infrastructure.persistence.LikePatterns;
import jakarta.persistence.criteria.CriteriaBuilder;
import jakarta.persistence.criteria.Predicate;
import jakarta.persistence.criteria.Root;
import jakarta.persistence.criteria.Subquery;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;
import org.springframework.data.jpa.domain.Specification;

/** Translates catalogue filters into a single SQL query (all filters are combinable). */
final class ProductSpecifications {

    /** Minimum pg_trgm word similarity for typo-tolerant name matches. */
    private static final double NAME_SIMILARITY = 0.5;

    private ProductSpecifications() {
    }

    static Specification<ProductJpaEntity> matching(UUID companyId, ProductSearchCriteria c) {
        return (root, query, cb) -> {
            List<Predicate> predicates = new ArrayList<>();
            predicates.add(cb.equal(root.get("companyId"), companyId));
            predicates.add(cb.isNull(root.get("deletedAt")));
            if (c.text() != null && !c.text().isBlank()) {
                predicates.add(text(root, cb, c.text()));
            }
            if (c.categoryId() != null) {
                Subquery<UUID> family = query.subquery(UUID.class);
                Root<CategoryJpaEntity> category = family.from(CategoryJpaEntity.class);
                family.select(category.get("id")).where(
                        cb.equal(category.get("companyId"), companyId),
                        cb.or(cb.equal(category.get("id"), c.categoryId()),
                                cb.equal(category.get("parentId"), c.categoryId())));
                predicates.add(root.get("categoryId").in(family));
            }
            if (c.supplierId() != null) {
                predicates.add(cb.equal(root.get("defaultSupplierId"), c.supplierId()));
            }
            if (c.active() != null) {
                predicates.add(cb.equal(root.get("active"), c.active()));
            }
            if (c.batchTracked() != null) {
                predicates.add(cb.equal(root.get("batchTracked"), c.batchTracked()));
            }
            if (c.expiryTracked() != null) {
                predicates.add(cb.equal(root.get("expiryTracked"), c.expiryTracked()));
            }
            if (c.hasBarcode() != null) {
                predicates.add(c.hasBarcode() ? cb.isNotNull(root.get("barcode")) : cb.isNull(root.get("barcode")));
            }
            return cb.and(predicates.toArray(Predicate[]::new));
        };
    }

    /** Name contains or is similar, SKU starts with, or barcode is exactly the text. */
    private static Predicate text(Root<ProductJpaEntity> root, CriteriaBuilder cb, String text) {
        String trimmed = text.strip();
        var lowerName = cb.lower(root.get("name"));
        return cb.or(
                cb.like(lowerName, LikePatterns.contains(trimmed), LikePatterns.ESCAPE),
                cb.greaterThanOrEqualTo(
                        cb.function("word_similarity", Double.class, cb.literal(trimmed.toLowerCase()), lowerName),
                        NAME_SIMILARITY),
                cb.like(cb.lower(root.get("sku")), LikePatterns.startsWith(trimmed), LikePatterns.ESCAPE),
                cb.equal(root.get("barcode"), trimmed));
    }
}
