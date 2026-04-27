package com.fsad.feedback.modules.auth.service;

import com.fsad.feedback.common.error.AppException;
import com.fsad.feedback.common.security.AuthenticatedUser;
import com.fsad.feedback.common.security.JwtService;
import com.fsad.feedback.modules.auth.config.AdminAuthProperties;
import com.fsad.feedback.modules.auth.dto.AuthPayload;
import com.fsad.feedback.modules.auth.dto.LoginRequest;
import com.fsad.feedback.modules.auth.dto.RegisterRequest;
import com.fsad.feedback.modules.auth.dto.UserPayload;
import com.fsad.feedback.modules.users.model.Role;
import com.fsad.feedback.modules.users.model.User;
import com.fsad.feedback.modules.users.repository.UserRepository;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.time.Instant;

@Service
public class AuthService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;
    private final AdminAuthProperties adminAuthProperties;

    public AuthService(
            UserRepository userRepository,
            PasswordEncoder passwordEncoder,
            JwtService jwtService,
            AdminAuthProperties adminAuthProperties
    ) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.jwtService = jwtService;
        this.adminAuthProperties = adminAuthProperties;
    }

    public AuthResult register(RegisterRequest request) {
        String normalizedEmail = normalizeEmail(request.email());
        String configuredAdminEmail = normalizeEmail(adminAuthProperties.adminLoginEmail());
        boolean isAdminRole = request.role() == Role.ADMIN;

        if (isAdminRole || normalizedEmail.equals(configuredAdminEmail)) {
            throw new AppException(
                    HttpStatus.FORBIDDEN,
                    "ADMIN_REGISTRATION_RESTRICTED",
                    "Admin registration is restricted to the configured administrator account"
            );
        }

        if (userRepository.existsByEmail(normalizedEmail)) {
            throw new AppException(HttpStatus.CONFLICT, "EMAIL_CONFLICT", "Email already in use");
        }

        User user = new User();
        user.setName(request.name().trim());
        user.setEmail(normalizedEmail);
        user.setPasswordHash(passwordEncoder.encode(request.password()));
        user.setRole(Role.STUDENT);
        user.setIsActive(true);

        User savedUser = userRepository.save(user);
        return buildAuthResult(savedUser);
    }

    public AuthResult login(LoginRequest request) {
        String normalizedEmail = normalizeEmail(request.email());
        String configuredAdminEmail = normalizeEmail(adminAuthProperties.adminLoginEmail());

        if (normalizedEmail.equals(configuredAdminEmail)) {
            if (!request.password().equals(adminAuthProperties.adminLoginPassword())) {
                throw invalidCredentials();
            }

            User user = userRepository.findByEmail(configuredAdminEmail).orElseGet(User::new);
            user.setName("Soumya Mishra");
            user.setEmail(configuredAdminEmail);
            user.setRole(Role.ADMIN);
            user.setPasswordHash(passwordEncoder.encode(adminAuthProperties.adminLoginPassword()));
            user.setIsActive(true);
            user.setLastLoginAt(Instant.now());

            return buildAuthResult(userRepository.save(user));
        }

        User user = userRepository.findByEmail(normalizedEmail)
                .orElseThrow(this::invalidCredentials);

        if (!passwordEncoder.matches(request.password(), user.getPasswordHash())) {
            throw invalidCredentials();
        }

        user.setLastLoginAt(Instant.now());
        return buildAuthResult(userRepository.save(user));
    }

    public AuthPayload refresh(String refreshToken) {
        if (refreshToken == null || refreshToken.isBlank()) {
            throw new AppException(HttpStatus.UNAUTHORIZED, "UNAUTHORIZED", "Missing refresh token");
        }

        AuthenticatedUser parsedUser;
        try {
            parsedUser = jwtService.parseRefreshToken(refreshToken);
        } catch (JwtService.AppJwtException exception) {
            throw new AppException(HttpStatus.UNAUTHORIZED, "UNAUTHORIZED", "Invalid refresh token");
        }

        User user = userRepository.findById(parsedUser.id())
                .orElseThrow(() -> new AppException(HttpStatus.NOT_FOUND, "USER_NOT_FOUND", "User not found"));

        return buildAuthPayload(user, parsedUser.tokenVersion() == null ? 1 : parsedUser.tokenVersion());
    }

    public UserPayload me(String userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new AppException(HttpStatus.NOT_FOUND, "USER_NOT_FOUND", "User not found"));
        return toPayload(user);
    }

    private AuthResult buildAuthResult(User user) {
        int tokenVersion = 1;
        AuthenticatedUser authenticatedUser = new AuthenticatedUser(user.getId(), user.getEmail(), user.getRole(), tokenVersion);

        return new AuthResult(
                buildAuthPayload(user, tokenVersion),
                jwtService.generateRefreshToken(authenticatedUser)
        );
    }

    private AuthPayload buildAuthPayload(User user, int tokenVersion) {
        AuthenticatedUser authenticatedUser = new AuthenticatedUser(user.getId(), user.getEmail(), user.getRole(), tokenVersion);
        String accessToken = jwtService.generateAccessToken(authenticatedUser);
        return new AuthPayload(accessToken, toPayload(user));
    }

    private UserPayload toPayload(User user) {
        return new UserPayload(
                user.getId(),
                user.getName(),
                user.getEmail(),
                user.getRole(),
                user.getAdminRequestStatus(),
                user.getAdminRequestRequestedAt(),
                user.getAdminRequestReviewedAt()
        );
    }

    private String normalizeEmail(String email) {
        return email == null ? "" : email.trim().toLowerCase();
    }

    private AppException invalidCredentials() {
        return new AppException(HttpStatus.UNAUTHORIZED, "INVALID_CREDENTIALS", "Invalid credentials");
    }

    public record AuthResult(AuthPayload payload, String refreshToken) {
    }
}
