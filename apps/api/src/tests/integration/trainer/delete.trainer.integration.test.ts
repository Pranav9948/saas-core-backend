import { app } from '@/app.js';
import { Security } from '@/core/security.js';
import { prisma } from '@/infra/db.js';
import request from 'supertest';

describe('DELETE /trainers/:id', () => {
  let adminToken: string;
  let userToken: string;
  let trainerId: string;
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
        email: 'trainer@test.com',
        passwordHash: 'hashed',
        role: 'TRAINER',
        firstName: 'Trainer',
        lastName: 'User',
      },
    });

    adminToken = Security.generateAccessToken({
      userId: admin.id,
      role: admin.role,
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
    const res = await request(app).delete(`/api/v1/trainers/${trainerId}`);
    expect(res.status).toBe(401);
  });

  it('should return 403 if not admin', async () => {
    const res = await request(app)
      .delete(`/api/v1/trainers/${trainerId}`)
      .set('Authorization', `Bearer ${userToken}`);

    expect(res.status).toBe(403);
  });

  it('should return 404 if trainer not found', async () => {
    const fakeId = crypto.randomUUID();

    const res = await request(app)
      .delete(`/api/v1/trainers/${fakeId}`)
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(404);
  });

  it('should delete trainer and revert role', async () => {
    const res = await request(app)
      .delete(`/api/v1/trainers/${trainerId}`)
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);

    const deletedTrainer = await prisma.trainer.findUnique({
      where: { id: trainerId },
    });

    expect(deletedTrainer).toBeNull();

    const updatedUser = await prisma.user.findUnique({
      where: { id: userId },
    });

    expect(updatedUser?.role).toBe('STAFF');
  });
});
