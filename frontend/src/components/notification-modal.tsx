"use client";

import { useState, useEffect, useRef, useId } from "react";
import { useAccount } from "wagmi";
import { useConnectModal } from "@rainbow-me/rainbowkit";
import { useTranslations } from "next-intl";
import { useToast } from "@/components/toast";
import { GlowButton } from "@/components/ui/glow-button";
import { cn } from "@/lib/utils";

type EventKey =
  | "escrow_created"
  | "escrow_funded"
  | "funds_released"
  | "dispute_opened"
  | "dispute_resolved"
  | "milestone_completed";

const ALL_EVENTS: EventKey[] = [
  "escrow_created",
  "escrow_funded",
  "funds_released",
  "dispute_opened",
  "dispute_resolved",
  "milestone_completed",
];

const TELEGRAM_BOT = process.env.NEXT_PUBLIC_TELEGRAM_BOT_USERNAME ?? "EscrowHubsBot";

interface NotificationPrefs {
  telegramChatId:  string | null;
  telegramEnabled: Record<EventKey, boolean>;
}

function defaultPrefs(): NotificationPrefs {
  const enabled = Object.fromEntries(ALL_EVENTS.map(e => [e, true])) as Record<EventKey, boolean>;
  return { telegramChatId: null, telegramEnabled: enabled };
}

interface NotificationModalProps {
  open:    boolean;
  onClose: () => void;
}

export function NotificationModal({ open, onClose }: NotificationModalProps) {
  const t          = useTranslations("notifications");
  const uid        = useId();
  const { address: wallet } = useAccount();
  const { openConnectModal } = useConnectModal();
  const { addToast }        = useToast();
  const backdropRef         = useRef<HTMLDivElement>(null);

  const [prefs,      setPrefs]      = useState<NotificationPrefs>(defaultPrefs());
  const [submitting, setSubmitting] = useState(false);

  // Load saved prefs
  useEffect(() => {
    if (!open || !wallet) return;
    fetch(`/api/notifications/preferences?wallet=${wallet}`)
      .then(r => r.json())
      .then(data => {
        if (data) {
          setPrefs({
            telegramChatId:  data.telegramChatId ?? null,
            telegramEnabled: { ...defaultPrefs().telegramEnabled, ...(data.telegramEnabled ?? {}) },
          });
        }
      })
      .catch(() => {});
  }, [open, wallet]);

  // Escape + focus trap
  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") { onClose(); return; }
      if (e.key === "Tab") {
        const modal = backdropRef.current?.querySelector("[data-modal]");
        if (!modal) return;
        const els = Array.from(modal.querySelectorAll<HTMLElement>(
          'button:not([disabled]), input:not([disabled]), a, [tabindex]:not([tabindex="-1"])'
        ));
        if (!els.length) return;
        if (e.shiftKey && document.activeElement === els[0]) { e.preventDefault(); els[els.length - 1].focus(); }
        else if (!e.shiftKey && document.activeElement === els[els.length - 1]) { e.preventDefault(); els[0].focus(); }
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  function toggleEvent(ev: EventKey) {
    setPrefs(p => ({ ...p, telegramEnabled: { ...p.telegramEnabled, [ev]: !p.telegramEnabled[ev] } }));
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!wallet) return;
    setSubmitting(true);
    try {
      const res = await fetch("/api/notifications/preferences", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          wallet,
          telegramChatId:  prefs.telegramChatId,
          telegramEnabled: prefs.telegramEnabled,
        }),
      });
      if (!res.ok) throw new Error();
      addToast({ type: "success", message: t("saved") });
      onClose();
    } catch {
      addToast({ type: "error", message: t("error") });
    } finally {
      setSubmitting(false);
    }
  }

  if (!open) return null;

  return (
    <div
      ref={backdropRef}
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
      onClick={e => { if (e.target === backdropRef.current) onClose(); }}
      role="dialog"
      aria-modal="true"
      aria-labelledby={`${uid}-title`}
    >
      <div
        data-modal
        className="w-full max-w-md rounded-2xl border border-white/10 bg-[#0a0a0a]/95 shadow-2xl backdrop-blur-xl max-h-[90vh] flex flex-col overflow-hidden"
      >
        {/* Header — fixed, never collapses */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/8 shrink-0">
          <div className="flex items-center gap-2">
            <span className="text-lg">🔔</span>
            <div>
              <h2 id={`${uid}-title`} className="text-sm font-semibold uppercase tracking-widest text-slate-200">
                {t("title")}
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">{t("subtitle")}</p>
            </div>
          </div>
          <button onClick={onClose} aria-label="Close" className="text-slate-500 hover:text-white transition-colors text-xl leading-none ml-4">×</button>
        </div>

        <div className="overflow-y-auto flex-1 min-h-0">
        {!wallet ? (
          <div className="px-6 py-10 flex flex-col items-center gap-4 text-center">
            <p className="text-sm text-slate-500">Connect your wallet to manage notifications.</p>
            <GlowButton
              variant="primary"
              onClick={() => { onClose(); openConnectModal?.(); }}
              className="px-6 py-2.5 text-sm"
            >
              Connect Wallet
            </GlowButton>
          </div>
        ) : (
          <form onSubmit={handleSave} className="p-6 space-y-6">

            {/* ── Telegram Section ──────────────────────────────── */}
            <section className="space-y-4">
              <h3 className="text-xs font-semibold uppercase tracking-widest text-cyan-400/70 flex items-center gap-2">
                <span>✈️</span> {t("telegramSection")}
              </h3>

              {/* Link button + status */}
              <div className="flex items-center gap-3 flex-wrap">
                <a
                  href={`https://t.me/${TELEGRAM_BOT}?start=${wallet}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={cn(
                    "inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all",
                    prefs.telegramChatId
                      ? "bg-green-400/10 text-green-400 border border-green-400/30"
                      : "bg-cyan-400/10 text-cyan-400 border border-cyan-400/30 hover:bg-cyan-400/20 hover:border-cyan-400/60"
                  )}
                >
                  {prefs.telegramChatId ? (
                    <><span>✓</span> {t("telegramLinked")}</>
                  ) : (
                    <><span>✈️</span> {t("telegramLink")}</>
                  )}
                </a>
                {!prefs.telegramChatId && (
                  <p className="text-xs text-slate-600 flex-1 min-w-0">{t("telegramHint")}</p>
                )}
              </div>

              {/* Status badge when linked */}
              {prefs.telegramChatId && (
                <div className="rounded-xl bg-green-400/5 border border-green-400/15 px-4 py-2.5 text-xs text-green-400/80">
                  ✓ Telegram notifications active for this wallet
                </div>
              )}

              {/* Per-event toggles — always shown so user can configure before linking */}
              <div className="space-y-3">
                <p className="text-xs text-slate-600 uppercase tracking-widest">Notify me when</p>
                {ALL_EVENTS.map(ev => (
                  <label key={ev} className="flex items-center justify-between gap-3 cursor-pointer group">
                    <span className="text-sm text-slate-400 group-hover:text-slate-200 transition-colors">
                      {t(`events.${ev}`)}
                    </span>
                    <ToggleSwitch
                      checked={!!prefs.telegramEnabled[ev]}
                      onChange={() => toggleEvent(ev)}
                    />
                  </label>
                ))}
              </div>
            </section>

            {/* Submit */}
            <div className="pt-1">
              <div className="h-px bg-gradient-to-r from-transparent via-cyan-400/20 to-transparent mb-4" />
              <GlowButton type="submit" variant="primary" loading={submitting} className="w-full py-2.5">
                {submitting ? t("saving") : t("save")}
              </GlowButton>
            </div>
          </form>
        )}
        </div>
      </div>
    </div>
  );
}

function ToggleSwitch({ checked, onChange }: { checked: boolean; onChange: () => void }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={onChange}
      className={cn(
        "relative inline-flex h-5 w-9 shrink-0 rounded-full border-2 transition-colors duration-200 cursor-pointer",
        "focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400",
        checked ? "bg-cyan-400 border-cyan-400" : "bg-white/10 border-white/20"
      )}
    >
      <span className={cn(
        "pointer-events-none inline-block h-3.5 w-3.5 rounded-full bg-white shadow transition-transform duration-200 mt-px",
        checked ? "translate-x-4" : "translate-x-0.5"
      )} />
    </button>
  );
}
