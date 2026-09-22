package com.stockhub.auth.infrastructure.config;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import java.lang.reflect.Method;
import org.springframework.core.annotation.AnnotatedElementUtils;
import org.springframework.security.access.expression.method.MethodSecurityExpressionHandler;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.authorization.AuthorizationDeniedException;
import org.springframework.security.authorization.AuthorizationResult;
import org.springframework.security.authorization.method.PreAuthorizeAuthorizationManager;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.util.SimpleMethodInvocation;
import org.springframework.web.method.HandlerMethod;
import org.springframework.web.servlet.HandlerInterceptor;

/**
 * Evaluates a controller's {@code @PreAuthorize} before Spring MVC binds and
 * validates the request body. Without it, {@code @Valid} runs during argument
 * resolution, ahead of the method-security proxy, and a caller lacking the
 * permission receives a 400 listing the form constraints instead of a 403.
 * <p>
 * Only expressions that do not reference method arguments ({@code #name}) can
 * be checked this early; the others are left to the regular method-security
 * interceptor, which still runs on every call and remains the authority.
 */
class PreAuthorizeBeforeBindingInterceptor implements HandlerInterceptor {

    private final PreAuthorizeAuthorizationManager authorizationManager = new PreAuthorizeAuthorizationManager();

    PreAuthorizeBeforeBindingInterceptor(MethodSecurityExpressionHandler expressionHandler) {
        authorizationManager.setExpressionHandler(expressionHandler);
    }

    @Override
    public boolean preHandle(HttpServletRequest request, HttpServletResponse response, Object handler) {
        if (!(handler instanceof HandlerMethod handlerMethod) || !checkableBeforeBinding(handlerMethod)) {
            return true;
        }
        Method method = handlerMethod.getMethod();
        var invocation = new SimpleMethodInvocation(handlerMethod.getBean(), method,
                new Object[method.getParameterCount()]);
        AuthorizationResult result = authorizationManager.authorize(
                () -> SecurityContextHolder.getContext().getAuthentication(), invocation);
        if (result != null && !result.isGranted()) {
            throw new AuthorizationDeniedException("Access Denied", result);
        }
        return true;
    }

    private static boolean checkableBeforeBinding(HandlerMethod handlerMethod) {
        PreAuthorize annotation = AnnotatedElementUtils.findMergedAnnotation(handlerMethod.getMethod(), PreAuthorize.class);
        if (annotation == null) {
            annotation = AnnotatedElementUtils.findMergedAnnotation(handlerMethod.getBeanType(), PreAuthorize.class);
        }
        return annotation != null && !annotation.value().contains("#");
    }
}
