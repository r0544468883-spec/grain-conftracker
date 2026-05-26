"use client";

import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";

type ContactForExport = {
  id: string;
  name: string;
  currentCompany: string | null;
  currentRole: string | null;
  email: string | null;
  phone: string | null;
  lifecycleStage: string;
  _count: { interactions: number };
};

export function ExportCsvButton({ contacts }: { contacts: ContactForExport[] }) {
  function exportToHubSpotCsv() {
    // HubSpot standard contact import columns
    const headers = [
      "First Name",
      "Last Name",
      "Email",
      "Phone Number",
      "Company Name",
      "Job Title",
      "Lifecycle Stage",
      "Number of Conference Interactions",
    ];

    const rows = contacts.map((c) => {
      const nameParts = c.name.split(" ");
      const firstName = nameParts[0] || "";
      const lastName = nameParts.slice(1).join(" ") || "";
      return [
        firstName,
        lastName,
        c.email || "",
        c.phone || "",
        c.currentCompany || "",
        c.currentRole || "",
        c.lifecycleStage.toLowerCase(),
        c._count.interactions.toString(),
      ];
    });

    const csvContent = [
      headers.join(","),
      ...rows.map((row) =>
        row.map((v) => `"${v.replace(/"/g, '""')}"`).join(",")
      ),
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `grain-contacts-hubspot-${new Date().toISOString().split("T")[0]}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  }

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={exportToHubSpotCsv}
      className="gap-2"
    >
      <Download className="w-4 h-4" />
      Export to HubSpot CSV
    </Button>
  );
}
