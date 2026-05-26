import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  const { contactName, interactions, provider, apiKey } = await req.json();

  if (!apiKey) {
    return NextResponse.json({ error: "API key required" }, { status: 400 });
  }

  if (!interactions || interactions.length === 0) {
    return NextResponse.json({ error: "No interactions to analyze" }, { status: 400 });
  }

  const ctx = interactions
    .map(
      (i: any) =>
        `- ${i.conferenceName} (${new Date(i.createdAt).toLocaleDateString()}): Temp=${i.temperature}, Role=${i.capturedRoleAtTime || "N/A"} @ ${i.capturedCompanyAtTime || "N/A"}: "${i.notes || "no notes"}"`
    )
    .join("\n");

  const prompt = `You are a sales analyst for Grain (FX hedging fintech). Analyze interactions with ${contactName}:

${ctx}

Reply in EXACTLY this format (keep under 100 words total):
RELATIONSHIP: [2 sentences on how the relationship evolved]
STATUS: [Hot/Warm/Cold + one reason]
NEXT STEP: [1-2 specific actions]`;

  try {
    let result: string;

    if (provider === "anthropic") {
      const res = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": apiKey,
          "anthropic-version": "2023-06-01",
        },
        body: JSON.stringify({
          model: "claude-haiku-4-5-20251001",
          max_tokens: 200,
          messages: [{ role: "user", content: prompt }],
        }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error?.message || `Anthropic API error: ${res.status}`);
      }
      const d = await res.json();
      result = d.content[0].text;
    } else {
      const res = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: "gpt-4o-mini",
          messages: [{ role: "user", content: prompt }],
          max_tokens: 200,
        }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error?.message || `OpenAI API error: ${res.status}`);
      }
      const d = await res.json();
      result = d.choices[0].message.content;
    }

    return NextResponse.json({ summary: result });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
