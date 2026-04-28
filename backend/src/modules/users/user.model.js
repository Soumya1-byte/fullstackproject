import mongoose from 'mongoose';
import { ROLES } from '../../shared/enums/roles.js';

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, index: true },
    passwordHash: { type: String, required: true },
    role: { type: String, enum: Object.values(ROLES), required: true },
    adminRequestStatus: { type: String, enum: ['NONE', 'PENDING', 'APPROVED', 'DENIED'], default: 'NONE' },
    adminRequestMessage: { type: String, default: '' },
    adminRequestRequestedAt: { type: Date, default: null },
    adminRequestReviewedAt: { type: Date, default: null },
    adminRequestReviewedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    adminRequestDecisionNote: { type: String, default: '' },
    isActive: { type: Boolean, default: true },
    departmentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Department', default: null },
    lastLoginAt: { type: Date, default: null }
  },
  { timestamps: true }
);

export const User = mongoose.model('User', userSchema);
