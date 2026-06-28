import { Router, Request, Response } from 'express';
import { getSmtpStatus } from '../services/emailService';

const router = Router();

router.get('/health', (req: Request, res: Response) => {
  res.status(200).json({ success: true, message: 'ok' });
});

router.get('/health/email', (req: Request, res: Response) => {
  const smtpStatus = getSmtpStatus();
  
  // simulated or connected counts as healthy
  const isHealthy = smtpStatus.status === 'connected' || smtpStatus.status === 'simulated';
  const statusCode = isHealthy ? 200 : 503;

  res.status(statusCode).json({
    success: isHealthy,
    ...smtpStatus,
  });
});

export default router;
