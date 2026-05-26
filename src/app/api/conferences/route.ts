import { prisma } from "@/lib/db";
import { NextResponse } from "next/server";

export async function GET() {
  const conferences = await prisma.conference.findMany({
    orderBy: { icpScore: "desc" },
    include: { _count: { select: { interactions: true } } },
  });

  return NextResponse.json(
    conferences.map((c) => ({
      id: c.id,
      name: c.name,
      date: c.date.toISOString(),
      endDate: c.endDate?.toISOString() || null,
      location: c.location,
      city: c.city,
      country: c.country,
      vertical: c.vertical,
      estimatedSize: c.estimatedSize,
      icpScore: c.icpScore,
      website: c.website,
      description: c.description,
      interactionCount: c._count.interactions,
    }))
  );
}
