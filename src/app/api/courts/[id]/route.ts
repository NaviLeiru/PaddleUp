import { NextResponse } from "next/server";
import { z } from "zod";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { getFacilityOrThrow } from "@/lib/facility";

const updateSchema = z.object({
  name: z.string().min(1).optional(),
  surfaceType: z.enum(["INDOOR", "OUTDOOR"]).optional(),
  pricePerHour: z.number().positive().optional(),
});

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (session?.user.role !== "COURT_OWNER") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;
  const facility = await getFacilityOrThrow();
  const court = await prisma.court.findFirst({
    where: { id, facilityId: facility.id },
  });

  if (!court) {
    return NextResponse.json({ error: "Court not found" }, { status: 404 });
  }

  return NextResponse.json({ court });
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (session?.user.role !== "COURT_OWNER") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;
  const body = await request.json();
  const parsed = updateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.flatten().fieldErrors },
      { status: 400 }
    );
  }

  const facility = await getFacilityOrThrow();
  const existing = await prisma.court.findFirst({
    where: { id, facilityId: facility.id },
  });

  if (!existing) {
    return NextResponse.json({ error: "Court not found" }, { status: 404 });
  }

  const court = await prisma.court.update({
    where: { id },
    data: parsed.data,
  });

  return NextResponse.json({ court });
}
