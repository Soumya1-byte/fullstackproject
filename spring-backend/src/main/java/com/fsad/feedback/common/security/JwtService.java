package com.fsad.feedback.common.security;

import com.fsad.feedback.modules.users.model.Role;
import io.jsonwebtoken.Claims;
import io.jsonwebtoken.JwtException;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import org.springframework.stereotype.Service;

import javax.crypto.SecretKey;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.time.Duration;
import java.time.Instant;
import java.util.Base64;
import java.util.Date;
import java.util.Map;

@Service
public class JwtService {

    private final JwtProperties jwtProperties;
    private final SecretKey accessKey;
    private final SecretKey refreshKey;

    public JwtService(JwtProperties jwtProperties) {
        this.jwtProperties = jwtProperties;
        this.accessKey = buildKey(jwtProperties.accessSecret());
        this.refreshKey = buildKey(jwtProperties.refreshSecret());
    }

    public String generateAccessToken(AuthenticatedUser user) {
        return generateToken(user, jwtProperties.accessExpiration(), accessKey);
    }

    public String generateRefreshToken(AuthenticatedUser user) {
        return generateToken(user, jwtProperties.refreshExpiration(), refreshKey);
    }

    public AuthenticatedUser parseAccessToken(String token) {
        return parseToken(token, accessKey);
    }

    public AuthenticatedUser parseRefreshToken(String token) {
        return parseToken(token, refreshKey);
    }

    private String generateToken(AuthenticatedUser user, String expiryValue, SecretKey key) {
        Instant now = Instant.now();
        Instant expiry = now.plus(parseDuration(expiryValue));

        return Jwts.builder()
                .claims(Map.of(
                        "email", user.email(),
                        "role", user.role().name(),
                        "tokenVersion", user.tokenVersion()
                ))
                .subject(user.id())
                .issuedAt(Date.from(now))
                .expiration(Date.from(expiry))
                .signWith(key)
                .compact();
    }

    private AuthenticatedUser parseToken(String token, SecretKey key) {
        try {
            Claims claims = Jwts.parser()
                    .verifyWith(key)
                    .build()
                    .parseSignedClaims(token)
                    .getPayload();

            return new AuthenticatedUser(
                    claims.getSubject(),
                    claims.get("email", String.class),
                    Role.valueOf(claims.get("role", String.class)),
                    claims.get("tokenVersion", Integer.class)
            );
        } catch (JwtException | IllegalArgumentException exception) {
            throw new AppJwtException("Invalid token");
        }
    }

    private Duration parseDuration(String value) {
        if (value == null || value.isBlank()) {
            return Duration.ofMinutes(15);
        }

        String normalized = value.trim().toLowerCase();
        if (normalized.endsWith("m")) {
            return Duration.ofMinutes(Long.parseLong(normalized.substring(0, normalized.length() - 1)));
        }
        if (normalized.endsWith("h")) {
            return Duration.ofHours(Long.parseLong(normalized.substring(0, normalized.length() - 1)));
        }
        if (normalized.endsWith("d")) {
            return Duration.ofDays(Long.parseLong(normalized.substring(0, normalized.length() - 1)));
        }
        return Duration.parse(value);
    }

    private SecretKey buildKey(String rawSecret) {
        try {
            byte[] digest = MessageDigest.getInstance("SHA-256")
                    .digest(rawSecret.getBytes(StandardCharsets.UTF_8));
            return Keys.hmacShaKeyFor(Base64.getEncoder().encode(digest));
        } catch (NoSuchAlgorithmException exception) {
            throw new IllegalStateException("Unable to initialize JWT secret", exception);
        }
    }

    public static class AppJwtException extends RuntimeException {
        public AppJwtException(String message) {
            super(message);
        }
    }
}
