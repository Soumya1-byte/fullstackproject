package com.fsad.feedback.modules.auth.dto;

import com.fsad.feedback.modules.users.model.Role;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public record RegisterRequest(
        @NotBlank @Size(min = 2) String name,
        @Email @NotBlank String email,
        @NotBlank @Size(min = 6) String password,
        @NotNull Role role
) {
}
