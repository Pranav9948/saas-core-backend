import cron from 'node-cron';
import { enqueueDailyAnalytics } from '../producers/analytics.producer.js';
import { logger } from '../../../core/logger.js';

// runs every day at 1 AM
export const startAnalyticsCron = () => {
  cron.schedule('0 1 * * *', async () => {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);

    logger.info(' Running daily analytics cron');

    await enqueueDailyAnalytics(yesterday);
  });
};
