"use client";

import { useEffect, useState } from "react";
import {
  Flame,
  Thermometer,
  Snowflake,
  Building2,
  ChevronRight,
  Download,
  ArrowLeft,
  Brain,
  Sparkles,
  Loader2,
  AlertCircle,
  Search,
  Upload,
  Check,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { type Contact, type ContactDetail, TEMP_DOTS, linkedInSearchUrl } from "@/lib/types";

const tempIcon: Record<string, React.ReactNode> = {
  HOT: <Flame className="w-4 h-4 text-red-500" />,
  WARM: <Thermometer className="w-4 h-4 text-orange-400" />,
  COLD: <Snowflake className="w-4 h-4 text-blue-400" />,
};

const tempDot = TEMP_DOTS;

export function ContactsTab() {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [detail, setDetail] = useState<ContactDetail | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterTemp, setFilterTemp] = useState<string>("");
  const [filterStage, setFilterStage] = useState<string>("");

  // HubSpot push state
  const [hubspotPushing, setHubspotPushing] = useState(false);
  const [hubspotResult, setHubspotResult] = useState<{ created: number; updated: number; errors: number } | null>(null);
  const [showHubspotSettings, setShowHubspotSettings] = useState(false);
  const [hubspotKey, setHubspotKey] = useState(() => {
    if (typeof window !== "undefined") return localStorage.getItem("grain_hubspot_key") || "";
    return "";
  });

  const [error, setError] = useState(false);

  function loadContacts() {
    setLoading(true);
    setError(false);
    fetch("/api/contacts")
      .then((r) => r.json())
      .then((data) => { setContacts(data); setLoading(false); })
      .catch(() => { setError(true); setLoading(false); });
  }

  useEffect(() => { loadContacts(); }, []);

  // Filtered contacts
  const filtered = contacts.filter((c) => {
    if (searchQuery && !c.name.toLowerCase().includes(searchQuery.toLowerCase()) && !c.currentCompany?.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    if (filterTemp && c.lastTemperature !== filterTemp) return false;
    if (filterStage && c.lifecycleStage !== filterStage) return false;
    return true;
  });

  function openContact(id: string) {
    setSelectedId(id);
    setDetailLoading(true);
    fetch(`/api/contacts/${id}`)
      .then((r) => r.json())
      .then((data) => { setDetail(data); setDetailLoading(false); })
      .catch(() => { setDetailLoading(false); });
  }

  function goBack() {
    setSelectedId(null);
    setDetail(null);
    loadContacts();
  }

  function exportCsv() {
    const headers = ["First Name", "Last Name", "Email", "Phone Number", "Company Name", "Job Title", "Lifecycle Stage"];
    const rows = filtered.map((c) => {
      const parts = c.name.split(" ");
      return [parts[0] || "", parts.slice(1).join(" ") || "", c.email || "", c.phone || "", c.currentCompany || "", c.currentRole || "", c.lifecycleStage.toLowerCase()];
    });
    const csv = [headers.join(","), ...rows.map((r) => r.map((v) => `"${v.replace(/"/g, '""')}"`).join(","))].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `grain-hubspot-${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  async function pushToHubspot() {
    const key = localStorage.getItem("grain_hubspot_key");
    if (!key) { setShowHubspotSettings(true); return; }

    const confirmed = window.confirm(`Push ${filtered.length} contacts to HubSpot?`);
    if (!confirmed) return;

    setHubspotPushing(true);
    setHubspotResult(null);
    try {
      const res = await fetch("/api/hubspot/push", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ contacts: filtered, hubspotApiKey: key }),
      });
      const data = await res.json();
      if (data.summary) setHubspotResult(data.summary);
      else setHubspotResult({ created: 0, updated: 0, errors: filtered.length });
    } catch {
      setHubspotResult({ created: 0, updated: 0, errors: filtered.length });
    } finally {
      setHubspotPushing(false);
    }
  }

  // Detail view
  if (selectedId) {
    if (detailLoading || !detail) {
      return <div className="flex items-center justify-center h-64"><Loader2 className="w-5 h-5 animate-spin text-muted-foreground" /></div>;
    }
    return <ContactProfile detail={detail} goBack={goBack} />;
  }

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
        <p className="text-sm text-muted-foreground">Failed to load contacts</p>
        <button onClick={loadContacts} className="px-4 py-2 rounded-lg bg-grain-blue text-white text-sm">Try Again</button>
      </div>
    );
  }

  return (
    <div className="p-4 space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold" data-tour="contacts-header">Contacts ({filtered.length})</h2>
        <div className="flex items-center gap-1.5" data-tour="hubspot-btns">
          <button onClick={exportCsv} className="flex items-center gap-1 text-[11px] text-grain-blue py-1.5 px-2 rounded-lg border border-grain-blue/20">
            <Download className="w-3 h-3" /> CSV
          </button>
          <button onClick={pushToHubspot} disabled={hubspotPushing} className="flex items-center gap-1 text-[11px] text-white py-1.5 px-2 rounded-lg bg-[#ff7a59]">
            {hubspotPushing ? <Loader2 className="w-3 h-3 animate-spin" /> : <Upload className="w-3 h-3" />} HubSpot
          </button>
        </div>
      </div>

      {/* HubSpot settings */}
      {showHubspotSettings && (
        <div className="rounded-lg border border-[#ff7a59]/20 bg-[#ff7a59]/5 p-3 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">HubSpot API Key</span>
            <button onClick={() => setShowHubspotSettings(false)}><X className="w-4 h-4 text-muted-foreground" /></button>
          </div>
          <input
            type="password"
            placeholder="pat-na1-..."
            value={hubspotKey}
            onChange={(e) => setHubspotKey(e.target.value)}
            className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm"
          />
          <p className="text-[10px] text-muted-foreground">Get your key from HubSpot Settings → Private Apps</p>
          <button
            onClick={() => { localStorage.setItem("grain_hubspot_key", hubspotKey); setShowHubspotSettings(false); }}
            className="w-full py-2 rounded-lg bg-[#ff7a59] text-white text-xs font-medium"
          >
            Save & Connect
          </button>
        </div>
      )}

      {/* HubSpot push result */}
      {hubspotResult && (
        <div className="rounded-lg border border-border p-2.5 flex items-center justify-between text-xs">
          <div className="flex items-center gap-3">
            <span className="text-green-500 flex items-center gap-1"><Check className="w-3 h-3" />{hubspotResult.created} created</span>
            <span className="text-grain-blue flex items-center gap-1">{hubspotResult.updated} updated</span>
            {hubspotResult.errors > 0 && <span className="text-red-500">{hubspotResult.errors} errors</span>}
          </div>
          <button onClick={() => setHubspotResult(null)} className="text-muted-foreground"><X className="w-3 h-3" /></button>
        </div>
      )}

      {/* Search + filters */}
      <div className="space-y-2" data-tour="contacts-filters">
        <div className="relative">
          <Search className="absolute left-3 top-2.5 w-4 h-4 text-muted-foreground" />
          <input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search name or company..."
            className="w-full pl-10 pr-3 py-2 rounded-lg border border-border bg-background text-sm"
          />
        </div>
        <div className="flex gap-2">
          <select
            value={filterTemp}
            onChange={(e) => setFilterTemp(e.target.value)}
            className="flex-1 px-2 py-1.5 rounded-lg border border-border bg-background text-xs"
          >
            <option value="">All temps</option>
            <option value="HOT">Hot</option>
            <option value="WARM">Warm</option>
            <option value="COLD">Cold</option>
          </select>
          <select
            value={filterStage}
            onChange={(e) => setFilterStage(e.target.value)}
            className="flex-1 px-2 py-1.5 rounded-lg border border-border bg-background text-xs"
          >
            <option value="">All stages</option>
            <option value="TARGET">Target</option>
            <option value="LEAD">Lead</option>
            <option value="PROSPECT">Prospect</option>
            <option value="CUSTOMER">Customer</option>
          </select>
        </div>
      </div>

      {/* Contact list */}
      {filtered.map((c) => (
        <button
          key={c.id}
          onClick={() => openContact(c.id)}
          className="w-full text-left flex items-center gap-3 p-3 rounded-xl border border-border bg-background"
        >
          <div className="w-10 h-10 rounded-full bg-grain-navy/10 flex items-center justify-center shrink-0">
            <span className="text-grain-navy font-semibold text-sm">
              {c.name.split(" ").map((n) => n[0]).join("").slice(0, 2)}
            </span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-medium text-sm truncate">{c.name}</p>
            <p className="text-xs text-muted-foreground truncate">
              {c.currentRole ? `${c.currentRole} @ ` : ""}{c.currentCompany || "No company"}
            </p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            {tempIcon[c.lastTemperature]}
            <span className="text-xs text-muted-foreground">{c.interactionCount}</span>
            <ChevronRight className="w-4 h-4 text-muted-foreground" />
          </div>
        </button>
      ))}

      {filtered.length === 0 && (
        <p className="text-sm text-muted-foreground text-center py-8">
          {contacts.length === 0 ? "No contacts yet. Capture some leads!" : "No contacts match your filters."}
        </p>
      )}
    </div>
  );
}

function ContactProfile({ detail, goBack }: { detail: ContactDetail; goBack: () => void }) {
  const [aiSummary, setAiSummary] = useState<string | null>(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);
  const [showSettings, setShowSettings] = useState(false);

  // Lead Score
  const [leadScore, setLeadScore] = useState<{ score: number; reason: string; priority: string } | null>(null);
  const [scoreLoading, setScoreLoading] = useState(false);

  // Follow-Up Email
  const [followUpEmail, setFollowUpEmail] = useState<string | null>(null);
  const [emailLoading, setEmailLoading] = useState(false);
  const [emailCopied, setEmailCopied] = useState(false);


  async function runAi() {
    if (detail.interactions.length === 0) { setAiError("No interactions to analyze"); return; }

    setAiLoading(true);
    setAiError(null);
    setAiSummary(null);

    try {
      const res = await fetch("/api/ai-summarize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contactName: detail.name,
          interactions: detail.interactions,
        }),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setAiSummary(data.summary);
    } catch (e: any) {
      setAiError(e.message);
    } finally {
      setAiLoading(false);
    }
  }

  async function runLeadScore() {
    setScoreLoading(true);
    setAiError(null);
    try {
      const res = await fetch("/api/ai-lead-score", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ contactId: detail.id }),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setLeadScore(data);
    } catch (e: unknown) {
      setAiError(e instanceof Error ? e.message : "Score failed");
    } finally {
      setScoreLoading(false);
    }
  }

  async function runFollowUpEmail() {
    setEmailLoading(true);
    setFollowUpEmail(null);
    setAiError(null);
    try {
      const res = await fetch("/api/ai-follow-up", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ contactId: detail.id }),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setFollowUpEmail(data.email);
    } catch (e: unknown) {
      setAiError(e instanceof Error ? e.message : "Email draft failed");
    } finally {
      setEmailLoading(false);
    }
  }

  function copyEmail() {
    if (followUpEmail) {
      navigator.clipboard.writeText(followUpEmail);
      setEmailCopied(true);
      setTimeout(() => setEmailCopied(false), 2000);
    }
  }

  return (
    <div className="p-4 space-y-4">
      <button onClick={goBack} className="flex items-center gap-1 text-sm text-muted-foreground">
        <ArrowLeft className="w-4 h-4" /> Back
      </button>

      {/* Contact header */}
      <div className="flex items-center gap-3">
        <div className="w-12 h-12 rounded-full bg-grain-navy/10 flex items-center justify-center">
          <span className="text-grain-navy font-bold">
            {detail.name.split(" ").map((n) => n[0]).join("").slice(0, 2)}
          </span>
        </div>
        <div>
          <h2 className="text-lg font-bold">{detail.name}</h2>
          <p className="text-sm text-muted-foreground">
            {detail.currentRole} {detail.currentCompany ? `@ ${detail.currentCompany}` : ""}
          </p>
        </div>
      </div>

      {/* Info chips */}
      <div className="flex flex-wrap gap-2 text-xs">
        <span className="px-2 py-1 rounded-full bg-grain-blue/10 text-grain-blue font-medium">{detail.lifecycleStage}</span>
        <span className="px-2 py-1 rounded-full bg-muted text-muted-foreground">{detail.interactionCount} conferences</span>
        {detail.email && <span className="px-2 py-1 rounded-full bg-muted text-muted-foreground">{detail.email}</span>}
        {detail.phone && <span className="px-2 py-1 rounded-full bg-muted text-muted-foreground">{detail.phone}</span>}
      </div>

      {/* LinkedIn connect */}
      <a
        href={linkedInSearchUrl(detail.name, detail.currentCompany || "")}
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center justify-center gap-2 w-full py-2.5 rounded-xl bg-[#0A66C2] text-white font-medium text-sm"
      >
        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/></svg>
        Find on LinkedIn
      </a>

      {/* AI Section */}
      <div className="rounded-xl border border-grain-blue/20 bg-grain-blue/5 p-3 space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Brain className="w-4 h-4 text-grain-blue" />
            <span className="text-sm font-medium">AI Intelligence</span>
          </div>
          <button onClick={runAi} disabled={aiLoading} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-grain-blue text-white text-xs font-medium">
            {aiLoading ? <Loader2 className="w-3 h-3 animate-spin" /> : <Sparkles className="w-3 h-3" />}
            Analyze
          </button>
        </div>

        {aiError && (
          <div className="flex items-start gap-2 text-xs text-red-500 bg-red-500/10 rounded-lg p-2">
            <AlertCircle className="w-3.5 h-3.5 mt-0.5 shrink-0" />{aiError}
          </div>
        )}

        {aiSummary && <div className="text-sm leading-relaxed whitespace-pre-line">{aiSummary}</div>}

        {!aiSummary && !aiError && (
          <p className="text-xs text-muted-foreground">Tap Analyze for AI-powered relationship insights</p>
        )}
      </div>

      {/* AI Lead Score */}
      <div className="flex gap-2">
        <button
          onClick={runLeadScore}
          disabled={scoreLoading}
          className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl border border-grain-gold/20 bg-grain-gold/5 text-sm font-medium"
        >
          {scoreLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4 text-grain-gold" />}
          {scoreLoading ? "Scoring..." : "AI Lead Score"}
        </button>
        <button
          onClick={runFollowUpEmail}
          disabled={emailLoading}
          className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl border border-green-500/20 bg-green-500/5 text-sm font-medium"
        >
          {emailLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4 text-green-500" />}
          {emailLoading ? "Drafting..." : "Draft Follow-Up"}
        </button>
      </div>

      {/* Lead Score Result */}
      {leadScore && (
        <div className="rounded-xl border border-grain-gold/20 bg-grain-gold/5 p-3">
          <div className="flex items-center justify-between mb-1">
            <span className="text-sm font-medium">Lead Score</span>
            <span className={cn(
              "text-xl font-bold",
              leadScore.score >= 70 ? "text-green-500" : leadScore.score >= 40 ? "text-grain-gold" : "text-muted-foreground"
            )}>
              {leadScore.score}/100
            </span>
          </div>
          <p className="text-xs text-muted-foreground">{leadScore.reason}</p>
          <span className={cn(
            "inline-block mt-1 text-[10px] font-medium px-2 py-0.5 rounded-full",
            leadScore.priority === "HIGH" ? "bg-green-500/10 text-green-500" :
            leadScore.priority === "MEDIUM" ? "bg-grain-gold/10 text-grain-gold" :
            "bg-muted text-muted-foreground"
          )}>
            {leadScore.priority} PRIORITY
          </span>
        </div>
      )}

      {/* Follow-Up Email Result */}
      {followUpEmail && (
        <div className="rounded-xl border border-green-500/20 bg-green-500/5 p-3 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Follow-Up Email Draft</span>
            <button
              onClick={copyEmail}
              className="text-xs px-2 py-1 rounded-lg bg-green-500 text-white"
            >
              {emailCopied ? "Copied!" : "Copy"}
            </button>
          </div>
          <pre className="text-xs text-muted-foreground whitespace-pre-wrap leading-relaxed font-sans">
            {followUpEmail}
          </pre>
        </div>
      )}

      {/* Timeline */}
      <div>
        <h3 className="text-sm font-semibold mb-3">Timeline</h3>
        <div className="space-y-3">
          {detail.interactions.map((i) => (
            <div key={i.id} className="flex gap-3">
              <div className="flex flex-col items-center">
                <div className={cn("w-3 h-3 rounded-full shrink-0 mt-1", tempDot[i.temperature] || "bg-gray-400")} />
                <div className="w-px flex-1 bg-border" />
              </div>
              <div className="pb-4 flex-1">
                <div className="flex items-center justify-between">
                  <p className="font-medium text-sm">{i.conferenceName}</p>
                  <span className="text-[11px] text-muted-foreground">
                    {new Date(i.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                  </span>
                </div>
                {i.capturedCompanyAtTime && i.capturedCompanyAtTime !== detail.currentCompany && (
                  <p className="text-[11px] text-orange-400 mt-0.5">Was at: {i.capturedCompanyAtTime} ({i.capturedRoleAtTime})</p>
                )}
                {i.notes && <p className="text-xs text-muted-foreground mt-1 leading-relaxed">{i.notes}</p>}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
