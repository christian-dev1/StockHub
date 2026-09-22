package com.stockhub.shared.infrastructure.config;

import com.stockhub.shared.web.ApiError;
import io.swagger.v3.core.converter.ModelConverters;
import io.swagger.v3.oas.models.Components;
import io.swagger.v3.oas.models.OpenAPI;
import io.swagger.v3.oas.models.Operation;
import io.swagger.v3.oas.models.PathItem;
import io.swagger.v3.oas.models.info.Info;
import io.swagger.v3.oas.models.media.Content;
import io.swagger.v3.oas.models.media.MediaType;
import io.swagger.v3.oas.models.media.Schema;
import io.swagger.v3.oas.models.responses.ApiResponse;
import io.swagger.v3.oas.models.responses.ApiResponses;
import io.swagger.v3.oas.models.security.SecurityRequirement;
import io.swagger.v3.oas.models.security.SecurityScheme;
import java.util.LinkedHashMap;
import java.util.Map;
import org.springdoc.core.customizers.GlobalOpenApiCustomizer;
import org.springdoc.core.customizers.GlobalOperationCustomizer;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.core.annotation.AnnotatedElementUtils;
import org.springframework.security.access.prepost.PreAuthorize;

@Configuration(proxyBeanMethods = false)
class OpenApiConfig {

    private static final String BEARER = "bearerAuth";
    private static final String API_ERROR = "ApiError";

    @Bean
    OpenAPI stockHubOpenApi() {
        Components components = new Components().addSecuritySchemes(BEARER, new SecurityScheme()
                .type(SecurityScheme.Type.HTTP)
                .scheme("bearer")
                .bearerFormat("JWT"));
        return new OpenAPI()
                .info(new Info()
                        .title("StockHub API")
                        .version("v1")
                        .description("""
                                Multi-company, multi-location stock management API.

                                Every failure returns an `ApiError` whose `code` is stable (e.g. \
                                `PRODUCT_SKU_ALREADY_EXISTS`). Lists use `q`, `page` (from 0), `size` (1-100, \
                                default 20) and `sort=field,asc|desc`. Resources of another company answer 404."""))
                .components(components)
                .addSecurityItem(new SecurityRequirement().addList(BEARER));
    }

    /** States the permission of each secured endpoint, read from its {@code @PreAuthorize}. */
    @Bean
    GlobalOperationCustomizer permissionDocumentation() {
        return (operation, handlerMethod) -> {
            PreAuthorize rule = AnnotatedElementUtils.findMergedAnnotation(handlerMethod.getMethod(), PreAuthorize.class);
            if (rule == null) {
                rule = AnnotatedElementUtils.findMergedAnnotation(handlerMethod.getBeanType(), PreAuthorize.class);
            }
            if (rule != null) {
                String note = "Requires `" + rule.value() + "`.";
                operation.setDescription(operation.getDescription() == null ? note
                        : operation.getDescription() + "\n\n" + note);
                operation.addExtension("x-required-authority", rule.value());
            }
            return operation;
        };
    }

    /**
     * Documents the error responses shared by every API operation. The ApiError
     * schema is registered here: springdoc drops component schemas that no
     * generated operation referenced yet.
     */
    @Bean
    GlobalOpenApiCustomizer errorResponses() {
        return openApi -> {
            ModelConverters.getInstance().readAll(ApiError.class).forEach(openApi.getComponents()::addSchemas);
            openApi.getPaths().forEach((path, item) -> {
                if (!path.startsWith("/api/")) {
                    return;
                }
                boolean publicAuth = path.startsWith("/api/v1/auth/") && !path.endsWith("/me")
                        && !path.endsWith("/change-password");
                item.readOperationsMap().forEach((method, operation) ->
                        addErrors(operation, method, path.contains("{"), publicAuth));
            });
        };
    }

    private static void addErrors(Operation operation, PathItem.HttpMethod method, boolean hasId, boolean publicAuth) {
        ApiResponses responses = operation.getResponses();
        boolean writes = method != PathItem.HttpMethod.GET;
        Map<String, String> errors = new LinkedHashMap<>();
        errors.put("400", "Invalid input (`VALIDATION_FAILED` with `fieldErrors`, or a business validation code)");
        if (!publicAuth) {
            errors.put("401", "Missing, expired or revoked token");
            errors.put("403", "The caller lacks the required permission");
        }
        if (hasId) {
            errors.put("404", "Unknown resource, or resource of another company");
        }
        if (writes) {
            errors.put("409", "Duplicate (e.g. `PRODUCT_SKU_ALREADY_EXISTS`) or stale `version`");
            errors.put("422", "Business rule violated (e.g. `CATEGORY_IN_USE`)");
        }
        errors.forEach((code, description) -> {
            if (!responses.containsKey(code)) {
                responses.addApiResponse(code, new ApiResponse().description(description)
                        .content(new Content().addMediaType("application/json",
                                new MediaType().schema(new Schema<>().$ref("#/components/schemas/" + API_ERROR)))));
            }
        });
    }
}
