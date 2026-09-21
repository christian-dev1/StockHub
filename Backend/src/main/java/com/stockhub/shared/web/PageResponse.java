package com.stockhub.shared.web;

import com.stockhub.shared.domain.page.PageResult;
import java.util.List;
import java.util.function.Function;

public record PageResponse<T>(List<T> content, int page, int size, long totalElements, int totalPages) {

    public static <S, T> PageResponse<T> of(PageResult<S> result, Function<S, T> mapper) {
        return new PageResponse<>(result.content().stream().map(mapper).toList(),
                result.page(), result.size(), result.totalElements(), result.totalPages());
    }
}
