import { Router, type Router as ExpressRouter } from 'express';
import { enqueueDailyAnalytics } from '@/modules/jobs/producers/analytics.producer.js';

const router: ExpressRouter = Router();

router.post('/run-analytics', async (_req, res) => {
  const yesterday = new Date();

  yesterday.setDate(yesterday.getDate() - 1);

  await enqueueDailyAnalytics(yesterday);

  res.json({
    success: true,
    message: 'Analytics job enqueued',
  });
});

export default router;
