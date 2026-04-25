import React from "react";
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { useChainId } from "wagmi";

import { getContractAddresses } from "@/lib/contracts/addresses";
import { getChainName, getExplorerTxUrl, getRpcUrl, isChainSupported } from "@/lib/chains";
import { GAS_LIMITS } from "@/lib/gasConfig";

import { useChainConfig } from "../useChainConfig";

jest.mock("wagmi", () => ({
  useChainId: jest.fn(),
}));

jest.mock("@/lib/contracts/addresses", () => ({
  getContractAddresses: jest.fn(),
}));

jest.mock("@/lib/chains", () => ({
  getChainName: jest.fn(),
  getExplorerTxUrl: jest.fn(),
  getRpcUrl: jest.fn(),
  isChainSupported: jest.fn(),
}));

const mockUseChainId = useChainId as jest.MockedFunction<typeof useChainId>;
const mockGetContractAddresses = getContractAddresses as jest.MockedFunction<typeof getContractAddresses>;
const mockGetChainName = getChainName as jest.MockedFunction<typeof getChainName>;
const mockGetExplorerTxUrl = getExplorerTxUrl as jest.MockedFunction<typeof getExplorerTxUrl>;
const mockGetRpcUrl = getRpcUrl as jest.MockedFunction<typeof getRpcUrl>;
const mockIsChainSupported = isChainSupported as jest.MockedFunction<typeof isChainSupported>;

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

describe("useChainConfig", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUseChainId.mockReturnValue(8453);
    mockGetContractAddresses.mockReturnValue({
      factory: "0x1111111111111111111111111111111111111111",
      arbiter: "0x2222222222222222222222222222222222222222",
      trustOracle: "0x3333333333333333333333333333333333333333",
    });
    mockGetChainName.mockImplementation(chainId => `Chain ${chainId}`);
    mockGetRpcUrl.mockImplementation(chainId => `https://rpc.example/${chainId}`);
    mockGetExplorerTxUrl.mockImplementation((chainId, txHash) => `https://explorer.example/${chainId}/tx/${txHash}`);
    mockIsChainSupported.mockImplementation(chainId => chainId === 8453);
  });

  it("returns config for the connected wallet chain", () => {
    const { result, unmount } = renderHook(() => useChainConfig());

    expect(result.current).toEqual({
      chainId: 8453,
      chainName: "Chain 8453",
      contracts: {
        factory: "0x1111111111111111111111111111111111111111",
        arbiter: "0x2222222222222222222222222222222222222222",
        trustOracle: "0x3333333333333333333333333333333333333333",
      },
      rpcUrl: "https://rpc.example/8453",
      getExplorerTxUrl: expect.any(Function),
      gasLimits: GAS_LIMITS,
      isSupported: true,
    });
    expect(mockGetContractAddresses).toHaveBeenCalledWith(8453);
    expect(result.current.getExplorerTxUrl("0xabc")).toBe("https://explorer.example/8453/tx/0xabc");

    unmount();
  });

  it("uses the override chain ID when provided", () => {
    const { result, unmount } = renderHook(() => useChainConfig(42220));

    expect(result.current.chainId).toBe(42220);
    expect(result.current.chainName).toBe("Chain 42220");
    expect(result.current.rpcUrl).toBe("https://rpc.example/42220");
    expect(result.current.isSupported).toBe(false);
    expect(mockGetContractAddresses).toHaveBeenCalledWith(42220);
    expect(result.current.getExplorerTxUrl("0xdef")).toBe("https://explorer.example/42220/tx/0xdef");

    unmount();
  });
});
