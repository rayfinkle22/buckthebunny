import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const TOKEN_MINT = "2ay5sdVY24SjdzjVdtXQfCkxGsjaTn8VnBU8b9FT5acV";
const SOLANA_RPC = "https://api.mainnet-beta.solana.com";

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { walletAddress } = await req.json();

    if (!walletAddress || typeof walletAddress !== "string") {
      return new Response(
        JSON.stringify({ error: "walletAddress is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Get token accounts for the wallet filtered by the specific mint
    const response = await fetch(SOLANA_RPC, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        jsonrpc: "2.0",
        id: 1,
        method: "getTokenAccountsByOwner",
        params: [
          walletAddress,
          { mint: TOKEN_MINT },
          { encoding: "jsonParsed" },
        ],
      }),
    });

    const data = await response.json();

    let balance = 0;
    if (data.result?.value?.length > 0) {
      const tokenAccount = data.result.value[0];
      balance =
        tokenAccount.account.data.parsed.info.tokenAmount.uiAmount ?? 0;
    }

    return new Response(
      JSON.stringify({ balance, mint: TOKEN_MINT }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
