package com.stockhub.shared.infrastructure.web;

import com.stockhub.shared.application.RequestMetadata;
import com.stockhub.shared.application.RequestMetadataProvider;
import com.stockhub.shared.web.RequestIdFilter;
import jakarta.servlet.http.HttpServletRequest;
import org.slf4j.MDC;
import org.springframework.stereotype.Component;
import org.springframework.web.context.request.RequestContextHolder;
import org.springframework.web.context.request.ServletRequestAttributes;

/**
 * Reads client IP (already resolved from X-Forwarded-For by the framework's
 * forwarded-header support), user agent and request id of the current request.
 */
@Component
class ServletRequestMetadataProvider implements RequestMetadataProvider {

    private static final int MAX_USER_AGENT = 255;

    @Override
    public RequestMetadata current() {
        if (!(RequestContextHolder.getRequestAttributes() instanceof ServletRequestAttributes attributes)) {
            return new RequestMetadata(null, null, MDC.get(RequestIdFilter.MDC_KEY));
        }
        HttpServletRequest request = attributes.getRequest();
        String userAgent = request.getHeader("User-Agent");
        if (userAgent != null && userAgent.length() > MAX_USER_AGENT) {
            userAgent = userAgent.substring(0, MAX_USER_AGENT);
        }
        return new RequestMetadata(request.getRemoteAddr(), userAgent, MDC.get(RequestIdFilter.MDC_KEY));
    }
}
