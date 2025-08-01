"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = ApiExample;
const jsx_runtime_1 = require("react/jsx-runtime");
const react_1 = require("react");
const react_2 = require("next-auth/react");
const api_client_1 = require("../lib/api-client");
function ApiExample() {
    const { data: session } = (0, react_2.useSession)();
    const [data, setData] = (0, react_1.useState)(null);
    const [loading, setLoading] = (0, react_1.useState)(false);
    const [error, setError] = (0, react_1.useState)(null);
    const fetchUserData = async () => {
        if (!session?.accessToken) {
            setError("No access token available");
            return;
        }
        setLoading(true);
        setError(null);
        try {
            const userData = await (0, api_client_1.authenticatedFetch)(`${process.env.NEXT_PUBLIC_BACKEND_URL}/auth/me`);
            setData(userData);
        }
        catch (err) {
            setError(err.message);
        }
        finally {
            setLoading(false);
        }
    };
    const fetchDashboardData = async () => {
        if (!session?.accessToken) {
            setError("No access token available");
            return;
        }
        setLoading(true);
        setError(null);
        try {
            const dashboardData = await (0, api_client_1.authenticatedFetch)(`${process.env.NEXT_PUBLIC_BACKEND_URL}/dashboard`);
            setData(dashboardData);
        }
        catch (err) {
            setError(err.message);
        }
        finally {
            setLoading(false);
        }
    };
    if (!session) {
        return (0, jsx_runtime_1.jsx)("div", { children: "Please sign in to test API calls" });
    }
    return ((0, jsx_runtime_1.jsxs)("div", { className: "p-4 space-y-4", children: [(0, jsx_runtime_1.jsx)("h2", { className: "text-xl font-bold", children: "API Test" }), (0, jsx_runtime_1.jsxs)("div", { className: "space-x-2", children: [(0, jsx_runtime_1.jsx)("button", { onClick: fetchUserData, disabled: loading, className: "px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50", children: loading ? "Loading..." : "Get User Data" }), (0, jsx_runtime_1.jsx)("button", { onClick: fetchDashboardData, disabled: loading, className: "px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 disabled:opacity-50", children: loading ? "Loading..." : "Get Dashboard Data" })] }), error && ((0, jsx_runtime_1.jsxs)("div", { className: "p-4 bg-red-100 border border-red-400 text-red-700 rounded", children: ["Error: ", error] })), data && ((0, jsx_runtime_1.jsxs)("div", { className: "p-4 bg-gray-100 rounded", children: [(0, jsx_runtime_1.jsx)("h3", { className: "font-semibold mb-2", children: "Response:" }), (0, jsx_runtime_1.jsx)("pre", { className: "text-sm overflow-auto", children: JSON.stringify(data, null, 2) })] }))] }));
}
//# sourceMappingURL=ApiExample.js.map