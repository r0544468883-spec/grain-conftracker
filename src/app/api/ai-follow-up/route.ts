import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { askAI } from "@/lib/ai";

export async function POST(req: NextRequest) {
  const { contactId } = await req.json();

  if (!contactId) {
    return NextResponse.json({ error: "contactId required" }, { status: 400 });
  }

  const contact = await prisma.contact.findUnique({
    where: { id: contactId },
    include: {
      interactions: {
        orderBy: { createdAt: "desc" },
        take: 3,
        include: { conference: { select: { name: true, vertical: true } } },
      },
    },
  });

  if (!contact || contact.interactions.length === 0) {
    return NextResponse.json({ error: "No interactions to base email on" }, { status: 400 });
  }

  const lastInteraction = contact.interactions[0];
  const ctx = contact.interactions
    .map((i) => `- ${i.conference.name}: ${i.temperature}, "${i.notes || "no notes"}"`)
    .join("\n");

  const prompt = `You are writing a follow-up email for a Grain sales rep after meeting someone at a conference.

Grain provides embedded FX hedging solutions for cross-border payment platforms, travel companies, and fintech.

Contact: ${contact.name}
Role: ${contact.currentRole || "Unknown"}
Company: ${contact.currentCompany || "Unknown"}
Last met at: ${lastInteraction.conference.name}
Temperature: ${lastInteraction.temperature}

Recent interaction notes:
${ctx}

Write a short, personalized follow-up email (3-4 paragraphs max). Rules:
- Open with a specific reference to what was discussed (from the notes)
- Mention Grain's value prop naturally (don't be salesy)
- Include a clear CTA (schedule a demo, share a case study, etc.)
- Professional but warm tone
- Subject line included

Reply in this format:
SUBJECT: <subject line>

<email body>`;

  try {
    const result = await askAI(prompt, 400);
    return NextResponse.json({ email: result });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "Unknown error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
