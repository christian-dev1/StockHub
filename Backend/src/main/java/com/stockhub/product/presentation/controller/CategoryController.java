package com.stockhub.product.presentation.controller;

import com.stockhub.product.application.usecase.CategoryQueries;
import com.stockhub.product.application.usecase.CreateCategoryUseCase;
import com.stockhub.product.application.usecase.DeleteCategoryUseCase;
import com.stockhub.product.application.usecase.UpdateCategoryUseCase;
import com.stockhub.product.presentation.request.CategoryRequest;
import com.stockhub.product.presentation.request.UpdateCategoryRequest;
import com.stockhub.product.presentation.response.CategoryResponse;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import java.net.URI;
import java.util.List;
import java.util.UUID;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/categories")
@Tag(name = "Categories")
class CategoryController {

    private final CategoryQueries queries;
    private final CreateCategoryUseCase create;
    private final UpdateCategoryUseCase update;
    private final DeleteCategoryUseCase delete;

    CategoryController(CategoryQueries queries, CreateCategoryUseCase create, UpdateCategoryUseCase update,
                       DeleteCategoryUseCase delete) {
        this.queries = queries;
        this.create = create;
        this.update = update;
        this.delete = delete;
    }

    @GetMapping
    @PreAuthorize("hasAuthority('CATEGORY_VIEW')")
    @Operation(summary = "All categories in tree order (each category followed by its sub-categories)")
    List<CategoryResponse> list(@RequestParam(required = false) String q) {
        return queries.list(q).stream().map(CategoryResponse::from).toList();
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAuthority('CATEGORY_VIEW')")
    CategoryResponse get(@PathVariable UUID id) {
        return CategoryResponse.from(queries.get(id));
    }

    @PostMapping
    @PreAuthorize("hasAuthority('CATEGORY_MANAGE')")
    ResponseEntity<CategoryResponse> create(@Valid @RequestBody CategoryRequest request) {
        var view = create.execute(request.toCommand());
        return ResponseEntity.created(URI.create("/api/v1/categories/" + view.id())).body(CategoryResponse.from(view));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAuthority('CATEGORY_MANAGE')")
    CategoryResponse update(@PathVariable UUID id, @Valid @RequestBody UpdateCategoryRequest request) {
        return CategoryResponse.from(update.execute(id, request.category().toCommand(), request.version()));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAuthority('CATEGORY_MANAGE')")
    @Operation(summary = "Delete an empty category (no products, no sub-categories)")
    ResponseEntity<Void> delete(@PathVariable UUID id) {
        delete.execute(id);
        return ResponseEntity.noContent().build();
    }
}
