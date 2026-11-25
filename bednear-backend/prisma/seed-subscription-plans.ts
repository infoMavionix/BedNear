
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const plans = [
  {
  code: "FREE_TRIAL",
  name: "Free Trial",
  description: "Try BedNear free for 30 days.",
  monthlyPrice: 0,
  quarterlyPrice: 0,
  features: [
    "One PG listing",
    "Basic PG profile and photos",
    "Location and contact details",
    "Receive candidate enquiries",
    "Standard listing visibility",
    "30 days free access",
  ],
},
  {
    code: "STARTER",
    name: "Starter",
    description: "Essential visibility for your PG property.",
    monthlyPrice: 99,
    quarterlyPrice: 297,
    features: [
      "One PG listing",
      "Basic PG profile and photos",
      "Location and contact details",
      "Receive candidate enquiries",
      "Standard listing visibility",
    ],
  },
  {
    code: "GROWTH",
    name: "Growth",
    description: "More tools to manage and promote your PG.",
    monthlyPrice: 149,
    quarterlyPrice: 447,
    features: [
      "Everything in Starter",
      "More listing photos",
      "Listing performance analytics",
      "Improved listing visibility",
      "Enquiry tracking",
    ],
  },
  {
    code: "PREMIUM",
    name: "Premium",
    description: "Additional promotion and visibility for your PG.",
    monthlyPrice: 249,
    quarterlyPrice: 747,
    features: [
      "Everything in Growth",
      "Featured PG listing",
      "Priority listing visibility",
      "Premium promotional placement",
      "Detailed enquiry analytics",
    ],
  },
];

async function main() {
  try {
    for (const plan of plans) {
      await prisma.subscriptionPlan.upsert({
        where: {
          code: plan.code,
        },
        update: {},
        create: plan,
      });
    }

    console.log(
      "BedNear subscription plans seeded successfully."
    );
  } finally {
    await prisma.$disconnect();
  }
}

void main();
