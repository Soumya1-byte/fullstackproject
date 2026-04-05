package com.fsad.feedback.modules.auth.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import com.fsad.feedback.modules.users.model.Role;

public record UserPayload(@JsonProperty("_id") String id, String name, String email, Role role) {
}
