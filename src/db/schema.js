"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const { pgTable, serial, text, timestamp, boolean, } = require("drizzle-orm/pg-core");
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
module.exports = { users };
//# sourceMappingURL=schema.js.map