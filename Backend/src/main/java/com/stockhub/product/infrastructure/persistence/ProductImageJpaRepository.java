package com.stockhub.product.infrastructure.persistence;

import java.util.Collection;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

interface ProductImageJpaRepository extends JpaRepository<ProductImageJpaEntity, UUID> {

    Optional<ProductImageJpaEntity> findByProductIdAndCompanyId(UUID productId, UUID companyId);

    @Modifying
    @Query("delete from ProductImageJpaEntity i where i.productId = :productId and i.companyId = :companyId")
    void deleteImage(@Param("productId") UUID productId, @Param("companyId") UUID companyId);

    @Query("select i.productId from ProductImageJpaEntity i where i.companyId = :companyId and i.productId in :ids")
    List<UUID> findProductIdsWithImage(@Param("companyId") UUID companyId, @Param("ids") Collection<UUID> ids);
}
