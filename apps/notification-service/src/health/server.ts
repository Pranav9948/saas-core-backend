import http from 'node:http';
import { config } from '../core/config.js';
import { logger } from '../core/logger.js';

export type HealthServer = Readonly<{
  server: http.Server;
  close: () => Promise<void>;
}>;

export function startHealthServer(): HealthServer {
  const server = http.createServer((req, res) => {
    if (req.url === '/health') {
      const payload = {
        status: 'ok',
        service: 'notification-service',
      };
      res.statusCode = 200;
      res.setHeader('content-type', 'application/json; charset=utf-8');
      res.end(JSON.stringify(payload));
      return;
    }

    res.statusCode = 404;
    res.end();
  });

  server.listen(config.HEALTH_PORT, '0.0.0.0', () => {
    logger.info(
      { port: config.HEALTH_PORT },
      'Health server listening for notification-service',
    );
  });

  return {
    server,
    close: () =>
      new Promise((resolve, reject) => {
        server.close((err) => (err ? reject(err) : resolve()));
      }),
  };
}
