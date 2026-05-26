"use client";

import { useState, useEffect, useCallback } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  UserPlus,
  Search,
  Camera,
  Check,
  WifiOff,
  RefreshCw,
  Flame,
  Thermometer,
  Snowflake,
  Loader2,
  Building2,
} from "lucide-react";
import { searchContacts, getConferences, submitLead } from "./actions";

const captureSchema = z.object({
  name: z.string().min(1, "Name is required"),
  company: z.string().default(""),
  role: z.string().default(""),
  email: z.string().default(""),
  phone: z.string().default(""),
  notes: z.string().default(""),
  website: z.string().default(""), // Honeypot
});

type CaptureForm = z.infer<typeof captureSchema>;

type SearchResult = {
  id: string;
  name: string;
  currentCompany: string | null;
  currentRole: string | null;
  email: string | null;
  phone: string | null;
  interactionCount: number;
};

type ConferenceOption = {
  id: string;
  name: string;
  date: Date;
};

export default function CapturePage() {
  const [conferences, setConferences] = useState<ConferenceOption[]>([]);
  const [selectedConference, setSelectedConference] = useState("");
  const [temperature, setTemperature] = useState("WARM");
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [selectedContact, setSelectedContact] = useState<SearchResult | null>(null);
  const [searching, setSearching] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [offlineSaved, setOfflineSaved] = useState(false);
  const [pendingSync, setPendingSync] = useState(0);

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(captureSchema),
    defaultValues: {
      name: "",
      company: "",
      role: "",
      email: "",
      phone: "",
      notes: "",
      website: "",
    },
  });

  useEffect(() => {
    getConferences().then(setConferences);
    // Check pending offline items
    const pending = JSON.parse(localStorage.getItem("grain_offline_queue") || "[]");
    setPendingSync(pending.length);
  }, []);

  // Search with debounce
  useEffect(() => {
    if (searchQuery.length < 2) {
      setSearchResults([]);
      return;
    }
    const timer = setTimeout(async () => {
      setSearching(true);
      const results = await searchContacts(searchQuery);
      setSearchResults(results);
      setSearching(false);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  function selectExistingContact(contact: SearchResult) {
    setSelectedContact(contact);
    setValue("name", contact.name);
    setValue("company", contact.currentCompany || "");
    setValue("role", contact.currentRole || "");
    setValue("email", contact.email || "");
    setValue("phone", contact.phone || "");
    setSearchQuery("");
    setSearchResults([]);
  }

  function clearSelection() {
    setSelectedContact(null);
    reset();
  }

  async function syncOfflineQueue() {
    const queue = JSON.parse(localStorage.getItem("grain_offline_queue") || "[]");
    const remaining: any[] = [];

    for (const item of queue) {
      try {
        await submitLead(item);
      } catch {
        remaining.push(item);
      }
    }

    localStorage.setItem("grain_offline_queue", JSON.stringify(remaining));
    setPendingSync(remaining.length);
  }

  const onSubmit = useCallback(
    async (data: Record<string, any>) => {
      // Honeypot check
      if (data.website) return;

      if (!selectedConference) return;

      setSubmitting(true);

      const payload = {
        name: data.name,
        company: data.company || "",
        role: data.role || "",
        email: data.email || "",
        phone: data.phone || "",
        conferenceId: selectedConference,
        notes: data.notes || "",
        temperature,
        source: "manual",
        existingContactId: selectedContact?.id,
      };

      try {
        await submitLead(payload);
        setSuccess(true);
        setTimeout(() => {
          setSuccess(false);
          reset();
          setSelectedContact(null);
          setTemperature("WARM");
        }, 2000);
      } catch {
        // Offline fallback
        const queue = JSON.parse(
          localStorage.getItem("grain_offline_queue") || "[]"
        );
        queue.push(payload);
        localStorage.setItem("grain_offline_queue", JSON.stringify(queue));
        setPendingSync(queue.length);
        setOfflineSaved(true);
        setTimeout(() => {
          setOfflineSaved(false);
          reset();
          setSelectedContact(null);
          setTemperature("WARM");
        }, 2000);
      } finally {
        setSubmitting(false);
      }
    },
    [selectedConference, temperature, selectedContact, reset]
  );

  // Success overlay
  if (success) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center space-y-3">
          <div className="w-16 h-16 rounded-full bg-green-500/10 flex items-center justify-center mx-auto">
            <Check className="w-8 h-8 text-green-500" />
          </div>
          <p className="text-lg font-semibold">Lead Captured!</p>
          <p className="text-sm text-muted-foreground">Ready for the next one...</p>
        </div>
      </div>
    );
  }

  // Offline saved overlay
  if (offlineSaved) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center space-y-3">
          <div className="w-16 h-16 rounded-full bg-orange-400/10 flex items-center justify-center mx-auto">
            <WifiOff className="w-8 h-8 text-orange-400" />
          </div>
          <p className="text-lg font-semibold">Saved Locally (Offline)</p>
          <p className="text-sm text-muted-foreground">
            Will sync when connection is restored
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-8 max-w-xl mx-auto space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold flex items-center gap-2">
            <UserPlus className="w-5 h-5" />
            Quick Capture
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Log a lead in seconds
          </p>
        </div>
        {pendingSync > 0 && (
          <Button
            variant="outline"
            size="sm"
            onClick={syncOfflineQueue}
            className="gap-2 text-orange-400 border-orange-400/30"
          >
            <RefreshCw className="w-4 h-4" />
            Sync ({pendingSync})
          </Button>
        )}
      </div>

      {/* Conference selector */}
      <Card>
        <CardContent className="p-3">
          <Label className="text-xs text-muted-foreground">Active Conference</Label>
          <Select value={selectedConference} onValueChange={(v) => setSelectedConference(v ?? "")}>
            <SelectTrigger className="mt-1">
              <SelectValue placeholder="Select conference..." />
            </SelectTrigger>
            <SelectContent>
              {conferences.map((c) => (
                <SelectItem key={c.id} value={c.id}>
                  {c.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      {/* Search existing contacts */}
      <Card>
        <CardContent className="p-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search existing contacts..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
            {searching && (
              <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 animate-spin text-muted-foreground" />
            )}
          </div>
          {searchResults.length > 0 && (
            <div className="mt-2 border rounded-lg overflow-hidden">
              {searchResults.map((r) => (
                <button
                  key={r.id}
                  onClick={() => selectExistingContact(r)}
                  className="w-full text-left p-3 hover:bg-muted/50 border-b last:border-b-0 flex items-center justify-between"
                >
                  <div>
                    <p className="font-medium text-sm">{r.name}</p>
                    <p className="text-xs text-muted-foreground flex items-center gap-1">
                      <Building2 className="w-3 h-3" />
                      {r.currentCompany || "No company"} &middot;{" "}
                      {r.interactionCount} interactions
                    </p>
                  </div>
                  <Badge variant="outline" className="text-xs">
                    Existing
                  </Badge>
                </button>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Selected contact banner */}
      {selectedContact && (
        <Card className="border-grain-blue/30 bg-grain-blue/5">
          <CardContent className="p-3 flex items-center justify-between">
            <div>
              <p className="text-sm font-medium">
                Adding interaction to: {selectedContact.name}
              </p>
              <p className="text-xs text-muted-foreground">
                {selectedContact.currentCompany} &middot;{" "}
                {selectedContact.interactionCount} prior interactions
              </p>
            </div>
            <Button variant="ghost" size="sm" onClick={clearSelection}>
              Clear
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Lead form */}
      <form onSubmit={handleSubmit(onSubmit)}>
        <Card>
          <CardHeader className="pb-2 pt-3">
            <CardTitle className="text-sm">
              {selectedContact ? "New Interaction" : "New Contact + Interaction"}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 pb-4">
            {/* Honeypot - invisible to users */}
            <div className="hidden" aria-hidden="true">
              <input tabIndex={-1} autoComplete="off" {...register("website")} />
            </div>

            {!selectedContact && (
              <>
                <div>
                  <Label className="text-xs">Name *</Label>
                  <Input
                    {...register("name")}
                    placeholder="Full name"
                    className="mt-1"
                    autoFocus
                  />
                  {errors.name && (
                    <p className="text-xs text-red-500 mt-1">
                      {errors.name.message}
                    </p>
                  )}
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label className="text-xs">Company</Label>
                    <Input
                      {...register("company")}
                      placeholder="Company"
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label className="text-xs">Role</Label>
                    <Input
                      {...register("role")}
                      placeholder="Job title"
                      className="mt-1"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label className="text-xs">Email</Label>
                    <Input
                      {...register("email")}
                      type="email"
                      placeholder="email@company.com"
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label className="text-xs">Phone</Label>
                    <Input
                      {...register("phone")}
                      type="tel"
                      placeholder="+1 555..."
                      className="mt-1"
                    />
                  </div>
                </div>
              </>
            )}

            {/* Temperature buttons */}
            <div>
              <Label className="text-xs">Interest Level</Label>
              <div className="grid grid-cols-3 gap-2 mt-1">
                {[
                  { val: "COLD", icon: Snowflake, label: "Cold", color: "border-blue-400 bg-blue-400/10 text-blue-500" },
                  { val: "WARM", icon: Thermometer, label: "Warm", color: "border-grain-gold bg-grain-gold/10 text-grain-gold" },
                  { val: "HOT", icon: Flame, label: "Hot", color: "border-red-500 bg-red-500/10 text-red-500" },
                ].map((t) => (
                  <button
                    key={t.val}
                    type="button"
                    onClick={() => setTemperature(t.val)}
                    className={`flex items-center justify-center gap-2 p-3 rounded-lg border-2 transition-all text-sm font-medium ${
                      temperature === t.val
                        ? t.color
                        : "border-border text-muted-foreground hover:border-border/80"
                    }`}
                  >
                    <t.icon className="w-4 h-4" />
                    {t.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Notes */}
            <div>
              <Label className="text-xs">Quick Notes</Label>
              <Textarea
                {...register("notes")}
                placeholder="What did you discuss? Key takeaways..."
                rows={3}
                className="mt-1"
              />
            </div>

            {/* OCR placeholder */}
            <Button
              type="button"
              variant="outline"
              className="w-full gap-2 text-muted-foreground"
              disabled
            >
              <Camera className="w-4 h-4" />
              Scan Business Card (Coming Soon)
            </Button>

            {/* Submit */}
            <Button
              type="submit"
              className="w-full gap-2 bg-grain-navy hover:bg-grain-navy-dark text-white"
              disabled={submitting || !selectedConference}
            >
              {submitting ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Check className="w-4 h-4" />
              )}
              {submitting
                ? "Saving..."
                : selectedContact
                  ? "Add Interaction"
                  : "Save Lead"}
            </Button>

            {!selectedConference && (
              <p className="text-xs text-orange-400 text-center">
                Select a conference above to continue
              </p>
            )}
          </CardContent>
        </Card>
      </form>
    </div>
  );
}
