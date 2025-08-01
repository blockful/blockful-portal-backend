const { createOrUpdateUser, getUserById, getUserByEmail, getUserByGoogleId } = require("./utils");
const { validateGoogleUser, validateDbUser, validateGoogleToken } = require("./middleware");

async function authRoutes(fastify: any, options: any) {

  // NextAuth Integration Endpoints
  // Create user (for NextAuth adapter) - Only validates Google token
  fastify.post("/users", { preHandler: validateGoogleUser }, async (request: any, reply: any) => {
    try {
      const { name, email, image, googleId } = request.body;
      const googleUser = request.googleUser;
      
      if (!email) {
        reply.code(400).send({ error: "Email is required" });
        return;
      }

      // Verify the email matches the Google token
      if (email !== googleUser.email) {
        reply.code(400).send({ 
          error: "Email mismatch", 
          message: "Email in request body must match the authenticated user's email" 
        });
        return;
      }

      const user = await createOrUpdateUser({
        id: googleId || googleUser.id,
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

  // Get user by ID (protected route)
  fastify.get("/users/:id", { preHandler: [validateGoogleUser, validateDbUser] }, async (request: any, reply: any) => {
    try {
      const { id } = request.params;
      const user = await getUserById(parseInt(id));
      
      if (!user) {
        reply.code(404).send({ error: "User not found" });
        return;
      }

      reply.send({ user });
    } catch (error) {
      fastify.log.error("Get user error:", error);
      reply.code(500).send({ error: "Failed to get user" });
    }
  });

  // Get user by email (protected route)
  fastify.get("/users/email/:email", { preHandler: [validateGoogleUser, validateDbUser] }, async (request: any, reply: any) => {
    try {
      const { email } = request.params;
      const user = await getUserByEmail(email);
      
      if (!user) {
        reply.code(404).send({ error: "User not found" });
        return;
      }

      reply.send({ user });
    } catch (error) {
      fastify.log.error("Get user by email error:", error);
      reply.code(500).send({ error: "Failed to get user" });
    }
  });

  // Get user by provider and provider account ID (protected route)
  fastify.get("/users/provider/:provider/:providerAccountId", { preHandler: [validateGoogleUser, validateDbUser] }, async (request: any, reply: any) => {
    try {
      const { provider, providerAccountId } = request.params;
      
      if (provider === "google") {
        const user = await getUserByGoogleId(providerAccountId);
        
        if (!user) {
          reply.code(404).send({ error: "User not found" });
          return;
        }

        reply.send({ user });
      } else {
        reply.code(400).send({ error: "Unsupported provider" });
      }
    } catch (error) {
      fastify.log.error("Get user by provider error:", error);
      reply.code(500).send({ error: "Failed to get user" });
    }
  });

  // Update user (protected route)
  fastify.put("/users/:id", { preHandler: [validateGoogleUser, validateDbUser] }, async (request: any, reply: any) => {
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
    } catch (error) {
      fastify.log.error("Update user error:", error);
      reply.code(500).send({ error: "Failed to update user" });
    }
  });

  // Delete user (protected route)
  fastify.delete("/users/:id", { preHandler: [validateGoogleUser, validateDbUser] }, async (request: any, reply: any) => {
    try {
      const { id } = request.params;
      
      // Implementation would depend on your database schema
      // For now, we'll just return success
      reply.send({ success: true });
    } catch (error) {
      fastify.log.error("Delete user error:", error);
      reply.code(500).send({ error: "Failed to delete user" });
    }
  });
}

module.exports = authRoutes;
