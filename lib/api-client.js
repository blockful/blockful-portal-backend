"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.authenticatedFetch = authenticatedFetch;
exports.getCurrentUser = getCurrentUser;
exports.getDashboardData = getDashboardData;
exports.getUsers = getUsers;
const react_1 = require("next-auth/react");
async function authenticatedFetch(url, options = {}) {
    const session = await (0, react_1.getSession)();
    if (!session?.accessToken) {
        throw new Error("No access token available");
    }
    const headers = {
        "Content-Type": "application/json",
        ...options.headers,
        Authorization: `Bearer ${session.accessToken}`,
    };
    const response = await fetch(url, {
        ...options,
        headers,
    });
    if (!response.ok) {
        const error = await response.json().catch(() => ({ message: "Unknown error" }));
        throw new Error(error.message || `HTTP error! status: ${response.status}`);
    }
    return response.json();
}
// Example usage functions
async function getCurrentUser() {
    return authenticatedFetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/auth/me`);
}
async function getDashboardData() {
    return authenticatedFetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/dashboard`);
}
async function getUsers() {
    return authenticatedFetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/users`);
}
//# sourceMappingURL=api-client.js.map