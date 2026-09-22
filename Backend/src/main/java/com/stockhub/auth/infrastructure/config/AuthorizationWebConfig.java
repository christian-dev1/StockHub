package com.stockhub.auth.infrastructure.config;

import org.springframework.beans.factory.ObjectProvider;
import org.springframework.context.ApplicationContext;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.access.expression.method.DefaultMethodSecurityExpressionHandler;
import org.springframework.security.access.expression.method.MethodSecurityExpressionHandler;
import org.springframework.web.servlet.config.annotation.InterceptorRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

/** Checks permissions before request bodies are bound and validated (403 before 400). */
@Configuration(proxyBeanMethods = false)
class AuthorizationWebConfig implements WebMvcConfigurer {

    private final MethodSecurityExpressionHandler expressionHandler;

    AuthorizationWebConfig(ObjectProvider<MethodSecurityExpressionHandler> expressionHandler, ApplicationContext context) {
        this.expressionHandler = expressionHandler.getIfAvailable(() -> {
            var handler = new DefaultMethodSecurityExpressionHandler();
            handler.setApplicationContext(context);
            return handler;
        });
    }

    @Override
    public void addInterceptors(InterceptorRegistry registry) {
        registry.addInterceptor(new PreAuthorizeBeforeBindingInterceptor(expressionHandler)).addPathPatterns("/api/**");
    }
}
