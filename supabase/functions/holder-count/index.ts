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
    // Use SolanaFM API for holder count
    const response = await fetch(
      `https://api.solana.fm/v0/tokens/${TOKEN_ADDRESS}/holders?page=1&pageSize=1`,
      {
        headers: { 'Accept': 'application/json' }
      }
    );

    console.log('SolanaFM response status:', response.status);
    
    if (response.ok) {
      const data = await response.json();
      console.log('SolanaFM data:', JSON.stringify(data).substring(0, 500));
      
      // SolanaFM returns pagination info with total
      if (data?.pagination?.totalItems !== undefined) {
        return new Response(
          JSON.stringify({ holderCount: data.pagination.totalItems }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      if (data?.totalItems !== undefined) {
        return new Response(
          JSON.stringify({ holderCount: data.totalItems }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    } else {
      const errorText = await response.text();
      console.log('SolanaFM error:', errorText);
    }

    // Return null if no data found
    return new Response(
      JSON.stringify({ holderCount: null }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error fetching holder count:', error);
    return new Response(
      JSON.stringify({ holderCount: null, error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});
