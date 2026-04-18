import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

/** Browser / client-side client (anon key) */
export const supabaseBrowser = createClient(supabaseUrl, supabaseAnonKey);

/** Server-side client with service role — only use in API routes */
export function createServerClient() {
  return createClient(supabaseUrl, supabaseServiceRoleKey);
}

export type MarketplaceEscrow = {
  id: string;
  escrow_id: string;
  seller_email: string | null;
  seller_phone: string | null;
  seller_wallet: string | null;
  buyer_email: string | null;
  buyer_phone: string | null;
  buyer_wallet: string | null;
  amount_fiat: number;
  amount_usdc: number;
  currency: string;
  description: string | null;
  protocol_fee_usdc: number;
  arbitration_enabled: boolean;
  chain_id: number;
  contract_address: string | null;
  on_chain_escrow_id: string | null;
  status: "PENDING_PAYMENT" | "FUNDED" | "RELEASED" | "DISPUTED" | "REFUNDED" | "CANCELLED";
  created_at: string;
  funded_at: string | null;
  released_at: string | null;
  updated_at: string;
};
