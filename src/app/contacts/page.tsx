import { prisma } from "@/lib/db";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Users, Building2, Mail, Flame, Thermometer, Snowflake } from "lucide-react";
import Link from "next/link";
import { ExportCsvButton } from "@/components/export-csv-button";

export const dynamic = "force-dynamic";

const tempIcon: Record<string, React.ReactNode> = {
  HOT: <Flame className="w-3.5 h-3.5 text-red-500" />,
  WARM: <Thermometer className="w-3.5 h-3.5 text-orange-400" />,
  COLD: <Snowflake className="w-3.5 h-3.5 text-blue-400" />,
};

const stageColors: Record<string, string> = {
  TARGET: "bg-grain-slate/10 text-grain-slate",
  LEAD: "bg-grain-blue/10 text-grain-blue",
  PROSPECT: "bg-grain-gold/10 text-grain-gold",
  CUSTOMER: "bg-green-500/10 text-green-600",
};

export default async function ContactsPage() {
  const contacts = await prisma.contact.findMany({
    orderBy: { updatedAt: "desc" },
    include: {
      interactions: {
        orderBy: { createdAt: "desc" },
        take: 1,
        include: { conference: true },
      },
      _count: { select: { interactions: true } },
    },
  });

  return (
    <div className="p-4 md:p-8 max-w-6xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Contacts</h1>
          <p className="text-muted-foreground text-sm mt-1">
            {contacts.length} contacts across all conferences
          </p>
        </div>
        <ExportCsvButton contacts={contacts} />
      </div>

      <div className="grid gap-3 md:grid-cols-2">
        {contacts.map((contact) => {
          const lastInteraction = contact.interactions[0];
          const lastTemp = lastInteraction?.temperature || "COLD";

          return (
            <Link key={contact.id} href={`/contacts/${contact.id}`}>
              <Card className="hover:border-grain-blue/30 transition-colors cursor-pointer">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-grain-navy/10 flex items-center justify-center shrink-0">
                        <span className="text-grain-navy font-semibold text-sm">
                          {contact.name
                            .split(" ")
                            .map((n) => n[0])
                            .join("")
                            .slice(0, 2)}
                        </span>
                      </div>
                      <div>
                        <p className="font-semibold text-sm">{contact.name}</p>
                        {contact.currentRole && (
                          <p className="text-xs text-muted-foreground">
                            {contact.currentRole}
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {tempIcon[lastTemp]}
                      <Badge
                        variant="secondary"
                        className={stageColors[contact.lifecycleStage] || ""}
                      >
                        {contact.lifecycleStage}
                      </Badge>
                    </div>
                  </div>

                  <div className="mt-3 flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                    {contact.currentCompany && (
                      <span className="flex items-center gap-1">
                        <Building2 className="w-3 h-3" />
                        {contact.currentCompany}
                      </span>
                    )}
                    {contact.email && (
                      <span className="flex items-center gap-1">
                        <Mail className="w-3 h-3" />
                        {contact.email}
                      </span>
                    )}
                    <span className="flex items-center gap-1">
                      <Users className="w-3 h-3" />
                      {contact._count.interactions} interactions
                    </span>
                  </div>

                  {lastInteraction && (
                    <p className="mt-2 text-xs text-muted-foreground">
                      Last seen at{" "}
                      <span className="font-medium text-foreground">
                        {lastInteraction.conference.name}
                      </span>{" "}
                      ({new Date(lastInteraction.createdAt).toLocaleDateString("en-US", { month: "short", year: "numeric" })})
                    </p>
                  )}
                </CardContent>
              </Card>
            </Link>
          );
        })}
      </div>

      {contacts.length === 0 && (
        <Card>
          <CardContent className="p-8 text-center">
            <Users className="w-10 h-10 mx-auto text-muted-foreground mb-3" />
            <p className="text-muted-foreground">
              No contacts yet. Start capturing leads at your next conference!
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
