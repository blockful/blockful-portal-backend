const { createOrUpdateUser } = require("./utils");
const { requireAuth } = require("./middleware");

async function authRoutes(fastify: any, options: any) {
  // Development mock login (REMOVE IN PRODUCTION!)
  fastify.get("/mock-login", async (request: any, reply: any) => {
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
    } catch (error: any) {
      fastify.log.error("Mock login error:", error);
      reply.code(500).send({
        error: "Mock login failed",
        message: error.message,
      });
    }
  });

  // Initiate Google OAuth login
  fastify.get("/google", async (request: any, reply: any) => {
    try {
      const redirectUrl = await fastify.googleOAuth2.generateAuthorizationUri(
        request,
        reply
      );

      reply.redirect(redirectUrl);
    } catch (error) {
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
  fastify.get("/google/callback", async (request: any, reply: any) => {
    try {
      // Exchange code for token
      const { token } =
        await fastify.googleOAuth2.getAccessTokenFromAuthorizationCodeFlow(
          request
        );

      // Get user profile from Google
      const response = await fetch(
        "https://www.googleapis.com/oauth2/v2/userinfo",
        {
          headers: {
            Authorization: `Bearer ${token.access_token}`,
          },
        }
      );

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
    } catch (error: any) {
      fastify.log.error("OAuth callback error:", error);

      // Handle domain restriction error specifically
      if (error.message.includes("email addresses are allowed")) {
        reply.code(403).send({
          error: "Access Denied",
          message: error.message,
          suggestion:
            "Please contact your administrator if you believe this is an error.",
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
  fastify.get("/logout", async (request: any, reply: any) => {
    try {
      if (request.session) {
        request.session.destroy();
      }
      reply.send({
        message: "Logged out successfully",
        loginUrl: "/auth/google",
      });
    } catch (error) {
      fastify.log.error("Logout error:", error);
      reply.code(500).send({
        error: "Logout failed",
        message: "Could not log out properly",
      });
    }
  });

  // Get current user info (protected route)
  fastify.get(
    "/me",
    { preHandler: requireAuth },
    async (request: any, reply: any) => {
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
      } catch (error) {
        fastify.log.error("Get user error:", error);
        reply.code(500).send({
          error: "Failed to get user information",
        });
      }
    }
  );
}

module.exports = authRoutes;
