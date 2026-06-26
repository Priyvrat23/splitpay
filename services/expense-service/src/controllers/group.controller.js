import { query } from '../db.js';
import { createGroupSchema, addMemberSchema } from '../validators/group.validators.js';

export const createGroup = async (req, res) => {
  const result = createGroupSchema.safeParse(req.body);
  if (!result.success) {
    return res.status(400).json({ error: result.error.flatten() });
  }

  const { name } = result.data;
  const userId = req.user.id;

  try {
    await query('BEGIN');

    const groupResult = await query(
      'INSERT INTO groups (name, created_by) VALUES ($1, $2) RETURNING *',
      [name, userId]
    );
    const group = groupResult.rows[0];

    await query(
      'INSERT INTO group_members (group_id, user_id) VALUES ($1, $2)',
      [group.id, userId]
    );

    await query('COMMIT');
    return res.status(201).json({ group });
  } catch (err) {
    await query('ROLLBACK');
    console.error('createGroup error:', err);
    return res.status(500).json({ error: 'Failed to create group' });
  }
};

export const addMember = async (req, res) => {
  const result = addMemberSchema.safeParse(req.body);
  if (!result.success) {
    return res.status(400).json({ error: result.error.flatten() });
  }

  const { user_id } = result.data;
  const { groupId } = req.params;

  try {
    const membership = await query(
      'SELECT id FROM group_members WHERE group_id = $1 AND user_id = $2',
      [groupId, req.user.id]
    );
    if (membership.rows.length === 0) {
      return res.status(403).json({ error: 'You are not a member of this group' });
    }

    await query(
      'INSERT INTO group_members (group_id, user_id) VALUES ($1, $2)',
      [groupId, user_id]
    );

    return res.status(201).json({ message: 'Member added successfully' });
  } catch (err) {
    if (err.code === '23505') {
      return res.status(409).json({ error: 'User is already a member of this group' });
    }
    console.error('addMember error:', err);
    return res.status(500).json({ error: 'Failed to add member' });
  }
};

export const getGroups = async (req, res) => {
  try {
    const result = await query(
      `SELECT g.* FROM groups g
       INNER JOIN group_members gm ON g.id = gm.group_id
       WHERE gm.user_id = $1
       ORDER BY g.created_at DESC`,
      [req.user.id]
    );
    return res.json({ groups: result.rows });
  } catch (err) {
    console.error('getGroups error:', err);
    return res.status(500).json({ error: 'Failed to fetch groups' });
  }
};

export const getGroupMembers = async (req, res) => {
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
      `SELECT u.id, u.full_name, u.email, u.avatar_color
       FROM users u
       INNER JOIN group_members gm ON u.id = gm.user_id
       WHERE gm.group_id = $1`,
      [groupId]
    );
    return res.json({ members: result.rows });
  } catch (err) {
    console.error('getGroupMembers error:', err);
    return res.status(500).json({ error: 'Failed to fetch members' });
  }
};
