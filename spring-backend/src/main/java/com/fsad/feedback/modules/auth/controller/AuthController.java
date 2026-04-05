package com.fsad.feedback.modules.auth.controller;

import com.fsad.feedback.common.api.ApiResponse;
import com.fsad.feedback.common.error.AppException;
import com.fsad.feedback.common.security.AuthenticatedUser;
import com.fsad.feedback.modules.auth.config.AdminAuthProperties;
import com.fsad.feedback.modules.auth.dto.AuthPayload;
import com.fsad.feedback.modules.auth.dto.LoginRequest;
import com.fsad.feedback.modules.auth.dto.LogoutPayload;
import com.fsad.feedback.modules.auth.dto.RegisterRequest;
import com.fsad.feedback.modules.auth.dto.UserPayload;
import com.fsad.feedback.modules.auth.service.AuthService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseCookie;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.CookieValue;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.time.Duration;

@RestController
@RequestMapping("/api/v1/auth")
public class AuthController {

    private final AuthService authService;
    private final AdminAuthProperties adminAuthProperties;

    public AuthController(AuthService authService, AdminAuthProperties adminAuthProperties) {
        this.authService = authService;
        this.adminAuthProperties = adminAuthProperties;
    }

    @PostMapping("/register")
    public ResponseEntity<ApiResponse<AuthPayload>> register(@Valid @RequestBody RegisterRequest request) {
        AuthService.AuthResult result = authService.register(request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .header("Set-Cookie", buildRefreshCookie(result.refreshToken()).toString())
                .body(ApiResponse.ok(result.payload()));
    }

    @PostMapping("/login")
    public ResponseEntity<ApiResponse<AuthPayload>> login(@Valid @RequestBody LoginRequest request) {
        AuthService.AuthResult result = authService.login(request);
        return ResponseEntity.ok()
                .header("Set-Cookie", buildRefreshCookie(result.refreshToken()).toString())
                .body(ApiResponse.ok(result.payload()));
    }

    @PostMapping("/refresh")
    public ApiResponse<AuthPayload> refresh(
            @CookieValue(value = "refreshToken", required = false) String refreshToken
    ) {
        return ApiResponse.ok(authService.refresh(refreshToken));
    }

    @PostMapping("/logout")
    public ResponseEntity<ApiResponse<LogoutPayload>> logout() {
        return ResponseEntity.ok()
                .header("Set-Cookie", clearRefreshCookie().toString())
                .body(ApiResponse.ok(new LogoutPayload(true)));
    }

    @GetMapping("/me")
    public ApiResponse<UserPayload> me(@AuthenticationPrincipal AuthenticatedUser authenticatedUser) {
        if (authenticatedUser == null) {
            throw new AppException(HttpStatus.UNAUTHORIZED, "UNAUTHORIZED", "Unauthorized");
        }
        return ApiResponse.ok(authService.me(authenticatedUser.id()));
    }

    private ResponseCookie buildRefreshCookie(String token) {
        return ResponseCookie.from("refreshToken", token)
                .httpOnly(true)
                .secure(adminAuthProperties.secureCookies())
                .sameSite("Lax")
                .path("/api/v1/auth")
                .maxAge(Duration.ofDays(7))
                .build();
    }

    private ResponseCookie clearRefreshCookie() {
        return ResponseCookie.from("refreshToken", "")
                .httpOnly(true)
                .secure(adminAuthProperties.secureCookies())
                .sameSite("Lax")
                .path("/api/v1/auth")
                .maxAge(Duration.ZERO)
                .build();
    }
}
