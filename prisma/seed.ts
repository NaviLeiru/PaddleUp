import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const ownerEmail = process.env.OWNER_EMAIL ?? "owner@paddleup.test";
  const ownerPassword = process.env.OWNER_PASSWORD ?? "change-me";
  const ownerName = process.env.OWNER_NAME ?? "Facility Owner";
  const facilityName = process.env.FACILITY_NAME ?? "PaddleUp Courts";

  const passwordHash = await bcrypt.hash(ownerPassword, 10);

  await prisma.user.upsert({
    where: { email: ownerEmail },
    update: {},
    create: {
      email: ownerEmail,
      name: ownerName,
      passwordHash,
      role: "COURT_OWNER",
    },
  });

  const existingFacility = await prisma.facility.findFirst();
  if (!existingFacility) {
    await prisma.facility.create({
      data: {
        name: facilityName,
      },
    });
  }

  console.log("Seed complete:");
  console.log(`  Court Owner: ${ownerEmail}`);
  console.log(`  Facility: ${facilityName}`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
