import { prisma } from "@/lib/db";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CalendarRange, AlertTriangle, Plane, MapPin } from "lucide-react";

export const dynamic = "force-dynamic";

const MONTHS = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
];

type ConferenceWithScore = {
  id: string;
  name: string;
  date: Date;
  endDate: Date | null;
  location: string;
  city: string | null;
  country: string | null;
  vertical: string;
  estimatedSize: number;
  icpScore: number;
};

function getRegion(country: string | null): string {
  if (!country) return "Unknown";
  const eu = ["Netherlands", "UK", "Germany", "Spain", "Portugal", "France", "Italy"];
  const na = ["USA", "Canada"];
  const apac = ["Singapore", "Japan", "Australia", "China", "India"];
  if (eu.includes(country)) return "Europe";
  if (na.includes(country)) return "North America";
  if (apac.includes(country)) return "APAC";
  return "Other";
}

type TripCluster = {
  conferences: ConferenceWithScore[];
  region: string;
  daySpan: number;
};

function findTripClusters(conferences: ConferenceWithScore[]): TripCluster[] {
  const clusters: TripCluster[] = [];
  const sorted = [...conferences].sort(
    (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
  );

  for (let i = 0; i < sorted.length; i++) {
    const group: ConferenceWithScore[] = [sorted[i]];
    const regionA = getRegion(sorted[i].country);

    for (let j = i + 1; j < sorted.length; j++) {
      const dayDiff = Math.abs(
        (new Date(sorted[j].date).getTime() - new Date(sorted[i].date).getTime()) /
          (1000 * 60 * 60 * 24)
      );
      const regionB = getRegion(sorted[j].country);

      if (dayDiff <= 14 && regionA === regionB) {
        group.push(sorted[j]);
      }
    }

    if (group.length >= 2) {
      const exists = clusters.some(
        (c) =>
          c.conferences.length === group.length &&
          c.conferences.every((conf) => group.some((g) => g.id === conf.id))
      );
      if (!exists) {
        const dates = group.map((g) => new Date(g.date).getTime());
        const daySpan = Math.round(
          (Math.max(...dates) - Math.min(...dates)) / (1000 * 60 * 60 * 24)
        );
        clusters.push({ conferences: group, region: regionA, daySpan });
      }
    }
  }
  return clusters;
}

export default async function PlanningPage() {
  const conferences = await prisma.conference.findMany({
    orderBy: { date: "asc" },
  });

  // Group by month
  const byMonth: Record<number, ConferenceWithScore[]> = {};
  for (let m = 0; m < 12; m++) byMonth[m] = [];
  for (const conf of conferences) {
    const month = new Date(conf.date).getMonth();
    byMonth[month].push(conf);
  }

  // Find gaps (months with no events)
  const gaps = Object.entries(byMonth)
    .filter(([, confs]) => confs.length === 0)
    .map(([m]) => parseInt(m));

  // Find trip clusters
  const clusters = findTripClusters(conferences);

  // Coverage stats
  const coveredMonths = 12 - gaps.length;
  const regions = [...new Set(conferences.map((c) => getRegion(c.country)))];

  return (
    <div className="p-4 md:p-8 max-w-6xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">
          Annual Planning 2026
        </h1>
        <p className="text-muted-foreground text-sm mt-1">
          Coverage map, investment gaps, and trip cluster opportunities
        </p>
      </div>

      {/* Summary stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Card>
          <CardContent className="p-4">
            <span className="text-muted-foreground text-xs uppercase tracking-wide">
              Coverage
            </span>
            <p className="text-2xl font-bold mt-1">
              {coveredMonths}/12{" "}
              <span className="text-sm font-normal text-muted-foreground">
                months
              </span>
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <span className="text-muted-foreground text-xs uppercase tracking-wide">
              Regions
            </span>
            <p className="text-2xl font-bold mt-1">{regions.length}</p>
          </CardContent>
        </Card>
        <Card
          className={
            gaps.length > 0
              ? "border-orange-500/30 bg-orange-500/5"
              : "border-green-500/30 bg-green-500/5"
          }
        >
          <CardContent className="p-4">
            <span className="text-muted-foreground text-xs uppercase tracking-wide">
              Gaps
            </span>
            <p className="text-2xl font-bold mt-1">{gaps.length} months</p>
          </CardContent>
        </Card>
        <Card
          className={
            clusters.length > 0
              ? "border-grain-blue/30 bg-grain-blue/5"
              : ""
          }
        >
          <CardContent className="p-4">
            <span className="text-muted-foreground text-xs uppercase tracking-wide">
              Trip Clusters
            </span>
            <p className="text-2xl font-bold mt-1">{clusters.length}</p>
          </CardContent>
        </Card>
      </div>

      {/* Trip Cluster Alerts */}
      {clusters.length > 0 && (
        <section>
          <h2 className="text-lg font-semibold mb-3 flex items-center gap-2">
            <Plane className="w-5 h-5 text-grain-blue" />
            Trip Cluster Opportunities
          </h2>
          <div className="space-y-3">
            {clusters.map((cluster, i) => (
              <Card
                key={i}
                className="border-grain-blue/20 bg-grain-blue/5"
              >
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-full bg-grain-blue/10 flex items-center justify-center shrink-0">
                      <Plane className="w-4 h-4 text-grain-blue" />
                    </div>
                    <div className="flex-1">
                      <p className="font-medium text-sm">
                        {cluster.region} &mdash; {cluster.daySpan} days apart
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        Combine these events into one trip to save flight costs:
                      </p>
                      <div className="flex flex-wrap gap-2 mt-2">
                        {cluster.conferences.map((c) => (
                          <Badge key={c.id} variant="secondary" className="text-xs">
                            {c.name} (
                            {new Date(c.date).toLocaleDateString("en-US", {
                              month: "short",
                              day: "numeric",
                            })}
                            )
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>
      )}

      {/* Monthly Timeline */}
      <section>
        <h2 className="text-lg font-semibold mb-3 flex items-center gap-2">
          <CalendarRange className="w-5 h-5" />
          Monthly Coverage
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
          {MONTHS.map((monthName, idx) => {
            const confs = byMonth[idx];
            const isGap = confs.length === 0;
            const now = new Date();
            const isPast =
              now.getFullYear() > 2026 ||
              (now.getFullYear() === 2026 && now.getMonth() > idx);

            return (
              <Card
                key={idx}
                className={
                  isGap && !isPast
                    ? "border-orange-500/30 bg-orange-500/5"
                    : isPast
                      ? "opacity-50"
                      : ""
                }
              >
                <CardHeader className="pb-1 pt-3 px-4">
                  <CardTitle className="text-sm flex items-center justify-between">
                    <span>{monthName} 2026</span>
                    {isGap && !isPast && (
                      <AlertTriangle className="w-4 h-4 text-orange-500" />
                    )}
                  </CardTitle>
                </CardHeader>
                <CardContent className="px-4 pb-3">
                  {confs.length > 0 ? (
                    <div className="space-y-2">
                      {confs.map((c) => (
                        <div
                          key={c.id}
                          className="text-xs border-l-2 border-grain-blue pl-2 py-1"
                        >
                          <p className="font-medium">{c.name}</p>
                          <div className="flex items-center gap-1 text-muted-foreground mt-0.5">
                            <MapPin className="w-3 h-3" />
                            <span>{c.city || c.location}</span>
                            <Badge
                              variant="outline"
                              className="ml-1 text-[10px] px-1 py-0"
                            >
                              ICP {c.icpScore}
                            </Badge>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-muted-foreground">
                      {isPast ? "No events" : "Under-invested"}
                    </p>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      </section>
    </div>
  );
}
