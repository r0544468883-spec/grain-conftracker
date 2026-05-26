import { prisma } from "@/lib/db";
import { notFound } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  Building2,
  Mail,
  Phone,
  ExternalLink,
  Calendar,
  MapPin,
  Flame,
  Thermometer,
  Snowflake,
  ArrowLeft,
  History,
} from "lucide-react";
import Link from "next/link";
import { AiSummarizer } from "@/components/ai-summarizer";

export const dynamic = "force-dynamic";

const tempConfig: Record<string, { icon: React.ReactNode; label: string; color: string }> = {
  HOT: { icon: <Flame className="w-4 h-4" />, label: "Hot", color: "text-red-500 bg-red-500/10 border-red-500/20" },
  WARM: { icon: <Thermometer className="w-4 h-4" />, label: "Warm", color: "text-orange-400 bg-orange-400/10 border-orange-400/20" },
  COLD: { icon: <Snowflake className="w-4 h-4" />, label: "Cold", color: "text-blue-400 bg-blue-400/10 border-blue-400/20" },
};

const stageColors: Record<string, string> = {
  TARGET: "bg-grain-slate/10 text-grain-slate",
  LEAD: "bg-grain-blue/10 text-grain-blue",
  PROSPECT: "bg-grain-gold/10 text-grain-gold",
  CUSTOMER: "bg-green-500/10 text-green-600",
};

export default async function ContactProfilePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const contact = await prisma.contact.findUnique({
    where: { id },
    include: {
      interactions: {
        orderBy: { createdAt: "asc" },
        include: { conference: true },
      },
    },
  });

  if (!contact) notFound();

  const previousCompanies: string[] = contact.previousCompanies
    ? JSON.parse(contact.previousCompanies)
    : [];

  const interactionData = contact.interactions.map((i) => ({
    id: i.id,
    notes: i.notes || "",
    temperature: i.temperature,
    capturedRoleAtTime: i.capturedRoleAtTime,
    capturedCompanyAtTime: i.capturedCompanyAtTime,
    createdAt: i.createdAt.toISOString(),
    conferenceName: i.conference.name,
    conferenceVertical: i.conference.vertical,
  }));

  return (
    <div className="p-4 md:p-8 max-w-4xl mx-auto space-y-6">
      {/* Back link */}
      <Link
        href="/contacts"
        className="text-sm text-muted-foreground hover:text-foreground flex items-center gap-1"
      >
        <ArrowLeft className="w-4 h-4" /> Back to Contacts
      </Link>

      {/* Contact header */}
      <div className="flex items-start gap-4">
        <div className="w-14 h-14 rounded-full bg-grain-navy/10 flex items-center justify-center shrink-0">
          <span className="text-grain-navy font-bold text-lg">
            {contact.name
              .split(" ")
              .map((n) => n[0])
              .join("")
              .slice(0, 2)}
          </span>
        </div>
        <div className="flex-1">
          <h1 className="text-2xl font-bold">{contact.name}</h1>
          <div className="flex flex-wrap items-center gap-2 mt-1">
            {contact.currentRole && (
              <span className="text-sm text-muted-foreground">
                {contact.currentRole}
              </span>
            )}
            {contact.currentCompany && (
              <span className="text-sm text-muted-foreground flex items-center gap-1">
                <Building2 className="w-3.5 h-3.5" />
                {contact.currentCompany}
              </span>
            )}
          </div>
          <div className="flex flex-wrap gap-2 mt-2">
            <Badge
              variant="secondary"
              className={stageColors[contact.lifecycleStage] || ""}
            >
              {contact.lifecycleStage}
            </Badge>
            <Badge variant="outline">
              {contact.interactions.length} conferences
            </Badge>
          </div>
        </div>
      </div>

      {/* Contact details */}
      <Card>
        <CardContent className="p-4 grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
          {contact.email && (
            <div className="flex items-center gap-2 text-muted-foreground">
              <Mail className="w-4 h-4 shrink-0" />
              <span>{contact.email}</span>
            </div>
          )}
          {contact.phone && (
            <div className="flex items-center gap-2 text-muted-foreground">
              <Phone className="w-4 h-4 shrink-0" />
              <span>{contact.phone}</span>
            </div>
          )}
          {contact.linkedinUrl && (
            <div className="flex items-center gap-2 text-muted-foreground">
              <ExternalLink className="w-4 h-4 shrink-0" />
              <Link
                href={contact.linkedinUrl}
                target="_blank"
                className="text-grain-blue hover:underline"
              >
                LinkedIn Profile
              </Link>
            </div>
          )}
          {previousCompanies.length > 0 && (
            <div className="flex items-center gap-2 text-muted-foreground col-span-full">
              <History className="w-4 h-4 shrink-0" />
              <span>
                Previously at:{" "}
                {previousCompanies.join(", ")}
              </span>
            </div>
          )}
        </CardContent>
      </Card>

      {/* AI Summarizer */}
      <AiSummarizer
        contactName={contact.name}
        interactions={interactionData}
      />

      {/* Timeline */}
      <section>
        <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <Calendar className="w-5 h-5" />
          Interaction Timeline
        </h2>
        <div className="relative">
          {/* Timeline line */}
          <div className="absolute left-5 top-0 bottom-0 w-px bg-border" />

          <div className="space-y-4">
            {contact.interactions.map((interaction, idx) => {
              const temp = tempConfig[interaction.temperature] || tempConfig.COLD;
              const date = new Date(interaction.createdAt);

              return (
                <div key={interaction.id} className="relative pl-12">
                  {/* Timeline dot */}
                  <div
                    className={`absolute left-3 w-4 h-4 rounded-full border-2 border-background ${
                      interaction.temperature === "HOT"
                        ? "bg-red-500"
                        : interaction.temperature === "WARM"
                          ? "bg-orange-400"
                          : "bg-blue-400"
                    }`}
                    style={{ top: "6px" }}
                  />

                  <Card>
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <div>
                          <p className="font-semibold text-sm">
                            {interaction.conference.name}
                          </p>
                          <div className="flex items-center gap-2 text-xs text-muted-foreground mt-0.5">
                            <MapPin className="w-3 h-3" />
                            {interaction.conference.location}
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className={temp.color}>
                            {temp.icon}
                            <span className="ml-1">{temp.label}</span>
                          </Badge>
                          <span className="text-xs text-muted-foreground whitespace-nowrap">
                            {date.toLocaleDateString("en-US", {
                              month: "short",
                              day: "numeric",
                              year: "numeric",
                            })}
                          </span>
                        </div>
                      </div>

                      {/* Role at time if different */}
                      {(interaction.capturedRoleAtTime ||
                        interaction.capturedCompanyAtTime) && (
                        <div className="text-xs text-muted-foreground mb-2 flex items-center gap-1">
                          <span className="italic">
                            Role at time:{" "}
                            {interaction.capturedRoleAtTime || "N/A"} @{" "}
                            {interaction.capturedCompanyAtTime || "N/A"}
                          </span>
                          {interaction.capturedCompanyAtTime &&
                            interaction.capturedCompanyAtTime !==
                              contact.currentCompany && (
                              <Badge variant="outline" className="text-[10px] px-1 py-0 border-orange-400/30 text-orange-400">
                                Changed
                              </Badge>
                            )}
                        </div>
                      )}

                      {interaction.notes && (
                        <p className="text-sm text-foreground/90 leading-relaxed">
                          {interaction.notes}
                        </p>
                      )}

                      {interaction.source && (
                        <span className="text-[10px] text-muted-foreground mt-2 inline-block">
                          Source: {interaction.source}
                        </span>
                      )}
                    </CardContent>
                  </Card>
                </div>
              );
            })}
          </div>
        </div>
      </section>
    </div>
  );
}
