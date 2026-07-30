import { connectDB, prisma } from '../../infra/db.js';
import { getAllPermissionSeedData } from './permission-descriptions.js';
import { logger } from '@/core/logger.js';

/**
 * Seeds the global Permission catalog independently of tenants.
 * Safe to run multiple times (upsert by unique name).
 */
export async function seedPermissions(): Promise<void> {
  const permissions = getAllPermissionSeedData();

  for (const permission of permissions) {
    await prisma.permission.upsert({
      where: { name: permission.name },
      update: { description: permission.description },
      create: permission,
    });
  }

  logger.info(`✅ Permissions seeded (${permissions.length} total)`);
}

async function run() {
  await connectDB();
  await seedPermissions();
}

const isDirectRun = process.argv[1]?.includes('seed-permissions');

if (isDirectRun) {
  run()
    .catch((error) => {
      console.error(error);
      process.exit(1);
    })
    .finally(async () => {
      await prisma.$disconnect();
    });
}
