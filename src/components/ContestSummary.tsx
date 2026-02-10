import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";

interface ContestSettings {
  id: string;
  countdown_end: string;
  fee_percentage: number;
  submission_start: string;
  submission_end: string;
  wallet_address: string;
  min_pool_display_usd: number;
}

const pad = (n: number) => String(n).padStart(2, "0");

const formatDate = (dateStr: string) => {
  const date = new Date(dateStr + "T00:00:00");
  return date.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });
};

export const ContestSummary = () => {
  const [settings, setSettings] = useState<ContestSettings | null>(null);
  const [timeLeft, setTimeLeft] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 });
  const [solBalance, setSolBalance] = useState<number | null>(null);
  const [solPrice, setSolPrice] = useState<number | null>(null);

  const fetchSettings = useCallback(async () => {
    const { data, error } = await supabase
      .from("contest_settings")
      .select("*")
      .limit(1)
      .maybeSingle();

    if (!error && data) {
      setSettings(data as ContestSettings);
    }
  }, []);

  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  useEffect(() => {
    if (!settings?.wallet_address) return;
    const fetchWalletBalance = async () => {
      try {
        const { data, error } = await supabase.functions.invoke("wallet-balance", {
          body: { walletAddress: settings.wallet_address },
        });
        if (!error && data) {
          setSolBalance(data.solBalance);
          setSolPrice(data.solPrice);
        }
      } catch (e) {
        console.error("Failed to fetch wallet balance", e);
      }
    };
    fetchWalletBalance();
    const interval = setInterval(fetchWalletBalance, 60000);
    return () => clearInterval(interval);
  }, [settings?.wallet_address]);

  useEffect(() => {
    if (!settings) return;
    const tick = () => {
      const now = new Date().getTime();
      const end = new Date(settings.countdown_end).getTime();
      const diff = end - now;
      if (diff <= 0) {
        setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0 });
        return;
      }
      setTimeLeft({
        days: Math.floor(diff / (1000 * 60 * 60 * 24)),
        hours: Math.floor((diff / (1000 * 60 * 60)) % 24),
        minutes: Math.floor((diff / (1000 * 60)) % 60),
        seconds: Math.floor((diff / 1000) % 60),
      });
    };
    tick();
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, [settings]);

  if (!settings) return null;

  const usdValue = solBalance !== null && solPrice !== null ? (solBalance * solPrice).toFixed(2) : null;
  const usdNum = usdValue ? parseFloat(usdValue) : 0;
  const showPool = usdNum >= (settings.min_pool_display_usd ?? 100);

  return (
    <section className="px-3 sm:px-4 py-8 sm:py-12">
      <div className="max-w-3xl mx-auto text-center space-y-6">
        <h2 className="font-display text-3xl sm:text-4xl text-foreground">Banner Contest</h2>

        {/* Countdown Timer */}
        <div className="flex items-start justify-center gap-3 sm:gap-5 font-display text-4xl sm:text-6xl font-bold tracking-wider">
          <div className="flex flex-col items-center">
            <span className="text-red-500">{pad(timeLeft.days)}</span>
            <span className="text-xs sm:text-sm font-body text-muted-foreground mt-1">DAYS</span>
          </div>
          <div className="flex flex-col items-center">
            <span className="text-red-500">:</span>
            <span className="text-xs sm:text-sm font-body text-transparent mt-1 select-none">.</span>
          </div>
          <div className="flex flex-col items-center">
            <span className="text-red-500">{pad(timeLeft.hours)}</span>
            <span className="text-xs sm:text-sm font-body text-muted-foreground mt-1">HRS</span>
          </div>
          <div className="flex flex-col items-center">
            <span className="text-red-500">:</span>
            <span className="text-xs sm:text-sm font-body text-transparent mt-1 select-none">.</span>
          </div>
          <div className="flex flex-col items-center">
            <span className="text-red-500">{pad(timeLeft.minutes)}</span>
            <span className="text-xs sm:text-sm font-body text-muted-foreground mt-1">MIN</span>
          </div>
          <div className="flex flex-col items-center">
            <span className="text-red-500">:</span>
            <span className="text-xs sm:text-sm font-body text-transparent mt-1 select-none">.</span>
          </div>
          <div className="flex flex-col items-center">
            <span className="text-red-500">{pad(timeLeft.seconds)}</span>
            <span className="text-xs sm:text-sm font-body text-muted-foreground mt-1">SEC</span>
          </div>
        </div>

        {/* Info Cards */}
        <div className={`grid gap-4 ${showPool ? 'grid-cols-1 sm:grid-cols-3' : 'grid-cols-1 sm:grid-cols-2 max-w-2xl mx-auto'}`}>
          {/* Contest Dates */}
          <div className="bg-card border border-border rounded-xl px-5 py-4 text-center flex flex-col items-center justify-center">
            <p className="font-body text-muted-foreground text-sm sm:text-base mb-1">Contest Period</p>
            <p className="font-display text-lg sm:text-xl text-foreground">
              <span className="text-red-500 font-semibold">
                {formatDate(settings.submission_start)}
              </span>
              {" — "}
              <span className="text-red-500 font-semibold">
                {formatDate(settings.submission_end)}
              </span>
            </p>
          </div>

          {/* Pool Amount - only show if above threshold */}
          {showPool && (
            <div className="bg-card border border-border rounded-xl px-5 py-4">
              <p className="font-body text-muted-foreground text-sm sm:text-base mb-1">Reward Pool</p>
              <p className="font-display text-2xl sm:text-3xl text-foreground">
                {solBalance !== null ? `${solBalance.toFixed(4)} SOL` : "—"}
              </p>
              {usdValue && (
                <p className="font-body text-muted-foreground text-sm sm:text-base mt-1">${usdValue} USD</p>
              )}
            </div>
          )}

          {/* Fee Allocation */}
          <div className="bg-card border border-border rounded-xl px-5 py-4">
            <p className="font-body text-muted-foreground text-sm sm:text-base mb-1">Pool Allocation</p>
            <p className="font-display text-2xl sm:text-3xl text-red-500">
              {settings.fee_percentage}%
            </p>
            <p className="font-body text-muted-foreground text-sm sm:text-base mt-1">of fees to community</p>
          </div>
        </div>

        {/* Link to full contest page */}
        <a
          href="/banner-contest"
          className="inline-block font-body text-sm text-foreground underline hover:text-muted-foreground transition-colors"
        >
          View Full Contest Rules →
        </a>
      </div>
    </section>
  );
};
