import { Course } from './course.model.js';
import { User } from '../users/user.model.js';
import { ROLES } from '../../shared/enums/roles.js';

function normalizeStudentIds(studentIds = []) {
  return [...new Set(studentIds.map((studentId) => String(studentId || '').trim()).filter(Boolean))];
}

export const courseService = {
  async list(user) {
    if (user.role === 'ADMIN') {
      return Course.find({ adminId: user.sub }).sort({ createdAt: -1 });
    }
    return Course.find({ assignedStudentIds: user.sub }).sort({ createdAt: -1 });
  },

  async create(user, payload) {
    return Course.create({ ...payload, adminId: user.sub });
  },

  async update(user, id, payload) {
    const course = await Course.findOneAndUpdate({ _id: id, adminId: user.sub }, payload, { new: true });
    if (!course) {
      const err = new Error('Course not found');
      err.status = 404;
      err.code = 'COURSE_NOT_FOUND';
      throw err;
    }
    return course;
  },

  async remove(user, id) {
    const deleted = await Course.findOneAndDelete({ _id: id, adminId: user.sub });
    if (!deleted) {
      const err = new Error('Course not found');
      err.status = 404;
      err.code = 'COURSE_NOT_FOUND';
      throw err;
    }
    return { deleted: true };
  },

  async assignStudents(user, id, studentIds) {
    const uniqueStudentIds = normalizeStudentIds(studentIds);
    const matchedStudents = await User.find({
      _id: { $in: uniqueStudentIds },
      role: ROLES.STUDENT
    }).select('_id');
    const validStudentIds = matchedStudents.map((student) => student._id);
    const course = await Course.findOneAndUpdate(
      { _id: id, adminId: user.sub },
      { $set: { assignedStudentIds: validStudentIds } },
      { new: true }
    );

    if (!course) {
      const err = new Error('Course not found');
      err.status = 404;
      err.code = 'COURSE_NOT_FOUND';
      throw err;
    }

    return course;
  }
};
