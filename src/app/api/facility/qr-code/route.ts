import { NextResponse } from "next/server";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { getFacilityOrThrow } from "@/lib/facility";

const ALLOWED_TYPES = ["image/png", "image/jpeg", "image/webp"];
const MAX_BYTES = 2 * 1024 * 1024; // 2MB

// QR code is stored as a base64 data URI directly on Facility.qrCodeImage
// (no schema change, no external storage dependency) and is only ever
// served back through this authenticated route — never a public URL.
export async function GET() {
  const session = await auth();
  if (session?.user.role !== "COURT_OWNER") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const facility = await getFacilityOrThrow();
  if (!facility.qrCodeImage) {
    return NextResponse.json({ error: "No QR code uploaded" }, { status: 404 });
  }

  const match = facility.qrCodeImage.match(/^data:([^;]+);base64,([\s\S]*)$/);
  if (!match) {
    return NextResponse.json({ error: "Stored QR code is malformed" }, { status: 500 });
  }
  const [, mimeType, base64Data] = match;

  return new NextResponse(Buffer.from(base64Data, "base64"), {
    headers: {
      "Content-Type": mimeType,
      "Cache-Control": "private, no-store",
    },
  });
}

export async function POST(request: Request) {
  const session = await auth();
  if (session?.user.role !== "COURT_OWNER") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const formData = await request.formData();
  const file = formData.get("file");

  if (!(file instanceof File)) {
    return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
  }

  if (!ALLOWED_TYPES.includes(file.type)) {
    return NextResponse.json(
      { error: "Unsupported file type. Use PNG, JPEG, or WebP." },
      { status: 400 }
    );
  }

  if (file.size > MAX_BYTES) {
    return NextResponse.json(
      { error: "File too large. Max size is 2MB." },
      { status: 400 }
    );
  }

  const facility = await getFacilityOrThrow();
  const bytes = Buffer.from(await file.arrayBuffer());
  const dataUri = `data:${file.type};base64,${bytes.toString("base64")}`;

  await prisma.facility.update({
    where: { id: facility.id },
    data: { qrCodeImage: dataUri },
  });

  return NextResponse.json({ ok: true });
}
