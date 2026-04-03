"use client";

import { useState, useEffect, useRef, useId } from "react";
import { useAccount } from "wagmi";
import { useTranslations } from "next-intl";
import { useToast } from "@/components/toast";
import { GlowButton } from "@/components/ui/glow-button";
import { cn } from "@/lib/utils";

const CATEGORIES = [
  "featureRequest",
  "bugReport",
  "uxImprovement",
  "integrationIdea",
  "other",
] as const;

type Category = (typeof CATEGORIES)[number];

const TITLE_MAX       = 100;
const DESCRIPTION_MAX = 1000;

interface FeedbackModalProps {
  open: boolean;
  onClose: () => void;
}

export function FeedbackModal({ open, onClose }: FeedbackModalProps) {
  const t   = useTranslations("feedback");
  const uid = useId();
  const { address: wallet } = useAccount();
  const { addToast }        = useToast();
  const backdropRef         = useRef<HTMLDivElement>(null);
  const firstFocusRef       = useRef<HTMLSelectElement>(null);

  const [category,    setCategory]    = useState<Category>("featureRequest");
  const [title,       setTitle]       = useState("");
  const [description, setDescription] = useState("");
  const [submitting,  setSubmitting]  = useState(false);

  // Focus first field on open
  useEffect(() => {
    if (open) {
      setTimeout(() => firstFocusRef.current?.focus(), 50);
    }
  }, [open]);

  // Escape to close + focus trap
  useEffect(() => {
    if (!open) return;

    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") { onClose(); return; }

      if (e.key === "Tab") {
        const modal = backdropRef.current?.querySelector("[data-modal]");
        if (!modal) return;
        const focusable = Array.from(
          modal.querySelectorAll<HTMLElement>(
            'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
          )
        ).filter(el => !el.hasAttribute("disabled"));
        if (!focusable.length) return;
        const first = focusable[0];
        const last  = focusable[focusable.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    }

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open, onClose]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim() || !description.trim()) return;
    setSubmitting(true);

    try {
      const res = await fetch("/api/feedback", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          category,
          title:       title.trim(),
          description: description.trim(),
          wallet:      wallet ?? null,
          timestamp:   new Date().toISOString(),
        }),
      });
      if (!res.ok) throw new Error("Request failed");
      addToast({ type: "success", message: t("success") });
      setTitle("");
      setDescription("");
      setCategory("featureRequest");
      onClose();
    } catch {
      addToast({ type: "error", message: t("error") });
    } finally {
      setSubmitting(false);
    }
  }

  if (!open) return null;

  const inputClass = cn(
    "w-full rounded-xl bg-white/5 border border-white/10 px-4 py-2.5 text-sm text-white",
    "placeholder:text-slate-600 focus:outline-none focus:border-cyan-400/50 transition-colors"
  );
  const labelClass = "text-xs font-medium uppercase tracking-widest text-slate-500";

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
        className="w-full max-w-lg rounded-2xl border border-white/10 bg-[#0a0a0a]/95 shadow-2xl shadow-black/60 backdrop-blur-xl"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/8">
          <div className="flex items-center gap-2">
            <span className="text-lg">💡</span>
            <div>
              <h2
                id={`${uid}-title`}
                className="text-sm font-semibold uppercase tracking-widest text-slate-200"
              >
                {t("title")}
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">{t("subtitle")}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label="Close"
            className="text-slate-500 hover:text-white transition-colors text-xl leading-none ml-4 shrink-0"
          >
            ×
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Category */}
          <div className="space-y-1.5">
            <label htmlFor={`${uid}-category`} className={labelClass}>
              {t("categoryLabel")}
            </label>
            <select
              id={`${uid}-category`}
              ref={firstFocusRef}
              value={category}
              onChange={e => setCategory(e.target.value as Category)}
              className={inputClass}
            >
              {CATEGORIES.map(cat => (
                <option key={cat} value={cat} className="bg-[#0a0a0a]">
                  {t(`categories.${cat}`)}
                </option>
              ))}
            </select>
          </div>

          {/* Title */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label htmlFor={`${uid}-title`} className={labelClass}>
                {t("titleLabel")} <span className="text-red-400">*</span>
              </label>
              <span className={cn("text-xs", title.length > TITLE_MAX * 0.9 ? "text-orange-400" : "text-slate-600")}>
                {title.length}/{TITLE_MAX}
              </span>
            </div>
            <input
              id={`${uid}-title`}
              type="text"
              required
              maxLength={TITLE_MAX}
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder={t("titlePlaceholder")}
              className={inputClass}
            />
          </div>

          {/* Description */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label htmlFor={`${uid}-desc`} className={labelClass}>
                {t("descriptionLabel")} <span className="text-red-400">*</span>
              </label>
              <span className={cn("text-xs", description.length > DESCRIPTION_MAX * 0.9 ? "text-orange-400" : "text-slate-600")}>
                {description.length}/{DESCRIPTION_MAX}
              </span>
            </div>
            <textarea
              id={`${uid}-desc`}
              required
              rows={4}
              maxLength={DESCRIPTION_MAX}
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder={t("descriptionPlaceholder")}
              className={cn(inputClass, "resize-none")}
            />
          </div>

          {/* Wallet (read-only) */}
          <div className="space-y-1.5">
            <label className={labelClass}>{t("walletLabel")}</label>
            <div className="rounded-xl bg-white/3 border border-white/8 px-4 py-2.5 text-xs font-mono text-slate-500 truncate">
              {wallet ?? t("notConnected")}
            </div>
          </div>

          {/* Neon accent glow behind submit */}
          <div className="relative pt-1">
            <div className="absolute inset-x-0 -top-2 h-px bg-gradient-to-r from-transparent via-cyan-400/20 to-transparent" />
            <GlowButton
              type="submit"
              variant="primary"
              loading={submitting}
              disabled={!title.trim() || !description.trim()}
              className="w-full py-2.5"
            >
              {submitting ? t("sending") : t("send")}
            </GlowButton>
          </div>
        </form>
      </div>
    </div>
  );
}
