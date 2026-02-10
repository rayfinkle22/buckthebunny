import { useState, useEffect, useCallback } from "react";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { RotateCcw } from "lucide-react";
import buckEmoji from "@/assets/buck-emoji.png";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface ContestSettings {
  id: string;
  countdown_end: string;
  fee_percentage: number;
  submission_start: string;
  submission_end: string;
  wallet_address: string;
}

const BannerContest = () => {
  const [password, setPassword] = useState("");
  const [unlocked, setUnlocked] = useState(false);
  const [error, setError] = useState(false);

  // Admin panel
  const [adminOpen, setAdminOpen] = useState(false);
  const [adminPassword, setAdminPassword] = useState("");
  const [adminError, setAdminError] = useState(false);
  const [adminUnlocked, setAdminUnlocked] = useState(false);

  // Settings from DB
  const [settings, setSettings] = useState<ContestSettings | null>(null);
  const [loading, setLoading] = useState(true);

  // Admin form fields
  const [formCountdownEnd, setFormCountdownEnd] = useState("");
  const [formFeePercent, setFormFeePercent] = useState("");
  const [formSubStart, setFormSubStart] = useState("");
  const [formSubEnd, setFormSubEnd] = useState("");
  const [formWalletAddress, setFormWalletAddress] = useState("HwaGGGWfVKVTkqwjAiCUhubVBiJ6ip7QLP7f5VquzC7L");

  // Countdown state
  const [timeLeft, setTimeLeft] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 });

  // Wallet balance
  const [solBalance, setSolBalance] = useState<number | null>(null);
  const [solPrice, setSolPrice] = useState<number | null>(null);

  const { toast } = useToast();

  // Fetch wallet balance via edge function
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

  // Fetch settings
  const fetchSettings = useCallback(async () => {
    const { data, error } = await supabase
      .from("contest_settings")
      .select("*")
      .limit(1)
      .single();

    if (!error && data) {
      setSettings(data as ContestSettings);
      // Pre-fill admin form
      const end = new Date(data.countdown_end);
      // Format for datetime-local input (in EST)
      const estOffset = end.toLocaleString("en-US", { timeZone: "America/New_York" });
      const estDate = new Date(estOffset);
      const y = estDate.getFullYear();
      const m = String(estDate.getMonth() + 1).padStart(2, "0");
      const d = String(estDate.getDate()).padStart(2, "0");
      const h = String(estDate.getHours()).padStart(2, "0");
      const min = String(estDate.getMinutes()).padStart(2, "0");
      setFormCountdownEnd(`${y}-${m}-${d}T${h}:${min}`);
      setFormFeePercent(String(data.fee_percentage));
      setFormSubStart(data.submission_start);
      setFormSubEnd(data.submission_end);
      setFormWalletAddress(data.wallet_address || "HwaGGGWfVKVTkqwjAiCUhubVBiJ6ip7QLP7f5VquzC7L");
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  // Countdown timer
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

  const handlePagePassword = (e: React.FormEvent) => {
    e.preventDefault();
    if (password === "admin") {
      setUnlocked(true);
      setError(false);
    } else {
      setError(true);
    }
  };

  const handleAdminPassword = (e: React.FormEvent) => {
    e.preventDefault();
    if (adminPassword === "buckthebunny2026") {
      setAdminUnlocked(true);
      setAdminError(false);
    } else {
      setAdminError(true);
    }
  };

  const handleSaveSettings = async () => {
    if (!settings) return;

    // Convert the EST datetime-local to UTC
    const estDateStr = formCountdownEnd;
    // Parse as EST by appending timezone
    const utcDate = new Date(estDateStr + ":00");
    // Create proper EST date
    const estParts = estDateStr.split("T");
    const dateParts = estParts[0].split("-");
    const timeParts = estParts[1].split(":");
    const estDate = new Date(
      Date.UTC(
        parseInt(dateParts[0]),
        parseInt(dateParts[1]) - 1,
        parseInt(dateParts[2]),
        parseInt(timeParts[0]) + 5, // EST is UTC-5
        parseInt(timeParts[1])
      )
    );

    const { error } = await supabase
      .from("contest_settings")
      .update({
        countdown_end: estDate.toISOString(),
        fee_percentage: parseFloat(formFeePercent),
        submission_start: formSubStart,
        submission_end: formSubEnd,
        wallet_address: formWalletAddress,
      })
      .eq("id", settings.id);

    if (error) {
      toast({ title: "Error saving settings", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Settings saved!" });
      fetchSettings();
    }
  };

  const handleRestartCountdown = async () => {
    if (!settings || !formCountdownEnd) return;
    // Restart countdown using the currently set countdown end date
    const estParts = formCountdownEnd.split("T");
    const dateParts = estParts[0].split("-");
    const timeParts = estParts[1].split(":");
    const estDate = new Date(
      Date.UTC(
        parseInt(dateParts[0]),
        parseInt(dateParts[1]) - 1,
        parseInt(dateParts[2]),
        parseInt(timeParts[0]) + 5,
        parseInt(timeParts[1])
      )
    );
    const { error } = await supabase
      .from("contest_settings")
      .update({ countdown_end: estDate.toISOString() })
      .eq("id", settings.id);

    if (error) {
      toast({ title: "Error restarting countdown", variant: "destructive" });
    } else {
      toast({ title: "Countdown restarted" });
      fetchSettings();
    }
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr + "T00:00:00");
    return date.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });
  };

  const pad = (n: number) => String(n).padStart(2, "0");

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex flex-col relative">
        <Header />
        <main className="flex-1 relative z-10 pt-20 sm:pt-24 px-4 flex items-center justify-center">
          <p className="text-muted-foreground font-body">Loading...</p>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col relative">
      <Header />
      <main className="flex-1 relative z-10 pt-20 sm:pt-24 px-4">
        {!unlocked ? (
          <div className="max-w-md mx-auto mt-20 text-center">
            <div className="bg-card border border-border rounded-xl p-8 shadow-lg">
              <img src={buckEmoji} alt="Buck" className="w-12 h-12 mx-auto mb-4" />
              <h1 className="font-display text-2xl text-foreground mb-2">Banner Contest</h1>
              <p className="font-body text-muted-foreground mb-6 text-sm">
                Enter the password to access this page.
              </p>
              <form onSubmit={handlePagePassword} className="flex flex-col gap-3">
                <Input
                  type="password"
                  placeholder="Password"
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    setError(false);
                  }}
                  className={error ? "border-destructive" : ""}
                />
                {error && (
                  <p className="text-destructive text-sm font-body">Incorrect password.</p>
                )}
                <Button type="submit" variant="hero" size="lg">
                  Enter
                </Button>
              </form>
            </div>
          </div>
        ) : (
          <div className="max-w-3xl mx-auto py-8">
            {/* Countdown Timer */}
            <div className="text-center mb-8">
              <div className="flex items-end justify-center gap-3 sm:gap-5 font-display text-4xl sm:text-6xl font-bold tracking-wider">
                <div className="flex flex-col items-center">
                  <span className="text-destructive drop-shadow-[0_0_12px_hsl(var(--destructive))] brightness-125">{pad(timeLeft.days)}</span>
                  <span className="text-xs sm:text-sm font-body text-muted-foreground mt-1">DAYS</span>
                </div>
                <div className="flex flex-col items-center">
                  <span className="text-destructive drop-shadow-[0_0_12px_hsl(var(--destructive))] brightness-125">:</span>
                  <span className="text-xs sm:text-sm font-body text-transparent mt-1 select-none">.</span>
                </div>
                <div className="flex flex-col items-center">
                  <span className="text-destructive drop-shadow-[0_0_12px_hsl(var(--destructive))] brightness-125">{pad(timeLeft.hours)}</span>
                  <span className="text-xs sm:text-sm font-body text-muted-foreground mt-1">HRS</span>
                </div>
                <div className="flex flex-col items-center">
                  <span className="text-destructive drop-shadow-[0_0_12px_hsl(var(--destructive))] brightness-125">:</span>
                  <span className="text-xs sm:text-sm font-body text-transparent mt-1 select-none">.</span>
                </div>
                <div className="flex flex-col items-center">
                  <span className="text-destructive drop-shadow-[0_0_12px_hsl(var(--destructive))] brightness-125">{pad(timeLeft.minutes)}</span>
                  <span className="text-xs sm:text-sm font-body text-muted-foreground mt-1">MIN</span>
                </div>
                <div className="flex flex-col items-center">
                  <span className="text-destructive drop-shadow-[0_0_12px_hsl(var(--destructive))] brightness-125">:</span>
                  <span className="text-xs sm:text-sm font-body text-transparent mt-1 select-none">.</span>
                </div>
                <div className="flex flex-col items-center">
                  <span className="text-destructive drop-shadow-[0_0_12px_hsl(var(--destructive))] brightness-125">{pad(timeLeft.seconds)}</span>
                  <span className="text-xs sm:text-sm font-body text-muted-foreground mt-1">SEC</span>
                </div>
              </div>
            </div>

            {/* Wallet Balance */}
            <div className="text-center mb-8">
              <h2 className="font-display text-xl sm:text-2xl text-foreground mb-3">
                Community Reward Pool Balance:
              </h2>
              <div className="flex items-center justify-center gap-4 sm:gap-6">
                <div className="bg-card border border-border rounded-xl px-5 py-3">
                  <p className="font-body text-muted-foreground text-xs mb-1">SOL</p>
                  <p className="font-display text-2xl sm:text-3xl text-foreground">
                    {solBalance !== null ? solBalance.toFixed(4) : "—"}
                  </p>
                </div>
                <div className="bg-card border border-border rounded-xl px-5 py-3">
                  <p className="font-body text-muted-foreground text-xs mb-1">USD</p>
                  <p className="font-display text-2xl sm:text-3xl text-foreground">
                    {solBalance !== null && solPrice !== null
                      ? `$${(solBalance * solPrice).toFixed(2)}`
                      : "—"}
                  </p>
                </div>
              </div>
            </div>

            {/* Admin Lock Icon */}
            <div className="text-center mb-8">
              <button
                onClick={() => setAdminOpen(!adminOpen)}
                className="hover:scale-110 transition-transform"
                title="Admin Settings"
              >
                <img src={buckEmoji} alt="Admin" className="w-8 h-8 inline-block" />
              </button>
            </div>

            {/* Admin Panel */}
            {adminOpen && (
              <div className="max-w-md mx-auto mb-8">
                {!adminUnlocked ? (
                  <div className="bg-card border border-border rounded-xl p-6 shadow-lg">
                    <form onSubmit={handleAdminPassword} className="flex flex-col gap-3">
                      <Label className="text-foreground font-body text-sm">Admin Password</Label>
                      <Input
                        type="password"
                        placeholder="Enter admin password"
                        value={adminPassword}
                        onChange={(e) => {
                          setAdminPassword(e.target.value);
                          setAdminError(false);
                        }}
                        className={adminError ? "border-destructive" : ""}
                      />
                      {adminError && (
                        <p className="text-destructive text-sm font-body">Incorrect password.</p>
                      )}
                      <Button type="submit" variant="hero" size="sm">
                        Unlock
                      </Button>
                    </form>
                  </div>
                ) : (
                  <div className="bg-card border border-border rounded-xl p-6 shadow-lg space-y-4">
                    <h3 className="font-display text-lg text-foreground">⚙️ Admin Settings</h3>

                    <div className="space-y-2">
                      <Label className="text-foreground font-body text-sm">Countdown End (EST)</Label>
                      <Input
                        type="datetime-local"
                        value={formCountdownEnd}
                        onChange={(e) => setFormCountdownEnd(e.target.value)}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label className="text-foreground font-body text-sm">Fee Percentage (%)</Label>
                      <Input
                        type="number"
                        min="0"
                        max="100"
                        value={formFeePercent}
                        onChange={(e) => setFormFeePercent(e.target.value)}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label className="text-foreground font-body text-sm">Submission Start Date</Label>
                      <Input
                        type="date"
                        value={formSubStart}
                        onChange={(e) => setFormSubStart(e.target.value)}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label className="text-foreground font-body text-sm">Submission End Date</Label>
                      <Input
                        type="date"
                        value={formSubEnd}
                        onChange={(e) => setFormSubEnd(e.target.value)}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label className="text-foreground font-body text-sm">Wallet Address</Label>
                      <Input
                        type="text"
                        placeholder="Solana wallet address"
                        value={formWalletAddress}
                        onChange={(e) => setFormWalletAddress(e.target.value)}
                      />
                    </div>

                    <div className="flex gap-3">
                      <Button onClick={handleSaveSettings} variant="hero" size="sm" className="flex-1">
                        Save Settings
                      </Button>
                      <Button onClick={handleRestartCountdown} variant="outline" size="sm" className="gap-1">
                        <RotateCcw className="w-4 h-4" />
                        Restart
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Contest Content */}
            <div className="bg-card border border-border rounded-xl p-6 sm:p-8 space-y-6 text-center">
              <h1 className="font-display text-3xl sm:text-4xl text-foreground">
                Contest Rules
              </h1>

              <p className="font-body text-foreground text-base sm:text-lg leading-relaxed">
                This pool is where {settings?.fee_percentage ?? "X"}% of the fees/donations go directly into a pool dedicated to the community.
              </p>

              <p className="font-body text-foreground text-base sm:text-lg leading-relaxed">
                Community members can submit custom banners (1500×500) over a set submission period which will occur from{" "}
                <span className="font-semibold text-primary">
                  {settings?.submission_start ? formatDate(settings.submission_start) : "TBD"}
                </span>{" "}
                to{" "}
                <span className="font-semibold text-primary">
                  {settings?.submission_end ? formatDate(settings.submission_end) : "TBD"}
                </span>.
              </p>

              <div className="border-t border-border pt-4">
                <h2 className="font-display text-xl sm:text-2xl text-foreground mb-3">Reward:</h2>
                <ul className="font-body text-foreground text-base sm:text-lg leading-relaxed space-y-2 list-none">
                  <li>The winner receives the Community Reward Pool</li>
                  <li>Their banner will be featured for one full week across the community and on the DEX</li>
                </ul>
              </div>
            </div>
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
};

export default BannerContest;
