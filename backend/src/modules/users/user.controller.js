import { userService } from './user.service.js';

export const userController = {
  async me(req, res, next) {
    try {
      const data = await userService.getProfile(req.user.sub);
      res.json({ success: true, data });
    } catch (error) {
      next(error);
    }
  },

  async updateMe(req, res, next) {
    try {
      const data = await userService.updateProfile(req.user.sub, req.body);
      res.json({ success: true, data });
    } catch (error) {
      next(error);
    }
  },

  async listStudents(_req, res, next) {
    try {
      const data = await userService.listStudents();
      res.json({ success: true, data });
    } catch (error) {
      next(error);
    }
  },

  async requestAdminAccess(req, res, next) {
    try {
      const data = await userService.requestAdminAccess(req.user.sub, req.body);
      res.json({ success: true, data });
    } catch (error) {
      next(error);
    }
  },

  async listAdminRequests(_req, res, next) {
    try {
      const data = await userService.listAdminRequests();
      res.json({ success: true, data });
    } catch (error) {
      next(error);
    }
  },

  async reviewAdminRequest(req, res, next) {
    try {
      const data = await userService.reviewAdminRequest(req.user.sub, req.params.userId, req.body);
      res.json({ success: true, data });
    } catch (error) {
      next(error);
    }
  }
};
