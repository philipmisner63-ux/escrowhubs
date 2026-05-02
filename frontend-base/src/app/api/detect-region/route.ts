import { NextResponse } from "next/server";

/**
 * MoonPay covers 150+ countries natively including all former Stripe countries
 * plus most of the world. No routing logic needed — always use MoonPay.
 */
export async function GET() {
  return NextResponse.json({ onramp: "moonpay" });
}
