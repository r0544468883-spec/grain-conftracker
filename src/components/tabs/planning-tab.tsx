"use client";

import { useEffect, useState } from "react";
import { AlertTriangle, Plane, MapPin } from "lucide-react";
import { cn } from "@/lib/utils";
import { type Conference } from "@/lib/types";

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

type Cluster = {
  names: string[];
  region: string;
  days: number;
};

function getRegion(country: string | null | undefined): string {
  if (!country) return "Other";
  const eu = ["Netherlands", "UK", "Germany", "Spain", "Portugal", "France"];
  const na = ["USA", "Canada"];
  if (eu.includes(country)) return "Europe";
  if (na.includes(country)) return "N. America";
  return "APAC";
}

function findClusters(confs: Conference[]): Cluster[] {
  const sorted = [...confs].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  const clusters: Cluster[] = [];

  for (let i = 0; i < sorted.length; i++) {
    for (let j = i + 1; j < sorted.length; j++) {
      const days = Math.round(Math.abs(new Date(sorted[j].date).getTime() - new Date(sorted[i].date).getTime()) / 86400000);
      const rA = getRegion(sorted[i].country);
      const rB = getRegion(sorted[j].country);
      if (days <= 14 && rA === rB) {
        const exists = clusters.some((c) => c.names.includes(sorted[i].name) && c.names.includes(sorted[j].name));
        if (!exists) {
          clusters.push({ names: [sorted[i].name, sorted[j].name], region: rA, days });
        }
      }
    }
  }
  return clusters;
}

export function PlanningTab() {
  const [conferences, setConferences] = useState<Conference[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  function loadData() {
    setLoading(true);
    setError(false);
    fetch("/api/conferences")
      .then((r) => r.json())
      .then((data) => { setConferences(data); setLoading(false); })
      .catch(() => { setError(true); setLoading(false); });
  }

  useEffect(() => { loadData(); }, []);

  if (loading) {
    return (
      <div className="p-4 space-y-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-16 rounded-xl bg-muted/50 animate-pulse" />
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-3">
        <p className="text-sm text-muted-foreground">Failed to load planning data</p>
        <button onClick={loadData} className="px-4 py-2 rounded-lg bg-grain-blue text-white text-sm">Try Again</button>
      </div>
    );
  }

  const byMonth: Record<number, Conference[]> = {};
  for (let m = 0; m < 12; m++) byMonth[m] = [];
  conferences.forEach((c) => {
    const m = new Date(c.date).getMonth();
    byMonth[m].push(c);
  });

  const gaps = Object.entries(byMonth).filter(([, c]) => c.length === 0).map(([m]) => parseInt(m));
  const clusters = findClusters(conferences);

  return (
    <div className="p-4 space-y-4">
      <div>
        <h2 className="text-lg font-bold" data-tour="planning-header">2026 Planning</h2>
        <p className="text-xs text-muted-foreground">
          {12 - gaps.length}/12 months covered &middot; {gaps.length} gaps &middot; {clusters.length} trip clusters
        </p>
      </div>

      {/* Clusters */}
      {clusters.length > 0 && (
        <div className="space-y-2" data-tour="trip-clusters">
          {clusters.map((c, i) => (
            <div key={i} className="flex items-start gap-2 p-2.5 rounded-lg bg-grain-blue/5 border border-grain-blue/20">
              <Plane className="w-4 h-4 text-grain-blue shrink-0 mt-0.5" />
              <div className="text-xs">
                <p className="font-medium">{c.region} — {c.days} days apart</p>
                <p className="text-muted-foreground">{c.names.join(" + ")}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Monthly grid */}
      <div className="grid grid-cols-3 gap-2">
        {MONTHS.map((name, idx) => {
          const confs = byMonth[idx];
          const isGap = confs.length === 0;
          return (
            <div
              key={idx}
              className={cn(
                "rounded-xl border p-2.5 min-h-[80px]",
                isGap
                  ? "border-orange-400/30 bg-orange-400/5"
                  : "border-border"
              )}
            >
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-medium">{name}</span>
                {isGap && <AlertTriangle className="w-3 h-3 text-orange-400" />}
              </div>
              {confs.length > 0 ? (
                confs.map((c) => (
                  <div key={c.id} className="text-[10px] text-muted-foreground mt-1 leading-tight">
                    <span className="font-medium text-foreground">{c.name.split(" ")[0]}</span>
                    <span className="ml-1">{c.icpScore}</span>
                  </div>
                ))
              ) : (
                <p className="text-[10px] text-orange-400 mt-1">Gap</p>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
