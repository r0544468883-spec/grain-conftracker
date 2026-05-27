import { prisma } from "@/lib/db";
import { NextResponse } from "next/server";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const contact = await prisma.contact.findUnique({
    where: { id },
    include: {
      interactions: {
        orderBy: { createdAt: "asc" },
        include: {
          conference: {
            select: { name: true, location: true, vertical: true },
          },
        },
      },
      _count: { select: { interactions: true } },
    },
  });

  if (!contact) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json({
    id: contact.id,
    name: contact.name,
    currentCompany: contact.currentCompany,
    currentRole: contact.currentRole,
    email: contact.email,
    phone: contact.phone,
    lifecycleStage: contact.lifecycleStage,
    interactionCount: contact._count.interactions,
    lastTemperature: contact.interactions.at(-1)?.temperature || "COLD",
    lastConference: contact.interactions.at(-1)?.conference.name || null,
    previousCompanies: Array.isArray(contact.previousCompanies) ? contact.previousCompanies : [],
    interactions: contact.interactions.map((i) => ({
      id: i.id,
      notes: i.notes,
      temperature: i.temperature,
      capturedRoleAtTime: i.capturedRoleAtTime,
      capturedCompanyAtTime: i.capturedCompanyAtTime,
      createdAt: i.createdAt.toISOString(),
      conferenceName: i.conference.name,
      conferenceLocation: i.conference.location,
      conferenceVertical: i.conference.vertical,
    })),
  });
}
