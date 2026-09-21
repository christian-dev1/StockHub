package com.stockhub.product.application.usecase;

import com.stockhub.audit.AuditEntry;
import com.stockhub.audit.AuditRecorder;
import com.stockhub.product.application.command.CategoryCommand;
import com.stockhub.product.application.command.ProductCommand;
import com.stockhub.product.application.dto.ImportResult;
import com.stockhub.product.application.usecase.ProductImportValidator.Action;
import com.stockhub.product.application.usecase.ProductImportValidator.ImportPlan;
import com.stockhub.product.application.usecase.ProductImportValidator.RowPlan;
import com.stockhub.product.domain.exception.ProductErrors;
import com.stockhub.product.domain.model.ImportJob;
import com.stockhub.product.domain.repository.ImportJobRepository;
import com.stockhub.shared.domain.exception.BusinessRuleViolationException;
import com.stockhub.shared.domain.exception.ResourceNotFoundException;
import java.time.Clock;
import java.util.HashMap;
import java.util.Locale;
import java.util.Map;
import java.util.UUID;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * Second step of a bulk import: re-validates the stored rows against the
 * current catalogue and applies them all in one transaction, or nothing at
 * all if any row is invalid. A job can only be committed once.
 */
@Service
public class CommitProductImportUseCase {

    private final ImportJobRepository jobs;
    private final ProductImportValidator validator;
    private final CreateProductUseCase createProduct;
    private final UpdateProductUseCase updateProduct;
    private final CreateCategoryUseCase createCategory;
    private final ProductAccess access;
    private final AuditRecorder audit;
    private final Clock clock;

    CommitProductImportUseCase(ImportJobRepository jobs, ProductImportValidator validator,
                               CreateProductUseCase createProduct, UpdateProductUseCase updateProduct,
                               CreateCategoryUseCase createCategory, ProductAccess access, AuditRecorder audit,
                               Clock clock) {
        this.jobs = jobs;
        this.validator = validator;
        this.createProduct = createProduct;
        this.updateProduct = updateProduct;
        this.createCategory = createCategory;
        this.access = access;
        this.audit = audit;
        this.clock = clock;
    }

    @Transactional
    public ImportResult execute(UUID jobId) {
        UUID companyId = access.companyId();
        ImportJob job = jobs.findById(companyId, jobId).orElseThrow(() -> new ResourceNotFoundException("Import", jobId));
        job.commit(clock.instant());
        ImportPlan plan = validator.validate(companyId, job.rows(), job.createMissingCategories());
        if (plan.hasErrors()) {
            throw new BusinessRuleViolationException("IMPORT_HAS_ERRORS",
                    "Some rows are invalid; fix the file and preview it again.");
        }
        Map<String, UUID> createdCategories = new HashMap<>();
        for (String name : plan.categoriesToCreate()) {
            createdCategories.put(name.toLowerCase(Locale.ROOT),
                    createCategory.create(companyId, new CategoryCommand(name, null, null)).id());
        }
        for (RowPlan row : plan.rows()) {
            apply(companyId, row, withCategory(row, createdCategories));
        }
        jobs.save(job);
        ImportResult result = new ImportResult(jobId, (int) plan.count(Action.CREATE), (int) plan.count(Action.UPDATE),
                createdCategories.size());
        audit.record(AuditEntry.of("PRODUCTS_IMPORTED", "Import", jobId).withMetadata(Map.of(
                "fileName", job.fileName(), "created", result.created(), "updated", result.updated(),
                "categoriesCreated", result.categoriesCreated())));
        return result;
    }

    private void apply(UUID companyId, RowPlan row, ProductCommand command) {
        if (row.action() == Action.CREATE) {
            createProduct.create(companyId, command);
        } else {
            var product = access.load(row.existingProductId());
            updateProduct.apply(product, command);
        }
    }

    private static ProductCommand withCategory(RowPlan row, Map<String, UUID> createdCategories) {
        ProductCommand c = row.command();
        if (row.categoryToCreate() == null) {
            return c;
        }
        UUID categoryId = createdCategories.get(row.categoryToCreate().toLowerCase(Locale.ROOT));
        if (categoryId == null) {
            throw ProductErrors.unknownCategory();
        }
        return new ProductCommand(c.sku(), c.barcode(), c.barcodeFormat(), c.name(), c.description(), categoryId,
                c.defaultSupplierId(), c.unit(), c.purchasePrice(), c.salePrice(), c.minStock(), c.reorderQuantity(),
                c.batchTracked(), c.expiryTracked());
    }
}
