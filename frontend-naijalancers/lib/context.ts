export type AppContext = "minipay" | "browser";

let _resolvedContext: AppContext | null = null;
let _detecting: Promise<AppContext> | null = null;

export async function detectContext(): Promise<AppContext> {
  if (_resolvedContext) return _resolvedContext;
  if (_detecting) return _detecting;
  _detecting = _doDetect();
  const result = await _detecting;
  _detecting = null;
  return result;
}

async function _doDetect(): Promise<AppContext> {
  if (typeof window === "undefined") return "browser";

  const ethereum = await new Promise<unknown>((resolve) => {
    if ((window as unknown as { ethereum?: unknown }).ethereum)
      return resolve((window as unknown as { ethereum?: unknown }).ethereum);
    let elapsed = 0;
    const interval = setInterval(() => {
      elapsed += 100;
      if ((window as unknown as { ethereum?: unknown }).ethereum) {
        clearInterval(interval);
        resolve((window as unknown as { ethereum?: unknown }).ethereum);
      } else if (elapsed >= 2000) {
        clearInterval(interval);
        resolve(null);
      }
    }, 100);
  });

  if (
    ethereum !== null &&
    typeof ethereum === "object" &&
    (ethereum as Record<string, unknown>).isMiniPay === true
  ) {
    _resolvedContext = "minipay";
    return "minipay";
  }

  _resolvedContext = "browser";
  return "browser";
}

export function getContext(): AppContext {
  return _resolvedContext ?? "browser";
}
