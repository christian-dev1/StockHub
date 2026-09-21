package com.stockhub.product.infrastructure.persistence;

import java.util.Collection;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

interface ProductJpaRepository extends JpaRepository<ProductJpaEntity, UUID>, JpaSpecificationExecutor<ProductJpaEntity> {

    Optional<ProductJpaEntity> findByIdAndCompanyIdAndDeletedAtIsNull(UUID id, UUID companyId);

    List<ProductJpaEntity> findByCompanyIdAndIdInAndDeletedAtIsNull(UUID companyId, Collection<UUID> ids);

    Optional<ProductJpaEntity> findByCompanyIdAndBarcodeAndDeletedAtIsNull(UUID companyId, String barcode);

    @Query("""
            select p from ProductJpaEntity p
            where p.companyId = :companyId and lower(p.sku) = lower(:sku) and p.deletedAt is null""")
    Optional<ProductJpaEntity> findBySku(@Param("companyId") UUID companyId, @Param("sku") String sku);

    @Query("""
            select p from ProductJpaEntity p
            where p.companyId = :companyId and lower(p.sku) in :skus and p.deletedAt is null""")
    List<ProductJpaEntity> findBySkus(@Param("companyId") UUID companyId, @Param("skus") Collection<String> lowerSkus);

    @Query("""
            select count(p) > 0 from ProductJpaEntity p
            where p.companyId = :companyId and lower(p.sku) = lower(:sku) and p.deletedAt is null
              and (:excludedId is null or p.id <> :excludedId)""")
    boolean existsBySku(@Param("companyId") UUID companyId, @Param("sku") String sku,
                        @Param("excludedId") UUID excludedId);

    @Query("""
            select count(p) > 0 from ProductJpaEntity p
            where p.companyId = :companyId and p.barcode = :barcode and p.deletedAt is null
              and (:excludedId is null or p.id <> :excludedId)""")
    boolean existsByBarcode(@Param("companyId") UUID companyId, @Param("barcode") String barcode,
                            @Param("excludedId") UUID excludedId);

    @Query("""
            select p.barcode, p.id from ProductJpaEntity p
            where p.companyId = :companyId and p.barcode in :barcodes and p.deletedAt is null""")
    List<Object[]> findIdsByBarcodes(@Param("companyId") UUID companyId, @Param("barcodes") Collection<String> barcodes);

    long countByCompanyIdAndCategoryIdAndDeletedAtIsNull(UUID companyId, UUID categoryId);

    @Query("""
            select p.categoryId, count(p) from ProductJpaEntity p
            where p.companyId = :companyId and p.categoryId is not null and p.deletedAt is null
            group by p.categoryId""")
    List<Object[]> countByCategories(@Param("companyId") UUID companyId);
}
