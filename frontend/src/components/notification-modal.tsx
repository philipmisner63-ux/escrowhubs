     1|"use client";
     2|
     3|import { useState, useEffect, useRef, useId } from "react";
     4|import { createPortal } from "react-dom";
     5|import { useAccount, useSignMessage } from "wagmi";
     6|import { useConnectModal } from "@rainbow-me/rainbowkit";
     7|import { useTranslations } from "next-intl";
     8|import { useToast } from "@/components/toast";
     9|import { GlowButton } from "@/components/ui/glow-button";
    10|import { cn } from "@/lib/utils";
    11|
    12|type EventKey =
    13|  | "escrow_created"
    14|  | "escrow_funded"
    15|  | "funds_released"
    16|  | "dispute_opened"
    17|  | "dispute_resolved"
    18|  | "milestone_completed";
    19|
    20|const ALL_EVENTS: EventKey[] = [
    21|  "escrow_created",
    22|  "escrow_funded",
    23|  "funds_released",
    24|  "dispute_opened",
    25|  "dispute_resolved",
    26|  "milestone_completed",
    27|];
    28|
    29|const TELEGRAM_BOT = process.env.NEXT_PUBLIC_TELEGRAM_BOT_USERNAME ?? "EscrowHubsBot";
    30|
    31|interface NotificationPrefs {
    32|  telegramChatId:  string | null;
    33|  telegramEnabled: Record<EventKey, boolean>;
    34|}
    35|
    36|function defaultPrefs(): NotificationPrefs {
    37|  const enabled = Object.fromEntries(ALL_EVENTS.map(e => [e, true])) as Record<EventKey, boolean>;
    38|  return { telegramChatId: null, telegramEnabled: enabled };
    39|}
    40|
    41|interface NotificationModalProps {
    42|  open:    boolean;
    43|  onClose: () => void;
    44|}
    45|
    46|export function NotificationModal({ open, onClose }: NotificationModalProps) {
    47|  const t          = useTranslations("notifications");
    48|  const uid        = useId();
    49|  const { address: wallet } = useAccount();
  const { signMessageAsync } = useSignMessage();
    50|  const { openConnectModal } = useConnectModal();
    51|  const { addToast }        = useToast();
    52|  const backdropRef         = useRef<HTMLDivElement>(null);
    53|
    54|  const [prefs,      setPrefs]      = useState<NotificationPrefs>(defaultPrefs());
    55|  const [submitting, setSubmitting] = useState(false);
    56|
    57|  // Load saved prefs
    58|  useEffect(() => {
    59|    if (!open || !wallet) return;
    60|    fetch(`/api/notifications/preferences?wallet=${wallet}`)
    61|      .then(r => r.json())
    62|      .then(data => {
    63|        if (data) {
    64|          setPrefs({
    65|            telegramChatId:  data.telegramChatId ?? null,
    66|            telegramEnabled: { ...defaultPrefs().telegramEnabled, ...(data.telegramEnabled ?? {}) },
    67|          });
    68|        }
    69|      })
    70|      .catch(() => {});
    71|  }, [open, wallet]);
    72|
    73|  // Escape + focus trap
    74|  useEffect(() => {
    75|    if (!open) return;
    76|    function onKey(e: KeyboardEvent) {
    77|      if (e.key === "Escape") { onClose(); return; }
    78|      if (e.key === "Tab") {
    79|        const modal = backdropRef.current?.querySelector("[data-modal]");
    80|        if (!modal) return;
    81|        const els = Array.from(modal.querySelectorAll<HTMLElement>(
    82|          'button:not([disabled]), input:not([disabled]), a, [tabindex]:not([tabindex="-1"])'
    83|        ));
    84|        if (!els.length) return;
    85|        if (e.shiftKey && document.activeElement === els[0]) { e.preventDefault(); els[els.length - 1].focus(); }
    86|        else if (!e.shiftKey && document.activeElement === els[els.length - 1]) { e.preventDefault(); els[0].focus(); }
    87|      }
    88|    }
    89|    window.addEventListener("keydown", onKey);
    90|    return () => window.removeEventListener("keydown", onKey);
    91|  }, [open, onClose]);
    92|
    93|  function toggleEvent(ev: EventKey) {
    94|    setPrefs(p => ({ ...p, telegramEnabled: { ...p.telegramEnabled, [ev]: !p.telegramEnabled[ev] } }));
    95|  }
    96|
    97|  async function handleSave(e: React.FormEvent) {
    98|    e.preventDefault();
    99|    if (!wallet) return;
   100|    setSubmitting(true);
   101|    try {
   102|      const res = await fetch("/api/notifications/preferences", {
   103|        method:  "POST",
   104|        headers: { "Content-Type": "application/json" },
   105|        body: JSON.stringify({
   106|          wallet,
   107|          telegramChatId:  prefs.telegramChatId,
   108|          telegramEnabled: prefs.telegramEnabled,
   109|        }),
   110|      });
   111|      if (!res.ok) throw new Error();
   112|      addToast({ type: "success", message: t("saved") });
   113|      onClose();
   114|    } catch {
   115|      addToast({ type: "error", message: t("error") });
   116|    } finally {
   117|      setSubmitting(false);
   118|    }
   119|  }
   120|
   121|  if (!open) return null;
   122|
   123|  return createPortal(
   124|    <div
   125|      ref={backdropRef}
   126|      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
   127|      onClick={e => { if (e.target === backdropRef.current) onClose(); }}
   128|      role="dialog"
   129|      aria-modal="true"
   130|      aria-labelledby={`${uid}-title`}
   131|    >
   132|      <div
   133|        data-modal
   134|        className="w-full max-w-md rounded-2xl border border-white/10 bg-[#0a0a0a]/95 shadow-2xl backdrop-blur-xl max-h-[90vh] flex flex-col overflow-hidden"
   135|      >
   136|        {/* Header — fixed, never collapses */}
   137|        <div className="flex items-center justify-between px-6 py-4 border-b border-white/8 shrink-0">
   138|          <div className="flex items-center gap-2">
   139|            <span className="text-lg">🔔</span>
   140|            <div>
   141|              <h2 id={`${uid}-title`} className="text-sm font-semibold uppercase tracking-widest text-slate-200">
   142|                {t("title")}
   143|              </h2>
   144|              <p className="text-xs text-slate-500 mt-0.5">{t("subtitle")}</p>
   145|            </div>
   146|          </div>
   147|          <button onClick={onClose} aria-label="Close" className="text-slate-500 hover:text-white transition-colors text-xl leading-none ml-4">×</button>
   148|        </div>
   149|
   150|        <div className="overflow-y-auto flex-1 min-h-0">
   151|        {!wallet ? (
   152|          <div className="px-6 py-10 flex flex-col items-center gap-4 text-center">
   153|            <p className="text-sm text-slate-500">Connect your wallet to manage notifications.</p>
   154|            <GlowButton
   155|              variant="primary"
   156|              onClick={() => { onClose(); openConnectModal?.(); }}
   157|              className="px-6 py-2.5 text-sm"
   158|            >
   159|              Connect Wallet
   160|            </GlowButton>
   161|          </div>
   162|        ) : (
   163|          <form onSubmit={handleSave} className="p-6 space-y-6">
   164|
   165|            {/* ── Telegram Section ──────────────────────────────── */}
   166|            <section className="space-y-4">
   167|              <h3 className="text-xs font-semibold uppercase tracking-widest text-cyan-400/70 flex items-center gap-2">
   168|                <span>✈️</span> {t("telegramSection")}
   169|              </h3>
   170|
   171|              {/* Link button + status */}
   172|              <div className="flex items-center gap-3 flex-wrap">
   173|                <a
   174|                  href={`https://t.me/${TELEGRAM_BOT}?start=${wallet}`}
   175|                  target="_blank"
   176|                  rel="noopener noreferrer"
   177|                  className={cn(
   178|                    "inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all",
   179|                    prefs.telegramChatId
   180|                      ? "bg-green-400/10 text-green-400 border border-green-400/30"
   181|                      : "bg-cyan-400/10 text-cyan-400 border border-cyan-400/30 hover:bg-cyan-400/20 hover:border-cyan-400/60"
   182|                  )}
   183|                >
   184|                  {prefs.telegramChatId ? (
   185|                    <><span>✓</span> {t("telegramLinked")}</>
   186|                  ) : (
   187|                    <><span>✈️</span> {t("telegramLink")}</>
   188|                  )}
   189|                </a>
   190|                {!prefs.telegramChatId && (
   191|                  <p className="text-xs text-slate-600 flex-1 min-w-0">{t("telegramHint")}</p>
   192|                )}
   193|              </div>
   194|
   195|              {/* Status badge when linked */}
   196|              {prefs.telegramChatId && (
   197|                <div className="rounded-xl bg-green-400/5 border border-green-400/15 px-4 py-2.5 text-xs text-green-400/80">
   198|                  ✓ Telegram notifications active for this wallet
   199|                </div>
   200|              )}
   201|
   202|              {/* Per-event toggles — always shown so user can configure before linking */}
   203|              <div className="space-y-3">
   204|                <p className="text-xs text-slate-600 uppercase tracking-widest">Notify me when</p>
   205|                {ALL_EVENTS.map(ev => (
   206|                  <label key={ev} className="flex items-center justify-between gap-3 cursor-pointer group">
   207|                    <span className="text-sm text-slate-400 group-hover:text-slate-200 transition-colors">
   208|                      {t(`events.${ev}`)}
   209|                    </span>
   210|                    <ToggleSwitch
   211|                      checked={!!prefs.telegramEnabled[ev]}
   212|                      onChange={() => toggleEvent(ev)}
   213|                    />
   214|                  </label>
   215|                ))}
   216|              </div>
   217|            </section>
   218|
   219|            {/* Submit */}
   220|            <div className="pt-1">
   221|              <div className="h-px bg-gradient-to-r from-transparent via-cyan-400/20 to-transparent mb-4" />
   222|              <GlowButton type="submit" variant="primary" loading={submitting} className="w-full py-2.5">
   223|                {submitting ? t("saving") : t("save")}
   224|              </GlowButton>
   225|            </div>
   226|          </form>
   227|        )}
   228|        </div>
   229|      </div>
   230|    </div>,
   231|    document.body
   232|  );
   233|}
   234|
   235|function ToggleSwitch({ checked, onChange }: { checked: boolean; onChange: () => void }) {
   236|  return (
   237|    <button
   238|      type="button"
   239|      role="switch"
   240|      aria-checked={checked}
   241|      onClick={onChange}
   242|      className={cn(
   243|        "relative inline-flex h-5 w-9 shrink-0 rounded-full border-2 transition-colors duration-200 cursor-pointer",
   244|        "focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400",
   245|        checked ? "bg-cyan-400 border-cyan-400" : "bg-white/10 border-white/20"
   246|      )}
   247|    >
   248|      <span className={cn(
   249|        "pointer-events-none inline-block h-3.5 w-3.5 rounded-full bg-white shadow transition-transform duration-200 mt-px",
   250|        checked ? "translate-x-4" : "translate-x-0.5"
   251|      )} />
   252|    </button>
   253|  );
   254|}
   255|