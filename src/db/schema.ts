const { pgTable, serial, text, timestamp, boolean, decimal, integer } = require("drizzle-orm/pg-core");

const reimbursements = pgTable("reimbursements", {
  id: serial("id").primaryKey(),
  userName: text("user_name").notNull(),
  userEmail: text("user_email").notNull(),
  userAddress: text("user_address"),
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

module.exports = { reimbursements };
