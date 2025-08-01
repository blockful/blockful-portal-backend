const {
  pgTable,
  serial,
  text,
  timestamp,
  boolean,
  decimal,
  integer,
} = require("drizzle-orm/pg-core");

const users = pgTable("users", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  googleId: text("google_id").unique(),
  avatar: text("avatar"),
  isActive: boolean("is_active").default(true).notNull(),
  lastLogin: timestamp("last_login"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

const reimbursements = pgTable("reimbursements", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
  currency: text("currency").default("USD").notNull(),
  description: text("description"),
  invoiceDate: timestamp("invoice_date").notNull(),
  status: text("status").default("pending").notNull(), // pending, approved, rejected, paid
  filePath: text("file_path"), // Path to uploaded file
  fileName: text("file_name"), // Original filename
  fileSize: integer("file_size"), // File size in bytes
  mimeType: text("mime_type"), // File MIME type
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

module.exports = { users, reimbursements };
