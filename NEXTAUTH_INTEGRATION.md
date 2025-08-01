# NextAuth Integration Guide

This guide explains how to integrate NextAuth.js with your existing Fastify backend for authentication.

## Overview

The integration allows your NextAuth frontend to:
- Handle Google OAuth flow
- Store user data in your PostgreSQL database
- Use your existing backend for user management
- Maintain session state across your application

## Setup Instructions

### 1. Install Dependencies

In your frontend project, install NextAuth:

```bash
npm install next-auth
# or
yarn add next-auth
```

### 2. Environment Variables

Create a `.env.local` file in your frontend project with the following variables:

```env
# NextAuth Configuration
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your-nextauth-secret-key-change-this-in-production

# Google OAuth (same as backend)
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret

# Backend API URL
BACKEND_URL=http://localhost:4000
```

### 3. Backend Environment Variables

Update your backend `.env` file to include:

```env
# Add this to your existing backend .env
FRONTEND_URL=http://localhost:3000
```

### 4. Install Backend Dependencies

In your backend project, install CORS support:

```bash
npm install @fastify/cors
```

### 5. Setup NextAuth Provider

Wrap your app with the NextAuth SessionProvider:

```tsx
// pages/_app.tsx (Pages Router)
import { SessionProvider } from "next-auth/react";
import type { AppProps } from "next/app";

export default function App({
  Component,
  pageProps: { session, ...pageProps },
}: AppProps) {
  return (
    <SessionProvider session={session}>
      <Component {...pageProps} />
    </SessionProvider>
  );
}
```

### 6. Usage Examples

#### Basic Authentication Button

```tsx
import { useSession, signIn, signOut } from "next-auth/react";

export default function AuthButton() {
  const { data: session } = useSession();

  if (session) {
    return (
      <div>
        <p>Welcome, {session.user?.name}</p>
        <button onClick={() => signOut()}>Sign Out</button>
      </div>
    );
  }

  return <button onClick={() => signIn("google")}>Sign In</button>;
}
```

#### Protected Routes

```tsx
import { useSession } from "next-auth/react";
import { useRouter } from "next/router";
import { useEffect } from "react";

export default function ProtectedPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/auth/signin");
    }
  }, [status, router]);

  if (status === "loading") return <div>Loading...</div>;
  if (!session) return null;

  return <div>Protected content here</div>;
}
```

#### Server-Side Protection

```tsx
// pages/protected.tsx
import { getServerSideProps } from "next";
import { getSession } from "next-auth/react";

export async function getServerSideProps(context) {
  const session = await getSession(context);

  if (!session) {
    return {
      redirect: {
        destination: "/auth/signin",
        permanent: false,
      },
    };
  }

  return {
    props: { session },
  };
}
```

## API Endpoints

Your backend now provides these endpoints for NextAuth:

- `POST /auth/users` - Create user
- `GET /auth/users/:id` - Get user by ID
- `GET /auth/users/email/:email` - Get user by email
- `GET /auth/users/provider/:provider/:providerAccountId` - Get user by provider
- `PUT /auth/users/:id` - Update user
- `DELETE /auth/users/:id` - Delete user

## How It Works

1. **OAuth Flow**: NextAuth handles the Google OAuth flow in the frontend
2. **User Creation**: When a user signs in, NextAuth calls your backend to create/update the user
3. **Session Management**: NextAuth manages sessions using JWTs
4. **Data Persistence**: User data is stored in your PostgreSQL database
5. **Domain Validation**: Your backend still validates email domains

## Customization

### Custom Callbacks

You can customize the authentication flow by modifying the callbacks in `lib/auth.ts`:

```tsx
callbacks: {
  async signIn({ user, account, profile }) {
    // Custom sign-in logic
    return true;
  },
  async session({ session, token }) {
    // Custom session logic
    return session;
  },
}
```

### Custom Pages

Create custom sign-in and error pages:

```tsx
// pages/auth/signin.tsx
import { signIn } from "next-auth/react";

export default function SignIn() {
  return (
    <div>
      <h1>Sign In</h1>
      <button onClick={() => signIn("google")}>
        Sign in with Google
      </button>
    </div>
  );
}
```

## Troubleshooting

### Common Issues

1. **CORS Errors**: Ensure your backend has CORS configured correctly
2. **Session Issues**: Check that `NEXTAUTH_SECRET` is set and consistent
3. **Database Errors**: Verify your database schema matches the expected format
4. **OAuth Errors**: Ensure Google OAuth credentials are correct

### Debug Mode

Enable NextAuth debug mode:

```env
NEXTAUTH_DEBUG=true
```

## Security Considerations

1. **Environment Variables**: Never commit secrets to version control
2. **HTTPS**: Use HTTPS in production
3. **Domain Validation**: Your backend still validates email domains
4. **Session Security**: Use strong session secrets

## Production Deployment

1. Set `NEXTAUTH_URL` to your production domain
2. Use strong secrets for `NEXTAUTH_SECRET`
3. Configure Google OAuth for your production domain
4. Set up proper CORS origins
5. Use HTTPS in production 