"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = ProtectedPage;
const jsx_runtime_1 = require("react/jsx-runtime");
const react_1 = require("next-auth/react");
const router_1 = require("next/router");
const react_2 = require("react");
function ProtectedPage() {
    const { data: session, status } = (0, react_1.useSession)();
    const router = (0, router_1.useRouter)();
    (0, react_2.useEffect)(() => {
        if (status === "unauthenticated") {
            router.push("/auth/signin");
        }
    }, [status, router]);
    if (status === "loading") {
        return (0, jsx_runtime_1.jsx)("div", { children: "Loading..." });
    }
    if (!session) {
        return null;
    }
    return ((0, jsx_runtime_1.jsxs)("div", { className: "p-8", children: [(0, jsx_runtime_1.jsx)("h1", { className: "text-2xl font-bold mb-4", children: "Protected Page" }), (0, jsx_runtime_1.jsxs)("div", { className: "bg-white p-6 rounded-lg shadow", children: [(0, jsx_runtime_1.jsx)("h2", { className: "text-xl font-semibold mb-4", children: "User Information" }), (0, jsx_runtime_1.jsxs)("div", { className: "space-y-2", children: [(0, jsx_runtime_1.jsxs)("p", { children: [(0, jsx_runtime_1.jsx)("strong", { children: "Name:" }), " ", session.user?.name] }), (0, jsx_runtime_1.jsxs)("p", { children: [(0, jsx_runtime_1.jsx)("strong", { children: "Email:" }), " ", session.user?.email] }), session.user?.image && ((0, jsx_runtime_1.jsxs)("div", { children: [(0, jsx_runtime_1.jsx)("strong", { children: "Avatar:" }), (0, jsx_runtime_1.jsx)("img", { src: session.user.image, alt: session.user.name || "User", className: "w-16 h-16 rounded-full mt-2" })] }))] })] })] }));
}
//# sourceMappingURL=ProtectedPage.js.map