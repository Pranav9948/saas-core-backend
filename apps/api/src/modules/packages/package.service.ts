import {
  BadRequestException,
  ConflictException,
  NotFoundException,
} from '@/exceptions/exceptions.js';
import { ErrorCode } from '@/exceptions/root.js';
import { MembershipPackageRepository } from './package.repository.js';
import {
  normalizePackageFeatureLimits,
  normalizePackageFeatures,
  parseFeatureLimits,
} from './package.features.js';

function toPackageDto<
  T extends { _count?: { members: number } },
>(pkg: T) {
  const { _count, ...rest } = pkg;
  return {
    ...rest,
    memberCount: _count?.members ?? 0,
  };
}

export class MembershipPackageService {
  constructor(private packageRepo = new MembershipPackageRepository()) {}

  async listPackages(tenantId: string, includeInactive = false) {
    const packages = await this.packageRepo.list(tenantId, includeInactive);
    return packages.map(toPackageDto);
  }

  async createPackage(
    tenantId: string,
    data: {
      name: string;
      description?: string;
      durationDays: number;
      price: number;
      currency?: string;
      features?: string[];
      featureLimits?: Record<string, number>;
    },
  ) {
    const duplicate = await this.packageRepo.findByName(data.name, tenantId);
    if (duplicate) {
      throw new ConflictException(
        'A package with this name already exists',
        ErrorCode.RESOURCE_ALREADY_EXISTS,
      );
    }

    const features = normalizePackageFeatures(data.features);
    const featureLimits = normalizePackageFeatureLimits(features, data.featureLimits);

    const created = await this.packageRepo.create({
      tenantId,
      name: data.name,
      description: data.description,
      durationDays: data.durationDays,
      price: data.price,
      currency: data.currency,
      features,
      featureLimits,
    });

    return toPackageDto(created);
  }

  async updatePackage(
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
    const existing = await this.packageRepo.findById(id, tenantId);
    if (!existing) {
      throw new NotFoundException('Package not found', ErrorCode.NOT_FOUND);
    }

    if (data.name && data.name.trim().toLowerCase() !== existing.name.toLowerCase()) {
      const duplicate = await this.packageRepo.findByName(data.name, tenantId);
      if (duplicate) {
        throw new ConflictException(
          'A package with this name already exists',
          ErrorCode.RESOURCE_ALREADY_EXISTS,
        );
      }
    }

    const features =
      data.features !== undefined
        ? normalizePackageFeatures(data.features)
        : existing.features;
    const featureLimits =
      data.features !== undefined || data.featureLimits !== undefined
        ? normalizePackageFeatureLimits(
            features,
            data.featureLimits ?? parseFeatureLimits(existing.featureLimits),
          )
        : undefined;

    const updated = await this.packageRepo.update(id, tenantId, {
      ...data,
      ...(data.features !== undefined && { features }),
      ...(featureLimits !== undefined && { featureLimits }),
    });
    return toPackageDto(updated);
  }

  async deletePackage(id: string, tenantId: string) {
    const existing = await this.packageRepo.findById(id, tenantId);
    if (!existing) {
      throw new NotFoundException('Package not found', ErrorCode.NOT_FOUND);
    }

    const assigned = existing._count.members;
    if (assigned > 0) {
      throw new BadRequestException(
        `Cannot delete this package because ${assigned} member${assigned === 1 ? ' is' : 's are'} still assigned to it. Reassign those members first.`,
      );
    }

    await this.packageRepo.hardDelete(id);
  }
}
