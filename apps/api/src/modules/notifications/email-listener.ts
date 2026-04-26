import { eventBus } from '@/modules/events/event-bus.js';
import { EVENTS } from '@/modules/events/events.js';
import { sendEmailJob } from '@/modules/jobs/producers/email.producer.js';

export const registerEmailListeners = () => {
  eventBus.on(EVENTS.USER_LOGGED_IN, async (data) => {
    console.log('📩 EVENT RECEIVED:', data);

    await sendEmailJob({
      to: data.email,
      subject: 'Login Alert',
      html: '<p>You logged in</p>',
      tenantId: data.tenantId,
    });
  });
};
