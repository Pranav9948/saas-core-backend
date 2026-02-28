import request from 'supertest';
import { app } from '@/app.js';
import { prisma } from '@/infra/db.js';

describe('POST /v1/auth/signup', () => {
  beforeEach(async () => {
    await prisma.user.deleteMany();
  });

  it('should create a user successfully', async () => {
    const res = await request(app).post('/api/v1/auth/signup').send({
      email: 'integration@gym.com',
      password: 'Password123!',
      role: 'STAFF',
      firstName: 'Test',
      lastName: 'User',
    });

    expect(res.status).toBe(201);
    expect(res.body.data.user.email).toBe('integration@gym.com');
  });

  it('should return 400 for invalid email', async () => {
    const res = await request(app).post('/api/v1/auth/signup').send({
      email: 'invalid-email',
      password: 'Password123!',
      role: 'STAFF',
      firstName: 'Test',
      lastName: 'User',
    });

    expect(res.status).toBe(400);
  });

  it('should return 409 if email exists', async () => {
    await prisma.user.create({
      data: {
        email: 'exists@gym.com',
        passwordHash: 'hashed',
        role: 'STAFF',
        firstName: 'Test',
        lastName: 'User',
      },
    });

    const res = await request(app).post('/api/v1/auth/signup').send({
      email: 'exists@gym.com',
      password: 'Password123!',
      role: 'STAFF',
      firstName: 'Test',
      lastName: 'User',
    });

    expect(res.status).toBe(409);
  });
});
