"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const { createOrUpdateUser, getUserById, getUserByEmail, getUserByGoogleId } = require("./utils");
const { requireAuth, validateGoogleToken } = require("./middleware");
async function authRoutes(fastify, options) {
    // Development mock login (REMOVE IN PRODUCTION!)
    fastify.get("/mock-login", async (request, reply) => {
        try {
            // Mock user data for testing
            const mockUser = {
                id: "mock123",
                email: "test@blockful.io",
                name: "Test User",
                picture: "https://via.placeholder.com/150",
            };
            // Create or update user in database
            const user = await createOrUpdateUser(mockUser);
            // Set session
            request.session.userId = user.id;
            request.session.user = {
                id: user.id,
                name: user.name,
                email: user.email,
                avatar: user.avatar,
            };
            fastify.log.info(`Mock user logged in: ${user.email}`);
            reply.redirect("/dashboard");
        }
        catch (error) {
            fastify.log.error("Mock login error:", error);
            reply.code(500).send({
                error: "Mock login failed",
                message: error.message,
            });
        }
    });
    // Initiate Google OAuth login
    fastify.get("/google", async (request, reply) => {
        try {
            const redirectUrl = await fastify.googleOAuth2.generateAuthorizationUri(request, reply);
            reply.redirect(redirectUrl);
        }
        catch (error) {
            fastify.log.error("OAuth initiation error - Full details:", error);
            console.error("GOOGLE OAUTH ERROR:", error);
            reply.code(500).send({
                error: "Authentication failed",
                message: "Could not initiate Google login",
                debug: error instanceof Error ? error.message : String(error),
            });
        }
    });
    // Handle Google OAuth callback
    fastify.get("/google/callback", async (request, reply) => {
        try {
            // Exchange code for token
            const { token } = await fastify.googleOAuth2.getAccessTokenFromAuthorizationCodeFlow(request);
            // Get user profile from Google
            const response = await fetch("https://www.googleapis.com/oauth2/v2/userinfo", {
                headers: {
                    Authorization: `Bearer ${token.access_token}`,
                },
            });
            if (!response.ok) {
                throw new Error("Failed to fetch user profile from Google");
            }
            const googleProfile = await response.json();
            // Create or update user in database
            const user = await createOrUpdateUser(googleProfile);
            // Set session
            request.session.userId = user.id;
            request.session.user = {
                id: user.id,
                name: user.name,
                email: user.email,
                avatar: user.avatar,
            };
            fastify.log.info(`User logged in: ${user.email}`);
            // Redirect to dashboard or home
            reply.redirect("/dashboard");
        }
        catch (error) {
            fastify.log.error("OAuth callback error:", error);
            // Handle domain restriction error specifically
            if (error.message.includes("email addresses are allowed")) {
                reply.code(403).send({
                    error: "Access Denied",
                    message: error.message,
                    suggestion: "Please contact your administrator if you believe this is an error.",
                });
                return;
            }
            reply.code(500).send({
                error: "Authentication failed",
                message: "Could not complete Google login",
            });
        }
    });
    // Logout
    fastify.get("/logout", async (request, reply) => {
        try {
            if (request.session) {
                request.session.destroy();
            }
            reply.send({
                message: "Logged out successfully",
                loginUrl: "/auth/google",
            });
        }
        catch (error) {
            fastify.log.error("Logout error:", error);
            reply.code(500).send({
                error: "Logout failed",
                message: "Could not log out properly",
            });
        }
    });
    // Get current user info (protected route)
    fastify.get("/me", { preHandler: requireAuth }, async (request, reply) => {
        try {
            const user = request.user;
            reply.send({
                user: {
                    id: user.id,
                    name: user.name,
                    email: user.email,
                    avatar: user.avatar,
                    lastLogin: user.lastLogin,
                    createdAt: user.createdAt,
                },
            });
        }
        catch (error) {
            fastify.log.error("Get user error:", error);
            reply.code(500).send({
                error: "Failed to get user information",
            });
        }
    });
    // Test endpoint to debug token validation
    fastify.post("/test-token", async (request, reply) => {
        try {
            const authHeader = request.headers.authorization;
            if (!authHeader || !authHeader.startsWith('Bearer ')) {
                reply.code(401).send({
                    error: "No Bearer token provided",
                });
                return;
            }
            const token = authHeader.substring(7);
            const userInfo = await validateGoogleToken(token);
            if (!userInfo) {
                reply.code(401).send({
                    error: "Invalid token",
                });
                return;
            }
            reply.send({
                message: "Token is valid",
                userInfo: {
                    id: userInfo.id,
                    email: userInfo.email,
                    name: userInfo.name,
                },
            });
        }
        catch (error) {
            fastify.log.error("Test token error:", error);
            reply.code(500).send({
                error: "Token validation failed",
            });
        }
    });
    // NextAuth Integration Endpoints
    // Create user (for NextAuth adapter)
    fastify.post("/users", async (request, reply) => {
        try {
            const { name, email, image, googleId } = request.body;
            if (!email) {
                reply.code(400).send({ error: "Email is required" });
                return;
            }
            const user = await createOrUpdateUser({
                id: googleId,
                email,
                name,
                picture: image,
            });
            reply.code(201).send({ user });
        }
        catch (error) {
            fastify.log.error("Create user error:", error);
            reply.code(500).send({
                error: "Failed to create user",
                message: error.message,
            });
        }
    });
    // Get user by ID
    fastify.get("/users/:id", async (request, reply) => {
        try {
            const { id } = request.params;
            const user = await getUserById(parseInt(id));
            if (!user) {
                reply.code(404).send({ error: "User not found" });
                return;
            }
            reply.send({ user });
        }
        catch (error) {
            fastify.log.error("Get user error:", error);
            reply.code(500).send({ error: "Failed to get user" });
        }
    });
    // Get user by email
    fastify.get("/users/email/:email", async (request, reply) => {
        try {
            const { email } = request.params;
            const user = await getUserByEmail(email);
            if (!user) {
                reply.code(404).send({ error: "User not found" });
                return;
            }
            reply.send({ user });
        }
        catch (error) {
            fastify.log.error("Get user by email error:", error);
            reply.code(500).send({ error: "Failed to get user" });
        }
    });
    // Get user by provider and provider account ID
    fastify.get("/users/provider/:provider/:providerAccountId", async (request, reply) => {
        try {
            const { provider, providerAccountId } = request.params;
            if (provider === "google") {
                const user = await getUserByGoogleId(providerAccountId);
                if (!user) {
                    reply.code(404).send({ error: "User not found" });
                    return;
                }
                reply.send({ user });
            }
            else {
                reply.code(400).send({ error: "Unsupported provider" });
            }
        }
        catch (error) {
            fastify.log.error("Get user by provider error:", error);
            reply.code(500).send({ error: "Failed to get user" });
        }
    });
    // Update user
    fastify.put("/users/:id", async (request, reply) => {
        try {
            const { id } = request.params;
            const updateData = request.body;
            // Implementation would depend on your database schema
            // For now, we'll return the existing user
            const user = await getUserById(parseInt(id));
            if (!user) {
                reply.code(404).send({ error: "User not found" });
                return;
            }
            reply.send({ user });
        }
        catch (error) {
            fastify.log.error("Update user error:", error);
            reply.code(500).send({ error: "Failed to update user" });
        }
    });
    // Delete user
    fastify.delete("/users/:id", async (request, reply) => {
        try {
            const { id } = request.params;
            // Implementation would depend on your database schema
            // For now, we'll just return success
            reply.send({ success: true });
        }
        catch (error) {
            fastify.log.error("Delete user error:", error);
            reply.code(500).send({ error: "Failed to delete user" });
        }
    });
}
module.exports = authRoutes;
//# sourceMappingURL=routes.js.map