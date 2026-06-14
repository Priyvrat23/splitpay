export const up = (pgm) => {
  pgm.createExtension("citext", { ifNotExists: true });

  pgm.createTable("users", {
    id: {
      type: "uuid",
      primaryKey: true,
      default: pgm.func("gen_random_uuid()"),
    },
    email: {
      type: "citext",
      notNull: true,
      unique: true,
    },
    password_hash: {
      type: "text",
      notNull: true,
    },
    full_name: {
      type: "varchar(100)",
      notNull: true,
    },
    avatar_color: {
      type: "char(7)",
      notNull: true,
      default: "#E50914",
    },
    is_active: {
      type: "boolean",
      notNull: true,
      default: true,
    },
    created_at: {
      type: "timestamptz",
      notNull: true,
      default: pgm.func("now()"),
    },
    updated_at: {
      type: "timestamptz",
      notNull: true,
      default: pgm.func("now()"),
    },
  });

  pgm.createIndex("users", "email");
};

export const down = (pgm) => {
  pgm.dropTable("users");
};