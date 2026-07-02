import { NextResponse } from "next/server";
import { z } from "zod";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { getFacilityOrThrow } from "@/lib/facility";

const createSchema = z.object({
  name: z.string().min(1),
  surfaceType: z.enum(["INDOOR", "OUTDOOR"]),
  pricePerHour: z.number().positive(),
});

export async function GET() {
  const session = await auth();
  if (session?.user.role !== "COURT_OWNER") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const facility = await getFacilityOrThrow();
  const courts = await prisma.court.findMany({
    where: { facilityId: facility.id },
    orderBy: { createdAt: "asc" },
  });

  return NextResponse.json({ courts });
}

export async function POST(request: Request) {
  const session = await auth();
  if (session?.user.role !== "COURT_OWNER") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await request.json();
  const parsed = createSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.flatten().fieldErrors },
      { status: 400 }
    );
  }

  const facility = await getFacilityOrThrow();

  const court = await prisma.court.create({
    data: {
      facilityId: facility.id,
      name: parsed.data.name,
      surfaceType: parsed.data.surfaceType,
      pricePerHour: parsed.data.pricePerHour,
    },
  });

  return NextResponse.json({ court }, { status: 201 });
}
