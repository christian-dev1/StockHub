package com.stockhub.auth.infrastructure.config;

import com.nimbusds.jose.jwk.source.ImmutableSecret;
import com.stockhub.auth.application.usecase.AuthSettings;
import java.util.Base64;
import javax.crypto.SecretKey;
import javax.crypto.spec.SecretKeySpec;
import org.springframework.boot.context.properties.EnableConfigurationProperties;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.oauth2.core.DelegatingOAuth2TokenValidator;
import org.springframework.security.oauth2.jose.jws.MacAlgorithm;
import org.springframework.security.oauth2.jwt.JwtDecoder;
import org.springframework.security.oauth2.jwt.JwtEncoder;
import org.springframework.security.oauth2.jwt.JwtIssuerValidator;
import org.springframework.security.oauth2.jwt.JwtTimestampValidator;
import org.springframework.security.oauth2.jwt.NimbusJwtDecoder;
import org.springframework.security.oauth2.jwt.NimbusJwtEncoder;

@Configuration(proxyBeanMethods = false)
@EnableConfigurationProperties(AuthProperties.class)
class JwtConfig {

    private static final int MIN_KEY_BYTES = 64;

    @Bean
    SecretKey jwtSigningKey(AuthProperties properties) {
        if (properties.jwtSecret() == null || properties.jwtSecret().isBlank()) {
            throw new IllegalStateException("stockhub.auth.jwt-secret (JWT_SECRET) must be configured");
        }
        byte[] key = Base64.getDecoder().decode(properties.jwtSecret().strip());
        if (key.length < MIN_KEY_BYTES) {
            throw new IllegalStateException("JWT secret must be at least 64 bytes (512 bits) for HS512");
        }
        return new SecretKeySpec(key, "HmacSHA512");
    }

    @Bean
    JwtEncoder jwtEncoder(SecretKey jwtSigningKey) {
        return new NimbusJwtEncoder(new ImmutableSecret<>(jwtSigningKey));
    }

    @Bean
    JwtDecoder jwtDecoder(SecretKey jwtSigningKey, AuthProperties properties) {
        NimbusJwtDecoder decoder = NimbusJwtDecoder.withSecretKey(jwtSigningKey).macAlgorithm(MacAlgorithm.HS512).build();
        decoder.setJwtValidator(new DelegatingOAuth2TokenValidator<>(
                new JwtTimestampValidator(java.time.Duration.ofSeconds(30)),
                new JwtIssuerValidator(properties.issuer())));
        return decoder;
    }

    @Bean
    AuthSettings authSettings(AuthProperties properties) {
        return new AuthSettings(properties.accessTokenTtl(), properties.refreshTokenTtl());
    }
}
