require("dotenv/config");
const Fastify = require("fastify");
const { db } = require("./db");
const reimbursementRoutes = require("./reimbursement/routes");
const oooRoutes = require("./ooo/routes");

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
  secret:
    process.env.SESSION_SECRET || "your-secret-key-change-this-in-production",
  cookie: {
    secure: process.env.NODE_ENV === "production", // Use secure cookies in production
    httpOnly: true,
    maxAge: 24 * 60 * 60 * 1000, // 24 hours
    sameSite: "lax",
  },
});

// Register multipart support for file uploads
fastify.register(require("@fastify/multipart"), {
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
    files: 1, // Only one file per request
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
  callbackUri:
    process.env.GOOGLE_REDIRECT_URI ||
    "http://localhost:4000/auth/google/callback",
});

// Hello World endpoint
fastify.get("/", async (request: any, reply: any) => {
  return {
    message: "Hello World from Fastify + Drizzle + Reimbursement System!",
    endpoints: {
      reimbursements: "/reimbursements",
      dashboard: "/dashboard",
    },
  };
});

// Dashboard
fastify.get("/dashboard", async (request: any, reply: any) => {
  try {
    // Get some stats for the dashboard
    const allReimbursements = await db
      .select()
      .from(require("./db/schema").reimbursements);

    return {
      message: "Welcome to your reimbursement dashboard!",
      stats: {
        totalReimbursements: allReimbursements.length,
        pendingReimbursements: allReimbursements.filter(
          (r: any) => r.status === "pending"
        ).length,
        approvedReimbursements: allReimbursements.filter(
          (r: any) => r.status === "approved"
        ).length,
        paidReimbursements: allReimbursements.filter(
          (r: any) => r.status === "paid"
        ).length,
      },
      actions: [
        { label: "View All Reimbursements", url: "/reimbursements" },
        { label: "Create New Reimbursement", url: "/reimbursements" },
      ],
    };
  } catch (error) {
    reply.code(500).send({ error: "Failed to load dashboard" });
  }
});

// Register reimbursement routes
fastify.register(reimbursementRoutes, { prefix: "/" });

// Register OOO routes
fastify.register(oooRoutes, { prefix: "/" });

// Serve static files (for login page)
fastify.register(require("@fastify/static"), {
  root: require("path").join(__dirname, "..", "public"),
  prefix: "/",
});

// Login page route
fastify.get("/login", async (request: any, reply: any) => {
  return reply.sendFile("login.html");
});

// Start server
const start = async () => {
  try {
    const port = Number(process.env.PORT) || 4000;
    const host = process.env.HOST || "0.0.0.0";

    await fastify.listen({ port, host });
    console.log(`🚀 Server running at http://${host}:${port}`);
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
};

start();
