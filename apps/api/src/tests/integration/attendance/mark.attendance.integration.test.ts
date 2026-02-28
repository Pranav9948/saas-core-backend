import request from 'supertest';
import { app } from '@/app.js';
import { prisma } from '@/infra/db.js';
import { Security } from '@/core/security.js';

describe('POST /attendance', () => {
  let adminToken: string;
  let memberId: string;

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

    adminToken = Security.generateAccessToken({
      userId: admin.id,
      role: admin.role,
    });

    const member = await prisma.member.create({
      data: {
        firstName: 'John',
        lastName: 'Doe',
        email: `member-${crypto.randomUUID()}@test.com`,
        status: 'ACTIVE',
      },
    });

    memberId = member.id;
  });

  afterEach(async () => {
    await prisma.attendance.deleteMany();
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  it('should mark attendance successfully', async () => {
    const response = await request(app)
      .post('/api/v1/attendance')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ memberId });

    expect(response.status).toBe(201);
    expect(response.body.success).toBe(true);
  });

  it('should return 400 if duplicate check-in', async () => {
    await prisma.attendance.create({
      data: { memberId },
    });

    const response = await request(app)
      .post('/api/v1/attendance')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ memberId });

    expect(response.status).toBe(400);
  });

  it('should return 400 if member is inactive', async () => {
    await prisma.member.update({
      where: { id: memberId },
      data: { status: 'INACTIVE' },
    });

    const response = await request(app)
      .post('/api/v1/attendance')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ memberId });

    expect(response.status).toBe(400);
  });

  it('should return 404 if member does not exist', async () => {
    const response = await request(app)
      .post('/api/v1/attendance')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ memberId: `${crypto.randomUUID()}` });

    expect(response.status).toBe(404);
  });

  it('should return 401 if not authenticated', async () => {
    const response = await request(app)
      .post('/api/v1/attendance')
      .send({ memberId });

    expect(response.status).toBe(401);
  });

  it('should return 403 if role is not ADMIN or STAFF', async () => {
    const user = await prisma.user.create({
      data: {
        email: `user-${crypto.randomUUID()}@test.com`,
        passwordHash: 'hashed',
        role: 'MEMBER',
        firstName: 'Test',
        lastName: 'User',
      },
    });

    const token = Security.generateAccessToken({
      userId: user.id,
      role: user.role,
    });

    const response = await request(app)
      .post('/api/v1/attendance')
      .set('Authorization', `Bearer ${token}`)
      .send({ memberId });

    expect(response.status).toBe(403);
  });
});
