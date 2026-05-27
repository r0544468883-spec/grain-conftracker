"use client";

import { useEffect, useState } from "react";
import { driver } from "driver.js";
import "driver.js/dist/driver.css";
import { HelpCircle } from "lucide-react";

const TOUR_SEEN_KEY = "grain_tour_seen";

const captureTourSteps = [
  {
    element: "[data-tour='conference-select']",
    popover: {
      title: "1. Select Your Conference",
      description: "Choose the event you're attending. The system remembers your last selection — no need to pick it every time.",
      side: "bottom" as const,
    },
  },
  {
    element: "[data-tour='quick-mode']",
    popover: {
      title: "2. Quick Capture Mode",
      description: "Busy show floor? Toggle Quick mode — only Name + Company + Temperature. Capture a lead in 5 seconds, add details later.",
      side: "bottom" as const,
    },
  },
  {
    element: "[data-tour='name-search']",
    popover: {
      title: "3. Smart Search + AI Matching",
      description: "Start typing — if this person exists from a previous conference, they pop up instantly. The AI also detects name variations (Bob/Robert) and job changes automatically.",
      side: "bottom" as const,
    },
  },
  {
    element: "[data-tour='temperature']",
    popover: {
      title: "4. Rate the Lead — One Tap",
      description: "Cold = browsing. Warm = asked questions. Hot = wants a demo. One tap with your thumb — this feeds the AI Lead Score later.",
      side: "top" as const,
    },
  },
  {
    element: "[data-tour='ocr-scan']",
    popover: {
      title: "5. AI-Powered Business Card Scan",
      description: "Take a photo of their card — OCR extracts the text, then AI enriches it: auto-fills name/company/email, detects duplicates, and flags job changes. Saves 30+ seconds per lead.",
      side: "top" as const,
    },
  },
  {
    element: "[data-tour='save-btn']",
    popover: {
      title: "6. Save + LinkedIn Connect",
      description: "Hit save — works offline too (syncs later). After saving, a LinkedIn Connect button opens their profile instantly. One tap to send a connection request.",
      side: "top" as const,
    },
  },
];

const eventsTourSteps = [
  {
    element: "[data-tour='events-header']",
    popover: {
      title: "Conference Intelligence",
      description: "All conferences ranked by ICP fit for Grain. Higher score = more PSPs, travel platforms, and FX-exposed companies in attendance.",
      side: "bottom" as const,
    },
  },
  {
    element: "[data-tour='view-toggle']",
    popover: {
      title: "List or Calendar View",
      description: "List view: sorted by ICP score. Calendar view: monthly grid like Google Calendar — tap a day to see full event details (dates, location, audience size, description, website).",
      side: "bottom" as const,
    },
  },
  {
    element: "[data-tour='events-filter']",
    popover: {
      title: "Search & Filter",
      description: "Search by name or location. Filter by vertical (Fintech, Payments, Treasury, Travel, SaaS). Zero in on what matters for your territory.",
      side: "bottom" as const,
    },
  },
];

const contactsTourSteps = [
  {
    element: "[data-tour='contacts-header']",
    popover: {
      title: "Your Contact Network",
      description: "Everyone you've met across all conferences. Each card shows temperature (Hot/Warm/Cold), lifecycle stage, and number of interactions.",
      side: "bottom" as const,
    },
  },
  {
    element: "[data-tour='contacts-filters']",
    popover: {
      title: "Search & Filter",
      description: "Search by name or company. Filter by temperature or lifecycle stage. Find the right person in seconds, even with hundreds of contacts.",
      side: "bottom" as const,
    },
  },
  {
    element: "[data-tour='hubspot-btns']",
    popover: {
      title: "HubSpot Integration",
      description: "Two options: CSV export for manual import, or direct API push to HubSpot (creates/updates contacts automatically). One click — leads are in your CRM.",
      side: "bottom" as const,
    },
  },
  {
    popover: {
      title: "AI Features (Inside Contact Profile)",
      description: "Tap any contact to open their profile. Inside you'll find 4 AI-powered tools that work automatically — no setup needed:",
      side: "bottom" as const,
    },
  },
  {
    popover: {
      title: "AI 1: Relationship Analyzer",
      description: "Analyzes all interactions across conferences and generates: Relationship Arc (how it evolved), Current Status (Hot/Warm/Cold + why), and Next Step (specific action to take).",
      side: "bottom" as const,
    },
  },
  {
    popover: {
      title: "AI 2: Lead Score (0-100)",
      description: "AI scores each lead based on: interaction frequency, temperature trends, job seniority, company-vertical fit, and buying signals in notes. Score is saved — track progress over time.",
      side: "bottom" as const,
    },
  },
  {
    popover: {
      title: "AI 3: Follow-Up Email Draft",
      description: "One tap generates a personalized follow-up email referencing your actual conversation notes. Includes subject line and CTA. Copy and paste into Gmail or HubSpot.",
      side: "bottom" as const,
    },
  },
  {
    popover: {
      title: "AI 4: LinkedIn Connect",
      description: "Every contact profile has a 'Find on LinkedIn' button that opens a pre-filled search. One click to send a connection request — strike while the iron is hot.",
      side: "bottom" as const,
    },
  },
];

const planningTourSteps = [
  {
    element: "[data-tour='planning-header']",
    popover: {
      title: "Annual Coverage Planner",
      description: "Your entire conference year at a glance. Months with no events are flagged as gaps — never miss a quarter of pipeline generation.",
      side: "bottom" as const,
    },
  },
  {
    element: "[data-tour='trip-clusters']",
    popover: {
      title: "Trip Cluster Detection",
      description: "When two conferences happen in the same region within 14 days, the system spots it. Combine trips = save $2-5K in flights per cluster.",
      side: "bottom" as const,
    },
  },
];

export function TourGuide({ activeTab }: { activeTab: string }) {
  const [tourReady, setTourReady] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setTourReady(true), 500);
    return () => clearTimeout(timer);
  }, [activeTab]);

  function startTour() {
    let steps: Array<{ element?: string; popover: { title: string; description: string; side: "top" | "bottom" | "left" | "right" } }> = [];

    switch (activeTab) {
      case "capture":
        steps = captureTourSteps;
        break;
      case "dashboard":
        steps = eventsTourSteps;
        break;
      case "contacts":
        steps = contactsTourSteps;
        break;
      case "planning":
        steps = planningTourSteps;
        break;
    }

    // Filter: steps with element must exist in DOM, steps without element always show
    const validSteps = steps.filter(
      (s) => !("element" in s && s.element) || document.querySelector(s.element as string) !== null
    );

    if (validSteps.length === 0) return;

    const d = driver({
      showProgress: true,
      animate: true,
      overlayColor: "rgba(0, 0, 0, 0.75)",
      stagePadding: 8,
      stageRadius: 12,
      popoverClass: "grain-tour-popover",
      nextBtnText: "Next ->",
      prevBtnText: "<- Back",
      doneBtnText: "Got it!",
      steps: validSteps,
      onDestroyStarted: () => {
        d.destroy();
      },
    });

    d.drive();
  }

  function startFirstTimeTour() {
    if (typeof window === "undefined") return;
    const seen = localStorage.getItem(TOUR_SEEN_KEY);
    if (!seen && activeTab === "capture") {
      setTimeout(() => {
        startTour();
        localStorage.setItem(TOUR_SEEN_KEY, "true");
      }, 1000);
    }
  }

  useEffect(() => {
    if (tourReady) startFirstTimeTour();
  }, [tourReady, activeTab]);

  return (
    <button
      onClick={startTour}
      className="p-1.5 rounded-lg hover:bg-white/10 transition-colors"
      title="Take a tour"
      aria-label="Start guided tour"
    >
      <HelpCircle className="w-4 h-4 text-white/70" />
    </button>
  );
}
