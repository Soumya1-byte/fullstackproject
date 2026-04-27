import { Router } from 'express';
import { userController } from './user.controller.js';
import { authMiddleware } from '../../middleware/auth.middleware.js';
import { roleMiddleware } from '../../middleware/role.middleware.js';
import { ROLES } from '../../shared/enums/roles.js';
import { validate } from '../../middleware/validate.middleware.js';
import { requestAdminAccessSchema, reviewAdminAccessSchema } from './user.validation.js';

const router = Router();

router.use(authMiddleware);
router.get('/me', userController.me);
router.patch('/me', userController.updateMe);
router.get('/students', roleMiddleware(ROLES.ADMIN), userController.listStudents);
router.post('/admin-request', roleMiddleware(ROLES.STUDENT), validate(requestAdminAccessSchema), userController.requestAdminAccess);
router.get('/admin-requests', roleMiddleware(ROLES.ADMIN), userController.listAdminRequests);
router.patch('/admin-requests/:userId', roleMiddleware(ROLES.ADMIN), validate(reviewAdminAccessSchema), userController.reviewAdminRequest);

export default router;
