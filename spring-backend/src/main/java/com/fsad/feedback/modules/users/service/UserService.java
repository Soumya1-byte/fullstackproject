package com.fsad.feedback.modules.users.service;

import com.fsad.feedback.common.error.AppException;
import com.fsad.feedback.modules.auth.config.AdminAuthProperties;
import com.fsad.feedback.modules.users.dto.DemoteAdminRequest;
import com.fsad.feedback.modules.users.dto.RequestAdminAccessRequest;
import com.fsad.feedback.modules.users.dto.ReviewAdminAccessRequest;
import com.fsad.feedback.modules.users.dto.UpdateProfileRequest;
import com.fsad.feedback.modules.users.dto.UserProfilePayload;
import com.fsad.feedback.modules.users.model.AdminRequestStatus;
import com.fsad.feedback.modules.users.model.Role;
import com.fsad.feedback.modules.users.model.User;
import com.fsad.feedback.modules.users.repository.UserRepository;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.List;

@Service
public class UserService {

    private final UserRepository userRepository;
    private final AdminAuthProperties adminAuthProperties;

    public UserService(UserRepository userRepository, AdminAuthProperties adminAuthProperties) {
        this.userRepository = userRepository;
        this.adminAuthProperties = adminAuthProperties;
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

    public UserProfilePayload requestAdminAccess(String userId, RequestAdminAccessRequest request) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new AppException(HttpStatus.NOT_FOUND, "USER_NOT_FOUND", "User not found"));

        if (user.getRole() == Role.ADMIN) {
            throw new AppException(HttpStatus.CONFLICT, "ADMIN_ACCESS_EXISTS", "You already have admin access");
        }

        if (user.getAdminRequestStatus() == AdminRequestStatus.PENDING) {
            throw new AppException(HttpStatus.CONFLICT, "ADMIN_REQUEST_PENDING", "An admin access request is already pending");
        }

        user.setAdminRequestStatus(AdminRequestStatus.PENDING);
        user.setAdminRequestMessage(normalizeBlank(request.message()));
        user.setAdminRequestRequestedAt(Instant.now());
        user.setAdminRequestReviewedAt(null);
        user.setAdminRequestReviewedBy(null);
        user.setAdminRequestDecisionNote(null);

        return toPayload(userRepository.save(user));
    }

    public List<UserProfilePayload> listAdminRequests() {
        return userRepository.findAll(Sort.by(Sort.Direction.DESC, "adminRequestRequestedAt")).stream()
                .filter(user -> user.getAdminRequestStatus() == AdminRequestStatus.PENDING
                        || user.getAdminRequestStatus() == AdminRequestStatus.APPROVED
                        || user.getAdminRequestStatus() == AdminRequestStatus.DENIED)
                .map(this::toPayload)
                .toList();
    }

    public UserProfilePayload reviewAdminRequest(String adminId, String userId, ReviewAdminAccessRequest request) {
        User actingAdmin = userRepository.findById(adminId)
                .orElseThrow(() -> new AppException(HttpStatus.NOT_FOUND, "USER_NOT_FOUND", "Admin account not found"));

        User user = userRepository.findById(userId)
                .orElseThrow(() -> new AppException(HttpStatus.NOT_FOUND, "USER_NOT_FOUND", "User not found"));

        if (request.decision() != AdminRequestStatus.APPROVED && request.decision() != AdminRequestStatus.DENIED) {
            throw new AppException(HttpStatus.BAD_REQUEST, "INVALID_ADMIN_REQUEST_DECISION", "Decision must be APPROVED or DENIED");
        }

        boolean isPrimaryAdmin = isPrimaryAdminEmail(actingAdmin.getEmail());
        boolean isPrimaryAdminTarget = isPrimaryAdminEmail(user.getEmail());
        boolean isApprovedAdmin = user.getAdminRequestStatus() == AdminRequestStatus.APPROVED && user.getRole() == Role.ADMIN;
        boolean canDemoteApprovedAdmin =
                request.decision() == AdminRequestStatus.DENIED
                        && isPrimaryAdmin
                        && !isPrimaryAdminTarget
                        && isApprovedAdmin;

        if (request.decision() == AdminRequestStatus.DENIED && isApprovedAdmin) {
            if (!isPrimaryAdmin) {
                throw new AppException(HttpStatus.FORBIDDEN, "PRIMARY_ADMIN_REQUIRED", "Only the primary admin can remove admin access");
            }

            if (isPrimaryAdminTarget) {
                throw new AppException(HttpStatus.CONFLICT, "PRIMARY_ADMIN_PROTECTED", "The primary admin account cannot be demoted");
            }
        }

        if (user.getAdminRequestStatus() != AdminRequestStatus.PENDING && !canDemoteApprovedAdmin) {
            throw new AppException(HttpStatus.CONFLICT, "ADMIN_REQUEST_NOT_PENDING", "Only pending requests can be reviewed");
        }

        user.setAdminRequestStatus(request.decision());
        user.setAdminRequestReviewedAt(Instant.now());
        user.setAdminRequestReviewedBy(adminId);
        user.setAdminRequestDecisionNote(normalizeBlank(request.note()));

        if (request.decision() == AdminRequestStatus.APPROVED) {
            user.setRole(Role.ADMIN);
        }

        if (canDemoteApprovedAdmin) {
            user.setRole(Role.STUDENT);
            if (user.getAdminRequestDecisionNote() == null || user.getAdminRequestDecisionNote().isBlank()) {
                user.setAdminRequestDecisionNote("Admin access removed by primary admin");
            }
        }

        return toPayload(userRepository.save(user));
    }

    public UserProfilePayload demoteAdmin(String adminId, String userId, DemoteAdminRequest request) {
        return reviewAdminRequest(
                adminId,
                userId,
                new ReviewAdminAccessRequest(
                        AdminRequestStatus.DENIED,
                        request.note() == null || request.note().isBlank()
                                ? "Admin access removed by primary admin"
                                : request.note()
                )
        );
    }

    private UserProfilePayload toPayload(User user) {
        return new UserProfilePayload(
                user.getId(),
                user.getName(),
                user.getEmail(),
                user.getRole(),
                isPrimaryAdminEmail(user.getEmail()),
                user.getAdminRequestStatus(),
                user.getAdminRequestMessage(),
                user.getAdminRequestRequestedAt(),
                user.getAdminRequestReviewedAt(),
                user.getAdminRequestDecisionNote(),
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

    private String normalizeBlank(String value) {
        if (value == null) {
            return "";
        }
        String trimmed = value.trim();
        return trimmed.isEmpty() ? "" : trimmed;
    }

    private boolean isPrimaryAdminEmail(String email) {
        return normalizeEmail(email).equals(normalizeEmail(adminAuthProperties.adminLoginEmail()));
    }

    private String normalizeEmail(String email) {
        return email == null ? "" : email.trim().toLowerCase();
    }
}
