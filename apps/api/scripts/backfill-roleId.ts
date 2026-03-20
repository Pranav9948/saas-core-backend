import { prisma } from '../src/infra/db.js';

async function backfillRoleId() {
  console.log('Starting roleId backfill...');

  const tenantUsers = await prisma.tenantUser.findMany({
    where: {
      roleId: null,
    },
    include: {
      tenant: true,
    },
  });

  console.log(`Found ${tenantUsers.length} users to update`);
  for (const tu of tenantUsers) {
    const roleName = tu.role || 'STAFF';

    // find matching role in SAME tenant
    const role = await prisma.role.findFirst({
      where: {
        name: roleName,
        tenantId: tu.tenantId,
      },
    });

    if (!role) {
      console.warn(
        `⚠️ Role not found for ${roleName} in tenant ${tu.tenantId}`,
      );
      continue;
    }

    await prisma.tenantUser.update({
      where: { id: tu.id },
      data: {
        roleId: role.id,
      },
    });

    console.log(`Updated user ${tu.userId} (${roleName} → ${role.id})`);
  }

  console.log('Backfill completed');
}

backfillRoleId()
  .catch((err) => {
    console.error('Backfill failed', err);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
