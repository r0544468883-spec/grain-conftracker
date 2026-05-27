import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function POST(req: NextRequest) {
  const { meetingId, provider, apiKey } = await req.json();

  if (!apiKey || !meetingId) {
    return NextResponse.json({ error: "API key and meetingId required" }, { status: 400 });
  }

  const meeting = await prisma.meeting.findUnique({
    where: { id: meetingId },
    include: {
      contact: {
        include: {
          interactions: {
            orderBy: { createdAt: "asc" },
            include: { conference: { select: { name: true, vertical: true } } },
          },
        },
      },
      conference: { select: { name: true, vertical: true } },
    },
  });

  if (!meeting) {
    return NextResponse.json({ error: "Meeting not found" }, { status: 404 });
  }

  const contact = meeting.contact;
  const ctx = contact.interactions
    .map((i) => `- ${i.conference.name} (${new Date(i.createdAt).toLocaleDateString()}): ${i.temperature}, Role: ${i.capturedRoleAtTime || "N/A"} @ ${i.capturedCompanyAtTime || "N/A"}: "${i.notes || ""}"`)
    .join("\n");

  const prevCompanies = Array.isArray(contact.previousCompanies) ? (contact.previousCompanies as string[]).join(", ") : "";

  const prompt = `You are a sales intelligence AI for Grain (FX hedging fintech). Prepare a 30-second pre-meeting briefing.

Meeting: "${meeting.title}" at ${meeting.conference.name}
Contact: ${contact.name}, ${contact.currentRole || "Unknown role"} @ ${contact.currentCompany || "Unknown company"}
${prevCompanies ? `Previously at: ${prevCompanies}` : ""}

All past interactions:
${ctx || "First meeting — no history"}

Write a concise briefing (max 80 words) in this format:
CONTEXT: [1-2 sentences — who they are and relationship history]
KEY INTEL: [1-2 bullets — what matters most for this meeting]
APPROACH: [1 sentence — exactly how to open the conversation]
AVOID: [1 thing NOT to say/do]`;

  try {
    let result: string;

    if (provider === "anthropic") {
      const res = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-api-key": apiKey, "anthropic-version": "2023-06-01" },
        body: JSON.stringify({ model: "claude-haiku-4-5-20251001", max_tokens: 200, messages: [{ role: "user", content: prompt }] }),
      });
      if (!res.ok) throw new Error(`Anthropic error: ${res.status}`);
      const d = await res.json();
      result = d.content[0].text;
    } else {
      const res = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
        body: JSON.stringify({ model: "gpt-4o-mini", messages: [{ role: "user", content: prompt }], max_tokens: 200 }),
      });
      if (!res.ok) throw new Error(`OpenAI error: ${res.status}`);
      const d = await res.json();
      result = d.choices[0].message.content;
    }

    // Save briefing to meeting
    await prisma.meeting.update({
      where: { id: meetingId },
      data: { aiBriefing: result },
    });

    return NextResponse.json({ briefing: result });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "Unknown error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
