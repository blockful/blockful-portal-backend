"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.authOptions = void 0;
const next_auth_1 = require("next-auth");
const google_1 = __importDefault(require("next-auth/providers/google"));
const backend_adapter_1 = require("./backend-adapter");
exports.authOptions = {
    providers: [
        (0, google_1.default)({
            clientId: process.env.GOOGLE_CLIENT_ID,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET,
        }),
    ],
    adapter: (0, backend_adapter_1.BackendAdapter)(),
    session: {
        strategy: "jwt",
    },
    callbacks: {
        async jwt({ token, user, account }) {
            // Initial sign in
            if (account && user) {
                return {
                    ...token,
                    accessToken: account.access_token,
                    refreshToken: account.refresh_token,
                    accessTokenExpires: account.expires_at * 1000,
                    user,
                };
            }
            // Return previous token if the access token has not expired yet
            if (Date.now() < token.accessTokenExpires) {
                return token;
            }
            // Access token has expired, try to update it
            return refreshAccessToken(token);
        },
        async session({ session, token }) {
            session.user = token.user;
            session.accessToken = token.accessToken;
            return session;
        },
        async signIn({ user, account, profile }) {
            // Validate domain if needed
            const allowedDomain = process.env.ALLOWED_DOMAIN || "blockful.io";
            if (user.email && !user.email.endsWith(`@${allowedDomain}`)) {
                return false; // This will prevent sign in
            }
            return true;
        },
    },
    pages: {
        signIn: "/auth/signin",
        error: "/auth/error",
    },
    debug: process.env.NODE_ENV === "development",
};
async function refreshAccessToken(token) {
    try {
        const response = await fetch(`${process.env.BACKEND_URL}/auth/refresh`, {
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                refreshToken: token.refreshToken,
            }),
        });
        const refreshedTokens = await response.json();
        if (!response.ok) {
            throw refreshedTokens;
        }
        return {
            ...token,
            accessToken: refreshedTokens.accessToken,
            accessTokenExpires: refreshedTokens.accessTokenExpires,
            refreshToken: refreshedTokens.refreshToken ?? token.refreshToken,
        };
    }
    catch (error) {
        console.error("Error refreshing access token", error);
        return {
            ...token,
            error: "RefreshAccessTokenError",
        };
    }
}
//# sourceMappingURL=auth.js.map