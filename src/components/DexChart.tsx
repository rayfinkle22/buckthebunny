import { useMarketData, formatMarketCap, TOKEN_ADDRESS } from "@/hooks/useMarketData";

export const DexChart = () => {
  const { marketCap, txns24h, priceChange, isLoading } = useMarketData();
  const priceChange24h = priceChange.h24;
  const totalTxns = txns24h ? txns24h.buys + txns24h.sells : null;

  return (
    <section id="chart" className="relative z-10 py-8 sm:py-12 px-4">
      <div className="max-w-4xl mx-auto">
        <h2 className="font-display text-4xl sm:text-5xl text-center text-foreground mb-2">
          LIVE CHART 📈
        </h2>
        <p className="font-body text-center text-muted-foreground mb-6">
          Track $BUCK in real-time on Dexscreener
        </p>

        {/* Market Stats Display */}
        <div className="mb-6 stats-card">
          <div className="grid grid-cols-3 gap-4">
            <div className="text-center">
              <p className="font-body text-sm text-muted-foreground mb-1">Market Cap</p>
              <p className="font-display text-2xl sm:text-3xl text-foreground">
                {isLoading ? (
                  <span className="opacity-50">...</span>
                ) : marketCap ? (
                  formatMarketCap(marketCap)
                ) : (
                  "N/A"
                )}
              </p>
            </div>
            <div className="text-center">
              <p className="font-body text-sm text-muted-foreground mb-1">24h Txns</p>
              <p className="font-display text-2xl sm:text-3xl text-foreground">
                {isLoading ? (
                  <span className="opacity-50">...</span>
                ) : totalTxns !== null ? (
                  totalTxns.toLocaleString()
                ) : (
                  "N/A"
                )}
              </p>
            </div>
            <div className="text-center">
              <p className="font-body text-sm text-muted-foreground mb-1">24h Change</p>
              <p className={`font-display text-2xl sm:text-3xl ${
                priceChange24h !== null 
                  ? priceChange24h >= 0 
                    ? "text-green-500" 
                    : "text-red-500"
                  : "text-foreground"
              }`}>
                {isLoading ? (
                  <span className="opacity-50">...</span>
                ) : priceChange24h !== null ? (
                  `${priceChange24h >= 0 ? '+' : ''}${priceChange24h.toFixed(2)}%`
                ) : (
                  "N/A"
                )}
              </p>
            </div>
          </div>
        </div>

        {/* Chart iframe */}
        <div className="card-glow overflow-hidden">
          <iframe
            src={`https://dexscreener.com/solana/${TOKEN_ADDRESS}?embed=1&theme=dark&trades=0&info=0`}
            title="$BUCK Dexscreener Chart"
            className="w-full border-0 min-h-[300px] sm:min-h-[400px]"
            style={{ height: "100%", maxHeight: 400 }}
            allow="clipboard-write"
          />
        </div>

        <p className="text-center mt-4">
          <a
            href={`https://dexscreener.com/solana/${TOKEN_ADDRESS}`}
            target="_blank"
            rel="noopener noreferrer"
            className="font-body text-foreground hover:text-primary transition-colors inline-flex items-center gap-2 underline underline-offset-2"
          >
            View full chart on Dexscreener →
          </a>
        </p>
      </div>
    </section>
  );
};
