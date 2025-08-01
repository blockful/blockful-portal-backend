"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = AuthButton;
const jsx_runtime_1 = require("react/jsx-runtime");
const react_1 = require("next-auth/react");
function AuthButton() {
    const { data: session, status } = (0, react_1.useSession)();
    if (status === "loading") {
        return (0, jsx_runtime_1.jsx)("div", { children: "Loading..." });
    }
    if (session) {
        return ((0, jsx_runtime_1.jsxs)("div", { className: "flex items-center gap-4", children: [(0, jsx_runtime_1.jsxs)("div", { className: "flex items-center gap-2", children: [session.user?.image && ((0, jsx_runtime_1.jsx)("img", { src: session.user.image, alt: session.user.name || "User", className: "w-8 h-8 rounded-full" })), (0, jsx_runtime_1.jsxs)("span", { children: ["Welcome, ", session.user?.name] })] }), (0, jsx_runtime_1.jsx)("button", { onClick: () => (0, react_1.signOut)(), className: "px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600", children: "Sign Out" })] }));
    }
    return ((0, jsx_runtime_1.jsx)("button", { onClick: () => (0, react_1.signIn)("google"), className: "px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600", children: "Sign In with Google" }));
}
//# sourceMappingURL=AuthButton.js.map