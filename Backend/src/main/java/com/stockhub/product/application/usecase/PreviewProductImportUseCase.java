package com.stockhub.product.application.usecase;

import com.stockhub.product.application.dto.ImportPreview;
import com.stockhub.product.application.dto.ImportRowResult;
import com.stockhub.product.application.port.TabularFileReader;
import com.stockhub.product.application.usecase.ProductImportValidator.Action;
import com.stockhub.product.application.usecase.ProductImportValidator.ImportPlan;
import com.stockhub.product.domain.model.ImportJob;
import com.stockhub.product.domain.repository.ImportJobRepository;
import com.stockhub.shared.domain.exception.InvalidInputException;
import com.stockhub.shared.security.CurrentUser;
import com.stockhub.shared.security.CurrentUserProvider;
import java.time.Clock;
import java.util.List;
import java.util.Map;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * First step of a bulk import: parses and validates the file, stores the rows
 * for the commit and reports, row by row, what would be created, updated or
 * rejected. The catalogue itself is not modified.
 */
@Service
public class PreviewProductImportUseCase {

    private final TabularFileReader reader;
    private final ProductImportValidator validator;
    private final ImportJobRepository jobs;
    private final CurrentUserProvider currentUser;
    private final Clock clock;

    PreviewProductImportUseCase(TabularFileReader reader, ProductImportValidator validator, ImportJobRepository jobs,
                                CurrentUserProvider currentUser, Clock clock) {
        this.reader = reader;
        this.validator = validator;
        this.jobs = jobs;
        this.currentUser = currentUser;
        this.clock = clock;
    }

    @Transactional
    public ImportPreview execute(String fileName, byte[] content, boolean createMissingCategories) {
        CurrentUser user = currentUser.require();
        String name = fileName == null || fileName.isBlank() ? "import" : fileName.strip();
        List<Map<String, String>> rows = reader.read(name, content);
        if (rows.isEmpty()) {
            throw new InvalidInputException("file", "IMPORT_EMPTY", "The file contains no data rows.");
        }
        ImportPlan plan = validator.validate(user.requireCompanyId(), rows, createMissingCategories);
        ImportJob job = ImportJob.preview(user.requireCompanyId(), truncate(name), rows,
                (int) plan.count(Action.ERROR), createMissingCategories, user.userId(), clock.instant());
        jobs.save(job);
        return toPreview(job, plan);
    }

    static ImportPreview toPreview(ImportJob job, ImportPlan plan) {
        List<ImportRowResult> rows = plan.rows().stream()
                .map(r -> new ImportRowResult(r.rowNumber(), r.action().name(), r.sku(), r.name(), r.issues()))
                .toList();
        return new ImportPreview(job.id(), job.fileName(), job.totalRows(), (int) plan.count(Action.CREATE),
                (int) plan.count(Action.UPDATE), (int) plan.count(Action.ERROR), plan.categoriesToCreate(), rows,
                job.expiresAt());
    }

    private static String truncate(String name) {
        return name.length() <= 255 ? name : name.substring(0, 255);
    }
}
