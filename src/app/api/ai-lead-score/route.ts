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
        orderBy: { createdAt: "asc" },
        include: { conference: { select: { name: true, vertical: true, icpScore: true } } },
      },
    },
  });

  if (!contact) {
    return NextResponse.json({ error: "Contact not found" }, { status: 404 });
  }

  const ctx = contact.interactions
    .map(
      (i) =>
        `- ${i.conference.name} (${i.conference.vertical}, ICP:${i.conference.icpScore}), ${new Date(i.createdAt).toLocaleDateString()}: Temp=${i.temperature}, Role=${i.capturedRoleAtTime || "N/A"} @ ${i.capturedCompanyAtTime || "N/A"}: "${i.notes || ""}"`
    )
    .join("\n");

  const prompt = `You are a sales intelligence AI for Grain, a fintech providing embedded FX hedging.

Score this lead 0-100 and explain why. Consider:
- Number of interactions (more = more engaged)
- Temperature trend (warming up = good)
- Job title seniority (VP/C-level = high value)
- Company vertical fit (Payments/Treasury/Fintech = ideal for Grain)
- Recency of last interaction
- Signs of buying intent in notes

Contact: ${contact.name}
Current: ${contact.currentRole || "Unknown"} @ ${contact.currentCompany || "Unknown"}
Lifecycle: ${contact.lifecycleStage}
Interactions (${contact.interactions.length}):
${ctx || "No interactions yet"}

Reply in EXACTLY this JSON format (no markdown):
{"score": <number 0-100>, "reason": "<one sentence explanation>", "priority": "<HIGH/MEDIUM/LOW>"}`;

  try {
    const result = await askAI(prompt, 150);
    const cleaned = result.replace(/```json\n?|\n?```/g, "").trim();
    const parsed = JSON.parse(cleaned);

    await prisma.contact.update({
      where: { id: contactId },
      data: { aiLeadScore: parsed.score, aiScoreReason: parsed.reason },
    });

    return NextResponse.json(parsed);
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "Unknown error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
