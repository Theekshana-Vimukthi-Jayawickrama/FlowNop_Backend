import env from './config/env';
import app from './app';
import connectDB from './config/db';
import logger from './utils/logger';
import { verifySmtpConnection } from './services/emailService';

const startServer = async () => {
  try {
    // Connect to MongoDB Atlas
    await connectDB();

    // Check SMTP Server Connection Status
    await verifySmtpConnection();

    app.listen(env.PORT, () => {
      logger.info(`Server is running on port ${env.PORT}`);
    });
  } catch (error: any) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
};

startServer();


