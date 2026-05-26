import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  const { contacts, hubspotApiKey } = await req.json();

  if (!hubspotApiKey) {
    return NextResponse.json({ error: "HubSpot API key required" }, { status: 400 });
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
      lifecyclestage: contact.lifecycleStage?.toLowerCase() || "lead",
    };

    if (contact.email) properties.email = contact.email;
    if (contact.phone) properties.phone = contact.phone;

    try {
      // Try to create contact
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
        // Contact exists — update instead
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
    } catch (e: any) {
      results.push({ name: contact.name, status: "error", error: e.message });
    }
  }

  const created = results.filter((r) => r.status === "created").length;
  const updated = results.filter((r) => r.status === "updated").length;
  const errors = results.filter((r) => r.status === "error").length;

  return NextResponse.json({ results, summary: { created, updated, errors } });
}
