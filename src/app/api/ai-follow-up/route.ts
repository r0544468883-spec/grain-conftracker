import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function POST(req: NextRequest) {
  const { contactId, provider, apiKey } = await req.json();

  if (!apiKey || !contactId) {
    return NextResponse.json({ error: "API key and contactId required" }, { status: 400 });
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
    let result: string;

    if (provider === "anthropic") {
      const res = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-api-key": apiKey, "anthropic-version": "2023-06-01" },
        body: JSON.stringify({ model: "claude-haiku-4-5-20251001", max_tokens: 400, messages: [{ role: "user", content: prompt }] }),
      });
      if (!res.ok) throw new Error(`Anthropic error: ${res.status}`);
      const d = await res.json();
      result = d.content[0].text;
    } else {
      const res = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
        body: JSON.stringify({ model: "gpt-4o-mini", messages: [{ role: "user", content: prompt }], max_tokens: 400 }),
      });
      if (!res.ok) throw new Error(`OpenAI error: ${res.status}`);
      const d = await res.json();
      result = d.choices[0].message.content;
    }

    return NextResponse.json({ email: result });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "Unknown error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
