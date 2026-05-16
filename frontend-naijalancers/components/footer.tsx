"use client";

import Link from "next/link";

export function Footer() {
  return (
    <footer className="border-t border-white/8 bg-[#020208]">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10">
          <div className="space-y-4">
              <Link href="/marketplace" className="flex items-center gap-2.5 group">
                <span className="text-base font-bold tracking-tight">
                  <span className="text-white">Naija</span>
                  <span style={{ color: "#00f5ff" }}>Lancers</span>
                </span>
              </Link>
            <p className="text-sm text-slate-400 leading-relaxed max-w-xs">
              Safe escrow payments for Africa. Buy and sell with trust on Celo.
            </p>
          </div>

          <div className="space-y-4">
            <h3 className="text-xs font-semibold uppercase tracking-widest text-slate-400">Product</h3>
            <ul className="space-y-2.5">
              <li><Link href="/marketplace" className="text-sm text-slate-500 hover:text-cyan-400 transition-colors">Marketplace</Link></li>
              <li><Link href="/create" className="text-sm text-slate-500 hover:text-cyan-400 transition-colors">Create Escrow</Link></li>
              <li><Link href="/dashboard" className="text-sm text-slate-500 hover:text-cyan-400 transition-colors">My Escrows</Link></li>
            </ul>
          </div>

          <div className="space-y-4">
            <h3 className="text-xs font-semibold uppercase tracking-widest text-slate-400">Resources</h3>
            <ul className="space-y-2.5">
              <li><a href="#" className="text-sm text-slate-500 hover:text-cyan-400 transition-colors">FAQ</a></li>
              <li><a href="#" className="text-sm text-slate-500 hover:text-cyan-400 transition-colors">Security</a></li>
            </ul>
          </div>

          <div className="space-y-4">
            <h3 className="text-xs font-semibold uppercase tracking-widest text-slate-400">Community</h3>
            <ul className="space-y-2.5">
              <li><a href="https://x.com/" target="_blank" rel="noopener noreferrer" className="text-sm text-slate-500 hover:text-cyan-400 transition-colors inline-flex items-center gap-1.5">Twitter <ExternalIcon /></a></li>
              <li><a href="https://t.me/" target="_blank" rel="noopener noreferrer" className="text-sm text-slate-500 hover:text-cyan-400 transition-colors inline-flex items-center gap-1.5">Telegram <ExternalIcon /></a></li>
            </ul>
          </div>
        </div>
      </div>

      <div className="border-t border-white/5">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-4 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-xs text-slate-600">
            <svg className="w-3.5 h-3.5 text-cyan-400/40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
              <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
            </svg>
            Built on Celo
          </div>
          <div className="flex items-center gap-4 text-xs text-slate-600">
            <a href="/terms" className="hover:text-slate-400 transition-colors">Terms</a>
            <span className="text-white/10">·</span>
            <a href="/privacy" className="hover:text-slate-400 transition-colors">Privacy</a>
          </div>
        </div>
      </div>
    </footer>
  );
}

function ExternalIcon() {
  return (
    <svg className="w-3 h-3 opacity-40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
      <polyline points="15 3 21 3 21 9" />
      <line x1="10" y1="14" x2="21" y2="3" />
    </svg>
  );
}
