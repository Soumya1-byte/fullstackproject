import { FeedbackForm } from './feedbackForm.model.js';
import { Course } from '../courses/course.model.js';

export const feedbackFormService = {
  async create(user, payload) {
    const course = await Course.findById(payload.courseId);
    if (!course || course.adminId.toString() !== user.sub) {
      const err = new Error('Invalid course access');
      err.status = 403;
      err.code = 'COURSE_ACCESS_DENIED';
      throw err;
    }

    return FeedbackForm.create({ ...payload, createdBy: user.sub });
  },

  async list(user) {
    if (user.role === 'ADMIN') {
      return FeedbackForm.find({ createdBy: user.sub }).sort({ createdAt: -1 });
    }

    const courses = await Course.find({ assignedStudentIds: user.sub }).select('_id');
    const ids = courses.map((course) => course._id);
    return FeedbackForm.find({ courseId: { $in: ids }, status: 'PUBLISHED' }).sort({ createdAt: -1 });
  },

  async getById(user, id) {
    const form = await FeedbackForm.findById(id);
    if (!form) {
      const err = new Error('Form not found');
      err.status = 404;
      err.code = 'FORM_NOT_FOUND';
      throw err;
    }

    if (user.role === 'ADMIN' && form.createdBy.toString() !== user.sub) {
      const err = new Error('Access denied');
      err.status = 403;
      err.code = 'FORM_ACCESS_DENIED';
      throw err;
    }

    if (user.role !== 'ADMIN') {
      if (form.status !== 'PUBLISHED') {
        const err = new Error('Form not available');
        err.status = 404;
        err.code = 'FORM_NOT_AVAILABLE';
        throw err;
      }

      const course = await Course.findById(form.courseId).select('assignedStudentIds');
      const isAssigned = course?.assignedStudentIds?.some((studentId) => studentId.toString() === user.sub);
      if (!isAssigned) {
        const err = new Error('Access denied');
        err.status = 403;
        err.code = 'FORM_ACCESS_DENIED';
        throw err;
      }
    }

    return form;
  },

  async update(user, id, payload) {
    const form = await FeedbackForm.findOneAndUpdate({ _id: id, createdBy: user.sub }, payload, { new: true });
    if (!form) {
      const err = new Error('Form not found');
      err.status = 404;
      err.code = 'FORM_NOT_FOUND';
      throw err;
    }
    return form;
  },

  async publish(user, id) {
    return this.update(user, id, { status: 'PUBLISHED', publishAt: new Date() });
  },

  async close(user, id) {
    return this.update(user, id, { status: 'CLOSED', closeAt: new Date() });
  }
};
