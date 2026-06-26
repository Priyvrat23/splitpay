import { Router } from 'express';
import { authenticate } from '../utils/auth.middleware.js';
import { createGroup, addMember, getGroups, getGroupMembers } from '../controllers/group.controller.js';

const router = Router();

router.use(authenticate);

router.post('/', createGroup);
router.get('/', getGroups);
router.post('/:groupId/members', addMember);
router.get('/:groupId/members', getGroupMembers);

export default router;
