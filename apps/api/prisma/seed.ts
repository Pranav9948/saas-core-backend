import {
  seedPermissions,
  seedRolesForAllTenants,
} from '../src/modules/rbac/rbac.seed.js';

import { prisma } from '../src/infra/db.js';

async function main() {
  console.log('🌱 Starting seed...');

  await seedPermissions(); // Step 1
  await seedRolesForAllTenants(); // Step 2

  console.log('🌱 Seeding completed');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
