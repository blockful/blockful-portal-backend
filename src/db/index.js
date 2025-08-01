"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const { drizzle } = require("drizzle-orm/node-postgres");
const { Pool } = require("pg");
const schema = require("./schema");
const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
});
const db = drizzle(pool, { schema });
module.exports = { db };
//# sourceMappingURL=index.js.map