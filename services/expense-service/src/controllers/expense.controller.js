import { query } from '../db.js';
import redis from '../redis.js';
import { createExpenseSchema, createSettlementSchema } from '../validators/expense.validators.js';
import { calculateSplits } from '../utils/split.utils.js';
import { simplifyDebts } from '../utils/debt.utils.js';

export const createExpense = async (req, res) => {
  const result = createExpenseSchema.safeParse(req.body);
  if (!result.success) {
    return res.status(400).json({ error: result.error.flatten() });
  }

  const { description, amount, split_type, splits } = result.data;
  const { groupId } = req.params;
  const userId = req.user.id;

  try {
    const membership = await query(
      'SELECT id FROM group_members WHERE group_id = $1 AND user_id = $2',
      [groupId, userId]
    );
    if (membership.rows.length === 0) {
      return res.status(403).json({ error: 'You are not a member of this group' });
    }

    const membersResult = await query(
      'SELECT user_id FROM group_members WHERE group_id = $1',
      [groupId]
    );
    const memberIds = membersResult.rows.map((r) => r.user_id);

    const calculatedSplits = calculateSplits(amount, split_type, memberIds, splits);

    await query('BEGIN');

    const expenseResult = await query(
      `INSERT INTO expenses (group_id, paid_by, description, amount, split_type)
       VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      [groupId, userId, description, amount, split_type]
    );
    const expense = expenseResult.rows[0];

    for (const split of calculatedSplits) {
      await query(
        'INSERT INTO expense_splits (expense_id, user_id, amount) VALUES ($1, $2, $3)',
        [expense.id, split.user_id, split.amount]
      );
    }

    await query('COMMIT');

    await redis.publish('expense:created', JSON.stringify({
      expenseId: expense.id,
      groupId,
      paidBy: userId,
      amount,
      splitType: split_type,
    }));

    return res.status(201).json({ expense, splits: calculatedSplits });
  } catch (err) {
    await query('ROLLBACK');
    console.error('createExpense error:', err);
    return res.status(500).json({ error: err.message || 'Failed to create expense' });
  }
};

export const getExpenses = async (req, res) => {
  const { groupId } = req.params;
  try {
    const membership = await query(
      'SELECT id FROM group_members WHERE group_id = $1 AND user_id = $2',
      [groupId, req.user.id]
    );
    if (membership.rows.length === 0) {
      return res.status(403).json({ error: 'You are not a member of this group' });
    }

    const result = await query(
      `SELECT e.*, u.full_name as paid_by_name
       FROM expenses e
       INNER JOIN users u ON e.paid_by = u.id
       WHERE e.group_id = $1
       ORDER BY e.created_at DESC`,
      [groupId]
    );
    return res.json({ expenses: result.rows });
  } catch (err) {
    console.error('getExpenses error:', err);
    return res.status(500).json({ error: 'Failed to fetch expenses' });
  }
};

export const getBalances = async (req, res) => {
  const { groupId } = req.params;
  try {
    const membership = await query(
      'SELECT id FROM group_members WHERE group_id = $1 AND user_id = $2',
      [groupId, req.user.id]
    );
    if (membership.rows.length === 0) {
      return res.status(403).json({ error: 'You are not a member of this group' });
    }

    const expenseResult = await query(
      'SELECT paid_by, amount FROM expenses WHERE group_id = $1',
      [groupId]
    );

    const splitResult = await query(
      `SELECT es.user_id, es.amount
       FROM expense_splits es
       INNER JOIN expenses e ON es.expense_id = e.id
       WHERE e.group_id = $1`,
      [groupId]
    );

    const settlementResult = await query(
      'SELECT paid_by, paid_to, amount FROM settlements WHERE group_id = $1',
      [groupId]
    );

    const balances = {};

    for (const exp of expenseResult.rows) {
      balances[exp.paid_by] = (balances[exp.paid_by] || 0) + parseFloat(exp.amount);
    }

    for (const split of splitResult.rows) {
      balances[split.user_id] = (balances[split.user_id] || 0) - parseFloat(split.amount);
    }

    for (const s of settlementResult.rows) {
      balances[s.paid_by] = (balances[s.paid_by] || 0) + parseFloat(s.amount);
      balances[s.paid_to] = (balances[s.paid_to] || 0) - parseFloat(s.amount);
    }

    const simplifiedDebts = simplifyDebts(balances);
    return res.json({ balances, simplifiedDebts });
  } catch (err) {
    console.error('getBalances error:', err);
    return res.status(500).json({ error: 'Failed to calculate balances' });
  }
};

export const createSettlement = async (req, res) => {
  const result = createSettlementSchema.safeParse(req.body);
  if (!result.success) {
    return res.status(400).json({ error: result.error.flatten() });
  }

  const { paid_to, amount } = result.data;
  const { groupId } = req.params;
  const userId = req.user.id;

  try {
    const membership = await query(
      'SELECT id FROM group_members WHERE group_id = $1 AND user_id = $2',
      [groupId, userId]
    );
    if (membership.rows.length === 0) {
      return res.status(403).json({ error: 'You are not a member of this group' });
    }

    const settlementResult = await query(
      `INSERT INTO settlements (group_id, paid_by, paid_to, amount)
       VALUES ($1, $2, $3, $4) RETURNING *`,
      [groupId, userId, paid_to, amount]
    );

    await redis.publish('settlement:created', JSON.stringify({
      settlementId: settlementResult.rows[0].id,
      groupId,
      paidBy: userId,
      paidTo: paid_to,
      amount,
    }));

    return res.status(201).json({ settlement: settlementResult.rows[0] });
  } catch (err) {
    console.error('createSettlement error:', err);
    return res.status(500).json({ error: 'Failed to record settlement' });
  }
};
