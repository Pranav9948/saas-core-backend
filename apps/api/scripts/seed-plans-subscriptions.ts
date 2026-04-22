import {
  BillingInterval,
  PlanName,
  SubscriptionStatus,
} from './../src/generated/prisma/enums';
import { prisma } from '../src/infra/db.js';

async function seedPlansAndSubscriptions() {
  console.log('--- Starting Plan Seeding ---');

  // 2. Fetch the FREE plan ID to use as default for existing gyms
  const freePlan = await prisma.plan.findUnique({
    where: { name: PlanName.FREE },
  });

  if (!freePlan) throw new Error('Free plan not found after seeding!');

  // 3. Find Tenants that DO NOT have a subscription yet
  console.log('--- Checking for gyms without subscriptions ---');
  const tenantsWithoutSub = await prisma.tenant.findMany({
    where: {
      subscriptions: {
        none: {}, // This filter finds records where the relation is empty
      },
    },
  });

  console.log(`Found ${tenantsWithoutSub.length} gyms needing a subscription.`);

  // 4. Backfill Subscriptions
  for (const tenant of tenantsWithoutSub) {
    await prisma.subscription.create({
      data: {
        tenantId: tenant.id,
        planId: freePlan.id,
        status: SubscriptionStatus.ACTIVE,
        currentPeriodStart: new Date(),
      },
    });

    console.log(
      `✅ Linked Gym: "${tenant.name}" (ID: ${tenant.id}) to FREE plan.`,
    );
  }

  console.log('--- Seed and Backfill Completed ---');
}

seedPlansAndSubscriptions()
  .catch((err) => {
    console.error('❌ Script failed:', err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
