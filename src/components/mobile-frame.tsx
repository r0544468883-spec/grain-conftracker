"use client";

import { useState } from "react";
import { Smartphone, Monitor } from "lucide-react";

export function MobileFrame({ children }: { children: React.ReactNode }) {
  const [mobilePreview, setMobilePreview] = useState(false);

  return (
    <div className="h-full">
      {/* Toggle button — only visible on desktop */}
      <div className="hidden md:flex fixed top-3 right-3 z-50 bg-background border border-border rounded-lg shadow-sm">
        <button
          onClick={() => setMobilePreview(false)}
          className={`p-2 rounded-l-lg ${!mobilePreview ? "bg-grain-blue text-white" : "text-muted-foreground hover:text-foreground"}`}
          title="Desktop view"
        >
          <Monitor className="w-4 h-4" />
        </button>
        <button
          onClick={() => setMobilePreview(true)}
          className={`p-2 rounded-r-lg ${mobilePreview ? "bg-grain-blue text-white" : "text-muted-foreground hover:text-foreground"}`}
          title="Mobile preview"
        >
          <Smartphone className="w-4 h-4" />
        </button>
      </div>

      {/* Mobile preview frame on desktop */}
      {mobilePreview ? (
        <div className="hidden md:flex h-screen items-center justify-center bg-gray-100">
          <div className="relative">
            {/* Phone frame */}
            <div className="w-[390px] h-[844px] bg-background rounded-[3rem] border-[8px] border-gray-800 shadow-2xl overflow-hidden">
              {/* Notch */}
              <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[120px] h-[28px] bg-gray-800 rounded-b-2xl z-10" />
              {/* Content */}
              <div className="h-full pt-7">{children}</div>
            </div>
          </div>
        </div>
      ) : (
        <div className="h-full max-w-lg mx-auto md:border-x md:border-border">
          {children}
        </div>
      )}

      {/* On actual mobile — just render directly */}
      <style>{`
        @media (max-width: 767px) {
          .hidden.md\\:flex { display: none !important; }
        }
      `}</style>
    </div>
  );
}
