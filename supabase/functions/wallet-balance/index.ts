import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const DEFAULT_WALLET = "HwaGGGWfVKVTkqwjAiCUhubVBiJ6ip7QLP7f5VquzC7L";
const SOLANA_RPC = "https://api.mainnet-beta.solana.com";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    let walletAddress = DEFAULT_WALLET;
    try {
      const body = await req.json();
      if (body?.walletAddress) walletAddress = body.walletAddress;
    } catch {}

    const balanceRes = await fetch(SOLANA_RPC, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        jsonrpc: "2.0",
        id: 1,
        method: "getBalance",
        params: [walletAddress],
      }),
    });
    const balanceData = await balanceRes.json();
    const solBalance = (balanceData.result?.value ?? 0) / 1e9;

    // Get SOL price
    const priceRes = await fetch(
      "https://api.coingecko.com/api/v3/simple/price?ids=solana&vs_currencies=usd"
    );
    const priceData = await priceRes.json();
    const solPrice = priceData.solana?.usd ?? 0;

    return new Response(
      JSON.stringify({ solBalance, solPrice, usdBalance: solBalance * solPrice }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
