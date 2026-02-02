import { TOKEN_ADDRESS } from "@/hooks/useMarketData";

const XIcon = () => (
  <svg viewBox="0 0 24 24" className="w-4 h-4 fill-current">
    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
  </svg>
);

export const Footer = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="relative z-10 border-t border-border py-12 mt-12 bg-card">
      <div className="relative z-20 max-w-6xl mx-auto px-4 text-center">
        <div className="flex items-center justify-center gap-2 mb-4">
          <span className="text-2xl">🐰</span>
          <span className="font-display text-2xl text-primary tracking-wide">$BUCK THE BUNNY</span>
          <span className="text-2xl">🚀</span>
        </div>

        <p className="font-body text-sm text-muted-foreground mb-4">
          Community-first. Fun-forward. Bold. Unapologetic. 🔥
        </p>

        <div className="flex flex-wrap justify-center gap-4 mb-6 text-sm font-body">
          <a
            href={`https://dexscreener.com/solana/${TOKEN_ADDRESS}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-primary hover:text-accent transition-colors"
          >
            Dexscreener
          </a>
          <span className="text-muted-foreground/30">•</span>
          <a
            href={`https://pump.fun/coin/${TOKEN_ADDRESS}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-primary hover:text-accent transition-colors"
          >
            Pump.fun
          </a>
          <span className="text-muted-foreground/30">•</span>
          <a
            href="https://x.com/i/communities/1960729088890691700"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 text-primary hover:text-accent transition-colors"
          >
            <XIcon />
            <span>X Community</span>
          </a>
        </div>

        <p className="font-body text-xs text-muted-foreground max-w-md mx-auto mb-4">
          This is a meme token with no intrinsic value. Trade responsibly. Not financial advice. DYOR. 🧠
        </p>

        <div className="flex items-center justify-center gap-4 text-muted-foreground/50">
          <span className="font-body text-xs">© {currentYear} $BUCK the Bunny</span>
          <span>•</span>
          <span className="font-body text-xs">Built on Solana</span>
        </div>
      </div>
    </footer>
  );
};
