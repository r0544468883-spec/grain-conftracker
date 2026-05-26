"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Brain, Settings, Loader2, Sparkles, AlertCircle } from "lucide-react";

type InteractionData = {
  id: string;
  notes: string;
  temperature: string;
  capturedRoleAtTime: string | null;
  capturedCompanyAtTime: string | null;
  createdAt: string;
  conferenceName: string;
  conferenceVertical: string;
};

export function AiSummarizer({
  contactName,
  interactions,
}: {
  contactName: string;
  interactions: InteractionData[];
}) {
  const [summary, setSummary] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [apiKey, setApiKey] = useState(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("grain_ai_key") || "";
    }
    return "";
  });
  const [apiProvider, setApiProvider] = useState<"anthropic" | "openai">(() => {
    if (typeof window !== "undefined") {
      return (localStorage.getItem("grain_ai_provider") as "anthropic" | "openai") || "openai";
    }
    return "openai";
  });

  function saveSettings() {
    localStorage.setItem("grain_ai_key", apiKey);
    localStorage.setItem("grain_ai_provider", apiProvider);
  }

  async function generateSummary() {
    const key = localStorage.getItem("grain_ai_key");
    const provider = localStorage.getItem("grain_ai_provider") || "openai";

    if (!key) {
      setError("Please configure your API key in settings first.");
      return;
    }

    if (interactions.length === 0) {
      setError("No interactions to summarize.");
      return;
    }

    setLoading(true);
    setError(null);
    setSummary(null);

    const interactionContext = interactions
      .map(
        (i) =>
          `- Conference: ${i.conferenceName} (${i.conferenceVertical}), Date: ${new Date(i.createdAt).toLocaleDateString()}, Temperature: ${i.temperature}, Role: ${i.capturedRoleAtTime || "N/A"} @ ${i.capturedCompanyAtTime || "N/A"}, Notes: "${i.notes}"`
      )
      .join("\n");

    const prompt = `You are a sales intelligence analyst for Grain, a fintech company that provides embedded FX hedging for cross-border payments.

Analyze the following interaction history with ${contactName} across multiple conferences. Provide a concise, actionable summary in exactly this format:

**Relationship Arc:** [2-3 sentences describing how the relationship has evolved across conferences. Note any job changes, warming/cooling signals, and key milestones.]

**Current Status:** [One line: Hot/Warm/Cold + reason]

**Nudge Strategy:** [2-3 specific, actionable next steps. Be concrete — mention specific products, timing, or approaches. Avoid generic advice like "follow up".]

Here are the chronological interactions:
${interactionContext}

Keep it under 150 words total. Write for a salesperson who needs to read this in 10 seconds before shaking hands.`;

    try {
      let result: string;

      if (provider === "openai") {
        const res = await fetch("https://api.openai.com/v1/chat/completions", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${key}`,
          },
          body: JSON.stringify({
            model: "gpt-4o-mini",
            messages: [{ role: "user", content: prompt }],
            max_tokens: 300,
            temperature: 0.7,
          }),
        });
        if (!res.ok) {
          const err = await res.json().catch(() => ({}));
          throw new Error(err.error?.message || `OpenAI API error: ${res.status}`);
        }
        const data = await res.json();
        result = data.choices[0].message.content;
      } else {
        const res = await fetch("https://api.anthropic.com/v1/messages", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-api-key": key,
            "anthropic-version": "2023-06-01",
            "anthropic-dangerous-direct-browser-access": "true",
          },
          body: JSON.stringify({
            model: "claude-haiku-4-5-20251001",
            max_tokens: 300,
            messages: [{ role: "user", content: prompt }],
          }),
        });
        if (!res.ok) {
          const err = await res.json().catch(() => ({}));
          throw new Error(err.error?.message || `Anthropic API error: ${res.status}`);
        }
        const data = await res.json();
        result = data.content[0].text;
      }

      setSummary(result);
    } catch (err: any) {
      setError(err.message || "Failed to generate summary.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card className="border-grain-blue/20 bg-gradient-to-br from-grain-blue/5 to-transparent">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base flex items-center gap-2">
            <Brain className="w-5 h-5 text-grain-blue" />
            AI Relationship Intelligence
          </CardTitle>
          <div className="flex items-center gap-2">
            <Dialog>
              <DialogTrigger>
                <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                  <Settings className="w-4 h-4" />
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>AI Settings</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 pt-2">
                  <div className="space-y-2">
                    <Label>Provider</Label>
                    <div className="flex gap-2">
                      <Button
                        variant={apiProvider === "openai" ? "default" : "outline"}
                        size="sm"
                        onClick={() => setApiProvider("openai")}
                      >
                        OpenAI
                      </Button>
                      <Button
                        variant={apiProvider === "anthropic" ? "default" : "outline"}
                        size="sm"
                        onClick={() => setApiProvider("anthropic")}
                      >
                        Anthropic
                      </Button>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>API Key</Label>
                    <Input
                      type="password"
                      placeholder={
                        apiProvider === "openai" ? "sk-..." : "sk-ant-..."
                      }
                      value={apiKey}
                      onChange={(e) => setApiKey(e.target.value)}
                    />
                    <p className="text-xs text-muted-foreground">
                      Stored locally in your browser. Never sent to our servers.
                    </p>
                  </div>
                  <Button onClick={saveSettings} className="w-full">
                    Save Settings
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
            <Button
              size="sm"
              onClick={generateSummary}
              disabled={loading || interactions.length === 0}
              className="gap-2"
            >
              {loading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Sparkles className="w-4 h-4" />
              )}
              {loading ? "Analyzing..." : "Analyze"}
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {error && (
          <div className="flex items-start gap-2 text-sm text-red-500 bg-red-500/10 rounded-lg p-3">
            <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
            <span>{error}</span>
          </div>
        )}
        {summary && (
          <div className="text-sm leading-relaxed whitespace-pre-line space-y-2">
            {summary.split("\n").map((line, i) => {
              if (line.startsWith("**") && line.includes(":**")) {
                const [label, ...rest] = line.split(":**");
                return (
                  <div key={i}>
                    <span className="font-semibold text-foreground">
                      {label.replace(/\*\*/g, "")}:
                    </span>{" "}
                    <span className="text-foreground/80">
                      {rest.join(":**").replace(/\*\*/g, "")}
                    </span>
                  </div>
                );
              }
              return line.trim() ? <p key={i}>{line}</p> : null;
            })}
          </div>
        )}
        {!summary && !error && (
          <p className="text-xs text-muted-foreground">
            Click &ldquo;Analyze&rdquo; to generate an AI-powered relationship
            summary and sales strategy based on {interactions.length} interaction
            {interactions.length !== 1 ? "s" : ""}.
          </p>
        )}
      </CardContent>
    </Card>
  );
}
