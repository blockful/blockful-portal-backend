const { db } = require("../db");
const { users } = require("../db/schema");
const { eq } = require("drizzle-orm");
const { createOrUpdateUser, getUserByEmail, getUserByGoogleId } = require("./utils");

async function authRoutes(fastify: any, options: any) {
  // Test token endpoint
  fastify.post("/test-token", async (request: any, reply: any) => {
    try {
      const authHeader = request.headers.authorization;
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        reply.code(401).send({
          error: "No Bearer token provided",
          message: "Please provide a valid Bearer token in the Authorization header"
        });
        return;
      }

      const token = authHeader.substring(7);
      reply.send({
        message: "Token received",
        token: token.substring(0, 20) + "...",
        header: authHeader
      });
    } catch (error: any) {
      fastify.log.error("Test token error:", error);
      reply.code(500).send({
        error: "Failed to process token",
        message: error.message,
      });
    }
  });

  // Create or update user (for NextAuth adapter)
  fastify.post("/users", async (request: any, reply: any) => {
    try {
      const { name, email, image, googleId } = request.body;

      if (!email) {
        reply.code(400).send({ error: "Email is required" });
        return;
      }

      const user = await createOrUpdateUser({
        id: googleId || email, // Use email as fallback if no googleId
        email,
        name,
        picture: image,
      });

      reply.code(201).send({ user });
    } catch (error: any) {
      fastify.log.error("Create user error:", error);
      reply.code(500).send({
        error: "Failed to create user",
        message: error.message,
      });
    }
  });

  // Get user by ID
  fastify.get("/users/:id", async (request: any, reply: any) => {
    try {
      const { id } = request.params;

      const user = await db
        .select()
        .from(users)
        .where(eq(users.id, parseInt(id)))
        .limit(1);

      if (user.length === 0) {
        reply.code(404).send({ error: "User not found" });
        return;
      }

      reply.send({ user: user[0] });
    } catch (error: any) {
      fastify.log.error("Get user error:", error);
      reply.code(500).send({
        error: "Failed to get user",
        message: error.message,
      });
    }
  });

  // Get user by email
  fastify.get("/users/email/:email", async (request: any, reply: any) => {
    try {
      const { email } = request.params;

      const user = await getUserByEmail(email);

      if (!user) {
        reply.code(404).send({ error: "User not found" });
        return;
      }

      reply.send({ user });
    } catch (error: any) {
      fastify.log.error("Get user by email error:", error);
      reply.code(500).send({
        error: "Failed to get user by email",
        message: error.message,
      });
    }
  });

  // Get user by provider and provider account ID
  fastify.get("/users/provider/:provider/:providerAccountId", async (request: any, reply: any) => {
    try {
      const { provider, providerAccountId } = request.params;

      if (provider !== "google") {
        reply.code(400).send({ error: "Only Google provider is supported" });
        return;
      }

      const user = await getUserByGoogleId(providerAccountId);

      if (!user) {
        reply.code(404).send({ error: "User not found" });
        return;
      }

      reply.send({ user });
    } catch (error: any) {
      fastify.log.error("Get user by provider error:", error);
      reply.code(500).send({
        error: "Failed to get user by provider",
        message: error.message,
      });
    }
  });

  // Update user
  fastify.put("/users/:id", async (request: any, reply: any) => {
    try {
      const { id } = request.params;
      const { name, email, image, isActive } = request.body;

      const updatedUser = await db
        .update(users)
        .set({
          name: name || undefined,
          email: email || undefined,
          avatar: image || undefined,
          isActive: isActive !== undefined ? isActive : undefined,
          updatedAt: new Date(),
        })
        .where(eq(users.id, parseInt(id)))
        .returning();

      if (updatedUser.length === 0) {
        reply.code(404).send({ error: "User not found" });
        return;
      }

      reply.send({ user: updatedUser[0] });
    } catch (error: any) {
      fastify.log.error("Update user error:", error);
      reply.code(500).send({
        error: "Failed to update user",
        message: error.message,
      });
    }
  });

  // Delete user
  fastify.delete("/users/:id", async (request: any, reply: any) => {
    try {
      const { id } = request.params;

      const deletedUser = await db
        .delete(users)
        .where(eq(users.id, parseInt(id)))
        .returning();

      if (deletedUser.length === 0) {
        reply.code(404).send({ error: "User not found" });
        return;
      }

      reply.send({ message: "User deleted successfully" });
    } catch (error: any) {
      fastify.log.error("Delete user error:", error);
      reply.code(500).send({
        error: "Failed to delete user",
        message: error.message,
      });
    }
  });
}

module.exports = authRoutes;
