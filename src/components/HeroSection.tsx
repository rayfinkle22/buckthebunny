import { useState } from "react";
import { Copy, Check } from "lucide-react";
import { toast } from "sonner";
import { TOKEN_ADDRESS } from "@/hooks/useMarketData";
import heroBanner from "@/assets/hero-banner.gif";
import buckEmoji from "@/assets/buck-emoji.png";

const XIcon = () => (
  <svg viewBox="0 0 24 24" className="w-3.5 h-3.5 fill-current">
    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
  </svg>
);

export const HeroSection = () => {
  const [copied, setCopied] = useState(false);

  const copyCA = async () => {
    try {
      await navigator.clipboard.writeText(TOKEN_ADDRESS);
      setCopied(true);
      toast.success("Contract address copied!");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Failed to copy");
    }
  };

  return (
    <section id="hero" className="relative flex flex-col items-center justify-center px-3 sm:px-4 py-8 sm:py-12 overflow-hidden">
      {/* Main content */}
      <div className="relative z-10 text-center max-w-4xl mx-auto w-full">
        {/* Hero Banner Image */}
        <div className="mb-6 sm:mb-10 w-full">
          <img
            src={heroBanner}
            alt="Buck the Bunny"
            className="w-full max-w-4xl mx-auto rounded-2xl shadow-glow-lg border-2 border-primary/30"
          />
        </div>

        {/* Title */}
        <h1 className="font-display text-5xl sm:text-7xl md:text-8xl text-foreground mb-2 tracking-wide">
          BUCK THE BUNNY
        </h1>
        <p className="font-body text-lg sm:text-xl text-muted-foreground mb-8">
          GameStop's iconic Rabbit Mascot. Tokenized on Pump.fun
        </p>

        {/* Buttons Section */}
        <div className="flex flex-col items-center gap-4 sm:gap-6">
          {/* Action buttons - compact outline style */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3 w-full max-w-xl">
            <a
              href={`https://dexscreener.com/solana/${TOKEN_ADDRESS}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg border border-primary/60 bg-transparent text-foreground hover:bg-primary/10 hover:border-primary hover:shadow-[0_0_15px_hsl(0_85%_50%/0.4)] transition-all text-sm font-medium"
            >
              <span>📊</span>
              <span>DEX</span>
            </a>

            <a
              href={`https://pump.fun/coin/${TOKEN_ADDRESS}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg border border-primary/60 bg-transparent text-foreground hover:bg-primary/10 hover:border-primary hover:shadow-[0_0_15px_hsl(0_85%_50%/0.4)] transition-all text-sm font-medium"
            >
              <span>🚀</span>
              <span>PUMP</span>
            </a>

            <a
              href="https://x.com/itsbuckthebunny"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg border border-primary/60 bg-transparent text-foreground hover:bg-primary/10 hover:border-primary hover:shadow-[0_0_15px_hsl(0_85%_50%/0.4)] transition-all text-sm font-medium"
            >
              <XIcon />
              <span>OFFICIAL</span>
            </a>

            <a
              href="https://x.com/i/communities/1960729088890691700"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg border border-primary/60 bg-transparent text-foreground hover:bg-primary/10 hover:border-primary hover:shadow-[0_0_15px_hsl(0_85%_50%/0.4)] transition-all text-sm font-medium"
            >
              <XIcon />
              <span>COMMUNITY</span>
            </a>
          </div>

          {/* Contract Address button */}
          <button
            onClick={copyCA}
            className="ca-pill"
          >
            <span className="text-xs sm:text-sm text-muted-foreground font-body">CA:</span>
            <code className="text-xs sm:text-sm font-mono text-foreground truncate max-w-[200px] sm:max-w-none">
              {TOKEN_ADDRESS}
            </code>
            {copied ? (
              <Check className="w-4 h-4 sm:w-5 sm:h-5 text-primary flex-shrink-0" />
            ) : (
              <Copy className="w-4 h-4 sm:w-5 sm:h-5 text-muted-foreground hover:text-primary flex-shrink-0 transition-colors" />
            )}
            <img src={buckEmoji} alt="Buck" className="w-6 h-6 sm:w-7 sm:h-7 object-contain" />
          </button>

          {/* History Section */}
          <div className="mt-8 sm:mt-12 max-w-3xl mx-auto text-center space-y-4">
            <h2 className="font-display text-3xl sm:text-4xl text-foreground mb-4">History</h2>
            <p className="font-body text-base sm:text-lg text-muted-foreground leading-relaxed">
              Buck the Bunny is GameStop's long-standing rabbit mascot, first unveiled at a 2009 company conference with a full "origin story" video. He later appeared across GameStop promotions and even starred in the official iOS game Buck and the Coin of Destiny (2010). The character was originally designed by artist Justin Claus Harder, whose work helped define Buck as a piece of GameStop history.
            </p>
            <p className="font-body text-base sm:text-lg text-muted-foreground leading-relaxed">
              Today, Buck is making a modern comeback through a community-driven memecoin that celebrates both the character and his creator, ensuring the artist who brought Buck to life is finally recognized and rewarded, with all creator fees going directly to Justin Claus Harder.
            </p>
            
            {/* YouTube Video Embed */}
            <div className="mt-6 sm:mt-8 w-full aspect-video max-w-2xl mx-auto rounded-xl overflow-hidden border-2 border-primary/30 shadow-glow">
              <iframe
                className="w-full h-full"
                src="https://www.youtube.com/embed/IMpHml429_8"
                title="Buck the Bunny Origin Story"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                allowFullScreen
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
