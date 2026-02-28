import { app } from '@/app.js';
import { Security } from '@/core/security.js';
import { prisma } from '@/infra/db.js';
import request from 'supertest';

describe('PATCH /trainers/:id', () => {
  let adminToken: string;
  let userToken: string;
  let trainerId: string;
  let userId: string;

  beforeAll(async () => {
    // Create admin user
    const admin = await prisma.user.create({
      data: {
        email: 'admin@test.com',
        passwordHash: 'hashed',
        role: 'ADMIN',
        firstName: 'Admin',
        lastName: 'User',
      },
    });

    adminToken = Security.generateAccessToken({
      userId: admin.id,
      role: admin.role,
    });

    // Create normal user
    const user = await prisma.user.create({
      data: {
        email: 'user@test.com',
        passwordHash: 'hashed',
        role: 'USER',
        firstName: 'Normal',
        lastName: 'User',
      },
    });

    userToken = Security.generateAccessToken({
      userId: user.id,
      role: user.role,
    });

    userId = user.id;

    const trainer = await prisma.trainer.create({
      data: {
        userId: user.id,
        specialization: 'Fitness',
        bio: 'Initial bio',
      },
    });

    trainerId = trainer.id;
  });

  afterAll(async () => {
    await prisma.trainer.deleteMany();
    await prisma.user.deleteMany();
    await prisma.$disconnect();
  });

  it('should return 401 if no token', async () => {
    const res = await request(app)
      .patch(`/api/v1/trainers/${trainerId}`)
      .send({ bio: 'Updated bio' });

    expect(res.status).toBe(401);
  });

  it('should return 403 if not admin', async () => {
    const res = await request(app)
      .patch(`/api/v1/trainers/${trainerId}`)
      .set('Authorization', `Bearer ${userToken}`)
      .send({ bio: 'Updated bio' });

    expect(res.status).toBe(403);
  });

  it('should return 404 if trainer not found', async () => {
    const fakeId = crypto.randomUUID();

    const res = await request(app)
      .patch(`/api/v1/trainers/${fakeId}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ bio: 'Updated bio' });

    expect(res.status).toBe(404);
  });

  it('should validate body', async () => {
    const res = await request(app)
      .patch(`/api/v1/trainers/${trainerId}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ specialization: '' });

    expect(res.status).toBe(400);
  });

  it('should update trainer successfully', async () => {
    const res = await request(app)
      .patch(`/api/v1/trainers/${trainerId}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ bio: 'Updated bio' });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);

    const updated = await prisma.trainer.findUnique({
      where: { id: trainerId },
    });

    expect(updated?.bio).toBe('Updated bio');
  });
});
