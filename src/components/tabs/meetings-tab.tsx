"use client";

import { useEffect, useState } from "react";
import {
  CalendarClock,
  Plus,
  Brain,
  Loader2,
  MapPin,
  Clock,
  Sparkles,
  ChevronRight,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";

type Meeting = {
  id: string;
  title: string;
  scheduledAt: string;
  location: string | null;
  notes: string | null;
  aiBriefing: string | null;
  contact: {
    id: string;
    name: string;
    currentCompany: string | null;
    currentRole: string | null;
    aiLeadScore: number | null;
  };
  conference: { id: string; name: string };
};

type Conference = { id: string; name: string };
type Contact = { id: string; name: string; currentCompany: string | null };

export function MeetingsTab() {
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [showCreate, setShowCreate] = useState(false);
  const [briefingLoading, setBriefingLoading] = useState<string | null>(null);

  // Create form
  const [conferences, setConferences] = useState<Conference[]>([]);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [newTitle, setNewTitle] = useState("");
  const [newDate, setNewDate] = useState("");
  const [newTime, setNewTime] = useState("");
  const [newLocation, setNewLocation] = useState("");
  const [newNotes, setNewNotes] = useState("");
  const [newConferenceId, setNewConferenceId] = useState("");
  const [newContactId, setNewContactId] = useState("");
  const [creating, setCreating] = useState(false);

  function loadMeetings() {
    setLoading(true);
    setError(false);
    fetch("/api/meetings")
      .then((r) => r.json())
      .then((data) => { setMeetings(data); setLoading(false); })
      .catch(() => { setError(true); setLoading(false); });
  }

  useEffect(() => {
    loadMeetings();
    fetch("/api/conferences").then((r) => r.json()).then(setConferences).catch(() => {});
    fetch("/api/contacts").then((r) => r.json()).then(setContacts).catch(() => {});
  }, []);

  async function createMeeting() {
    if (!newTitle || !newDate || !newTime || !newConferenceId || !newContactId) return;
    setCreating(true);
    try {
      await fetch("/api/meetings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: newTitle,
          scheduledAt: `${newDate}T${newTime}:00`,
          location: newLocation || null,
          notes: newNotes || null,
          conferenceId: newConferenceId,
          contactId: newContactId,
        }),
      });
      setShowCreate(false);
      setNewTitle(""); setNewDate(""); setNewTime(""); setNewLocation(""); setNewNotes("");
      loadMeetings();
    } catch {
      // error
    } finally {
      setCreating(false);
    }
  }

  async function generateBriefing(meetingId: string) {
    setBriefingLoading(meetingId);
    try {
      const res = await fetch("/api/ai-meeting-brief", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ meetingId }),
      });
      const data = await res.json();
      if (data.briefing) {
        setMeetings((prev) =>
          prev.map((m) => m.id === meetingId ? { ...m, aiBriefing: data.briefing } : m)
        );
      }
    } catch {
      // error
    } finally {
      setBriefingLoading(null);
    }
  }

  if (loading) {
    return (
      <div className="p-4 space-y-3">
        {[1, 2].map((i) => (
          <div key={i} className="h-20 rounded-xl bg-muted/50 animate-pulse" />
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-3">
        <p className="text-sm text-muted-foreground">Failed to load meetings</p>
        <button onClick={loadMeetings} className="px-4 py-2 rounded-lg bg-grain-blue text-white text-sm">Try Again</button>
      </div>
    );
  }

  const now = new Date();
  const upcoming = meetings.filter((m) => new Date(m.scheduledAt) >= now);
  const past = meetings.filter((m) => new Date(m.scheduledAt) < now);

  return (
    <div className="p-4 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold">Meetings</h2>
          <p className="text-xs text-muted-foreground">
            {meetings.length} scheduled &middot; AI briefings available
          </p>
        </div>
        <button
          onClick={() => setShowCreate(!showCreate)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-grain-navy text-white text-xs font-medium"
        >
          {showCreate ? <X className="w-3.5 h-3.5" /> : <Plus className="w-3.5 h-3.5" />}
          {showCreate ? "Cancel" : "New Meeting"}
        </button>
      </div>

      {/* Create form */}
      {showCreate && (
        <div className="rounded-xl border border-border p-3 space-y-3">
          <input
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
            placeholder="Meeting title *"
            className="w-full px-3 py-2.5 rounded-lg border border-border bg-background text-sm"
          />
          <div className="flex gap-2">
            <input
              type="date"
              value={newDate}
              onChange={(e) => setNewDate(e.target.value)}
              className="flex-1 px-3 py-2.5 rounded-lg border border-border bg-background text-sm"
            />
            <input
              type="time"
              value={newTime}
              onChange={(e) => setNewTime(e.target.value)}
              className="flex-1 px-3 py-2.5 rounded-lg border border-border bg-background text-sm"
            />
          </div>
          <input
            value={newLocation}
            onChange={(e) => setNewLocation(e.target.value)}
            placeholder="Location (booth, hall...)"
            className="w-full px-3 py-2.5 rounded-lg border border-border bg-background text-sm"
          />
          <select
            value={newConferenceId}
            onChange={(e) => setNewConferenceId(e.target.value)}
            className="w-full px-3 py-2.5 rounded-lg border border-border bg-background text-sm"
          >
            <option value="">Select conference *</option>
            {conferences.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
          <select
            value={newContactId}
            onChange={(e) => setNewContactId(e.target.value)}
            className="w-full px-3 py-2.5 rounded-lg border border-border bg-background text-sm"
          >
            <option value="">Select contact *</option>
            {contacts.map((c) => (
              <option key={c.id} value={c.id}>{c.name}{c.currentCompany ? ` (${c.currentCompany})` : ""}</option>
            ))}
          </select>
          <textarea
            value={newNotes}
            onChange={(e) => setNewNotes(e.target.value)}
            placeholder="Prep notes (optional)"
            rows={2}
            className="w-full px-3 py-2.5 rounded-lg border border-border bg-background text-sm resize-none"
          />
          <button
            onClick={createMeeting}
            disabled={creating || !newTitle || !newDate || !newTime || !newConferenceId || !newContactId}
            className={cn(
              "w-full py-3 rounded-xl font-semibold text-white text-sm",
              creating || !newTitle || !newDate || !newTime || !newConferenceId || !newContactId
                ? "bg-grain-navy/50" : "bg-grain-navy"
            )}
          >
            {creating ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : "Create Meeting"}
          </button>
        </div>
      )}

      {/* Upcoming */}
      {upcoming.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
            Upcoming ({upcoming.length})
          </p>
          {upcoming.map((m) => (
            <MeetingCard key={m.id} meeting={m} onBrief={generateBriefing} briefingLoading={briefingLoading} />
          ))}
        </div>
      )}

      {/* Past */}
      {past.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
            Past ({past.length})
          </p>
          {past.map((m) => (
            <MeetingCard key={m.id} meeting={m} onBrief={generateBriefing} briefingLoading={briefingLoading} dimmed />
          ))}
        </div>
      )}

      {meetings.length === 0 && !showCreate && (
        <div className="text-center py-12 space-y-3">
          <CalendarClock className="w-10 h-10 mx-auto text-muted-foreground" />
          <p className="text-sm text-muted-foreground">No meetings scheduled yet</p>
          <button
            onClick={() => setShowCreate(true)}
            className="px-4 py-2 rounded-lg bg-grain-blue text-white text-sm"
          >
            Schedule your first meeting
          </button>
        </div>
      )}
    </div>
  );
}

function MeetingCard({
  meeting,
  onBrief,
  briefingLoading,
  dimmed,
}: {
  meeting: Meeting;
  onBrief: (id: string) => void;
  briefingLoading: string | null;
  dimmed?: boolean;
}) {
  const [expanded, setExpanded] = useState(false);
  const date = new Date(meeting.scheduledAt);
  const isLoading = briefingLoading === meeting.id;

  return (
    <div className={cn("rounded-xl border border-border overflow-hidden", dimmed && "opacity-50")}>
      {/* Header */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full text-left p-3 flex items-center gap-3"
      >
        {/* Time badge */}
        <div className="w-12 h-12 rounded-xl bg-grain-navy/10 flex flex-col items-center justify-center shrink-0">
          <span className="text-xs font-bold text-grain-navy">
            {date.toLocaleDateString("en-US", { month: "short", day: "numeric" })}
          </span>
          <span className="text-[10px] text-grain-navy/60">
            {date.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })}
          </span>
        </div>

        <div className="flex-1 min-w-0">
          <p className="font-medium text-sm truncate">{meeting.title}</p>
          <p className="text-xs text-muted-foreground truncate">
            {meeting.contact.name}{meeting.contact.currentCompany ? ` @ ${meeting.contact.currentCompany}` : ""}
          </p>
          <p className="text-[11px] text-muted-foreground">{meeting.conference.name}</p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {meeting.aiBriefing && <Brain className="w-4 h-4 text-grain-blue" />}
          <ChevronRight className={cn("w-4 h-4 text-muted-foreground transition-transform", expanded && "rotate-90")} />
        </div>
      </button>

      {/* Expanded content */}
      {expanded && (
        <div className="px-3 pb-3 space-y-3 border-t border-border pt-3">
          {meeting.location && (
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <MapPin className="w-3.5 h-3.5" />
              {meeting.location}
            </div>
          )}

          {meeting.contact.aiLeadScore && (
            <div className="flex items-center gap-2 text-xs">
              <span className="text-muted-foreground">Lead Score:</span>
              <span className={cn(
                "font-bold",
                meeting.contact.aiLeadScore >= 70 ? "text-green-500" : meeting.contact.aiLeadScore >= 40 ? "text-grain-gold" : "text-muted-foreground"
              )}>
                {meeting.contact.aiLeadScore}/100
              </span>
            </div>
          )}

          {meeting.notes && (
            <p className="text-xs text-muted-foreground">{meeting.notes}</p>
          )}

          {/* AI Briefing */}
          {meeting.aiBriefing ? (
            <div className="rounded-lg bg-grain-blue/5 border border-grain-blue/20 p-3">
              <div className="flex items-center gap-1.5 mb-2">
                <Brain className="w-3.5 h-3.5 text-grain-blue" />
                <span className="text-xs font-medium text-grain-blue">AI Pre-Meeting Briefing</span>
              </div>
              <pre className="text-xs text-foreground/80 whitespace-pre-wrap leading-relaxed font-sans">
                {meeting.aiBriefing}
              </pre>
            </div>
          ) : (
            <button
              onClick={() => onBrief(meeting.id)}
              disabled={isLoading}
              className="w-full flex items-center justify-center gap-2 py-2.5 rounded-lg border border-grain-blue/20 bg-grain-blue/5 text-sm font-medium text-grain-blue"
            >
              {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
              {isLoading ? "Generating briefing..." : "Generate AI Briefing"}
            </button>
          )}
        </div>
      )}
    </div>
  );
}
