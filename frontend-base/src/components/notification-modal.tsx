     1|"use client";
     2|
     3|import { useState, useEffect, useRef, useId } from "react";
     4|import { createPortal } from "react-dom";
     5|import { useContext } from "react";
     6|import { useAccount, WagmiContext, useSignMessage } from "wagmi";
     7|import { useAppKit } from "@reown/appkit/react";
     8|import { useTranslations } from "next-intl";
     9|import { useToast } from "@/components/toast";
    10|import { GlowButton } from "@/components/ui/glow-button";
    11|import { cn } from "@/lib/utils";
    12|
    13|type EventKey =
    14|  | "escrow_created"
    15|  | "escrow_funded"
    16|  | "funds_released"
    17|  | "dispute_opened"
    18|  | "dispute_resolved"
    19|  | "milestone_completed";
    20|
    21|const ALL_EVENTS: EventKey[] = [
    22|  "escrow_created",
    23|  "escrow_funded",
    24|  "funds_released",
    25|  "dispute_opened",
    26|  "dispute_resolved",
    27|  "milestone_completed",
    28|];
    29|
    30|const TELEGRAM_BOT = process.env.NEXT_PUBLIC_TELEGRAM_BOT_USERNAME ?? "EscrowHubsBot";
    31|
    32|interface NotificationPrefs {
    33|  telegramChatId:  string | null;
    34|  telegramEnabled: Record<EventKey, boolean>;
    35|}
    36|
    37|function defaultPrefs(): NotificationPrefs {
    38|  const enabled = Object.fromEntries(ALL_EVENTS.map(e => [e, true])) as Record<EventKey, boolean>;
    39|  return { telegramChatId: null, telegramEnabled: enabled };
    40|}
    41|
    42|interface NotificationModalProps {
    43|  open:    boolean;
    44|  onClose: () => void;
    45|}
    46|
    47|function NotificationModalInner({ open, onClose }: NotificationModalProps) {
    48|  const t          = useTranslations("notifications");
    49|  const uid        = useId();
    50|  const { address: wallet } = useAccount();
  const { signMessageAsync } = useSignMessage();
    51|  const { open: openConnectModal } = useAppKit();
    52|  const { addToast }        = useToast();
    53|  const backdropRef         = useRef<HTMLDivElement>(null);
    54|
    55|  const [prefs,      setPrefs]      = useState<NotificationPrefs>(defaultPrefs());
    56|  const [submitting, setSubmitting] = useState(false);
    57|
    58|  // Load saved prefs
    59|  useEffect(() => {
    60|    if (!open || !wallet) return;
    61|    fetch(`/api/notifications/preferences?wallet=${wallet}`)
    62|      .then(r => r.json())
    63|      .then(data => {
    64|        if (data) {
    65|          setPrefs({
    66|            telegramChatId:  data.telegramChatId ?? null,
    67|            telegramEnabled: { ...defaultPrefs().telegramEnabled, ...(data.telegramEnabled ?? {}) },
    68|          });
    69|        }
    70|      })
    71|      .catch(() => {});
    72|  }, [open, wallet]);
    73|
    74|  // Escape + focus trap
    75|  useEffect(() => {
    76|    if (!open) return;
    77|    function onKey(e: KeyboardEvent) {
    78|      if (e.key === "Escape") { onClose(); return; }
    79|      if (e.key === "Tab") {
    80|        const modal = backdropRef.current?.querySelector("[data-modal]");
    81|        if (!modal) return;
    82|        const els = Array.from(modal.querySelectorAll<HTMLElement>(
    83|          'button:not([disabled]), input:not([disabled]), a, [tabindex]:not([tabindex="-1"])'
    84|        ));
    85|        if (!els.length) return;
    86|        if (e.shiftKey && document.activeElement === els[0]) { e.preventDefault(); els[els.length - 1].focus(); }
    87|        else if (!e.shiftKey && document.activeElement === els[els.length - 1]) { e.preventDefault(); els[0].focus(); }
    88|      }
    89|    }
    90|    window.addEventListener("keydown", onKey);
    91|    return () => window.removeEventListener("keydown", onKey);
    92|  }, [open, onClose]);
    93|
    94|  function toggleEvent(ev: EventKey) {
    95|    setPrefs(p => ({ ...p, telegramEnabled: { ...p.telegramEnabled, [ev]: !p.telegramEnabled[ev] } }));
    96|  }
    97|
    98|  async function handleSave(e: React.FormEvent) {
    99|    e.preventDefault();
   100|    if (!wallet) return;
   101|    setSubmitting(true);
   102|    try {
   103|      const res = await fetch("/api/notifications/preferences", {
   104|        method:  "POST",
   105|        headers: { "Content-Type": "application/json" },
   106|        body: JSON.stringify({
   107|          wallet,
   108|          telegramChatId:  prefs.telegramChatId,
   109|          telegramEnabled: prefs.telegramEnabled,
   110|        }),
   111|      });
   112|      if (!res.ok) throw new Error();
   113|      addToast({ type: "success", message: t("saved") });
   114|      onClose();
   115|    } catch {
   116|      addToast({ type: "error", message: t("error") });
   117|    } finally {
   118|      setSubmitting(false);
   119|    }
   120|  }
   121|
   122|  if (!open) return null;
   123|
   124|  return createPortal(
   125|    <div
   126|      ref={backdropRef}
   127|      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
   128|      onClick={e => { if (e.target === backdropRef.current) onClose(); }}
   129|      role="dialog"
   130|      aria-modal="true"
   131|      aria-labelledby={`${uid}-title`}
   132|    >
   133|      <div
   134|        data-modal
   135|        className="w-full max-w-md rounded-2xl border border-white/10 bg-[#0a0a0a]/95 shadow-2xl backdrop-blur-xl max-h-[90vh] flex flex-col overflow-hidden"
   136|      >
   137|        {/* Header — fixed, never collapses */}
   138|        <div className="flex items-center justify-between px-6 py-4 border-b border-white/8 shrink-0">
   139|          <div className="flex items-center gap-2">
   140|            <span className="text-lg">🔔</span>
   141|            <div>
   142|              <h2 id={`${uid}-title`} className="text-sm font-semibold uppercase tracking-widest text-slate-200">
   143|                {t("title")}
   144|              </h2>
   145|              <p className="text-xs text-slate-500 mt-0.5">{t("subtitle")}</p>
   146|            </div>
   147|          </div>
   148|          <button onClick={onClose} aria-label="Close" className="text-slate-500 hover:text-white transition-colors text-xl leading-none ml-4">×</button>
   149|        </div>
   150|
   151|        <div className="overflow-y-auto flex-1 min-h-0">
   152|        {!wallet ? (
   153|          <div className="px-6 py-10 flex flex-col items-center gap-4 text-center">
   154|            <p className="text-sm text-slate-500">Connect your wallet to manage notifications.</p>
   155|            <GlowButton
   156|              variant="primary"
   157|              onClick={() => { onClose(); openConnectModal(); }}
   158|              className="px-6 py-2.5 text-sm"
   159|            >
   160|              Connect Wallet
   161|            </GlowButton>
   162|          </div>
   163|        ) : (
   164|          <form onSubmit={handleSave} className="p-6 space-y-6">
   165|
   166|            {/* ── Telegram Section ──────────────────────────────── */}
   167|            <section className="space-y-4">
   168|              <h3 className="text-xs font-semibold uppercase tracking-widest text-cyan-400/70 flex items-center gap-2">
   169|                <span>✈️</span> {t("telegramSection")}
   170|              </h3>
   171|
   172|              {/* Link button + status */}
   173|              <div className="flex items-center gap-3 flex-wrap">
   174|                <a
   175|                  href={`https://t.me/${TELEGRAM_BOT}?start=${wallet}`}
   176|                  target="_blank"
   177|                  rel="noopener noreferrer"
   178|                  className={cn(
   179|                    "inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all",
   180|                    prefs.telegramChatId
   181|                      ? "bg-green-400/10 text-green-400 border border-green-400/30"
   182|                      : "bg-cyan-400/10 text-cyan-400 border border-cyan-400/30 hover:bg-cyan-400/20 hover:border-cyan-400/60"
   183|                  )}
   184|                >
   185|                  {prefs.telegramChatId ? (
   186|                    <><span>✓</span> {t("telegramLinked")}</>
   187|                  ) : (
   188|                    <><span>✈️</span> {t("telegramLink")}</>
   189|                  )}
   190|                </a>
   191|                {!prefs.telegramChatId && (
   192|                  <p className="text-xs text-slate-600 flex-1 min-w-0">{t("telegramHint")}</p>
   193|                )}
   194|              </div>
   195|
   196|              {/* Status badge when linked */}
   197|              {prefs.telegramChatId && (
   198|                <div className="rounded-xl bg-green-400/5 border border-green-400/15 px-4 py-2.5 text-xs text-green-400/80">
   199|                  ✓ Telegram notifications active for this wallet
   200|                </div>
   201|              )}
   202|
   203|              {/* Per-event toggles — always shown so user can configure before linking */}
   204|              <div className="space-y-3">
   205|                <p className="text-xs text-slate-600 uppercase tracking-widest">Notify me when</p>
   206|                {ALL_EVENTS.map(ev => (
   207|                  <label key={ev} className="flex items-center justify-between gap-3 cursor-pointer group">
   208|                    <span className="text-sm text-slate-400 group-hover:text-slate-200 transition-colors">
   209|                      {t(`events.${ev}`)}
   210|                    </span>
   211|                    <ToggleSwitch
   212|                      checked={!!prefs.telegramEnabled[ev]}
   213|                      onChange={() => toggleEvent(ev)}
   214|                    />
   215|                  </label>
   216|                ))}
   217|              </div>
   218|            </section>
   219|
   220|            {/* Submit */}
   221|            <div className="pt-1">
   222|              <div className="h-px bg-gradient-to-r from-transparent via-cyan-400/20 to-transparent mb-4" />
   223|              <GlowButton type="submit" variant="primary" loading={submitting} className="w-full py-2.5">
   224|                {submitting ? t("saving") : t("save")}
   225|              </GlowButton>
   226|            </div>
   227|          </form>
   228|        )}
   229|        </div>
   230|      </div>
   231|    </div>,
   232|    document.body
   233|  );
   234|}
   235|
   236|function ToggleSwitch({ checked, onChange }: { checked: boolean; onChange: () => void }) {
   237|  return (
   238|    <button
   239|      type="button"
   240|      role="switch"
   241|      aria-checked={checked}
   242|      onClick={onChange}
   243|      className={cn(
   244|        "relative inline-flex h-5 w-9 shrink-0 rounded-full border-2 transition-colors duration-200 cursor-pointer",
   245|        "focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400",
   246|        checked ? "bg-cyan-400 border-cyan-400" : "bg-white/10 border-white/20"
   247|      )}
   248|    >
   249|      <span className={cn(
   250|        "pointer-events-none inline-block h-3.5 w-3.5 rounded-full bg-white shadow transition-transform duration-200 mt-px",
   251|        checked ? "translate-x-4" : "translate-x-0.5"
   252|      )} />
   253|    </button>
   254|  );
   255|}
   256|
   257|// Safe wrapper — returns null if no WagmiProvider in tree (e.g. landing page, marketplace)
   258|export function NotificationModal({ open, onClose }: NotificationModalProps) {
   259|  const wagmiCtx = useContext(WagmiContext);
   260|  if (!wagmiCtx) return null;
   261|  return <NotificationModalInner open={open} onClose={onClose} />;
   262|}
   263|