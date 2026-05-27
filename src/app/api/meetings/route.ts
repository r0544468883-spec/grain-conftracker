import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET(req: NextRequest) {
  const conferenceId = req.nextUrl.searchParams.get("conferenceId");

  const where = conferenceId ? { conferenceId } : {};

  const meetings = await prisma.meeting.findMany({
    where,
    orderBy: { scheduledAt: "asc" },
    include: {
      contact: { select: { id: true, name: true, currentCompany: true, currentRole: true, aiLeadScore: true } },
      conference: { select: { id: true, name: true } },
    },
  });

  return NextResponse.json(meetings.map((m) => ({
    id: m.id,
    title: m.title,
    scheduledAt: m.scheduledAt.toISOString(),
    location: m.location,
    notes: m.notes,
    aiBriefing: m.aiBriefing,
    contact: m.contact,
    conference: m.conference,
  })));
}

export async function POST(req: NextRequest) {
  const { title, scheduledAt, location, notes, contactId, conferenceId } = await req.json();

  if (!title || !scheduledAt || !contactId || !conferenceId) {
    return NextResponse.json({ error: "title, scheduledAt, contactId, conferenceId required" }, { status: 400 });
  }

  const meeting = await prisma.meeting.create({
    data: {
      title,
      scheduledAt: new Date(scheduledAt),
      location: location || null,
      notes: notes || null,
      contactId,
      conferenceId,
    },
  });

  return NextResponse.json(meeting);
}
