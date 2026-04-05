package com.fsad.feedback.modules.auth.config;

import org.springframework.boot.context.properties.ConfigurationProperties;

@ConfigurationProperties(prefix = "app.auth")
public record AdminAuthProperties(
        String adminLoginEmail,
        String adminLoginPassword,
        boolean secureCookies
) {
}
