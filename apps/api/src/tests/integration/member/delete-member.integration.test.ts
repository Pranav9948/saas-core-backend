import request from 'supertest';
import { app } from '@/app.js';
import { prisma } from '@/infra/db.js';
import { Security } from '@/core/security.js';

describe('DELETE /members/:id', () => {
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

    // Create member
    const member = await prisma.member.create({
      data: {
        email: 'member@test.com',
        firstName: 'John',
        lastName: 'Doe',
        status: 'ACTIVE',
      },
    });

    memberId = member.id;
  });

  afterAll(async () => {
    await prisma.member.deleteMany();
    await prisma.user.deleteMany();
    await prisma.$disconnect();
  });

  it('should soft delete member successfully', async () => {
    const response = await request(app)
      .delete(`/api/v1/members/${memberId}`)
      .set('Authorization', `Bearer ${adminToken}`);

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);

    const updatedMember = await prisma.member.findUnique({
      where: { id: memberId },
    });

    expect(updatedMember?.status).toBe('DELETED');
  });

  it('should return 404 if member does not exist', async () => {
    const response = await request(app)
      .delete(`/api/v1/members/${crypto.randomUUID()}`)
      .set('Authorization', `Bearer ${adminToken}`);

    expect(response.status).toBe(404);
  });

  it('should return 401 if no token provided', async () => {
    const response = await request(app).delete(`/api/v1/members/${memberId}`);

    expect(response.status).toBe(401);
  });

  it('should return 403 if user is not ADMIN', async () => {
    const staff = await prisma.user.create({
      data: {
        email: 'staff@test.com',
        passwordHash: 'hashed',
        role: 'STAFF',
        firstName: 'Staff',
        lastName: 'User',
      },
    });

    const staffToken = Security.generateAccessToken({
      userId: staff.id,
      role: staff.role,
    });

    const response = await request(app)
      .delete(`/api/v1/members/${memberId}`)
      .set('Authorization', `Bearer ${staffToken}`);

    expect(response.status).toBe(403);
  });
});
