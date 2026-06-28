import env from './config/env';
import app from './app';
import connectDB from './config/db';
import logger from './utils/logger';
import { initializeEmailService } from './services/emailService';

const startServer = async () => {
  try {
    // Connect to MongoDB Atlas
    await connectDB();

    // Initialize SMTP Email Service
    try {
      await initializeEmailService();
    } catch (emailError: any) {
      logger.error('[SMTP] Failed to initialize email service during startup (will continue running):', emailError);
    }

    app.listen(env.PORT, () => {
      logger.info(`Server is running on port ${env.PORT}`);
    });
  } catch (error: any) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
};

startServer();


