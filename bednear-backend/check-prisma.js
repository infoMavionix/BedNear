const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

console.log(
  "PhoneOtpChallenge:",
  typeof prisma.phoneOtpChallenge
);

prisma.$disconnect();