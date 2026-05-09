"use client";
// Initializes AppKit (WalletConnect/Reown) for non-MiniPay browser context.
// Imported lazily via next/dynamic so it is never loaded in MiniPay.
import "@/lib/appkit";
export default function AppKitInit() {
  return null;
}
