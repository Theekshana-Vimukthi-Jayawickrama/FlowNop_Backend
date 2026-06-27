import express from 'express';
import cors from 'cors';
import env from './config/env';
import healthRouter from './routes/health';
import authRouter from './routes/authRoutes';
import taskRouter from './routes/taskRoutes';
import userRouter from './routes/userRoutes';
import notFound from './middleware/notFound';
import errorHandler from './middleware/errorHandler';

const app = express();

// Standard middleware
app.use(cors({
  origin: env.CLIENT_URL,
  credentials: true
}));
app.use(express.json());

// Routes
app.use('/api', healthRouter);
app.use('/api/auth', authRouter);
app.use('/api/tasks', taskRouter);
app.use('/api/users', userRouter);

app.get('/', (req, res) => {
  res.json({ message: 'FlowNop Backend is running' });
});

// Catch-all 404 handler for undefined routes
app.use(notFound);

// Centralized error handler (must be last)
app.use(errorHandler);

export default app;

