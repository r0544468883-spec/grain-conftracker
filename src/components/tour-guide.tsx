"use client";

import { useEffect, useState } from "react";
import { driver } from "driver.js";
import "driver.js/dist/driver.css";
import { HelpCircle } from "lucide-react";

const TOUR_SEEN_KEY = "grain_tour_seen";

// Tour steps per tab
const captureTourSteps = [
  {
    element: "[data-tour='conference-select']",
    popover: {
      title: "1. Select Your Conference",
      description: "Choose the event you're attending right now. The system remembers your last selection so you don't have to pick it again every time.",
      side: "bottom" as const,
    },
  },
  {
    element: "[data-tour='quick-mode']",
    popover: {
      title: "2. Quick Capture Mode ⚡",
      description: "At a busy booth? Toggle Quick mode to show only Name + Company + Temperature. Capture a lead in 5 seconds flat — add details later.",
      side: "bottom" as const,
    },
  },
  {
    element: "[data-tour='name-search']",
    popover: {
      title: "3. Smart Search",
      description: "Start typing a name — if this person is already in the system from a previous conference, they'll pop up instantly. Tap to add a new interaction instead of creating a duplicate.",
      side: "bottom" as const,
    },
  },
  {
    element: "[data-tour='temperature']",
    popover: {
      title: "4. Rate the Lead — One Tap",
      description: "Cold = just browsing. Warm = interested, asked questions. Hot = wants a demo, brought their boss. One tap with your thumb — no dropdowns, no typing.",
      side: "top" as const,
    },
  },
  {
    element: "[data-tour='ocr-scan']",
    popover: {
      title: "5. Scan a Business Card 📸",
      description: "Take a photo of their business card — the OCR engine extracts name, company, email, and phone automatically. Saves 30 seconds per lead.",
      side: "top" as const,
    },
  },
  {
    element: "[data-tour='save-btn']",
    popover: {
      title: "6. Save & Connect",
      description: "Hit save — if you're offline (bad WiFi at the venue), the lead saves locally and syncs later. After saving, you'll see a LinkedIn Connect button to immediately send a connection request.",
      side: "top" as const,
    },
  },
];

const eventsTourSteps = [
  {
    element: "[data-tour='events-header']",
    popover: {
      title: "Conference Intelligence",
      description: "All your target conferences, ranked by ICP fit for Grain. The higher the score, the more likely you'll find PSPs, travel platforms, and companies with FX exposure.",
      side: "bottom" as const,
    },
  },
  {
    element: "[data-tour='view-toggle']",
    popover: {
      title: "List or Calendar View",
      description: "Switch between a prioritized list (sorted by ICP score) and a monthly calendar view. The calendar shows colored dots on days with events — tap a day to see full event details.",
      side: "bottom" as const,
    },
  },
  {
    element: "[data-tour='events-filter']",
    popover: {
      title: "Filter by Vertical",
      description: "Quickly filter by Fintech, Payments, Treasury, Travel, or SaaS. Focus on the verticals that matter most for your territory.",
      side: "bottom" as const,
    },
  },
];

const contactsTourSteps = [
  {
    element: "[data-tour='contacts-header']",
    popover: {
      title: "Your Contact Network",
      description: "Everyone you've met across all conferences, in one place. Each contact shows their temperature (Hot/Warm/Cold) and how many conferences you've met them at.",
      side: "bottom" as const,
    },
  },
  {
    element: "[data-tour='contacts-filters']",
    popover: {
      title: "Search & Filter",
      description: "Search by name or company. Filter by temperature (show me only Hot leads) or lifecycle stage (Prospect, Lead, etc.). Find the right person in seconds.",
      side: "bottom" as const,
    },
  },
  {
    element: "[data-tour='hubspot-btns']",
    popover: {
      title: "Push to HubSpot",
      description: "Export contacts as a CSV for manual import, or push directly to HubSpot via API. One click — your leads are in the CRM, ready for follow-up sequences.",
      side: "bottom" as const,
    },
  },
];

const planningTourSteps = [
  {
    element: "[data-tour='planning-header']",
    popover: {
      title: "Annual Coverage Planner",
      description: "See your entire conference year at a glance. Months with no events are flagged as gaps — so you never miss a quarter of pipeline generation.",
      side: "bottom" as const,
    },
  },
  {
    element: "[data-tour='trip-clusters']",
    popover: {
      title: "Trip Cluster Detection ✈️",
      description: "When two conferences happen in the same region within 14 days, the system flags it as a trip cluster opportunity. Combine trips = save $2-5K in flights per cluster.",
      side: "bottom" as const,
    },
  },
];

export function TourGuide({ activeTab }: { activeTab: string }) {
  const [tourReady, setTourReady] = useState(false);

  useEffect(() => {
    // Wait for DOM to render
    const timer = setTimeout(() => setTourReady(true), 500);
    return () => clearTimeout(timer);
  }, [activeTab]);

  function startTour() {
    let steps: typeof captureTourSteps = [];

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

    // Filter to only steps whose elements exist in DOM
    const validSteps = steps.filter(
      (s) => document.querySelector(s.element) !== null
    );

    if (validSteps.length === 0) return;

    const d = driver({
      showProgress: true,
      animate: true,
      overlayColor: "rgba(0, 0, 0, 0.75)",
      stagePadding: 8,
      stageRadius: 12,
      popoverClass: "grain-tour-popover",
      nextBtnText: "Next →",
      prevBtnText: "← Back",
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
    >
      <HelpCircle className="w-4 h-4 text-white/70" />
    </button>
  );
}
