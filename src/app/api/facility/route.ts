import { NextResponse } from "next/server";
import { z } from "zod";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { getFacilityOrThrow } from "@/lib/facility";

const updateSchema = z.object({
  name: z.string().min(1),
  location: z.string().nullable().optional(),
  description: z.string().nullable().optional(),
  cancellationPolicy: z.string().nullable().optional(),
});

export async function GET() {
  const session = await auth();
  if (session?.user.role !== "COURT_OWNER") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const facility = await getFacilityOrThrow();

  return NextResponse.json({
    facility: {
      id: facility.id,
      name: facility.name,
      location: facility.location,
      description: facility.description,
      cancellationPolicy: facility.cancellationPolicy,
      hasQrCode: Boolean(facility.qrCodeImage),
    },
  });
}

export async function PATCH(request: Request) {
  const session = await auth();
  if (session?.user.role !== "COURT_OWNER") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await request.json();
  const parsed = updateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.flatten().fieldErrors },
      { status: 400 }
    );
  }

  const existing = await getFacilityOrThrow();

  const facility = await prisma.facility.update({
    where: { id: existing.id },
    data: parsed.data,
  });

  return NextResponse.json({
    facility: {
      id: facility.id,
      name: facility.name,
      location: facility.location,
      description: facility.description,
      cancellationPolicy: facility.cancellationPolicy,
      hasQrCode: Boolean(facility.qrCodeImage),
    },
  });
}
