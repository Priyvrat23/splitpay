export const up = (pgm) => {
  pgm.createTable('settlements', {
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
    paid_by: {
      type: 'uuid',
      notNull: true,
      references: '"users"',
      onDelete: 'CASCADE',
    },
    paid_to: {
      type: 'uuid',
      notNull: true,
      references: '"users"',
      onDelete: 'CASCADE',
    },
    amount: {
      type: 'numeric(12,2)',
      notNull: true,
    },
    created_at: {
      type: 'timestamptz',
      notNull: true,
      default: pgm.func('now()'),
    },
  });

  pgm.createIndex('settlements', 'group_id');
  pgm.createIndex('settlements', 'paid_by');
  pgm.createIndex('settlements', 'paid_to');
  pgm.addConstraint('settlements', 'positive_settlement', 'CHECK (amount > 0)');
  pgm.addConstraint('settlements', 'no_self_settlement', 'CHECK (paid_by <> paid_to)');
};

export const down = (pgm) => {
  pgm.dropTable('settlements');
};
