export const up = (pgm) => {
  pgm.createTable('expenses', {
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
    description: {
      type: 'varchar(255)',
      notNull: true,
    },
    amount: {
      type: 'numeric(12,2)',
      notNull: true,
    },
    split_type: {
      type: 'varchar(10)',
      notNull: true,
      default: "'equal'",
    },
    date: {
      type: 'timestamptz',
      notNull: true,
      default: pgm.func('now()'),
    },
    created_at: {
      type: 'timestamptz',
      notNull: true,
      default: pgm.func('now()'),
    },
  });

  pgm.createIndex('expenses', 'group_id');
  pgm.createIndex('expenses', 'paid_by');
  pgm.addConstraint('expenses', 'valid_split_type', "CHECK (split_type IN ('equal', 'exact', 'percentage'))");
  pgm.addConstraint('expenses', 'positive_amount', 'CHECK (amount > 0)');
};

export const down = (pgm) => {
  pgm.dropTable('expenses');
};
