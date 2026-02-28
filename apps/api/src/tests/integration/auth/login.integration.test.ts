import request from 'supertest';
import bcrypt from 'bcrypt';
import { prisma } from '@/infra/db.js';
import { app } from '@/app.js';

describe('Login Integration', () => {
  const email = 'integration@test.com';
  const password = 'Password123!';

  beforeAll(async () => {
    const hashed = await bcrypt.hash(password, 10);

    await prisma.user.create({
      data: {
        email,
        passwordHash: hashed,
        firstName: 'Integration',
        lastName: 'User',
        role: 'USER',
        isActive: true,
      },
    });
  });

  afterAll(async () => {
    await prisma.user.deleteMany({ where: { email } });
  });

  it('should login successfully', async () => {
    const res = await request(app)
      .post('/api/v1/auth/login')
      .send({ email, password });

    expect(res.status).toBe(200);
    expect(res.body.accessToken).toBeDefined();
    expect(res.body.user.email).toBe(email);

    expect(res.headers['set-cookie']).toBeDefined();
  });

  it('should fail with wrong password', async () => {
    const res = await request(app)
      .post('/api/v1/auth/login')
      .send({ email, password: 'wrong' });

    expect(res.status).toBe(401);
  });

  it('should fail if user not found', async () => {
    const res = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'notfound@mail.com', password });

    expect(res.status).toBe(401);
  });
});
