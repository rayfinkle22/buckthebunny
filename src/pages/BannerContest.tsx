import { useState } from "react";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Lock } from "lucide-react";

const BannerContest = () => {
  const [password, setPassword] = useState("");
  const [unlocked, setUnlocked] = useState(false);
  const [error, setError] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (password === "admin") {
      setUnlocked(true);
      setError(false);
    } else {
      setError(true);
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col relative">
      <Header />
      <main className="flex-1 relative z-10 pt-20 sm:pt-24 px-4">
        {!unlocked ? (
          <div className="max-w-md mx-auto mt-20 text-center">
            <div className="bg-card border border-border rounded-xl p-8 shadow-lg">
              <Lock className="w-12 h-12 text-primary mx-auto mb-4" />
              <h1 className="font-display text-2xl text-foreground mb-2">Banner Contest</h1>
              <p className="font-body text-muted-foreground mb-6 text-sm">
                Enter the password to access this page.
              </p>
              <form onSubmit={handleSubmit} className="flex flex-col gap-3">
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
          <div className="max-w-4xl mx-auto py-8">
            <h1 className="font-display text-3xl sm:text-4xl text-foreground mb-6 text-center">
              🎨 Banner Contest
            </h1>
            <div className="bg-card border border-border rounded-xl p-6 sm:p-8">
              <p className="font-body text-foreground text-center text-lg">
                Welcome to the Buck The Bunny Banner Contest! Content coming soon.
              </p>
            </div>
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
};

export default BannerContest;
