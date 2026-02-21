import { useState, useEffect, useCallback } from "react";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { RotateCcw } from "lucide-react";
import buckEmoji from "@/assets/buck-emoji.png";
import countdownVideo from "@/assets/countdown-animation.mp4";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Table, TableHeader, TableBody, TableHead, TableRow, TableCell } from "@/components/ui/table";

interface ContestSubmission {
  id: string;
  wallet_address: string;
  x_handle: string;
  post_link: string;
  token_balance: number | null;
  submitted_at: string;
}

interface ContestSettings {
  id: string;
  countdown_end: string;
  fee_percentage: number;
  submission_start: string;
  submission_end: string;
  wallet_address: string;
  min_pool_display_usd: number;
}

const BannerContest = () => {
  const [password, setPassword] = useState("");
  const [unlocked, setUnlocked] = useState(true);
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
  // derivedSubEnd is computed from countdown end
  const [formWalletAddress, setFormWalletAddress] = useState("HwaGGGWfVKVTkqwjAiCUhubVBiJ6ip7QLP7f5VquzC7L");
  const [formMinPoolUsd, setFormMinPoolUsd] = useState("100");

  // Countdown state
  const [timeLeft, setTimeLeft] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 });

  // Wallet balance
  const [solBalance, setSolBalance] = useState<number | null>(null);
  const [solPrice, setSolPrice] = useState<number | null>(null);

  // Submission form
  const [subWallet, setSubWallet] = useState("");
  const [subXHandle, setSubXHandle] = useState("");
  const [subPostLink, setSubPostLink] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submissions, setSubmissions] = useState<ContestSubmission[]>([]);

  const { toast } = useToast();

  // Derive submission end date from countdown end (date portion)
  const derivedSubEnd = formCountdownEnd ? formCountdownEnd.split("T")[0] : "";

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
      setFormWalletAddress(data.wallet_address || "HwaGGGWfVKVTkqwjAiCUhubVBiJ6ip7QLP7f5VquzC7L");
      setFormMinPoolUsd(String(data.min_pool_display_usd ?? 100));
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  // Fetch submissions
  const fetchSubmissions = useCallback(async () => {
    const { data } = await supabase
      .from("contest_submissions")
      .select("*")
      .order("submitted_at", { ascending: true });
    if (data) setSubmissions(data as ContestSubmission[]);
  }, []);

  useEffect(() => {
    fetchSubmissions();
  }, [fetchSubmissions]);

  // Handle contest submission
  const handleSubmitEntry = async (e: React.FormEvent) => {
    e.preventDefault();

    const trimmedHandle = subXHandle.trim();
    if (!trimmedHandle.startsWith("@")) {
      toast({ title: "X handle must start with @", description: 'Example: @yourhandle', variant: "destructive" });
      return;
    }
    if (!subWallet.trim() || !subPostLink.trim()) {
      toast({ title: "All fields are required", variant: "destructive" });
      return;
    }

    setSubmitting(true);
    try {
      // Insert submission
      const { error: insertError } = await supabase
        .from("contest_submissions")
        .insert({
          wallet_address: subWallet.trim(),
          x_handle: trimmedHandle,
          post_link: subPostLink.trim(),
        });

      if (insertError) {
        if (insertError.message.includes("unique")) {
          toast({ title: "Already submitted", description: "This wallet or X handle has already been used.", variant: "destructive" });
        } else {
          toast({ title: "Submission failed", description: insertError.message, variant: "destructive" });
        }
        setSubmitting(false);
        return;
      }

      // Fetch token balance for the wallet
      try {
        const { data: balanceData } = await supabase.functions.invoke("token-balance", {
          body: { walletAddress: subWallet.trim() },
        });

        if (balanceData?.balance !== undefined) {
          await supabase
            .from("contest_submissions")
            .update({ token_balance: balanceData.balance })
            .eq("wallet_address", subWallet.trim());
        }
      } catch (balErr) {
        console.error("Failed to fetch token balance", balErr);
      }

      toast({ title: "Entry submitted!" });
      setSubWallet("");
      setSubXHandle("");
      setSubPostLink("");
      fetchSubmissions();
    } catch (err) {
      toast({ title: "Submission failed", variant: "destructive" });
    }
    setSubmitting(false);
  };


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
        submission_end: derivedSubEnd,
        wallet_address: formWalletAddress,
        min_pool_display_usd: parseFloat(formMinPoolUsd),
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
            {/* Countdown Animation */}
            <div className="flex justify-center mb-8">
              <video
                src={countdownVideo}
                autoPlay
                loop
                muted
                playsInline
                preload="auto"
                className="w-full max-w-2xl rounded-xl"
              />
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
                        value={derivedSubEnd}
                        disabled
                        className="opacity-50 cursor-not-allowed"
                      />
                      <p className="text-xs text-muted-foreground">Defaults to timer end date</p>
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

                    <div className="space-y-2">
                      <Label className="text-foreground font-body text-sm">Min Pool Display (USD)</Label>
                      <Input
                        type="number"
                        min="0"
                        value={formMinPoolUsd}
                        onChange={(e) => setFormMinPoolUsd(e.target.value)}
                      />
                      <p className="text-xs text-muted-foreground">Reward pool only shown when balance exceeds this USD amount</p>
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

                    <div className="border-t border-border pt-4 mt-4">
                      <Button
                        variant="destructive"
                        size="sm"
                        className="w-full"
                        onClick={async () => {
                          if (!confirm("Are you sure you want to delete ALL contest entries? This cannot be undone.")) return;
                          const { error } = await supabase
                            .from("contest_submissions")
                            .delete()
                            .neq("id", "00000000-0000-0000-0000-000000000000");
                          if (error) {
                            toast({ title: "Error clearing entries", description: error.message, variant: "destructive" });
                          } else {
                            toast({ title: "All entries cleared" });
                            fetchSubmissions();
                          }
                        }}
                      >
                        Clear All Contest Entries
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
                The contest will run from{" "}
                <span className="font-semibold text-red-500">
                  {settings?.submission_start ? formatDate(settings.submission_start) : "TBD"}
                </span>{" "}
                to{" "}
                <span className="font-semibold text-red-500">
                  {settings?.submission_end ? formatDate(settings.submission_end) : "TBD"}
                </span>.{" "}
                Link to the{" "}
                <a href="https://x.com/i/communities/1960729088890691700" target="_blank" rel="noopener noreferrer" className="font-semibold text-red-500 underline hover:text-red-400 transition-colors">Community</a>.
              </p>

              {/* Wallet Balance - only show if above threshold */}
              {(() => {
                const usdVal = solBalance !== null && solPrice !== null ? solBalance * solPrice : 0;
                const threshold = settings?.min_pool_display_usd ?? 100;
                if (usdVal < threshold) return null;
                return (
                  <div className="text-center">
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
                          {`$${usdVal.toFixed(2)}`}
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })()}

              <div className="border-t border-border pt-6">
                <h2 className="font-display text-xl sm:text-2xl text-foreground mb-4">Submit your Entry</h2>
                <form onSubmit={handleSubmitEntry} className="space-y-4 text-left max-w-md mx-auto">
                  <div className="space-y-2">
                    <Label className="text-foreground font-body text-sm">Solana Wallet Address</Label>
                    <Input
                      type="text"
                      placeholder="Your Solana wallet address"
                      value={subWallet}
                      onChange={(e) => setSubWallet(e.target.value)}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-foreground font-body text-sm">X Handle</Label>
                    <Input
                      type="text"
                      placeholder="@yourhandle"
                      value={subXHandle}
                      onChange={(e) => setSubXHandle(e.target.value)}
                      required
                    />
                    <p className="text-xs text-muted-foreground">Submit as "@yourhandle" (must start with @)</p>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-foreground font-body text-sm">Link to Post</Label>
                    <Input
                      type="url"
                      placeholder="https://x.com/..."
                      value={subPostLink}
                      onChange={(e) => setSubPostLink(e.target.value)}
                      required
                    />
                  </div>
                  <Button type="submit" variant="hero" size="lg" className="w-full" disabled={submitting}>
                    {submitting ? "Submitting..." : "Submit Entry"}
                  </Button>
                </form>
              </div>

              {/* Submissions Table */}
              {submissions.length > 0 && (
                <div className="border-t border-border pt-6">
                  <h2 className="font-display text-xl sm:text-2xl text-foreground mb-4">Submissions</h2>
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>X Handle</TableHead>
                          <TableHead>Wallet</TableHead>
                          <TableHead>Post</TableHead>
                          <TableHead>$BUCK Balance</TableHead>
                          <TableHead>Submitted</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {submissions.map((sub) => (
                          <TableRow key={sub.id}>
                            <TableCell className="font-body">{sub.x_handle}</TableCell>
                            <TableCell className="font-body text-xs">
                              {sub.wallet_address.slice(0, 4)}...{sub.wallet_address.slice(-4)}
                            </TableCell>
                            <TableCell>
                              <a href={sub.post_link} target="_blank" rel="noopener noreferrer" className="text-red-500 underline hover:text-red-400 text-sm">
                                View
                              </a>
                            </TableCell>
                            <TableCell className="font-display">
                              {sub.token_balance !== null ? Number(sub.token_balance).toLocaleString() : "—"}
                            </TableCell>
                            <TableCell className="font-body text-xs text-muted-foreground">
                              {new Date(sub.submitted_at).toLocaleDateString()}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </div>
              )}
            </div>

            {/* Past Contest Winners */}
            <div className="bg-card border border-border rounded-xl p-6 sm:p-8 text-center mt-8">
              <h2 className="font-display text-2xl sm:text-3xl text-foreground mb-6">Past Contest Winners</h2>
              <div className="flex justify-center">
                <iframe
                  src="https://platform.x.com/embed/Post.html?id=2022732904292585720&theme=dark"
                  className="w-full max-w-[550px] border-0"
                  height="600"
                  allowFullScreen
                  title="Past Contest Winner Tweet"
                />
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
