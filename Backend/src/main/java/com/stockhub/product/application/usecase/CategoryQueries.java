package com.stockhub.product.application.usecase;

import com.stockhub.product.application.dto.CategoryView;
import com.stockhub.product.domain.model.Category;
import com.stockhub.product.domain.repository.CategoryRepository;
import com.stockhub.product.domain.repository.ProductRepository;
import java.util.Comparator;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.UUID;
import java.util.function.Function;
import java.util.stream.Collectors;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * Categories are few per company, so they are returned as one list ordered as
 * a tree (each root followed by its sub-categories) rather than paginated.
 */
@Service
@Transactional(readOnly = true)
public class CategoryQueries {

    private final CategoryRepository categories;
    private final ProductRepository products;
    private final CategoryAccess access;

    CategoryQueries(CategoryRepository categories, ProductRepository products, CategoryAccess access) {
        this.categories = categories;
        this.products = products;
        this.access = access;
    }

    public List<CategoryView> list(String text) {
        UUID companyId = access.companyId();
        List<Category> all = categories.findAll(companyId);
        Map<UUID, Category> byId = all.stream().collect(Collectors.toMap(Category::id, Function.identity()));
        Map<UUID, Long> counts = products.countByCategories(companyId);
        String filter = text == null || text.isBlank() ? null : text.strip().toLowerCase(Locale.ROOT);
        return all.stream()
                .filter(c -> filter == null || c.name().toLowerCase(Locale.ROOT).contains(filter))
                .sorted(treeOrder(byId))
                .map(c -> view(c, byId, counts))
                .toList();
    }

    public CategoryView get(UUID categoryId) {
        Category category = access.load(categoryId);
        UUID companyId = category.companyId();
        String parentName = category.parentId() == null ? null
                : categories.findById(companyId, category.parentId()).map(Category::name).orElse(null);
        return CategoryView.from(category, parentName, products.countByCategory(companyId, categoryId));
    }

    private static CategoryView view(Category c, Map<UUID, Category> byId, Map<UUID, Long> counts) {
        Category parent = c.parentId() == null ? null : byId.get(c.parentId());
        return CategoryView.from(c, parent == null ? null : parent.name(), counts.getOrDefault(c.id(), 0L));
    }

    /** Sorts by (root name, is child, own name) so that children follow their parent. */
    private static Comparator<Category> treeOrder(Map<UUID, Category> byId) {
        Function<Category, String> rootName = c -> {
            Category root = c.parentId() == null ? c : byId.getOrDefault(c.parentId(), c);
            return root.name().toLowerCase(Locale.ROOT) + "\u0000" + root.id();
        };
        return Comparator.comparing(rootName)
                .thenComparing(c -> c.parentId() != null)
                .thenComparing(c -> c.name().toLowerCase(Locale.ROOT));
    }
}
