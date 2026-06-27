"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const env_1 = __importDefault(require("./config/env"));
const health_1 = __importDefault(require("./routes/health"));
const authRoutes_1 = __importDefault(require("./routes/authRoutes"));
const taskRoutes_1 = __importDefault(require("./routes/taskRoutes"));
const userRoutes_1 = __importDefault(require("./routes/userRoutes"));
const notFound_1 = __importDefault(require("./middleware/notFound"));
const errorHandler_1 = __importDefault(require("./middleware/errorHandler"));
const app = (0, express_1.default)();
// Standard middleware
app.use((0, cors_1.default)({
    origin: env_1.default.CLIENT_URL,
    credentials: true
}));
app.use(express_1.default.json());
// Routes
app.use('/api', health_1.default);
app.use('/api/auth', authRoutes_1.default);
app.use('/api/tasks', taskRoutes_1.default);
app.use('/api/users', userRoutes_1.default);
app.get('/', (req, res) => {
    res.json({ message: 'FlowNop Backend is running' });
});
// Catch-all 404 handler for undefined routes
app.use(notFound_1.default);
// Centralized error handler (must be last)
app.use(errorHandler_1.default);
exports.default = app;
