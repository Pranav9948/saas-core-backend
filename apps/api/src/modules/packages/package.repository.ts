import { prisma } from '@/infra/db.js';

export class MembershipPackageRepository {
  async list(tenantId: string, includeInactive = false) {
    return prisma.membershipPackage.findMany({
      where: {
        tenantId,
        ...(includeInactive ? {} : { isActive: true }),
      },
      orderBy: [{ durationDays: 'asc' }, { name: 'asc' }],
      include: {
        _count: {
          select: {
            members: {
              where: { status: { not: 'DELETED' } },
            },
          },
        },
      },
    });
  }

  async findById(id: string, tenantId: string) {
    return prisma.membershipPackage.findFirst({
      where: { id, tenantId },
      include: {
        _count: {
          select: {
            members: {
              where: { status: { not: 'DELETED' } },
            },
          },
        },
      },
    });
  }

  async findByName(name: string, tenantId: string) {
    return prisma.membershipPackage.findFirst({
      where: {
        tenantId,
        name: { equals: name, mode: 'insensitive' },
      },
    });
  }

  async create(data: {
    tenantId: string;
    name: string;
    description?: string | null;
    durationDays: number;
    price: number;
    currency?: string;
    features?: string[];
    featureLimits?: Record<string, number>;
  }) {
    return prisma.membershipPackage.create({
      data: {
        tenantId: data.tenantId,
        name: data.name.trim(),
        description: data.description?.trim() || null,
        durationDays: data.durationDays,
        price: data.price,
        currency: data.currency ?? 'INR',
        features: data.features ?? [],
        featureLimits: data.featureLimits ?? {},
      },
      include: {
        _count: {
          select: {
            members: {
              where: { status: { not: 'DELETED' } },
            },
          },
        },
      },
    });
  }

  async update(
    id: string,
    tenantId: string,
    data: {
      name?: string;
      description?: string | null;
      durationDays?: number;
      price?: number;
      currency?: string;
      isActive?: boolean;
      features?: string[];
      featureLimits?: Record<string, number>;
    },
  ) {
    await prisma.membershipPackage.findFirstOrThrow({
      where: { id, tenantId },
    });

    return prisma.membershipPackage.update({
      where: { id },
      data: {
        ...(data.name !== undefined && { name: data.name.trim() }),
        ...(data.description !== undefined && {
          description: data.description?.trim() || null,
        }),
        ...(data.durationDays !== undefined && { durationDays: data.durationDays }),
        ...(data.price !== undefined && { price: data.price }),
        ...(data.currency !== undefined && { currency: data.currency }),
        ...(data.isActive !== undefined && { isActive: data.isActive }),
        ...(data.features !== undefined && { features: data.features }),
        ...(data.featureLimits !== undefined && { featureLimits: data.featureLimits }),
      },
      include: {
        _count: {
          select: {
            members: {
              where: { status: { not: 'DELETED' } },
            },
          },
        },
      },
    });
  }

  async countMembers(packageId: string, tenantId: string) {
    return prisma.member.count({
      where: {
        packageId,
        tenantId,
        status: { not: 'DELETED' },
      },
    });
  }

  async hardDelete(id: string) {
    return prisma.membershipPackage.delete({
      where: { id },
    });
  }
}
