package com.stockhub.product.infrastructure.persistence;

import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;

interface ImportJobJpaRepository extends JpaRepository<ImportJobJpaEntity, UUID> {

    Optional<ImportJobJpaEntity> findByIdAndCompanyId(UUID id, UUID companyId);
}
