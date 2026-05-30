import { NextResponse } from "next/server";

export async function GET() {
  const hubspotApiKey = process.env.HUBSPOT_API_KEY;

  if (!hubspotApiKey) {
    return NextResponse.json({ connected: false, message: "HubSpot API key not configured" });
  }

  try {
    const res = await fetch("https://api.hubapi.com/crm/v3/objects/contacts?limit=1", {
      headers: { Authorization: `Bearer ${hubspotApiKey}` },
    });

    if (res.ok) {
      const data = await res.json();
      return NextResponse.json({
        connected: true,
        message: `Connected — ${data.total} contacts in HubSpot`,
      });
    } else {
      return NextResponse.json({
        connected: false,
        message: `HubSpot returned ${res.status}`,
      });
    }
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "Unknown error";
    return NextResponse.json({ connected: false, message: msg });
  }
}
