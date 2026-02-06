import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers':
    'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

const TOKEN_ADDRESS = "2ay5sdVY24SjdzjVdtXQfCkxGsjaTn8VnBU8b9FT5acV";

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // No-API-key approach: count token accounts on-chain via Solana RPC.
    // Note: This counts token *accounts* with a non-zero balance for the mint.
    // For most SPL tokens this is effectively the holder count used by common explorers.

    const TOKEN_PROGRAM_ID = "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA";
    const RPC_URL = "https://api.mainnet-beta.solana.com";

    const body = {
      jsonrpc: "2.0",
      id: 1,
      method: "getProgramAccounts",
      params: [
        TOKEN_PROGRAM_ID,
        {
          encoding: "base64",
          commitment: "confirmed",
          // Only fetch the `amount` field (u64 LE at offset 64) to keep payload small
          dataSlice: { offset: 64, length: 8 },
          filters: [
            { dataSize: 165 },
            { memcmp: { offset: 0, bytes: TOKEN_ADDRESS } },
          ],
        },
      ],
    };

    const response = await fetch(RPC_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        "User-Agent": "LovableCloudFunction/holder-count",
      },
      body: JSON.stringify(body),
    });

    console.log("RPC status:", response.status);

    if (!response.ok) {
      const errorText = await response.text();
      console.log("RPC error (truncated):", errorText.substring(0, 300));
      return new Response(JSON.stringify({ holderCount: null }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const json = await response.json();

    if (json?.error) {
      console.log("RPC json error:", JSON.stringify(json.error).substring(0, 500));
      return new Response(JSON.stringify({ holderCount: null }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const accounts: any[] = json?.result ?? [];

    let holders = 0;
    for (const acc of accounts) {
      // With dataSlice + base64 encoding, this is typically: data: ["<base64>", "base64"]
      const dataField = acc?.account?.data;
      const base64 = Array.isArray(dataField) ? dataField[0] : null;
      if (typeof base64 !== "string") continue;

      const bytes = Uint8Array.from(atob(base64), (c) => c.charCodeAt(0));
      if (bytes.length < 8) continue;

      // u64 little-endian
      let amount = 0n;
      for (let i = 0; i < 8; i++) amount |= BigInt(bytes[i]) << (8n * BigInt(i));

      if (amount > 0n) holders++;
    }

    console.log("RPC matched token accounts:", accounts.length, "non-zero:", holders);

    return new Response(JSON.stringify({ holderCount: holders }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error('Error fetching holder count:', error);
    return new Response(
      JSON.stringify({ holderCount: null, error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});
