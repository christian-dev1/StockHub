package com.stockhub.product.domain;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import com.stockhub.product.domain.model.Category;
import java.util.UUID;
import org.junit.jupiter.api.Test;

class CategoryTest {

    private static final UUID COMPANY = UUID.randomUUID();

    @Test
    void categoriesAreLimitedToTwoLevels() {
        Category root = Category.create(COMPANY, "Boissons", null);
        Category child = Category.create(COMPANY, "Eaux", null);
        child.moveUnder(root, false);
        assertThat(child.parentId()).isEqualTo(root.id());

        Category grandChild = Category.create(COMPANY, "Eaux gazeuses", null);
        assertThatThrownBy(() -> grandChild.moveUnder(child, false)).extracting("code")
                .isEqualTo("CATEGORY_DEPTH_EXCEEDED");
    }

    @Test
    void aParentCategoryCannotBecomeAChild() {
        Category root = Category.create(COMPANY, "Boissons", null);
        Category other = Category.create(COMPANY, "Épicerie", null);
        assertThatThrownBy(() -> root.moveUnder(other, true)).extracting("code").isEqualTo("CATEGORY_DEPTH_EXCEEDED");
    }

    @Test
    void cannotBeItsOwnParent() {
        Category root = Category.create(COMPANY, "Boissons", null);
        assertThatThrownBy(() -> root.moveUnder(root, false)).extracting("code").isEqualTo("CATEGORY_PARENT_INVALID");
    }
}
