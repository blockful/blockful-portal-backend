"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BackendAdapter = BackendAdapter;
const adapters_1 = require("next-auth/adapters");
function BackendAdapter() {
    return {
        async createUser(user) {
            const response = await fetch(`${process.env.BACKEND_URL}/auth/users`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    name: user.name,
                    email: user.email,
                    image: user.image,
                    googleId: user.id,
                }),
            });
            if (!response.ok) {
                throw new Error("Failed to create user");
            }
            const data = await response.json();
            return data.user;
        },
        async getUser(id) {
            const response = await fetch(`${process.env.BACKEND_URL}/auth/users/${id}`, {
                headers: {
                    "Content-Type": "application/json",
                },
            });
            if (!response.ok) {
                return null;
            }
            const data = await response.json();
            return data.user;
        },
        async getUserByEmail(email) {
            const response = await fetch(`${process.env.BACKEND_URL}/auth/users/email/${email}`, {
                headers: {
                    "Content-Type": "application/json",
                },
            });
            if (!response.ok) {
                return null;
            }
            const data = await response.json();
            return data.user;
        },
        async getUserByAccount({ provider, providerAccountId }) {
            const response = await fetch(`${process.env.BACKEND_URL}/auth/users/provider/${provider}/${providerAccountId}`, {
                headers: {
                    "Content-Type": "application/json",
                },
            });
            if (!response.ok) {
                return null;
            }
            const data = await response.json();
            return data.user;
        },
        async updateUser(user) {
            const response = await fetch(`${process.env.BACKEND_URL}/auth/users/${user.id}`, {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(user),
            });
            if (!response.ok) {
                throw new Error("Failed to update user");
            }
            const data = await response.json();
            return data.user;
        },
        async deleteUser(userId) {
            const response = await fetch(`${process.env.BACKEND_URL}/auth/users/${userId}`, {
                method: "DELETE",
                headers: {
                    "Content-Type": "application/json",
                },
            });
            return response.ok;
        },
        async linkAccount(account) {
            const response = await fetch(`${process.env.BACKEND_URL}/auth/accounts`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(account),
            });
            if (!response.ok) {
                throw new Error("Failed to link account");
            }
            return account;
        },
        async unlinkAccount({ provider, providerAccountId }) {
            const response = await fetch(`${process.env.BACKEND_URL}/auth/accounts/${provider}/${providerAccountId}`, {
                method: "DELETE",
                headers: {
                    "Content-Type": "application/json",
                },
            });
            return response.ok;
        },
        async createSession(session) {
            const response = await fetch(`${process.env.BACKEND_URL}/auth/sessions`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(session),
            });
            if (!response.ok) {
                throw new Error("Failed to create session");
            }
            const data = await response.json();
            return data.session;
        },
        async getSessionAndUser(sessionToken) {
            const response = await fetch(`${process.env.BACKEND_URL}/auth/sessions/${sessionToken}`, {
                headers: {
                    "Content-Type": "application/json",
                },
            });
            if (!response.ok) {
                return null;
            }
            const data = await response.json();
            return {
                session: data.session,
                user: data.user,
            };
        },
        async updateSession(session) {
            const response = await fetch(`${process.env.BACKEND_URL}/auth/sessions/${session.sessionToken}`, {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(session),
            });
            if (!response.ok) {
                return null;
            }
            const data = await response.json();
            return data.session;
        },
        async deleteSession(sessionToken) {
            const response = await fetch(`${process.env.BACKEND_URL}/auth/sessions/${sessionToken}`, {
                method: "DELETE",
                headers: {
                    "Content-Type": "application/json",
                },
            });
            return response.ok;
        },
        async createVerificationToken(verificationToken) {
            const response = await fetch(`${process.env.BACKEND_URL}/auth/verification-tokens`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(verificationToken),
            });
            if (!response.ok) {
                throw new Error("Failed to create verification token");
            }
            const data = await response.json();
            return data.verificationToken;
        },
        async useVerificationToken({ identifier, token }) {
            const response = await fetch(`${process.env.BACKEND_URL}/auth/verification-tokens/use`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ identifier, token }),
            });
            if (!response.ok) {
                return null;
            }
            const data = await response.json();
            return data.verificationToken;
        },
    };
}
//# sourceMappingURL=backend-adapter.js.map