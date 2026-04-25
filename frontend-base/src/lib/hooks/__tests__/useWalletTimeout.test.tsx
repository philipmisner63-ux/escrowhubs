import React from "react";
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";

import { useWalletTimeout } from "../useWalletTimeout";

const TIMEOUT_MS = 30 * 60 * 1_000;

interface HookProps {
  isConnected: boolean;
  disconnect: () => void;
  addToast?: (opts: { type: "success" | "error" | "info" | "pending"; message: string }) => void;
}

function renderUseWalletTimeout(initialProps: HookProps) {
  const container = document.createElement("div");
  const root: Root = createRoot(container);
  let props = initialProps;

  function TestComponent() {
    useWalletTimeout(props);
    return null;
  }

  const render = () => {
    act(() => {
      root.render(<TestComponent />);
    });
  };

  render();

  return {
    rerender: (nextProps: HookProps) => {
      props = nextProps;
      render();
    },
    unmount: () => {
      act(() => {
        root.unmount();
      });
    },
  };
}

describe("useWalletTimeout", () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.runOnlyPendingTimers();
    jest.useRealTimers();
    jest.clearAllMocks();
  });

  it("disconnects and shows a toast after the inactivity timeout", () => {
    const disconnect = jest.fn();
    const addToast = jest.fn();
    const hook = renderUseWalletTimeout({ isConnected: true, disconnect, addToast });

    act(() => {
      jest.advanceTimersByTime(TIMEOUT_MS);
    });

    expect(disconnect).toHaveBeenCalledTimes(1);
    expect(addToast).toHaveBeenCalledWith({
      type: "error",
      message: "Wallet disconnected due to inactivity.",
    });

    hook.unmount();
  });

  it("does not start a timeout when the wallet is disconnected", () => {
    const disconnect = jest.fn();
    const hook = renderUseWalletTimeout({ isConnected: false, disconnect });

    act(() => {
      jest.advanceTimersByTime(TIMEOUT_MS);
    });

    expect(disconnect).not.toHaveBeenCalled();

    hook.unmount();
  });

  it("resets the timeout when activity events fire", () => {
    const disconnect = jest.fn();
    const hook = renderUseWalletTimeout({ isConnected: true, disconnect });

    act(() => {
      jest.advanceTimersByTime(TIMEOUT_MS - 1_000);
      window.dispatchEvent(new Event("click"));
      jest.advanceTimersByTime(999);
    });

    expect(disconnect).not.toHaveBeenCalled();

    act(() => {
      jest.advanceTimersByTime(1);
    });

    expect(disconnect).toHaveBeenCalledTimes(1);

    hook.unmount();
  });

  it("clears the active timeout when the wallet disconnects externally", () => {
    const disconnect = jest.fn();
    const hook = renderUseWalletTimeout({ isConnected: true, disconnect });

    hook.rerender({ isConnected: false, disconnect });

    act(() => {
      jest.advanceTimersByTime(TIMEOUT_MS);
    });

    expect(disconnect).not.toHaveBeenCalled();

    hook.unmount();
  });
});
