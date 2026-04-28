import { User } from './user.model.js';
import { env } from '../../config/env.js';
import { ROLES } from '../../shared/enums/roles.js';

const profileSelection = [
  'name',
  'email',
  'role',
  'departmentId',
  'isActive',
  'lastLoginAt',
  'createdAt',
  'updatedAt',
  'adminRequestStatus',
  'adminRequestMessage',
  'adminRequestRequestedAt',
  'adminRequestReviewedAt',
  'adminRequestReviewedBy',
  'adminRequestDecisionNote'
].join(' ');

function normalizeValue(value) {
  return String(value || '').trim().toUpperCase();
}

function isPrimaryAdminEmail(email) {
  return String(email || '').trim().toLowerCase() === env.adminLoginEmail;
}

export const userService = {
  async listStudents() {
    return User.find({ role: 'STUDENT' }).select('name email role').sort({ createdAt: -1 });
  },

  async getProfile(userId) {
    const user = await User.findById(userId).select(profileSelection);
    if (!user) {
      const err = new Error('User not found');
      err.status = 404;
      err.code = 'USER_NOT_FOUND';
      throw err;
    }
    return user;
  },

  async updateProfile(userId, payload) {
    const allowed = {
      name: payload.name,
      departmentId: payload.departmentId
    };

    const profile = await User.findByIdAndUpdate(userId, allowed, {
      new: true,
      runValidators: true
    }).select(profileSelection);

    if (!profile) {
      const err = new Error('User not found');
      err.status = 404;
      err.code = 'USER_NOT_FOUND';
      throw err;
    }

    return profile;
  },

  async requestAdminAccess(userId, payload) {
    const user = await User.findById(userId).select(profileSelection);
    if (!user) {
      const err = new Error('User not found');
      err.status = 404;
      err.code = 'USER_NOT_FOUND';
      throw err;
    }

    if (user.role === 'ADMIN') {
      const err = new Error('You already have admin access');
      err.status = 409;
      err.code = 'ADMIN_ACCESS_EXISTS';
      throw err;
    }

    if (user.adminRequestStatus === 'PENDING') {
      const err = new Error('An admin access request is already pending');
      err.status = 409;
      err.code = 'ADMIN_REQUEST_PENDING';
      throw err;
    }

    user.adminRequestStatus = 'PENDING';
    user.adminRequestMessage = payload.message || '';
    user.adminRequestRequestedAt = new Date();
    user.adminRequestReviewedAt = null;
    user.adminRequestReviewedBy = null;
    user.adminRequestDecisionNote = '';
    await user.save();

    return user;
  },

  async listAdminRequests() {
    const users = await User.find({ adminRequestStatus: { $in: ['PENDING', 'APPROVED', 'DENIED'] } })
      .select('name email role adminRequestStatus adminRequestMessage adminRequestRequestedAt adminRequestReviewedAt adminRequestDecisionNote createdAt')
      .sort({ adminRequestRequestedAt: -1, createdAt: -1 });

    return users.map((user) => ({
      ...user.toObject(),
      isPrimaryAdmin: isPrimaryAdminEmail(user.email)
    }));
  },

  async reviewAdminRequest(adminId, userId, payload) {
    const actingAdmin = await User.findById(adminId).select('email role');
    if (!actingAdmin) {
      const err = new Error('Admin account not found');
      err.status = 404;
      err.code = 'USER_NOT_FOUND';
      throw err;
    }

    const user = await User.findById(userId).select(profileSelection);
    if (!user) {
      const err = new Error('User not found');
      err.status = 404;
      err.code = 'USER_NOT_FOUND';
      throw err;
    }

    const requestStatus = normalizeValue(user.adminRequestStatus);
    const userRole = normalizeValue(user.role);
    const isPrimaryAdmin = isPrimaryAdminEmail(actingAdmin.email);
    const isPrimaryAdminTarget = isPrimaryAdminEmail(user.email);
    const isApprovedAdmin = requestStatus === 'APPROVED' && userRole === ROLES.ADMIN;
    const canDemoteApprovedAdmin = payload.decision === 'DENIED' && isPrimaryAdmin && !isPrimaryAdminTarget && isApprovedAdmin;

    if (payload.decision === 'DENIED' && isApprovedAdmin) {
      if (!isPrimaryAdmin) {
        const err = new Error('Only the primary admin can remove admin access');
        err.status = 403;
        err.code = 'PRIMARY_ADMIN_REQUIRED';
        throw err;
      }

      if (isPrimaryAdminTarget) {
        const err = new Error('The primary admin account cannot be demoted');
        err.status = 409;
        err.code = 'PRIMARY_ADMIN_PROTECTED';
        throw err;
      }
    }

    if (requestStatus !== 'PENDING' && !canDemoteApprovedAdmin) {
      const err = new Error('Only pending requests can be reviewed');
      err.status = 409;
      err.code = 'ADMIN_REQUEST_NOT_PENDING';
      throw err;
    }

    user.adminRequestStatus = payload.decision;
    user.adminRequestReviewedAt = new Date();
    user.adminRequestReviewedBy = adminId;
    user.adminRequestDecisionNote = payload.note || '';

    if (payload.decision === 'APPROVED') {
      user.role = 'ADMIN';
    }

    if (canDemoteApprovedAdmin) {
      user.role = ROLES.STUDENT;
      if (!user.adminRequestDecisionNote) {
        user.adminRequestDecisionNote = 'Admin access removed by primary admin';
      }
    }

    await user.save();
    return user;
  },

  async demoteAdmin(adminId, userId, payload) {
    return this.reviewAdminRequest(adminId, userId, {
      decision: 'DENIED',
      note: payload.note || 'Admin access removed by primary admin'
    });
  }
};
