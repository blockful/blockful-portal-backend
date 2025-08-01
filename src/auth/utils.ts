const { db } = require("../db");
const { users } = require("../db/schema");
const { eq } = require("drizzle-orm");

// Track ongoing user creation to prevent duplicates
const ongoingCreations = new Map();

// Validate if email domain is allowed
function isAllowedDomain(email: string): boolean {
  const allowedDomain = process.env.ALLOWED_DOMAIN || "blockful.io";
  return email.endsWith(`@${allowedDomain}`);
}

// Create or update user from Google OAuth data
async function createOrUpdateUser(googleProfile: any) {
  console.log("=== createOrUpdateUser called ===");
  console.log("Google profile received:", googleProfile);
  
  // Handle different possible field names from Google API
  const googleId = googleProfile.id || googleProfile.sub;
  const email = googleProfile.email;
  const name = googleProfile.name;
  const picture = googleProfile.picture || googleProfile.image;

  console.log("Extracted data:", { googleId, email, name, picture });

  // Create a unique key for this user creation
  const creationKey = `${googleId}-${email}`;
  
  // Check if this user creation is already in progress
  if (ongoingCreations.has(creationKey)) {
    console.log("User creation already in progress for:", creationKey);
    return ongoingCreations.get(creationKey);
  }

  // Mark this creation as in progress
  const creationPromise = performUserCreation(googleId, email, name, picture);
  ongoingCreations.set(creationKey, creationPromise);

  try {
    const result = await creationPromise;
    console.log("User creation completed successfully:", result.email);
    return result;
  } finally {
    // Clean up after a delay
    setTimeout(() => {
      ongoingCreations.delete(creationKey);
    }, 5000);
  }
}

// Separate function to perform the actual user creation
async function performUserCreation(googleId: string, email: string, name: string, picture: string) {
  // Validate domain
  if (!isAllowedDomain(email)) {
    throw new Error(
      `Only ${
        process.env.ALLOWED_DOMAIN || "blockful.io"
      } email addresses are allowed`
    );
  }

  try {
    // Check if user exists by googleId
    const existingUser = await db
      .select()
      .from(users)
      .where(eq(users.googleId, googleId))
      .limit(1);

    console.log("Existing user check result:", existingUser.length);

    if (existingUser.length > 0) {
      // Update existing user
      console.log("Updating existing user");
      const updatedUser = await db
        .update(users)
        .set({
          name,
          avatar: picture,
          lastLogin: new Date(),
          updatedAt: new Date(),
        })
        .where(eq(users.googleId, googleId))
        .returning();

      console.log("User updated successfully:", updatedUser[0]);
      return updatedUser[0];
    } else {
      // Check if user exists by email (in case they signed up before)
      const existingByEmail = await db
        .select()
        .from(users)
        .where(eq(users.email, email))
        .limit(1);

      console.log("Existing user by email check result:", existingByEmail.length);

      if (existingByEmail.length > 0) {
        // Update existing user with Google ID
        console.log("Updating existing user with Google ID");
        const updatedUser = await db
          .update(users)
          .set({
            googleId,
            name,
            avatar: picture,
            lastLogin: new Date(),
            updatedAt: new Date(),
          })
          .where(eq(users.email, email))
          .returning();

        console.log("User updated with Google ID successfully:", updatedUser[0]);
        return updatedUser[0];
      } else {
        // Create new user
        console.log("Creating new user");
        const newUser = await db
          .insert(users)
          .values({
            googleId,
            email,
            name,
            avatar: picture,
            lastLogin: new Date(),
          })
          .returning();

        console.log("New user created successfully:", newUser[0]);
        return newUser[0];
      }
    }
  } catch (error: any) {
    console.error("Database error details:", error);
    console.error("Error stack:", error.stack);
    throw new Error(`Failed to create or update user: ${error.message}`);
  }
}

// Get user by ID
async function getUserById(userId: number) {
  try {
    const user = await db
      .select()
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    return user.length > 0 ? user[0] : null;
  } catch (error) {
    console.error("Error getting user by ID:", error);
    return null;
  }
}

// Get user by email
async function getUserByEmail(email: string) {
  try {
    const user = await db
      .select()
      .from(users)
      .where(eq(users.email, email))
      .limit(1);

    return user.length > 0 ? user[0] : null;
  } catch (error) {
    console.error("Error getting user by email:", error);
    return null;
  }
}

// Get user by Google ID
async function getUserByGoogleId(googleId: string) {
  try {
    const user = await db
      .select()
      .from(users)
      .where(eq(users.googleId, googleId))
      .limit(1);

    return user.length > 0 ? user[0] : null;
  } catch (error) {
    console.error("Error getting user by Google ID:", error);
    return null;
  }
}

module.exports = {
  isAllowedDomain,
  createOrUpdateUser,
  getUserById,
  getUserByEmail,
  getUserByGoogleId,
};
