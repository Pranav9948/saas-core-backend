import request from 'supertest';
import { app } from '@/app.js';
import { prisma } from '@/infra/db.js';
import { Security } from '@/core/security.js';

describe('GET /attendance/stats/:id', () => {
  let adminToken: string;
  let staffToken: string;
  let memberToken: string;
  let memberId: string;

  beforeAll(async () => {
    // Create ADMIN
    const admin = await prisma.user.create({
      data: {
        email: `admin-${crypto.randomUUID()}@test.com`,
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

    // Create STAFF
    const staff = await prisma.user.create({
      data: {
        email: `staff-${crypto.randomUUID()}@test.com`,
        passwordHash: 'hashed',
        role: 'STAFF',
        firstName: 'Staff',
        lastName: 'User',
      },
    });

    staffToken = Security.generateAccessToken({
      userId: staff.id,
      role: staff.role,
    });

    // Create MEMBER role user (unauthorized role)
    const memberUser = await prisma.user.create({
      data: {
        email: `memberuser-${crypto.randomUUID()}@test.com`,
        passwordHash: 'hashed',
        role: 'MEMBER',
        firstName: 'Member',
        lastName: 'User',
      },
    });

    memberToken = Security.generateAccessToken({
      userId: memberUser.id,
      role: memberUser.role,
    });

    // Create actual gym member entity
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

  it('should return attendance stats for valid member (ADMIN)', async () => {
    await prisma.attendance.create({
      data: { memberId },
    });

    const response = await request(app)
      .get(`/api/v1/attendance/stats/${memberId}`)
      .set('Authorization', `Bearer ${adminToken}`);

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.data.totalVisits).toBe(1);
    expect(response.body.data.lastVisit).not.toBeNull();
  });

  it('should return attendance stats for valid member (STAFF)', async () => {
    const response = await request(app)
      .get(`/api/v1/attendance/stats/${memberId}`)
      .set('Authorization', `Bearer ${staffToken}`);

    expect(response.status).toBe(200);
    expect(response.body.data.totalVisits).toBe(0);
    expect(response.body.data.lastVisit).toBeNull();
  });

  it('should return 404 if member does not exist', async () => {
    const response = await request(app)
      .get(`/api/v1/attendance/stats/${crypto.randomUUID()}`)
      .set('Authorization', `Bearer ${adminToken}`);

    expect(response.status).toBe(404);
  });

  it('should return 400 for invalid UUID', async () => {
    const response = await request(app)
      .get(`/api/v1/attendance/stats/invalid-id`)
      .set('Authorization', `Bearer ${adminToken}`);

    expect(response.status).toBe(400);
  });

  it('should return 401 if not authenticated', async () => {
    const response = await request(app).get(
      `/api/v1/attendance/stats/${memberId}`,
    );

    expect(response.status).toBe(401);
  });
});
