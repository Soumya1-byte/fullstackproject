package com.fsad.feedback.modules.auth.dto;

public record AuthPayload(String token, UserPayload user) {
}
