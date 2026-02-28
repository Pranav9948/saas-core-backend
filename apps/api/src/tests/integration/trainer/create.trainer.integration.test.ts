import request from 'supertest';
import { app } from '@/app.js';
import { prisma } from '@/infra/db.js';
import { Security } from '@/core/security.js';

describe('POST /trainers', () => {
  let adminToken: string;
  let normalUserToken: string;
  let userId: string;

  beforeAll(async () => {
    const admin = await prisma.user.create({
      data: {
        email: 'admin@test.com',
        passwordHash: 'hashed',
        role: 'ADMIN',
        firstName: 'Admin',
        lastName: 'User',
      },
    });

    const user = await prisma.user.create({
      data: {
        email: 'user@test.com',
        passwordHash: 'hashed',
        role: 'STAFF',
        firstName: 'Normal',
        lastName: 'User',
      },
    });

    adminToken = Security.generateAccessToken({
      userId: admin.id,
      role: admin.role,
    });

    normalUserToken = Security.generateAccessToken({
      userId: user.id,
      role: user.role,
    });
    userId = user.id;
  });

  afterAll(async () => {
    await prisma.trainer.deleteMany();
    await prisma.user.deleteMany();
    await prisma.$disconnect();
  });

  it('should return 401 if no token', async () => {
    const res = await request(app).post('/api/v1/trainers').send({ userId });

    expect(res.status).toBe(401);
  });

  it('should return 403 if not admin', async () => {
    const res = await request(app)
      .post('/api/v1/trainers')
      .set('Authorization', `Bearer ${normalUserToken}`)
      .send({ userId });

    expect(res.status).toBe(403);
  });

  it('should create trainer successfully', async () => {
    const res = await request(app)
      .post('/api/v1/trainers')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        userId,
        specialization: 'Yoga',
        bio: 'Expert trainer',
      });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);

    const updatedUser = await prisma.user.findUnique({
      where: { id: userId },
    });

    expect(updatedUser?.role).toBe('TRAINER');

    const trainer = await prisma.trainer.findFirst({
      where: { userId },
    });

    expect(trainer).not.toBeNull();
  });

  it('should fail if user already trainer', async () => {
    const res = await request(app)
      .post('/api/v1/trainers')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        userId,
        specialization: 'Yoga',
      });

    expect(res.status).toBe(400);
  });
});
