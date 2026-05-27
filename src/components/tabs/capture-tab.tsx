"use client";

import { useState, useEffect, useTransition } from "react";
import {
  Check,
  WifiOff,
  RefreshCw,
  Flame,
  Thermometer,
  Snowflake,
  Loader2,
  Search,
  Camera,
  Zap,
  ChevronDown,
  ExternalLink,
} from "lucide-react";
import { searchContacts, getConferences, submitLead } from "@/app/capture/actions";
import { cn } from "@/lib/utils";

type SearchResult = {
  id: string;
  name: string;
  currentCompany: string | null;
  currentRole: string | null;
  email: string | null;
  phone: string | null;
  interactionCount: number;
};

export function CaptureTab() {
  const [quickMode, setQuickMode] = useState(false);
  const [ocrLoading, setOcrLoading] = useState(false);
  const [ocrError, setOcrError] = useState<string | null>(null);
  const [conferences, setConferences] = useState<{ id: string; name: string }[]>([]);
  const [conferenceId, setConferenceId] = useState(() => {
    if (typeof window !== "undefined") return localStorage.getItem("grain_last_conference") || "";
    return "";
  });
  const [name, setName] = useState("");
  const [company, setCompany] = useState("");
  const [role, setRole] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [notes, setNotes] = useState("");
  const [temperature, setTemperature] = useState("WARM");
  const [honeypot, setHoneypot] = useState("");

  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [selectedContact, setSelectedContact] = useState<SearchResult | null>(null);
  const [searching, setSearching] = useState(false);

  const [isPending, startTransition] = useTransition();
  const [status, setStatus] = useState<"idle" | "saved" | "offline">("idle");
  const [savedName, setSavedName] = useState("");
  const [savedCompany, setSavedCompany] = useState("");
  const [savedContactId, setSavedContactId] = useState("");
  const [undoTimeout, setUndoTimeout] = useState<NodeJS.Timeout | null>(null);
  const [pendingSync, setPendingSync] = useState(0);
  const [emailError, setEmailError] = useState("");
  const [phoneError, setPhoneError] = useState("");

  useEffect(() => {
    getConferences().then((c) => {
      setConferences(c);
      if (c.length > 0) setConferenceId(c[0].id);
    });
    const q = JSON.parse(localStorage.getItem("grain_offline_queue") || "[]");
    setPendingSync(q.length);
  }, []);

  // Search debounce
  useEffect(() => {
    if (name.length < 2 || selectedContact) {
      setSearchResults([]);
      return;
    }
    const t = setTimeout(async () => {
      setSearching(true);
      const r = await searchContacts(name);
      setSearchResults(r);
      setSearching(false);
    }, 300);
    return () => clearTimeout(t);
  }, [name, selectedContact]);

  function pickContact(c: SearchResult) {
    setSelectedContact(c);
    setName(c.name);
    setCompany(c.currentCompany || "");
    setRole(c.currentRole || "");
    setEmail(c.email || "");
    setPhone(c.phone || "");
    setSearchResults([]);
  }

  async function handleOcr(file: File) {
    setOcrLoading(true);
    try {
      const { createWorker } = await import("tesseract.js");
      const worker = await createWorker("eng");
      const { data } = await worker.recognize(file);
      await worker.terminate();

      const lines = data.text.split("\n").map((l) => l.trim()).filter((l) => l.length > 1);
      // Extract email
      const emailMatch = data.text.match(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i);
      if (emailMatch && !email) setEmail(emailMatch[0]);
      // Extract phone
      const phoneMatch = data.text.match(/(\+?\d[\d\s().-]{6,}\d)/);
      if (phoneMatch && !phone) setPhone(phoneMatch[1].trim());
      // Extract name (first line that looks like a name)
      for (const l of lines) {
        const words = l.replace(/[^A-Za-z\s'-]/g, "").trim().split(/\s+/).filter(Boolean);
        if (words.length === 2 && words[0].length >= 2 && words[1].length >= 2 && !name) {
          setName(`${words[0]} ${words[1]}`);
          break;
        }
      }
      // Extract company (longest non-email, non-phone line)
      const companyLine = lines
        .filter((l) => !l.includes("@") && !/(\+?\d[\d\s().-]{6,}\d)/.test(l))
        .sort((a, b) => b.length - a.length)[0];
      if (companyLine && !company) setCompany(companyLine.replace(/[^A-Za-z0-9&().,' -]/g, "").trim());
    } catch (err) {
      setOcrError("Couldn't read the card. Try a clearer photo.");
      setTimeout(() => setOcrError(null), 5000);
    } finally {
      setOcrLoading(false);
    }
  }

  function clearForm() {
    setName("");
    setCompany("");
    setRole("");
    setEmail("");
    setPhone("");
    setNotes("");
    setTemperature("WARM");
    setSelectedContact(null);
    setSearchResults([]);
  }

  function handleConferenceChange(val: string) {
    setConferenceId(val);
    if (val) localStorage.setItem("grain_last_conference", val);
  }

  function validateFields(): boolean {
    let valid = true;
    setEmailError("");
    setPhoneError("");
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setEmailError("Invalid email format");
      valid = false;
    }
    if (phone && !/^[+\d][\d\s().-]{5,}$/.test(phone)) {
      setPhoneError("Invalid phone format");
      valid = false;
    }
    return valid;
  }

  function handleSubmit() {
    if (honeypot) return;
    if (!name.trim() || !conferenceId) return;
    if (!validateFields()) return;

    const payload = {
      name: name.trim(),
      company,
      role,
      email,
      phone,
      conferenceId,
      notes,
      temperature,
      source: "manual",
      existingContactId: selectedContact?.id,
    };

    startTransition(async () => {
      try {
        const result = await submitLead(payload);
        setSavedName(name.trim());
        setSavedCompany(company);
        setSavedContactId(result.contactId);
        setStatus("saved");
      } catch {
        // Offline fallback
        const q = JSON.parse(localStorage.getItem("grain_offline_queue") || "[]");
        q.push(payload);
        localStorage.setItem("grain_offline_queue", JSON.stringify(q));
        setPendingSync(q.length);
        setStatus("offline");
        setTimeout(() => {
          setStatus("idle");
          clearForm();
        }, 1500);
      }
    });
  }

  async function syncQueue() {
    const q = JSON.parse(localStorage.getItem("grain_offline_queue") || "[]");
    const remaining: any[] = [];
    for (const item of q) {
      try {
        await submitLead(item);
      } catch {
        remaining.push(item);
      }
    }
    localStorage.setItem("grain_offline_queue", JSON.stringify(remaining));
    setPendingSync(remaining.length);
  }

  function linkedInSearchUrl(personName: string, companyName: string) {
    const q = encodeURIComponent(`${personName} ${companyName}`.trim());
    return `https://www.linkedin.com/search/results/people/?keywords=${q}`;
  }

  // Success overlay with LinkedIn connect
  if (status === "saved") {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center space-y-4 px-6 w-full max-w-sm">
          <div className="w-16 h-16 rounded-full bg-green-500/10 flex items-center justify-center mx-auto">
            <Check className="w-8 h-8 text-green-500" />
          </div>
          <div>
            <p className="text-lg font-semibold">Lead Saved!</p>
            <p className="text-sm text-muted-foreground">
              {savedName}{savedCompany ? ` @ ${savedCompany}` : ""}
            </p>
          </div>

          {/* LinkedIn connect */}
          <a
            href={linkedInSearchUrl(savedName, savedCompany)}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-2 w-full py-3 rounded-xl bg-[#0A66C2] text-white font-medium text-sm"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/></svg>
            Connect on LinkedIn
          </a>

          {/* Next lead */}
          <button
            onClick={() => { setStatus("idle"); clearForm(); }}
            className="w-full py-3 rounded-xl border border-border text-sm text-muted-foreground"
          >
            Next Lead →
          </button>
        </div>
      </div>
    );
  }

  if (status === "offline") {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <div className="w-16 h-16 rounded-full bg-orange-400/10 flex items-center justify-center mx-auto mb-3">
            <WifiOff className="w-8 h-8 text-orange-400" />
          </div>
          <p className="text-lg font-semibold">Saved Offline</p>
          <p className="text-sm text-muted-foreground mt-1">Will sync later</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 space-y-3">
      {/* Mode toggle + Conference selector */}
      <div className="flex gap-2">
        <select
          data-tour="conference-select"
          value={conferenceId}
          onChange={(e) => handleConferenceChange(e.target.value)}
          className="flex-1 bg-muted/50 text-sm rounded-lg px-3 py-2.5 border border-border"
        >
          <option value="">Select conference...</option>
          {conferences.map((c) => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </select>
        <button
          data-tour="quick-mode"
          onClick={() => setQuickMode(!quickMode)}
          className={cn(
            "flex items-center gap-1 px-3 py-2.5 rounded-lg border text-xs font-medium shrink-0",
            quickMode
              ? "border-grain-gold bg-grain-gold/10 text-grain-gold"
              : "border-border text-muted-foreground"
          )}
        >
          <Zap className="w-3.5 h-3.5" />
          Quick
        </button>
      </div>

      {/* Sync button if offline items pending */}
      {pendingSync > 0 && (
        <button
          onClick={syncQueue}
          className="w-full flex items-center justify-center gap-2 text-sm py-2 rounded-lg bg-orange-400/10 text-orange-500 border border-orange-400/20"
        >
          <RefreshCw className="w-4 h-4" />
          Sync {pendingSync} offline lead{pendingSync > 1 ? "s" : ""}
        </button>
      )}

      {/* Existing contact banner */}
      {selectedContact && (
        <div className="flex items-center justify-between bg-grain-blue/10 border border-grain-blue/20 rounded-lg px-3 py-2">
          <div>
            <p className="text-sm font-medium">{selectedContact.name}</p>
            <p className="text-xs text-muted-foreground">
              {selectedContact.currentCompany} &middot; {selectedContact.interactionCount} prior
            </p>
          </div>
          <button onClick={clearForm} className="text-xs text-grain-blue">
            Clear
          </button>
        </div>
      )}

      {/* Name field with search */}
      <div className="relative" data-tour="name-search">
        <Search className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
        <input
          value={name}
          onChange={(e) => { setName(e.target.value); setSelectedContact(null); }}
          placeholder="Name *"
          aria-label="Contact name"
          className="w-full pl-10 pr-3 py-2.5 rounded-lg border border-border bg-background text-sm"
          autoFocus
        />
        {searching && (
          <Loader2 className="absolute right-3 top-3 w-4 h-4 animate-spin text-muted-foreground" />
        )}

        {/* Search dropdown */}
        {searchResults.length > 0 && (
          <div className="absolute z-20 left-0 right-0 mt-1 bg-background border border-border rounded-lg shadow-lg overflow-hidden">
            {searchResults.map((r) => (
              <button
                key={r.id}
                onClick={() => pickContact(r)}
                className="w-full text-left px-3 py-2.5 hover:bg-muted/50 border-b last:border-b-0 text-sm"
              >
                <span className="font-medium">{r.name}</span>
                <span className="text-xs text-muted-foreground ml-2">
                  {r.currentCompany} &middot; {r.interactionCount} meetings
                </span>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Company + Role — single row (hidden in quick mode) */}
      {!selectedContact && (
        <div className="flex gap-2">
          <input
            value={company}
            onChange={(e) => setCompany(e.target.value)}
            placeholder="Company"
            className="flex-1 px-3 py-2.5 rounded-lg border border-border bg-background text-sm"
          />
          {!quickMode && (
            <input
              value={role}
              onChange={(e) => setRole(e.target.value)}
              placeholder="Role"
              className="flex-1 px-3 py-2.5 rounded-lg border border-border bg-background text-sm"
            />
          )}
        </div>
      )}

      {/* Email + Phone — hidden in quick mode */}
      {!selectedContact && !quickMode && (
        <div className="space-y-1">
          <div className="flex gap-2">
            <div className="flex-1">
              <label className="sr-only" htmlFor="cap-email">Email</label>
              <input
                id="cap-email"
                value={email}
                onChange={(e) => { setEmail(e.target.value); setEmailError(""); }}
                placeholder="Email"
                type="email"
                aria-label="Email address"
                className={cn("w-full px-3 py-2.5 rounded-lg border bg-background text-sm", emailError ? "border-red-500" : "border-border")}
              />
              {emailError && <p className="text-[11px] text-red-500 mt-0.5">{emailError}</p>}
            </div>
            <div className="flex-1">
              <label className="sr-only" htmlFor="cap-phone">Phone</label>
              <input
                id="cap-phone"
                value={phone}
                onChange={(e) => { setPhone(e.target.value); setPhoneError(""); }}
                placeholder="Phone"
                type="tel"
                aria-label="Phone number"
                className={cn("w-full px-3 py-2.5 rounded-lg border bg-background text-sm", phoneError ? "border-red-500" : "border-border")}
              />
              {phoneError && <p className="text-[11px] text-red-500 mt-0.5">{phoneError}</p>}
            </div>
          </div>
        </div>
      )}

      {/* Temperature — 3 big buttons */}
      <div className="grid grid-cols-3 gap-2" data-tour="temperature">
        {[
          { val: "COLD", icon: Snowflake, label: "Cold", active: "border-blue-400 bg-blue-400/10 text-blue-500" },
          { val: "WARM", icon: Thermometer, label: "Warm", active: "border-grain-gold bg-grain-gold/10 text-grain-gold" },
          { val: "HOT", icon: Flame, label: "Hot", active: "border-red-500 bg-red-500/10 text-red-500" },
        ].map((t) => (
          <button
            key={t.val}
            type="button"
            onClick={() => setTemperature(t.val)}
            className={cn(
              "flex items-center justify-center gap-2 py-3 rounded-xl border-2 text-sm font-medium transition-all",
              temperature === t.val
                ? t.active
                : "border-border text-muted-foreground"
            )}
          >
            <t.icon className="w-5 h-5" />
            {t.label}
          </button>
        ))}
      </div>

      {/* Notes — hidden in quick mode */}
      {!quickMode && (
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Quick notes... (optional)"
          rows={2}
          className="w-full px-3 py-2.5 rounded-lg border border-border bg-background text-sm resize-none"
        />
      )}

      {/* Honeypot — hidden */}
      <div className="hidden" aria-hidden="true">
        <input tabIndex={-1} autoComplete="off" value={honeypot} onChange={(e) => setHoneypot(e.target.value)} />
      </div>

      {/* OCR error banner */}
      {ocrError && (
        <div className="flex items-center gap-2 text-xs text-red-500 bg-red-500/10 rounded-lg p-2.5">
          <Camera className="w-4 h-4 shrink-0" />
          {ocrError}
        </div>
      )}

      {/* Scan Business Card — working OCR */}
      <label data-tour="ocr-scan" className={cn(
        "w-full flex items-center justify-center gap-2 py-2.5 rounded-lg border border-dashed text-sm cursor-pointer transition-colors",
        ocrLoading
          ? "border-grain-blue/30 bg-grain-blue/5 text-grain-blue"
          : "border-border text-muted-foreground hover:border-grain-blue/30 hover:text-grain-blue"
      )}>
        {ocrLoading ? (
          <><Loader2 className="w-4 h-4 animate-spin" /> Scanning...</>
        ) : (
          <><Camera className="w-4 h-4" /> Scan Business Card</>
        )}
        <input
          type="file"
          accept="image/*"
          capture="environment"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) handleOcr(file);
            e.target.value = "";
          }}
        />
      </label>

      {/* Submit — big thumb-zone button */}
      <button
        data-tour="save-btn"
        onClick={handleSubmit}
        disabled={isPending || !name.trim() || !conferenceId}
        className={cn(
          "w-full py-4 rounded-xl font-semibold text-white text-base transition-all",
          isPending || !name.trim() || !conferenceId
            ? "bg-grain-navy/50"
            : "bg-grain-navy active:scale-[0.98]"
        )}
      >
        {isPending ? (
          <Loader2 className="w-5 h-5 animate-spin mx-auto" />
        ) : selectedContact ? (
          "Add Interaction"
        ) : (
          "Save Lead"
        )}
      </button>
    </div>
  );
}
