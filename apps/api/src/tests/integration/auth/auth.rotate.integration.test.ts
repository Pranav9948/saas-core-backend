import request from 'supertest';
import bcrypt from 'bcrypt';
import { prisma } from '@/infra/db.js';
import { app } from '@/app.js';
import { Security } from '@/core/security.js';

describe('Rotate Refresh Token - Integration', () => {
  let refreshToken: string;
  let userId: string;

  beforeAll(async () => {
    const passwordHash = await bcrypt.hash('password123', 10);

    const user = await prisma.user.create({
      data: {
        email: 'rotate@test.com',
        firstName: 'Rotate',
        lastName: 'Test',
        passwordHash,
        role: 'USER',
        isActive: true,
      },
    });

    userId = user.id;

    refreshToken = Security.generateRefreshToken({
      userId,
    });

    await prisma.refreshToken.create({
      data: {
        userId,
        token: refreshToken,
        expiryAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      },
    });
  });

  afterAll(async () => {
    await prisma.refreshToken.deleteMany();
    await prisma.user.deleteMany();
    await prisma.$disconnect();
  });

  it('should rotate refresh token successfully', async () => {
    const res = await request(app)
      .get('/api/v1/auth/generate-new-tokens')
      .set('Cookie', [`refreshToken=${refreshToken}`]);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.accessToken).toBeDefined();

    expect(res.headers['set-cookie']).toBeDefined();
  });
});
