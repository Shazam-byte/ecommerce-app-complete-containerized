"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const path_1 = __importDefault(require("path"));
// --- CRITICAL: LOAD ENV CONFIGURATIONS BEFORE ANY OTHER IMPORTS ---
const dotenv_1 = __importDefault(require("dotenv"));
// Explicitly look for the .env file relative to this backend source directory 
// to prevent execution directory path confusion from the frontend server runner.
dotenv_1.default.config({ path: path_1.default.resolve(__dirname, "../.env") });
// -----------------------------------------------------------------
const auth_routes_1 = __importDefault(require("./routes/auth.routes"));
const category_routes_1 = __importDefault(require("./routes/category.routes"));
const product_routes_1 = __importDefault(require("./routes/product.routes"));
const cart_routes_1 = __importDefault(require("./routes/cart.routes"));
const order_routes_1 = __importDefault(require("./routes/order.routes"));
const review_routes_1 = __importDefault(require("./routes/review.routes"));
const admin_routes_1 = __importDefault(require("./routes/admin.routes"));
const auth_1 = require("./middleware/auth");
const migrations_1 = require("./db/migrations");
const app = (0, express_1.default)();
// Configure CORS to permit the decoupled frontend to speak to our endpoint
app.use((0, cors_1.default)({
    origin: [
        'd3g7a1twk7q2ux.cloudfront.net',
        'http://ecommerce-frontend-shah.s3-website-us-east-1.amazonaws.com',
        'http://localhost:5173',
        'http://localhost:3000'
    ],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Cookie']
}));
// Body parsers
app.use(express_1.default.json());
app.use(express_1.default.urlencoded({ extended: true }));
// Serve static directory local fallback uploads if present
const UPLOADS_PATH = path_1.default.join(process.cwd(), "uploads");
app.use("/uploads", express_1.default.static(UPLOADS_PATH));
// Global Cookie authentication initializer
app.use(auth_1.authenticateToken);
// Mount routing trees
app.use("/api/auth", auth_routes_1.default);
app.use("/api/categories", category_routes_1.default);
app.use("/api/products", product_routes_1.default);
app.use("/api/cart", cart_routes_1.default);
app.use("/api/orders", order_routes_1.default);
app.use("/api/reviews", review_routes_1.default);
app.use("/api/admin", admin_routes_1.default);
// Service Health check endpoint
app.get("/api/health", (req, res) => {
    res.json({
        status: "healthy",
        timestamp: new Date(),
        uptime: process.uptime(),
    });
});
// Run migrations on startup
let isDatabaseReady = false;
(0, migrations_1.runMigrations)()
    .then(() => {
    isDatabaseReady = true;
    console.log("APP_STARTUP: Database initialized and ready.");
})
    .catch((err) => {
    console.error("APP_STARTUP: Database migration failed. Serving API with connection issues.", err);
});
// Endpoint block defense for pending DB migrations
app.use((req, res, next) => {
    if (!isDatabaseReady && req.path.startsWith("/api")) {
        return res.status(503).json({
            error: "Database is initializing. Please retry in a few seconds.",
            code: "DB_INITIALIZING",
        });
    }
    next();
});
// Uniform Error Handling Middleware
app.use((err, req, res, next) => {
    console.error("EXPRESS_GLOBAL_ERROR:", err);
    const status = err.status || 500;
    // Format Postgres error codes
    if (err.code === "23505") {
        return res.status(400).json({
            error: "Resource already exists. Unique constraint conflict.",
            code: "CONFLICT_ERROR",
            details: err.detail,
        });
    }
    return res.status(status).json({
        error: err.message || "An unexpected error occurred on the server.",
        code: err.code || "INTERNAL_SERVER_ERROR",
    });
});
exports.default = app;
const PORT = parseInt(process.env.PORT || "5000", 10);
app.listen(PORT, "0.0.0.0", () => {
    console.log('Server is listening on port ${PORT}');
});
