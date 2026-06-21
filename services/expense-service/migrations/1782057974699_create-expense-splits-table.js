export const up = (pgm) => {
  pgm.createTable('expense_splits', {
    id: {
      type: 'uuid',
      primaryKey: true,
      default: pgm.func('gen_random_uuid()'),
    },
    expense_id: {
      type: 'uuid',
      notNull: true,
      references: '"expenses"',
      onDelete: 'CASCADE',
    },
    user_id: {
      type: 'uuid',
      notNull: true,
      references: '"users"',
      onDelete: 'CASCADE',
    },
    amount: {
      type: 'numeric(12,2)',
      notNull: true,
    },
  });

  pgm.createIndex('expense_splits', 'expense_id');
  pgm.createIndex('expense_splits', 'user_id');
  pgm.addConstraint('expense_splits', 'unique_expense_user_split', 'UNIQUE (expense_id, user_id)');
  pgm.addConstraint('expense_splits', 'non_negative_split', 'CHECK (amount >= 0)');
};

export const down = (pgm) => {
  pgm.dropTable('expense_splits');
};
