import { prisma } from "@/lib/db";
import { NextResponse } from "next/server";

export async function GET() {
  const contacts = await prisma.contact.findMany({
    orderBy: { updatedAt: "desc" },
    include: {
      interactions: {
        orderBy: { createdAt: "desc" },
        take: 1,
        include: { conference: { select: { name: true } } },
      },
      _count: { select: { interactions: true } },
    },
  });

  return NextResponse.json(
    contacts.map((c) => ({
      id: c.id,
      name: c.name,
      currentCompany: c.currentCompany,
      currentRole: c.currentRole,
      email: c.email,
      phone: c.phone,
      lifecycleStage: c.lifecycleStage,
      interactionCount: c._count.interactions,
      lastTemperature: c.interactions[0]?.temperature || "COLD",
      lastConference: c.interactions[0]?.conference.name || null,
    }))
  );
}
