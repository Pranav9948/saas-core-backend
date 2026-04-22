import { prisma } from './../src/infra/db';
import { stripe } from './../src/modules/billing/stripe.service';

async function main() {
  const tenants = await prisma.tenant.findMany({
    where: {
      stripeCustomerId: null,
    },
  });

  console.log(`Found ${tenants.length} tenants to backfill`);

  for (const tenant of tenants) {
    try {
      const customer = await stripe.customers.create({
        name: tenant.name,
        metadata: {
          tenantId: tenant.id,
        },
      });

      await prisma.tenant.update({
        where: { id: tenant.id },
        data: {
          stripeCustomerId: customer.id,
        },
      });

      console.log(` Tenant ${tenant.id} linked to ${customer.id}`);
    } catch (err) {
      console.error(` Failed for tenant ${tenant.id}`, err);
    }
  }
}

main();
