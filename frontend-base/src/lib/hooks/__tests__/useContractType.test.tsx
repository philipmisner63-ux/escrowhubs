import React from "react";
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { useChainId, useReadContract } from "wagmi";

import { MILESTONE_ESCROW_ABI } from "@/lib/contracts";

import { useContractType } from "../useContractType";

jest.mock("wagmi", () => ({
  useChainId: jest.fn(),
  useReadContract: jest.fn(),
}));

jest.mock("@/lib/contracts", () => ({
  MILESTONE_ESCROW_ABI: [{ type: "function", name: "milestoneCount" }],
}));

type Address = `0x${string}`;

const ESCROW_ADDRESS = "0x1111111111111111111111111111111111111111" as Address;

const mockUseChainId = useChainId as jest.MockedFunction<typeof useChainId>;
const mockUseReadContract = useReadContract as jest.MockedFunction<typeof useReadContract>;

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

describe("useContractType", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUseChainId.mockReturnValue(8453);
    mockUseReadContract.mockReturnValue({ data: undefined, isLoading: false, isError: false } as ReturnType<typeof useReadContract>);
  });

  it("returns unknown and disables the contract read when no address is provided", () => {
    const { result, unmount } = renderHook(() => useContractType(undefined));

    expect(result.current).toBe("unknown");
    expect(mockUseReadContract).toHaveBeenCalledWith({
      address: undefined,
      abi: MILESTONE_ESCROW_ABI,
      functionName: "milestoneCount",
      chainId: 8453,
      query: { enabled: false, retry: false },
    });

    unmount();
  });

  it("returns unknown while the milestone count read is loading", () => {
    mockUseReadContract.mockReturnValue({ data: undefined, isLoading: true, isError: false } as ReturnType<typeof useReadContract>);

    const { result, unmount } = renderHook(() => useContractType(ESCROW_ADDRESS));

    expect(result.current).toBe("unknown");

    unmount();
  });

  it("returns simple when the milestone count read errors", () => {
    mockUseReadContract.mockReturnValue({ data: undefined, isLoading: false, isError: true } as ReturnType<typeof useReadContract>);

    const { result, unmount } = renderHook(() => useContractType(ESCROW_ADDRESS));

    expect(result.current).toBe("simple");

    unmount();
  });

  it("returns milestone when milestone count data is available", () => {
    mockUseReadContract.mockReturnValue({ data: 2n, isLoading: false, isError: false } as ReturnType<typeof useReadContract>);

    const { result, unmount } = renderHook(() => useContractType(ESCROW_ADDRESS, 42220));

    expect(result.current).toBe("milestone");
    expect(mockUseReadContract).toHaveBeenCalledWith({
      address: ESCROW_ADDRESS,
      abi: MILESTONE_ESCROW_ABI,
      functionName: "milestoneCount",
      chainId: 42220,
      query: { enabled: true, retry: false },
    });

    unmount();
  });
});
