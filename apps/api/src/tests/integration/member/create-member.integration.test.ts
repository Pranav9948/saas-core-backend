import { app } from '@/app.js';
import { Security } from '@/core/security.js';
import { prisma } from '@/infra/db.js';
import request from 'supertest';

describe('POST /members', () => {
  let adminToken: string;
  let trainerId: string;

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
  });

  afterAll(async () => {
    await prisma.member.deleteMany();
    await prisma.trainer.deleteMany();
    await prisma.user.deleteMany();
    await prisma.$disconnect();
  });

  it('should create member successfully', async () => {
    const email = `integration-${crypto.randomUUID()}@example.com`;

    const response = await request(app)
      .post('/api/v1/members')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        email,
        firstName: 'Integration',
        lastName: 'User',
        phone: '9999999999',
        dateOfBirth: '2000-01-01',
      });

    expect(response.status).toBe(201);
    expect(response.body.success).toBe(true);
    expect(response.body.data.email).toBe(email);
  });

  it('should fail if email already exists', async () => {
    const duplicateEmail = `duplicate-${crypto.randomUUID()}@example.com`;

    await prisma.member.create({
      data: {
        email: duplicateEmail,
        firstName: 'Dup',
        lastName: 'User',
      },
    });

    const response = await request(app)
      .post('/api/v1/members')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        email: duplicateEmail,
        firstName: 'Test',
        lastName: 'User',
      });

    expect(response.status).toBe(409);
  });

  it('should fail if trainer not found', async () => {
    const response = await request(app)
      .post('/api/v1/members')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        email: `trainerfail-${crypto.randomUUID()}@example.com`,
        firstName: 'Test',
        lastName: 'User',
        phone: '9999999999',
        dateOfBirth: '2000-01-01',
        assignedTrainerId: '00000000-0000-0000-0000-000000000000',
      });
    expect(response.status).toBe(404);
  });

  it('should create member successfully with valid trainer', async () => {
    const response = await request(app)
      .post('/api/v1/members')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        email: `trainersuccess-${crypto.randomUUID()}@example.com`,
        firstName: 'Test',
        lastName: 'User',
        phone: '9999999999',
        dateOfBirth: '2000-01-01',
        assignedTrainerId: trainerId,
      });

    expect(response.status).toBe(201);
    expect(response.body.success).toBe(true);
    expect(response.body.data.assignedTrainerId).toBe(trainerId);
  });
});
