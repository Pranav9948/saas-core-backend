import request from 'supertest';
import { app } from '@/app.js';
import { prisma } from '@/infra/db.js';
import { Security } from '@/core/security.js';

describe('PATCH /members/:id - Update Member (Integration)', () => {
  let memberId: string;
  let trainerId: string;
  let adminToken: string;

  beforeAll(async () => {
    const admin = await prisma.user.create({
      data: {
        email: `admin-${crypto.randomUUID()}@test.com`,
        passwordHash: 'hashed',
        role: 'ADMIN',
        firstName: 'Admin',
        lastName: 'User',
      },
    });

    const trainerUser = await prisma.user.create({
      data: {
        email: `trainer-${crypto.randomUUID()}@test.com`,
        passwordHash: 'hashed',
        role: 'TRAINER',
        firstName: 'Trainer',
        lastName: 'User',
      },
    });

    const trainer = await prisma.trainer.create({
      data: {
        userId: trainerUser.id,
        specialization: 'Fitness',
      },
    });

    trainerId = trainer.id;

    adminToken = Security.generateAccessToken({
      userId: admin.id,
      role: admin.role,
    });

    const member = await prisma.member.create({
      data: {
        email: `member-${crypto.randomUUID()}@test.com`,
        firstName: 'John',
        lastName: 'Doe',
      },
    });

    memberId = member.id;
  });

  afterAll(async () => {
    await prisma.member.deleteMany();
    await prisma.trainer.deleteMany();
    await prisma.user.deleteMany();
    await prisma.$disconnect();
  });

  it('should update member successfully', async () => {
    const response = await request(app)
      .patch(`/api/v1/members/${memberId}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        firstName: 'UpdatedName',
        assignedTrainerId: trainerId,
      });

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.data.firstName).toBe('UpdatedName');
  });

  it('should return 404 if member not found', async () => {
    const response = await request(app)
      .patch(`/api/v1/members/${crypto.randomUUID()}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ firstName: 'Test' });

    expect(response.status).toBe(404);
  });

  it('should return 404 if trainer not found', async () => {
    const response = await request(app)
      .patch(`/api/v1/members/${memberId}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        assignedTrainerId: crypto.randomUUID(),
      });

    expect(response.status).toBe(404);
  });

  it('should return 400 for invalid UUID', async () => {
    const response = await request(app)
      .patch(`/api/v1/members/invalid-uuid`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ firstName: 'Test' });

    expect(response.status).toBe(400);
  });

  it('should return 401 if no token provided', async () => {
    const response = await request(app)
      .patch(`/api/v1/members/${memberId}`)
      .send({ firstName: 'Test' });

    expect(response.status).toBe(401);
  });
});
