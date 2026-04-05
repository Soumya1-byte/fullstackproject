package com.fsad.feedback.common.security;

import com.fsad.feedback.modules.users.model.Role;

public record AuthenticatedUser(String id, String email, Role role, Integer tokenVersion) {
}
