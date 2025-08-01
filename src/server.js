"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
require("dotenv/config");
const Fastify = require("fastify");
const { db } = require("./db");
const { users } = require("./db/schema");
const authRoutes = require("./auth/routes");
const { requireAuth, optionalAuth } = require("./auth/middleware");
const fastify = Fastify({
    logger: true,
});
// Register CORS support
fastify.register(require("@fastify/cors"), {
    origin: process.env.FRONTEND_URL || "http://localhost:3000",
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
});
// Register cookie support (required for sessions)
fastify.register(require("@fastify/cookie"));
// Register session support
fastify.register(require("@fastify/session"), {
    secret: process.env.SESSION_SECRET || "your-secret-key-change-this-in-production",
    cookie: {
        secure: process.env.NODE_ENV === "production", // Use secure cookies in production
        httpOnly: true,
        maxAge: 24 * 60 * 60 * 1000, // 24 hours
        sameSite: "lax",
    },
});
// Register Google OAuth2
fastify.register(require("@fastify/oauth2"), {
    name: "googleOAuth2",
    scope: ["profile", "email"],
    credentials: {
        client: {
            id: process.env.GOOGLE_CLIENT_ID,
            secret: process.env.GOOGLE_CLIENT_SECRET,
        },
        auth: require("@fastify/oauth2").GOOGLE_CONFIGURATION,
    },
    callbackUri: process.env.GOOGLE_REDIRECT_URI ||
        "http://localhost:4000/auth/google/callback",
});
// Hello World endpoint (with optional auth to show user info if logged in)
fastify.get("/", { preHandler: optionalAuth }, async (request, reply) => {
    const user = request.user;
    return {
        message: "Hello World from Fastify + Drizzle + Google OAuth!",
        user: user
            ? {
                name: user.name,
                email: user.email,
                avatar: user.avatar,
            }
            : null,
        loginUrl: user ? null : "/auth/google",
    };
});
// Get all users
fastify.get("/users", async (request, reply) => {
    try {
        const allUsers = await db.select().from(users);
        return { users: allUsers };
    }
    catch (error) {
        reply.code(500).send({ error: "Failed to fetch users" });
    }
});
// Create a new user (protected route)
fastify.post("/users", { preHandler: requireAuth }, async (request, reply) => {
    try {
        const { name, email } = request.body;
        if (!name || !email) {
            reply.code(400).send({ error: "Name and email are required" });
            return;
        }
        const newUser = await db
            .insert(users)
            .values({ name, email })
            .returning();
        reply.code(201).send({ user: newUser[0] });
    }
    catch (error) {
        reply.code(500).send({ error: "Failed to create user" });
    }
});
// Dashboard (protected route example)
fastify.get("/dashboard", { preHandler: requireAuth }, async (request, reply) => {
    const user = request.user;
    try {
        // Get some stats for the dashboard
        const totalUsers = await db.select().from(users);
        return {
            message: "Welcome to your dashboard!",
            user: {
                name: user.name,
                email: user.email,
                avatar: user.avatar,
                lastLogin: user.lastLogin,
            },
            stats: {
                totalUsers: totalUsers.length,
            },
            actions: [
                { label: "View Profile", url: "/auth/me" },
                { label: "View Users", url: "/users" },
                { label: "Logout", url: "/auth/logout" },
            ],
        };
    }
    catch (error) {
        reply.code(500).send({ error: "Failed to load dashboard" });
    }
});
// Register authentication routes
fastify.register(authRoutes, { prefix: "/auth" });
// Serve static files (for login page)
fastify.register(require("@fastify/static"), {
    root: require("path").join(__dirname, "..", "public"),
    prefix: "/",
});
// Login page route
fastify.get("/login", async (request, reply) => {
    return reply.sendFile("login.html");
});
// Start server
const start = async () => {
    try {
        const port = Number(process.env.PORT) || 4000;
        const host = process.env.HOST || "0.0.0.0";
        await fastify.listen({ port, host });
        console.log(`🚀 Server running at http://${host}:${port}`);
    }
    catch (err) {
        fastify.log.error(err);
        process.exit(1);
    }
};
start();
//# sourceMappingURL=server.js.map