"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import { FAQ_ITEMS } from "../mock-data";

export default function FAQPage() {
  const [open, setOpen] = useState<number | null>(0);

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Frequently Asked Questions</h1>
        <p className="mt-1 text-slate-400 text-sm">Everything you need to know about EscrowHubs on Base.</p>
      </div>

      <div className="space-y-2">
        {FAQ_ITEMS.map((item, i) => (
          <div
            key={i}
            className={cn(
              "rounded-xl border transition-all duration-200",
              open === i ? "border-amber-500/30 bg-amber-500/5" : "border-white/8 bg-white/3"
            )}
          >
            <button
              onClick={() => setOpen(open === i ? null : i)}
              className="w-full flex items-center justify-between px-5 py-4 text-left gap-4"
            >
              <span className={cn("text-sm font-medium transition-colors", open === i ? "text-amber-300" : "text-white")}>
                {item.q}
              </span>
              <span className={cn("shrink-0 text-lg transition-transform duration-200", open === i ? "rotate-45 text-amber-400" : "text-slate-500")}>
                +
              </span>
            </button>
            {open === i && (
              <div className="px-5 pb-4">
                <p className="text-sm text-slate-300 leading-relaxed">{item.a}</p>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
