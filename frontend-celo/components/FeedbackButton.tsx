"use client";
import { useState } from "react";
import { useAccount } from "wagmi";
import { usePathname } from "next/navigation";
import { useMiniPay } from "@/hooks/useMiniPay";

type TabType = "support" | "feature" | "rating";
type SubmitState = "idle" | "submitting" | "success";

export function FeedbackButton() {
  const [open, setOpen] = useState(false);
  const [tab, setTab] = useState<TabType>("support");
  const [message, setMessage] = useState("");
  const [rating, setRating] = useState(0);
  const [state, setState] = useState<SubmitState>("idle");

  const { address } = useAccount();
  const pathname = usePathname();
  const { isMiniPay } = useMiniPay();

  function reset() {
    setMessage("");
    setRating(0);
    setState("idle");
    setTab("support");
  }

  function close() {
    setOpen(false);
    setTimeout(reset, 300);
  }

  function switchTab(t: TabType) {
    setTab(t);
    setMessage("");
    setRating(0);
    setState("idle");
  }

  async function submit() {
    if (state !== "idle") return;
    if (tab === "rating" && rating === 0) return;
    setState("submitting");
    try {
      await fetch("/api/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: tab,
          message,
          rating: tab === "rating" ? rating : undefined,
          wallet: address,
          route: pathname,
          isMiniPay,
        }),
      });
    } catch {
      // silently succeed
    }
    setState("success");
    setTimeout(close, 2000);
  }

  const inputClass =
    "bg-white/10 border border-white/20 text-white placeholder:text-white/40 rounded-xl px-4 py-3 w-full focus:outline-none focus:border-[#35D07F] resize-none";

  const tabs: { key: TabType; label: string }[] = [
    { key: "support", label: "🛟 Support" },
    { key: "feature", label: "💡 Suggest" },
    { key: "rating", label: "⭐ Rate" },
  ];

  function openTab(t: TabType) {
    setTab(t);
    setMessage("");
    setRating(0);
    setState("idle");
    setOpen(true);
  }

  return (
    <>
      {/* Fixed bottom bar */}
      <div className="fixed bottom-0 left-0 right-0 z-40 bg-[#0F1F2E]/95 backdrop-blur-sm border-t border-white/10 flex items-center justify-around px-4 py-3 pb-4">
        <button
          onClick={() => openTab("support")}
          className="flex flex-col items-center gap-0.5 tap-compress flex-1 py-1"
          aria-label="Support"
        >
          <span className="text-xl">🛟</span>
          <span className="text-white/50 text-xs">Support</span>
        </button>
        <button
          onClick={() => openTab("feature")}
          className="flex flex-col items-center gap-0.5 tap-compress flex-1 py-1"
          aria-label="Feedback"
        >
          <span className="text-xl">💬</span>
          <span className="text-white/50 text-xs">Feedback</span>
        </button>
        <button
          onClick={() => openTab("rating")}
          className="flex flex-col items-center gap-0.5 tap-compress flex-1 py-1"
          aria-label="Rate"
        >
          <span className="text-xl">⭐</span>
          <span className="text-white/50 text-xs">Rate</span>
        </button>
      </div>

      {/* Modal overlay */}
      {open && (
        <div className="fixed inset-0 z-50 flex items-end justify-center">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/60"
            onClick={close}
          />

          {/* Sheet */}
          <div className="relative w-full max-w-md glass-card rounded-t-3xl p-6 pb-8">
            {/* Header */}
            <div className="flex items-center justify-between mb-1">
              <h2 className="text-white font-bold text-lg">How can we help?</h2>
              <button
                onClick={close}
                className="text-white/60 hover:text-white text-xl leading-none tap-compress"
                aria-label="Close"
              >
                ✕
              </button>
            </div>
            {!isMiniPay && (
              <p className="text-white/50 text-xs mb-4">
                Feedback helps us improve before launch.
              </p>
            )}

            {state === "success" ? (
              <div className="flex flex-col items-center justify-center py-10 gap-3">
                <span className="text-4xl">✅</span>
                <p className="text-white font-medium text-base text-center">
                  Thanks — we read every message.
                </p>
              </div>
            ) : (
              <>
                {/* Tab pills */}
                <div className="flex gap-2 mt-3 mb-5">
                  {tabs.map(({ key, label }) => (
                    <button
                      key={key}
                      onClick={() => switchTab(key)}
                      className={
                        tab === key
                          ? "bg-[#35D07F]/20 border border-[#35D07F]/40 text-[#35D07F] rounded-full px-4 py-1.5 text-sm font-medium"
                          : "bg-white/5 border border-white/10 text-white/60 rounded-full px-4 py-1.5 text-sm"
                      }
                    >
                      {label}
                    </button>
                  ))}
                </div>

                {/* Support tab */}
                {tab === "support" && (
                  <div className="flex flex-col gap-4">
                    <div>
                      <label className="text-white/70 text-sm mb-1.5 block">
                        What went wrong?
                      </label>
                      <textarea
                        rows={3}
                        className={inputClass}
                        placeholder="Describe the issue..."
                        value={message}
                        onChange={(e) => setMessage(e.target.value)}
                      />
                    </div>
                    <SubmitBtn
                      label="Send Report"
                      loading={state === "submitting"}
                      disabled={!message.trim()}
                      onClick={submit}
                    />
                  </div>
                )}

                {/* Suggest tab */}
                {tab === "feature" && (
                  <div className="flex flex-col gap-4">
                    <div>
                      <label className="text-white/70 text-sm mb-1.5 block">
                        What would make this better?
                      </label>
                      <textarea
                        rows={3}
                        className={inputClass}
                        placeholder="I wish the app could..."
                        value={message}
                        onChange={(e) => setMessage(e.target.value)}
                      />
                    </div>
                    <SubmitBtn
                      label="Send Idea"
                      loading={state === "submitting"}
                      disabled={!message.trim()}
                      onClick={submit}
                    />
                  </div>
                )}

                {/* Rate tab */}
                {tab === "rating" && (
                  <div className="flex flex-col gap-4">
                    <div>
                      <label className="text-white/70 text-sm mb-1.5 block">
                        How was your experience?
                      </label>
                      <div className="flex gap-2 mb-3">
                        {[1, 2, 3, 4, 5].map((n) => (
                          <button
                            key={n}
                            onClick={() => setRating(n)}
                            className="text-3xl tap-compress cursor-pointer leading-none"
                            aria-label={`${n} star`}
                          >
                            {n <= rating ? "⭐" : "☆"}
                          </button>
                        ))}
                      </div>
                      <textarea
                        rows={2}
                        className={inputClass}
                        placeholder="Tell us more..."
                        value={message}
                        onChange={(e) => setMessage(e.target.value)}
                      />
                    </div>
                    <SubmitBtn
                      label="Submit Rating"
                      loading={state === "submitting"}
                      disabled={rating === 0}
                      onClick={submit}
                    />
                  </div>
                )}
              </>
            )}

            {/* Footer */}
            <p className="text-white/40 text-xs text-center mt-4">
              Find us on X: @escrowhubs94501
            </p>
          </div>
        </div>
      )}
    </>
  );
}

function SubmitBtn({
  label,
  loading,
  disabled,
  onClick,
}: {
  label: string;
  loading: boolean;
  disabled: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled || loading}
      className="w-full py-3 rounded-xl font-semibold text-white bg-gradient-to-br from-[#35D07F] to-[#0EA56F] tap-compress disabled:opacity-40 disabled:cursor-not-allowed"
    >
      {loading ? "Sending…" : label}
    </button>
  );
}
