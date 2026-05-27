import { NextRequest, NextResponse } from "next/server";
import { askAI } from "@/lib/ai";

export async function POST(req: NextRequest) {
  const { contactName, interactions } = await req.json();

  if (!interactions || interactions.length === 0) {
    return NextResponse.json({ error: "No interactions to analyze" }, { status: 400 });
  }

  const ctx = interactions
    .map(
      (i: { conferenceName: string; createdAt: string; temperature: string; capturedRoleAtTime: string | null; capturedCompanyAtTime: string | null; notes: string | null }) =>
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
    const result = await askAI(prompt);
    return NextResponse.json({ summary: result });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "Unknown error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
