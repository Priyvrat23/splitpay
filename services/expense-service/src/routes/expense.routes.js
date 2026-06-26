import { Router } from 'express';
import { authenticate } from '../utils/auth.middleware.js';
import { createExpense, getExpenses, getBalances, createSettlement } from '../controllers/expense.controller.js';

const router = Router();

router.use(authenticate);

router.post('/:groupId', createExpense);
router.get('/:groupId', getExpenses);
router.get('/:groupId/balances', getBalances);
router.post('/:groupId/settlements', createSettlement);

export default router;
