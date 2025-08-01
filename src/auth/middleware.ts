const { getUserById } = require("./utils");

// Authentication middleware
async function requireAuth(request: any, reply: any) {
  try {
    const userId = request.session?.userId;

    if (!userId) {
      reply.code(401).send({
        error: "Authentication required",
        message: "Please log in to access this resource",
        loginUrl: "/auth/google",
      });
      return;
    }

    // Get user from database
    const user = await getUserById(userId);

    if (!user || !user.isActive) {
      // Clear invalid session
      request.session.destroy();
      reply.code(401).send({
        error: "Invalid or inactive user",
        message: "Please log in again",
        loginUrl: "/auth/google",
      });
      return;
    }

    // Add user to request object
    request.user = user;
  } catch (error) {
    reply.code(500).send({
      error: "Authentication error",
      message: "Failed to verify authentication",
    });
  }
}

// Optional authentication middleware (doesn't block request if not authenticated)
async function optionalAuth(request: any, reply: any) {
  try {
    const userId = request.session?.userId;

    if (userId) {
      const user = await getUserById(userId);
      if (user && user.isActive) {
        request.user = user;
      }
    }
    // Continue regardless of authentication status
  } catch (error) {
    // Silently fail for optional auth
    console.error("Optional auth error:", error);
  }
}

module.exports = {
  requireAuth,
  optionalAuth,
};
