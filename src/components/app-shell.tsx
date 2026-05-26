"use client";

import { useState } from "react";
import { UserPlus, LayoutGrid, Users, CalendarRange } from "lucide-react";
import { cn } from "@/lib/utils";
import { CaptureTab } from "./tabs/capture-tab";
import { DashboardTab } from "./tabs/dashboard-tab";
import { ContactsTab } from "./tabs/contacts-tab";
import { PlanningTab } from "./tabs/planning-tab";
import { MobileFrame } from "./mobile-frame";
import { TourGuide } from "./tour-guide";

const tabs = [
  { id: "capture", label: "Capture", icon: UserPlus },
  { id: "dashboard", label: "Events", icon: LayoutGrid },
  { id: "contacts", label: "Contacts", icon: Users },
  { id: "planning", label: "Planning", icon: CalendarRange },
] as const;

type TabId = (typeof tabs)[number]["id"];

export function AppShell() {
  const [activeTab, setActiveTab] = useState<TabId>("capture");

  return (
    <MobileFrame>
      <div className="h-full flex flex-col">
        {/* Header */}
        <header className="shrink-0 bg-grain-navy text-white px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-md bg-white/20 flex items-center justify-center">
              <span className="font-bold text-xs">G</span>
            </div>
            <span className="font-semibold text-sm">ConfTracker</span>
          </div>
          <div className="flex items-center gap-2">
            <TourGuide activeTab={activeTab} />
            <span className="text-xs text-white/60">Grain Sales</span>
          </div>
        </header>

        {/* Content */}
        <div className="flex-1 overflow-y-auto">
          {activeTab === "capture" && <CaptureTab />}
          {activeTab === "dashboard" && <DashboardTab />}
          {activeTab === "contacts" && <ContactsTab />}
          {activeTab === "planning" && <PlanningTab />}
        </div>

        {/* Bottom tab bar */}
        <nav className="shrink-0 border-t border-border bg-background flex">
          {tabs.map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  "flex-1 flex flex-col items-center gap-1 py-2 text-[11px] transition-colors",
                  isActive
                    ? "text-grain-blue"
                    : "text-muted-foreground"
                )}
              >
                <tab.icon className={cn("w-5 h-5", isActive && "stroke-[2.5]")} />
                {tab.label}
              </button>
            );
          })}
        </nav>
      </div>
    </MobileFrame>
  );
}
