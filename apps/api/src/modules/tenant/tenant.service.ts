import slugifyPkg from 'slugify';
import { TenantRepository } from './tenant.repository.js';
import { NotFoundException } from '@/exceptions/exceptions.js';
import { ErrorCode } from '@/exceptions/root.js';

const slugify = slugifyPkg.default;

export class TenantService {
  constructor(private tenantRepo: TenantRepository) {}

  async generateUniqueSlug(name: string) {
    let baseSlug = slugify(name, { lower: true, strict: true });
    let slug = baseSlug;
    let counter = 1;

    while (await this.tenantRepo.slugExists(slug)) {
      slug = `${baseSlug}-${counter}`;
      counter++;
    }

    return slug;
  }

  async getCurrentTenant(tenantId: string) {
    return this.tenantRepo.findById(tenantId);
  }

  async updateTenant(tenantId: string, data: any) {
    const existing = await this.tenantRepo.findById(tenantId);

    if (!existing) {
      throw new NotFoundException('Gym not found', ErrorCode.NOT_FOUND);
    }

    return this.tenantRepo.updateTenant(tenantId, data);
  }
}
