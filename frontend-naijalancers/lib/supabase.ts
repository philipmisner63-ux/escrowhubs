import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "";

export const supabaseBrowser = createClient(
  supabaseUrl || "https://placeholder.supabase.co",
  supabaseAnonKey || "placeholder"
);

// Alias for backward compat with existing routes
type SupabaseClient = ReturnType<typeof createClient>;
export function createServerClient(): SupabaseClient {
  const url = process.env.SUPABASE_SERVICE_ROLE_KEY ? supabaseUrl : "https://placeholder.supabase.co";
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || "placeholder";
  return createClient(url, key);
}

// Also export for new code
export const supabaseServer = createServerClient;

// Placeholder MarketplaceEscrow type (used in existing routes)
export interface MarketplaceEscrow {
  escrow_id: string;
  seller_wallet: string;
  buyer_wallet?: string | null;
  buyer_contact?: string | null;
  amount_fiat?: number;
  amount_cusd?: number;
  amount_usdt?: number;
  currency?: string;
  description?: string;
  status?: string;
  contract_address?: string | null;
  on_chain_escrow_id?: string | null;
  chain_id?: number;
  created_at?: string;
  buyer_notified?: boolean;
}
