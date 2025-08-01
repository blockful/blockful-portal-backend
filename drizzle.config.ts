// drizzle.config.ts
require("dotenv/config");
const { defineConfig } = require("drizzle-kit");

module.exports = defineConfig({
  /* --- core options ------------------------------------- */
  dialect: "postgresql", // which DB engine you're talking to
  schema: "./src/db/schema.ts", // where your table definitions live
  out: "./drizzle", // where migration SQL & snapshots go

  /* --- how to reach the database ------------------------ */
  dbCredentials: {
    url: process.env.DATABASE_URL!, // e.g. postgres://user:pw@host:5432/db
  },

  /* --- (nice-to-have, toggle as you like) --------------- */
  strict: true, // fail if a migration would lose data
  verbose: false, // set true to print SQL during CLI runs
});
