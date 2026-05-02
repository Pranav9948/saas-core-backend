import { logger } from '@/core/logger.js';
import { eventBus } from '@/modules/events/event-bus.js';
import { EVENTS } from '@/modules/events/events.js';
import {
  sendEmailJob,
  sendNotificationJob,
} from '@/modules/jobs/producers/email.producer.js';

export const registerEmailListeners = () => {
  eventBus.on(EVENTS.USER_LOGGED_IN, async (data) => {
    console.log('📩 EVENT RECEIVED:', EVENTS.USER_LOGGED_IN, data);

    await sendEmailJob({
      type: 'LOGIN_ALERT',
      to: data.email,
      tenantId: data.tenantId,
      payload: {},
    });
  });

  eventBus.on(EVENTS.PASSWORD_RESET_REQUESTED, async (data) => {
    console.log('📩 EVENT RECEIVED:', EVENTS.PASSWORD_RESET_REQUESTED, data);

    await sendNotificationJob({
      channel: 'email',
      type: 'RESET_PASSWORD',
      to: data.email,
      tenantId: data.tenantId,
      payload: {
        resetUrl: data.resetUrl,
        name: data.firstName,
      },
    });
  });

  eventBus.on(EVENTS.USER_INVITED, async (data) => {
    console.log('📩 EVENT RECEIVED:', EVENTS.USER_INVITED, data);

    await sendEmailJob({
      type: 'INVITE_USER',
      to: data.email,
      tenantId: data.tenantId,
      payload: {
        link: data.link,
        name: data.name,
        gymName: data.gymName,
        role: data.role,
      },
    });
  });
};
