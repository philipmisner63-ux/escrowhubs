"use client";

interface Props {
  error: string;
  onRetry: () => void;
  loading?: boolean;
}

export function NaijaLancersErrorCard({ error, onRetry, loading }: Props) {
  if (!error) return null;

  return (
    <div className="bg-[#FF5B5B]/10 border border-[#FF5B5B]/30 rounded-2xl p-5 mb-4 text-center">
      <div className="text-3xl mb-2">⚠️</div>
      <p className="text-sm font-medium text-white mb-1">
        NaijaLancers Connection Issue
      </p>
      <p className="text-xs text-white/60 mb-3">{error}</p>
      <button
        onClick={onRetry}
        disabled={loading}
        className="bg-[#4A9EFF]/20 border border-[#4A9EFF]/40 text-[#4A9EFF] rounded-xl px-4 py-2 text-sm font-semibold disabled:opacity-50 flex items-center justify-center gap-2 mx-auto"
      >
        {loading ? (
          <>
            <span className="w-3 h-3 border-2 border-[#4A9EFF] border-t-transparent rounded-full animate-spin inline-block" />
            Retrying…
          </>
        ) : (
          "Retry Connection"
        )}
      </button>
    </div>
  );
}
