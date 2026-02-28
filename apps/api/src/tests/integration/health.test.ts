import request from 'supertest';
// Supertest is a library that helps us test HTTP APIs
// It allows us to send fake requests to our Express app
import { app } from '../../app.js';

describe('Health Check API', () => {
  it('should return 200 and valid health response', async () => {
    const response = await request(app).get('/api/v1/health');

    expect(response.status).toBe(200);

    expect(response.body.status).toBe('OK');
  });
});
