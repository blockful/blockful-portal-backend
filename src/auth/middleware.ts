const { getUserById, getUserByGoogleId, createOrUpdateUser } = require("./utils");

// Authentication middleware for Bearer token validation
async function requireAuth(request: any, reply: any) {
  try {
    // Get the Authorization header
    const authHeader = request.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      reply.code(401).send({
        error: "Authentication required",
        message: "Please provide a valid Bearer token",
        loginUrl: "/auth/google",
      });
      return;
    }

    // Extract the token
    const token = authHeader.substring(7); // Remove 'Bearer ' prefix

    // Validate the token with Google
    const userInfo = await validateGoogleToken(token);
    
    if (!userInfo) {
      reply.code(401).send({
        error: "Invalid token",
        message: "The provided token is invalid or expired",
        loginUrl: "/auth/google",
      });
      return;
    }

    // Check if user exists in our database
    let user = await getUserByGoogleId(userInfo.id);
    
    // If user doesn't exist, create them
    if (!user) {
      try {
        user = await createOrUpdateUser(userInfo);
        console.log("Created new user:", user.email);
      } catch (error: any) {
        console.error("Failed to create user:", error);
        reply.code(401).send({
          error: "User creation failed",
          message: error.message,
          loginUrl: "/auth/google",
        });
        return;
      }
    }

    if (!user.isActive) {
      reply.code(401).send({
        error: "Inactive user",
        message: "User account is inactive",
        loginUrl: "/auth/google",
      });
      return;
    }

    // Add user to request object
    request.user = user;
  } catch (error) {
    console.error("Authentication error:", error);
    reply.code(500).send({
      error: "Authentication error",
      message: "Failed to verify authentication",
    });
  }
}

// Optional authentication middleware (doesn't block request if not authenticated)
async function optionalAuth(request: any, reply: any) {
  try {
    const authHeader = request.headers.authorization;
    
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7);
      const userInfo = await validateGoogleToken(token);
      
      if (userInfo) {
        let user = await getUserByGoogleId(userInfo.id);
        
        // If user doesn't exist, create them
        if (!user) {
          try {
            user = await createOrUpdateUser(userInfo);
            console.log("Created new user (optional auth):", user.email);
          } catch (error) {
            console.error("Failed to create user in optional auth:", error);
            // Don't fail the request for optional auth
          }
        }
        
        if (user && user.isActive) {
          request.user = user;
        }
      }
    }
    // Continue regardless of authentication status
  } catch (error) {
    // Silently fail for optional auth
    console.error("Optional auth error:", error);
  }
}

// Validate Google OAuth token
async function validateGoogleToken(token: string) {
  console.log("Validating Google token:", token);
  try {
    const response = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      console.error('Google token validation failed:', response.status, response.statusText);
      return null;
    }

    const userInfo = await response.json();
    console.log("Google user info:", userInfo);
    
    // Validate domain if required
    const allowedDomain = process.env.ALLOWED_DOMAIN || "blockful.io";
    if (!userInfo.email.endsWith(`@${allowedDomain}`)) {
      console.error('Domain not allowed:', userInfo.email);
      return null;
    }

    return userInfo;
  } catch (error) {
    console.error('Error validating Google token:', error);
    return null;
  }
}

module.exports = {
  requireAuth,
  optionalAuth,
  validateGoogleToken,
};
