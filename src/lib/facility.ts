import { prisma } from "@/lib/prisma";

// The system has exactly one pre-seeded Facility record — there is no
// create endpoint and no facilityId is ever supplied by the client.
export async function getFacilityOrThrow() {
  const facility = await prisma.facility.findFirst();
  if (!facility) {
    throw new Error("No facility record found — did prisma/seed.ts run?");
  }
  return facility;
}
