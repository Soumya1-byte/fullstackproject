import bcrypt from 'bcryptjs';
import { User } from '../users/user.model.js';
import { signAccessToken, signRefreshToken, verifyRefreshToken } from '../../shared/utils/jwt.js';
import { env } from '../../config/env.js';
import { ROLES } from '../../shared/enums/roles.js';

function buildAuthPayload(user) {
  const claims = { sub: user._id.toString(), role: user.role, tokenVersion: 1 };
  const accessToken = signAccessToken(claims);
  const refreshToken = signRefreshToken(claims);

  return {
    accessToken,
    refreshToken,
    user: {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      adminRequestStatus: user.adminRequestStatus || 'NONE',
      adminRequestRequestedAt: user.adminRequestRequestedAt || null,
      adminRequestReviewedAt: user.adminRequestReviewedAt || null
    }
  };
}

export const authService = {
  async register(payload) {
    const normalizedEmail = payload.email.toLowerCase();
    const isAdminRole = payload.role === ROLES.ADMIN;

    if (isAdminRole && normalizedEmail !== env.adminLoginEmail) {
      const err = new Error('Admin registration is restricted');
      err.status = 403;
      err.code = 'ADMIN_REGISTRATION_RESTRICTED';
      throw err;
    }

    const exists = await User.findOne({ email: normalizedEmail });
    if (exists) {
      const err = new Error('Email already in use');
      err.status = 409;
      err.code = 'EMAIL_CONFLICT';
      throw err;
    }

    const passwordHash = await bcrypt.hash(payload.password, 10);
    const user = await User.create({
      name: payload.name,
      email: normalizedEmail,
      passwordHash,
      role: payload.role
    });

    return buildAuthPayload(user);
  },

  async login(payload) {
    const normalizedEmail = payload.email.toLowerCase();

    if (normalizedEmail === env.adminLoginEmail) {
      if (payload.password !== env.adminLoginPassword) {
        const err = new Error('Invalid credentials');
        err.status = 401;
        err.code = 'INVALID_CREDENTIALS';
        throw err;
      }

      const passwordHash = await bcrypt.hash(env.adminLoginPassword, 10);
      const user = await User.findOneAndUpdate(
        { email: env.adminLoginEmail },
        {
          $set: {
            name: 'Soumya Mishra',
            email: env.adminLoginEmail,
            role: ROLES.ADMIN,
            passwordHash,
            isActive: true
          }
        },
        { new: true, upsert: true, setDefaultsOnInsert: true }
      );

      return buildAuthPayload(user);
    }

    const user = await User.findOne({ email: normalizedEmail });
    if (!user) {
      const err = new Error('Invalid credentials');
      err.status = 401;
      err.code = 'INVALID_CREDENTIALS';
      throw err;
    }

    const valid = await bcrypt.compare(payload.password, user.passwordHash);
    if (!valid) {
      const err = new Error('Invalid credentials');
      err.status = 401;
      err.code = 'INVALID_CREDENTIALS';
      throw err;
    }

    return buildAuthPayload(user);
  },

  async refresh(refreshToken) {
    if (!refreshToken) {
      const err = new Error('Missing refresh token');
      err.status = 401;
      err.code = 'UNAUTHORIZED';
      throw err;
    }

    let payload;
    try {
      payload = verifyRefreshToken(refreshToken);
    } catch {
      const err = new Error('Invalid refresh token');
      err.status = 401;
      err.code = 'UNAUTHORIZED';
      throw err;
    }
    const user = await User.findById(payload.sub).select('name email role adminRequestStatus adminRequestRequestedAt adminRequestReviewedAt');

    if (!user) {
      const err = new Error('User not found');
      err.status = 404;
      err.code = 'USER_NOT_FOUND';
      throw err;
    }

    return {
      accessToken: signAccessToken({ sub: user._id.toString(), role: user.role, tokenVersion: payload.tokenVersion || 1 }),
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        adminRequestStatus: user.adminRequestStatus || 'NONE',
        adminRequestRequestedAt: user.adminRequestRequestedAt || null,
        adminRequestReviewedAt: user.adminRequestReviewedAt || null
      }
    };
  },

  async me(userId) {
    const user = await User.findById(userId).select('name email role adminRequestStatus adminRequestRequestedAt adminRequestReviewedAt');
    if (!user) {
      const err = new Error('User not found');
      err.status = 404;
      err.code = 'USER_NOT_FOUND';
      throw err;
    }
    return {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      adminRequestStatus: user.adminRequestStatus || 'NONE',
      adminRequestRequestedAt: user.adminRequestRequestedAt || null,
      adminRequestReviewedAt: user.adminRequestReviewedAt || null
    };
  }
};
