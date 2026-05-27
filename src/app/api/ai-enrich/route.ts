import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { askAI } from "@/lib/ai";

export async function POST(req: NextRequest) {
  const { ocrText } = await req.json();

  if (!ocrText) {
    return NextResponse.json({ error: "OCR text required" }, { status: 400 });
  }

  const existingContacts = await prisma.contact.findMany({
    select: { id: true, name: true, currentCompany: true, email: true, currentRole: true },
    take: 200,
  });

  const existingList = existingContacts
    .map((c) => `${c.id} | ${c.name} | ${c.currentCompany || ""} | ${c.email || ""} | ${c.currentRole || ""}`)
    .join("\n");

  const prompt = `You are an AI assistant for a CRM. Analyze this business card OCR text and:
1. Extract structured contact info
2. Check if this person already exists in our database (fuzzy match — handle name variations like Bob/Robert, Dave/David)
3. If the person exists but company changed, flag it as a job change

OCR text from business card:
"""
${ocrText}
"""

Existing contacts in our database (format: id | name | company | email | role):
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
    const result = await askAI(prompt, 400);
    const cleaned = result.replace(/```json\n?|\n?```/g, "").trim();
    const parsed = JSON.parse(cleaned);
    return NextResponse.json(parsed);
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "Unknown error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
