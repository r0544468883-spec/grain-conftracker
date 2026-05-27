import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function POST(req: NextRequest) {
  const { ocrText, provider, apiKey } = await req.json();

  if (!apiKey || !ocrText) {
    return NextResponse.json({ error: "API key and OCR text required" }, { status: 400 });
  }

  // Get existing contacts for fuzzy matching
  const existingContacts = await prisma.contact.findMany({
    select: { id: true, name: true, currentCompany: true, email: true, currentRole: true },
    take: 200,
  });

  const existingList = existingContacts
    .map((c) => `${c.name} | ${c.currentCompany || ""} | ${c.email || ""} | ${c.currentRole || ""}`)
    .join("\n");

  const prompt = `You are an AI assistant for a CRM. Analyze this business card OCR text and:
1. Extract structured contact info
2. Check if this person already exists in our database (fuzzy match — handle name variations like Bob/Robert, Dave/David)
3. If the person exists but company changed, flag it as a job change

OCR text from business card:
"""
${ocrText}
"""

Existing contacts in our database:
${existingList || "No existing contacts"}

Reply in EXACTLY this JSON format (no markdown):
{
  "extracted": {
    "name": "<full name or empty>",
    "company": "<company or empty>",
    "role": "<job title or empty>",
    "email": "<email or empty>",
    "phone": "<phone or empty>"
  },
  "matchFound": <true/false>,
  "matchedContactId": "<id of matched contact or null>",
  "matchConfidence": "<HIGH/MEDIUM/LOW>",
  "matchReason": "<why matched or why not>",
  "isJobChange": <true/false>,
  "jobChangeNote": "<e.g. 'Was at TransferHub, now at PayFlow' or null>",
  "enrichmentNote": "<any additional insight about this person/company>"
}`;

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

    const cleaned = result.replace(/```json\n?|\n?```/g, "").trim();
    const parsed = JSON.parse(cleaned);
    return NextResponse.json(parsed);
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "Unknown error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
