export const up = (pgm) => {
  pgm.createTable('group_members', {
    id: {
      type: 'uuid',
      primaryKey: true,
      default: pgm.func('gen_random_uuid()'),
    },
    group_id: {
      type: 'uuid',
      notNull: true,
      references: '"groups"',
      onDelete: 'CASCADE',
    },
    user_id: {
      type: 'uuid',
      notNull: true,
      references: '"users"',
      onDelete: 'CASCADE',
    },
    joined_at: {
      type: 'timestamptz',
      notNull: true,
      default: pgm.func('now()'),
    },
  });

  pgm.createIndex('group_members', 'group_id');
  pgm.createIndex('group_members', 'user_id');
  pgm.addConstraint('group_members', 'unique_group_member', 'UNIQUE (group_id, user_id)');
};

export const down = (pgm) => {
  pgm.dropTable('group_members');
};
