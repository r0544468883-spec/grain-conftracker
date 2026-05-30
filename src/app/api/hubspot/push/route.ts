import { NextRequest, NextResponse } from "next/server";

// Map our lifecycle stages to HubSpot's valid stages
function mapLifecycleStage(stage: string | undefined): string {
  const map: Record<string, string> = {
    TARGET: "subscriber",
    LEAD: "lead",
    PROSPECT: "salesqualifiedlead",
    CUSTOMER: "customer",
  };
  return map[stage?.toUpperCase() || ""] || "lead";
}

export async function POST(req: NextRequest) {
  const { contacts } = await req.json();

  const hubspotApiKey = process.env.HUBSPOT_API_KEY;
  if (!hubspotApiKey) {
    return NextResponse.json({ error: "HubSpot is not configured. Contact your administrator." }, { status: 400 });
  }

  if (!contacts || contacts.length === 0) {
    return NextResponse.json({ error: "No contacts to push" }, { status: 400 });
  }

  const results: { name: string; status: "created" | "updated" | "error"; error?: string }[] = [];

  for (const contact of contacts) {
    const nameParts = contact.name.split(" ");
    const firstName = nameParts[0] || "";
    const lastName = nameParts.slice(1).join(" ") || "";

    const properties: Record<string, string> = {
      firstname: firstName,
      lastname: lastName,
      company: contact.currentCompany || "",
      jobtitle: contact.currentRole || "",
      lifecyclestage: mapLifecycleStage(contact.lifecycleStage),
    };

    if (contact.email) properties.email = contact.email;
    if (contact.phone) properties.phone = contact.phone;

    try {
      const createRes = await fetch("https://api.hubapi.com/crm/v3/objects/contacts", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${hubspotApiKey}`,
        },
        body: JSON.stringify({ properties }),
      });

      if (createRes.ok) {
        results.push({ name: contact.name, status: "created" });
      } else if (createRes.status === 409) {
        const err = await createRes.json();
        const existingId = err.message?.match(/ID: (\d+)/)?.[1];

        if (existingId) {
          const updateRes = await fetch(
            `https://api.hubapi.com/crm/v3/objects/contacts/${existingId}`,
            {
              method: "PATCH",
              headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${hubspotApiKey}`,
              },
              body: JSON.stringify({ properties }),
            }
          );
          results.push({
            name: contact.name,
            status: updateRes.ok ? "updated" : "error",
            error: updateRes.ok ? undefined : `Update failed: ${updateRes.status}`,
          });
        } else {
          results.push({ name: contact.name, status: "updated" });
        }
      } else {
        const errBody = await createRes.json().catch(() => ({}));
        results.push({
          name: contact.name,
          status: "error",
          error: errBody.message || `HTTP ${createRes.status}`,
        });
      }
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Unknown error";
      results.push({ name: contact.name, status: "error", error: msg });
    }
  }

  const created = results.filter((r) => r.status === "created").length;
  const updated = results.filter((r) => r.status === "updated").length;
  const errors = results.filter((r) => r.status === "error").length;

  return NextResponse.json({ results, summary: { created, updated, errors } });
}
