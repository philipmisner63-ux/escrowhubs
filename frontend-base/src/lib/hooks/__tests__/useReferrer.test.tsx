import React from "react";
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { useSearchParams } from "next/navigation";
import { isAddress } from "viem";

import { useReferrer } from "../useReferrer";

jest.mock("next/navigation", () => ({
  useSearchParams: jest.fn(),
}));

jest.mock("viem", () => ({
  isAddress: jest.fn(),
}));

const mockUseSearchParams = useSearchParams as jest.MockedFunction<typeof useSearchParams>;
const mockIsAddress = isAddress as jest.MockedFunction<typeof isAddress>;

const ZERO_ADDRESS = "0x0000000000000000000000000000000000000000";
const REFERRER = "0x1111111111111111111111111111111111111111";
const STORED_REFERRER = "0x2222222222222222222222222222222222222222";

function renderHook<T>(callback: () => T) {
  const container = document.createElement("div");
  const root: Root = createRoot(container);
  const result = { current: undefined as T };

  function TestComponent() {
    result.current = callback();
    return null;
  }

  act(() => {
    root.render(<TestComponent />);
  });

  return {
    result,
    unmount: () => {
      act(() => {
        root.unmount();
      });
    },
  };
}

function mockRefParam(ref: string | null) {
  mockUseSearchParams.mockReturnValue({
    get: jest.fn((key: string) => (key === "ref" ? ref : null)),
  } as unknown as ReturnType<typeof useSearchParams>);
}

describe("useReferrer", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    localStorage.clear();
    jest.spyOn(Date, "now").mockReturnValue(1_700_000_000_000);
    mockIsAddress.mockImplementation((address: string): address is `0x${string}` => address.startsWith("0x") && address.length === 42);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("stores and returns a valid URL referrer", () => {
    mockRefParam(REFERRER);

    const { result, unmount } = renderHook(() => useReferrer());

    expect(result.current).toBe(REFERRER);
    expect(localStorage.getItem("escrowhubs_referrer")).toBe(REFERRER);
    expect(localStorage.getItem("escrowhubs_referrer_expiry")).toBe(String(1_700_000_000_000 + 30 * 86_400_000));

    unmount();
  });

  it("returns a valid stored referrer before expiry when no URL referrer is present", () => {
    mockRefParam(null);
    localStorage.setItem("escrowhubs_referrer", STORED_REFERRER);
    localStorage.setItem("escrowhubs_referrer_expiry", String(1_700_000_000_001));

    const { result, unmount } = renderHook(() => useReferrer());

    expect(result.current).toBe(STORED_REFERRER);
    expect(localStorage.getItem("escrowhubs_referrer")).toBe(STORED_REFERRER);

    unmount();
  });

  it("clears expired stored referrers and returns the zero address", () => {
    mockRefParam(null);
    localStorage.setItem("escrowhubs_referrer", STORED_REFERRER);
    localStorage.setItem("escrowhubs_referrer_expiry", String(1_699_999_999_999));

    const { result, unmount } = renderHook(() => useReferrer());

    expect(result.current).toBe(ZERO_ADDRESS);
    expect(localStorage.getItem("escrowhubs_referrer")).toBeNull();
    expect(localStorage.getItem("escrowhubs_referrer_expiry")).toBeNull();

    unmount();
  });

  it("ignores invalid URL referrers", () => {
    mockRefParam("not-an-address");
    localStorage.setItem("escrowhubs_referrer", STORED_REFERRER);
    localStorage.setItem("escrowhubs_referrer_expiry", String(1_700_000_000_001));
    mockIsAddress.mockImplementation((address: string): address is `0x${string}` => address === STORED_REFERRER);

    const { result, unmount } = renderHook(() => useReferrer());

    expect(result.current).toBe(STORED_REFERRER);
    expect(localStorage.getItem("escrowhubs_referrer")).toBe(STORED_REFERRER);

    unmount();
  });
});
