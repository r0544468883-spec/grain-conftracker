"use client";

import { useEffect, useState } from "react";
import { Calendar, MapPin, List, LayoutGrid, ChevronLeft, ChevronRight, Users, ExternalLink, Clock, Search } from "lucide-react";
import { cn } from "@/lib/utils";
import { type Conference, VERTICAL_COLORS, VERTICAL_DOTS } from "@/lib/types";

const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];
const DAY_NAMES = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];


export function DashboardTab() {
  const [conferences, setConferences] = useState<Conference[]>([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<"list" | "calendar">("list");
  const [calMonth, setCalMonth] = useState(new Date().getMonth());
  const [calYear, setCalYear] = useState(2026);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [filterVertical, setFilterVertical] = useState("");
  const [searchQ, setSearchQ] = useState("");
  const [error, setError] = useState(false);

  function loadConferences() {
    setLoading(true);
    setError(false);
    fetch("/api/conferences")
      .then((r) => r.json())
      .then((data) => { setConferences(data); setLoading(false); })
      .catch(() => { setError(true); setLoading(false); });
  }

  useEffect(() => { loadConferences(); }, []);

  if (loading) {
    return (
      <div className="p-4 space-y-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-20 rounded-xl bg-muted/50 animate-pulse" />
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-3">
        <p className="text-sm text-muted-foreground">Failed to load conferences</p>
        <button onClick={loadConferences} className="px-4 py-2 rounded-lg bg-grain-blue text-white text-sm">
          Try Again
        </button>
      </div>
    );
  }

  const now = new Date();
  const filteredConfs = conferences.filter((c) => {
    if (filterVertical && c.vertical !== filterVertical) return false;
    if (searchQ && !c.name.toLowerCase().includes(searchQ.toLowerCase()) && !c.location.toLowerCase().includes(searchQ.toLowerCase())) return false;
    return true;
  });
  const upcoming = filteredConfs.filter((c) => new Date(c.date) >= now);
  const past = filteredConfs.filter((c) => new Date(c.date) < now);

  // Build calendar grid for current month
  function getCalendarDays(year: number, month: number) {
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const days: (number | null)[] = [];
    for (let i = 0; i < firstDay; i++) days.push(null);
    for (let d = 1; d <= daysInMonth; d++) days.push(d);
    return days;
  }

  // Map conferences to dates for current calendar month
  const confsByDate: Record<string, Conference[]> = {};
  conferences.forEach((c) => {
    const d = new Date(c.date);
    if (d.getMonth() === calMonth && d.getFullYear() === calYear) {
      const key = d.toISOString().split("T")[0];
      if (!confsByDate[key]) confsByDate[key] = [];
      confsByDate[key].push(c);
    }
  });

  const calDays = getCalendarDays(calYear, calMonth);

  // Events for selected date
  const selectedEvents = selectedDate ? confsByDate[selectedDate] || [] : [];

  function prevMonth() {
    if (calMonth === 0) { setCalMonth(11); setCalYear(calYear - 1); }
    else setCalMonth(calMonth - 1);
    setSelectedDate(null);
  }

  function nextMonth() {
    if (calMonth === 11) { setCalMonth(0); setCalYear(calYear + 1); }
    else setCalMonth(calMonth + 1);
    setSelectedDate(null);
  }

  return (
    <div className="p-4 space-y-4">
      <div className="flex items-center justify-between" data-tour="events-header">
        <div>
          <h2 className="text-lg font-bold">Conferences</h2>
          <p className="text-xs text-muted-foreground">
            {conferences.length} events
          </p>
        </div>
        <div className="flex border border-border rounded-lg overflow-hidden" data-tour="view-toggle">
          <button
            onClick={() => setView("list")}
            aria-label="List view"
            className={cn("p-2", view === "list" ? "bg-grain-blue text-white" : "text-muted-foreground")}
          >
            <List className="w-4 h-4" />
          </button>
          <button
            onClick={() => setView("calendar")}
            aria-label="Calendar view"
            className={cn("p-2", view === "calendar" ? "bg-grain-blue text-white" : "text-muted-foreground")}
          >
            <LayoutGrid className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Search + Filter (list view only) */}
      {view === "list" && (
        <div className="flex gap-2" data-tour="events-filter">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-2.5 w-4 h-4 text-muted-foreground" />
            <input
              value={searchQ}
              onChange={(e) => setSearchQ(e.target.value)}
              placeholder="Search events..."
              className="w-full pl-10 pr-3 py-2 rounded-lg border border-border bg-background text-sm"
            />
          </div>
          <select
            value={filterVertical}
            onChange={(e) => setFilterVertical(e.target.value)}
            className="px-2 py-2 rounded-lg border border-border bg-background text-xs"
          >
            <option value="">All verticals</option>
            <option value="FINTECH">Fintech</option>
            <option value="PAYMENTS">Payments</option>
            <option value="TREASURY">Treasury</option>
            <option value="TRAVEL">Travel</option>
            <option value="SAAS">SaaS</option>
          </select>
        </div>
      )}

      {/* LIST VIEW */}
      {view === "list" && (
        <>
          {upcoming.length > 0 && (
            <div className="space-y-2">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                Upcoming ({upcoming.length})
              </p>
              {upcoming.map((c) => (
                <ConferenceRow key={c.id} conference={c} />
              ))}
            </div>
          )}
          {past.length > 0 && (
            <div className="space-y-2">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                Past ({past.length})
              </p>
              {past.map((c) => (
                <ConferenceRow key={c.id} conference={c} dimmed />
              ))}
            </div>
          )}
        </>
      )}

      {/* CALENDAR VIEW — Google Calendar style */}
      {view === "calendar" && (
        <div className="space-y-3">
          {/* Month nav */}
          <div className="flex items-center justify-between">
            <button onClick={prevMonth} className="p-2 rounded-lg hover:bg-muted">
              <ChevronLeft className="w-5 h-5" />
            </button>
            <span className="font-semibold">
              {MONTH_NAMES[calMonth]} {calYear}
            </span>
            <button onClick={nextMonth} className="p-2 rounded-lg hover:bg-muted">
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>

          {/* Day headers */}
          <div className="grid grid-cols-7 text-center">
            {DAY_NAMES.map((d) => (
              <span key={d} className="text-[11px] font-medium text-muted-foreground py-1">
                {d}
              </span>
            ))}
          </div>

          {/* Day grid */}
          <div className="grid grid-cols-7 gap-px bg-border rounded-xl overflow-hidden">
            {calDays.map((day, i) => {
              if (day === null) {
                return <div key={`empty-${i}`} className="bg-background aspect-square" />;
              }

              const dateStr = `${calYear}-${String(calMonth + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
              const dayConfs = confsByDate[dateStr] || [];
              const isToday =
                now.getDate() === day &&
                now.getMonth() === calMonth &&
                now.getFullYear() === calYear;
              const isSelected = selectedDate === dateStr;
              const hasEvents = dayConfs.length > 0;

              return (
                <button
                  key={dateStr}
                  onClick={() => setSelectedDate(isSelected ? null : dateStr)}
                  className={cn(
                    "bg-background aspect-square flex flex-col items-center justify-start pt-1 relative transition-colors",
                    isSelected && "bg-grain-blue/10",
                    !isSelected && hasEvents && "hover:bg-muted/50"
                  )}
                >
                  <span
                    className={cn(
                      "w-7 h-7 flex items-center justify-center rounded-full text-xs font-medium",
                      isToday && "bg-grain-blue text-white",
                      isSelected && !isToday && "bg-grain-navy text-white"
                    )}
                  >
                    {day}
                  </span>
                  {/* Event dots */}
                  {dayConfs.length > 0 && (
                    <div className="flex gap-0.5 mt-0.5">
                      {dayConfs.slice(0, 3).map((c) => (
                        <div
                          key={c.id}
                          className={cn(
                            "w-1.5 h-1.5 rounded-full",
                            VERTICAL_DOTS[c.vertical] || "bg-gray-400"
                          )}
                        />
                      ))}
                    </div>
                  )}
                </button>
              );
            })}
          </div>

          {/* Selected date — full event detail (Google Calendar style) */}
          {selectedDate && (
            <div className="space-y-2">
              <p className="text-xs font-medium text-muted-foreground">
                {new Date(selectedDate + "T00:00:00").toLocaleDateString("en-US", {
                  weekday: "long",
                  month: "long",
                  day: "numeric",
                })}
              </p>
              {selectedEvents.length > 0 ? (
                selectedEvents.map((c) => (
                  <EventDetailCard key={c.id} conference={c} />
                ))
              ) : (
                <p className="text-xs text-muted-foreground italic py-2">
                  No events on this day
                </p>
              )}
            </div>
          )}

          {/* Events this month (always visible below calendar) */}
          {!selectedDate && (
            <div className="space-y-2">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                This month
              </p>
              {Object.values(confsByDate).flat().length > 0 ? (
                Object.values(confsByDate)
                  .flat()
                  .map((c) => <ConferenceRow key={c.id} conference={c} />)
              ) : (
                <p className="text-xs text-muted-foreground italic py-2">
                  No events in {MONTH_NAMES[calMonth]}
                </p>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function ConferenceRow({
  conference,
  dimmed,
}: {
  conference: Conference;
  dimmed?: boolean;
}) {
  const date = new Date(conference.date).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });

  const scoreColor =
    conference.icpScore >= 80
      ? "text-green-500"
      : conference.icpScore >= 60
        ? "text-grain-gold"
        : "text-muted-foreground";

  return (
    <div
      className={cn(
        "flex items-center gap-3 p-3 rounded-xl border border-border bg-background",
        dimmed && "opacity-50"
      )}
    >
      <div className="text-center shrink-0 w-12">
        <p className={cn("text-lg font-bold", scoreColor)}>
          {conference.icpScore}
        </p>
        <p className="text-[10px] text-muted-foreground">ICP</p>
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-medium text-sm truncate">{conference.name}</p>
        <div className="flex items-center gap-2 mt-0.5 text-xs text-muted-foreground">
          <Calendar className="w-3 h-3 shrink-0" />
          <span>{date}</span>
          <MapPin className="w-3 h-3 shrink-0" />
          <span className="truncate">{conference.location}</span>
        </div>
      </div>
      <span
        className={cn(
          "text-[10px] font-medium px-2 py-0.5 rounded-full shrink-0",
          VERTICAL_COLORS[conference.vertical] || "bg-muted text-muted-foreground"
        )}
      >
        {conference.vertical}
      </span>
    </div>
  );
}

function EventDetailCard({ conference }: { conference: Conference }) {
  const startDate = new Date(conference.date);
  const endDate = conference.endDate ? new Date(conference.endDate) : null;

  const dateRange = endDate
    ? `${startDate.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" })} — ${endDate.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric", year: "numeric" })}`
    : startDate.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric" });

  const days = endDate
    ? Math.round((endDate.getTime() - startDate.getTime()) / 86400000) + 1
    : 1;

  const scoreColor =
    conference.icpScore >= 80
      ? "bg-green-500"
      : conference.icpScore >= 60
        ? "bg-grain-gold"
        : "bg-grain-slate";

  const scoreLabel =
    conference.icpScore >= 80
      ? "Top Priority"
      : conference.icpScore >= 60
        ? "High Fit"
        : conference.icpScore >= 40
          ? "Medium Fit"
          : "Low Fit";

  return (
    <div className="rounded-xl border border-border bg-background overflow-hidden">
      {/* Color bar at top (like Google Calendar event) */}
      <div className={cn("h-1.5", VERTICAL_DOTS[conference.vertical] || "bg-gray-400")} />

      <div className="p-4 space-y-3">
        {/* Title + ICP badge */}
        <div className="flex items-start justify-between gap-2">
          <h3 className="font-semibold text-base leading-tight">{conference.name}</h3>
          <div className={cn("shrink-0 px-2 py-1 rounded-lg text-white text-xs font-bold", scoreColor)}>
            ICP {conference.icpScore}
          </div>
        </div>

        {/* Date & duration */}
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Calendar className="w-4 h-4 shrink-0" />
          <span>{dateRange}</span>
        </div>
        {days > 1 && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Clock className="w-4 h-4 shrink-0" />
            <span>{days} days</span>
          </div>
        )}

        {/* Location */}
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <MapPin className="w-4 h-4 shrink-0" />
          <span>{conference.location}</span>
        </div>

        {/* Audience size */}
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Users className="w-4 h-4 shrink-0" />
          <span>{conference.estimatedSize.toLocaleString()} attendees</span>
        </div>

        {/* Vertical + Score label */}
        <div className="flex items-center gap-2">
          <span className={cn("text-xs font-medium px-2 py-0.5 rounded-full", VERTICAL_COLORS[conference.vertical] || "bg-muted text-muted-foreground")}>
            {conference.vertical}
          </span>
          <span className="text-xs text-muted-foreground">{scoreLabel}</span>
          {conference.interactionCount > 0 && (
            <span className="text-xs text-muted-foreground">
              &middot; {conference.interactionCount} leads captured
            </span>
          )}
        </div>

        {/* Description */}
        {conference.description && (
          <p className="text-sm text-muted-foreground leading-relaxed border-t border-border pt-3">
            {conference.description}
          </p>
        )}

        {/* Website link */}
        {conference.website && (
          <a
            href={conference.website}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 text-sm text-grain-blue hover:underline pt-1"
          >
            <ExternalLink className="w-3.5 h-3.5" />
            Visit website
          </a>
        )}
      </div>
    </div>
  );
}
