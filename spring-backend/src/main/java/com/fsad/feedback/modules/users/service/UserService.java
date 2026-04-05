package com.fsad.feedback.modules.users.service;

import com.fsad.feedback.common.error.AppException;
import com.fsad.feedback.modules.users.dto.UpdateProfileRequest;
import com.fsad.feedback.modules.users.dto.UserProfilePayload;
import com.fsad.feedback.modules.users.model.Role;
import com.fsad.feedback.modules.users.model.User;
import com.fsad.feedback.modules.users.repository.UserRepository;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class UserService {

    private final UserRepository userRepository;

    public UserService(UserRepository userRepository) {
        this.userRepository = userRepository;
    }

    public List<UserProfilePayload> listStudents() {
        return userRepository.findAll(Sort.by(Sort.Direction.DESC, "createdAt")).stream()
                .filter(user -> user.getRole() == Role.STUDENT)
                .map(this::toPayload)
                .toList();
    }

    public UserProfilePayload getProfile(String userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new AppException(HttpStatus.NOT_FOUND, "USER_NOT_FOUND", "User not found"));
        return toPayload(user);
    }

    public UserProfilePayload updateProfile(String userId, UpdateProfileRequest request) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new AppException(HttpStatus.NOT_FOUND, "USER_NOT_FOUND", "User not found"));

        if (request.name() != null && !request.name().isBlank()) {
            user.setName(request.name().trim());
        }

        user.setDepartmentId(normalizeNullable(request.departmentId()));
        return toPayload(userRepository.save(user));
    }

    private UserProfilePayload toPayload(User user) {
        return new UserProfilePayload(
                user.getId(),
                user.getName(),
                user.getEmail(),
                user.getRole(),
                user.getDepartmentId(),
                user.getIsActive(),
                user.getLastLoginAt(),
                user.getCreatedAt(),
                user.getUpdatedAt()
        );
    }

    private String normalizeNullable(String value) {
        if (value == null) {
            return null;
        }
        String trimmed = value.trim();
        return trimmed.isEmpty() ? null : trimmed;
    }
}
