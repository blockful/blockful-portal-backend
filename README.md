# Reimbursement App - Hello World

A simple Hello World application built with **Fastify**, **PostgreSQL**, and **Drizzle ORM**.

## 🚀 Getting Started

### Prerequisites

- Node.js (v18 or higher)
- PostgreSQL database running
- npm or yarn

### Setup

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Set up environment variables:**
   ```bash
   cp .env.example .env
   ```
   
   Then edit `.env` with your actual credentials:
   ```
   DATABASE_URL=postgresql://username:password@localhost:5432/reimbursement
   PORT=3000
   HOST=0.0.0.0
   
   # Google OAuth (see Google OAuth Setup below)
   GOOGLE_CLIENT_ID=your_google_client_id
   GOOGLE_CLIENT_SECRET=your_google_client_secret
   GOOGLE_REDIRECT_URI=http://localhost:3000/auth/google/callback
   
   SESSION_SECRET=your_super_secret_session_key
   ALLOWED_DOMAIN=blockful.io
   ```

3. **Set up Google OAuth:**
   - Go to [Google Cloud Console](https://console.cloud.google.com/)
   - Create a new project or select an existing one
   - Enable the Google+ API
   - Go to "Credentials" → "Create Credentials" → "OAuth 2.0 Client IDs"
   - Choose "Web application"
   - Add authorized redirect URIs: `http://localhost:3000/auth/google/callback`
   - Copy the Client ID and Client Secret to your `.env` file

4. **Generate and run database migrations:**
   ```bash
   npm run db:generate
   npm run db:push
   ```

5. **Start the development server:**
   ```bash
   npm run dev
   ```

The server will start at `http://localhost:3000`

## 📋 Available Scripts

- `npm run dev` - Start development server with hot reload
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run db:generate` - Generate database migrations
- `npm run db:push` - Push schema changes to database
- `npm run db:migrate` - Run database migrations
- `npm run db:studio` - Open Drizzle Studio (database GUI)

## 🔗 API Endpoints

### Authentication Endpoints

#### GET `/login`
Beautiful login page with Google OAuth button

#### GET `/auth/google`
Initiate Google OAuth login (redirects to Google)

#### GET `/auth/google/callback`
Handle Google OAuth callback (internal use)

#### GET `/auth/logout`
Logout current user
```json
{
  "message": "Logged out successfully",
  "loginUrl": "/auth/google"
}
```

#### GET `/auth/me` 🔒
Get current user information (requires authentication)
```json
{
  "user": {
    "id": 1,
    "name": "John Doe",
    "email": "john@blockful.io",
    "avatar": "https://lh3.googleusercontent.com/...",
    "lastLogin": "2024-01-01T12:00:00.000Z",
    "createdAt": "2024-01-01T00:00:00.000Z"
  }
}
```

### General Endpoints

#### GET `/`
Hello World endpoint (shows user info if logged in)
```json
{
  "message": "Hello World from Fastify + Drizzle + Google OAuth!",
  "user": {
    "name": "John Doe",
    "email": "john@blockful.io",
    "avatar": "https://lh3.googleusercontent.com/..."
  },
  "loginUrl": null
}
```

#### GET `/dashboard` 🔒
Protected dashboard (requires authentication)
```json
{
  "message": "Welcome to your dashboard!",
  "user": { ... },
  "stats": {
    "totalUsers": 5
  },
  "actions": [
    { "label": "View Profile", "url": "/auth/me" },
    { "label": "View Users", "url": "/users" },
    { "label": "Logout", "url": "/auth/logout" }
  ]
}
```

### GET `/users`
Get all users
```json
{
  "users": [
    {
      "id": 1,
      "name": "John Doe",
      "email": "john@example.com",
      "createdAt": "2024-01-01T00:00:00.000Z",
      "updatedAt": "2024-01-01T00:00:00.000Z"
    }
  ]
}
```

#### GET `/users`
Get all users
```json
{
  "users": [
    {
      "id": 1,
      "name": "John Doe",
      "email": "john@blockful.io",
      "googleId": "google_user_id",
      "avatar": "https://lh3.googleusercontent.com/...",
      "isActive": true,
      "lastLogin": "2024-01-01T12:00:00.000Z",
      "createdAt": "2024-01-01T00:00:00.000Z",
      "updatedAt": "2024-01-01T00:00:00.000Z"
    }
  ]
}
```

#### POST `/users` 🔒
Create a new user (requires authentication)
```bash
curl -X POST http://localhost:3000/users \
  -H "Content-Type: application/json" \
  -H "Cookie: sessionId=your_session_cookie" \
  -d '{"name": "John Doe", "email": "john@blockful.io"}'
```

## 🛠 Tech Stack

- **Fastify** - Fast and efficient web framework
- **PostgreSQL** - Robust relational database
- **Drizzle ORM** - TypeScript ORM with excellent developer experience
- **TypeScript** - Type safety and better development experience
- **Google OAuth 2.0** - Secure authentication with domain restriction
- **Session Management** - Secure cookie-based sessions

## 🔐 Security Features

- **Domain Restriction**: Only `@blockful.io` email addresses allowed
- **Secure Sessions**: HTTP-only, secure cookies with CSRF protection
- **OAuth 2.0**: Industry-standard authentication flow
- **Route Protection**: Middleware-based authentication for sensitive endpoints
- **User Management**: Track login times and user activity

## 📁 Project Structure

```
src/
├── auth/
│   ├── middleware.ts # Authentication middleware
│   ├── routes.ts     # Auth routes (/login, /callback, /logout)
│   └── utils.ts      # Domain validation, user creation
├── db/
│   ├── schema.ts     # Database schema definitions
│   └── index.ts      # Database connection setup
├── server.ts         # Main application server
public/
└── login.html        # Beautiful login page
```

## 🚀 Quick Start

1. **Visit the app**: http://localhost:3000
2. **Login**: Click "Continue with Google" or visit http://localhost:3000/login
3. **Dashboard**: After login, visit http://localhost:3000/dashboard
4. **API**: Use authenticated endpoints with your session cookie

**Note**: Only `@blockful.io` email addresses are allowed. Update `ALLOWED_DOMAIN` in `.env` to change this restriction. 