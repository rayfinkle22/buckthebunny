import { useState } from "react";
import { Link } from "react-router-dom";
import { useMarketData, formatMarketCap, TOKEN_ADDRESS } from "@/hooks/useMarketData";
import { Menu, X, ChartLine, Home, Rocket } from "lucide-react";
import buckLogo from "@/assets/buck-logo.jpeg";

const navItems = [
  { id: "hero", label: "Home", icon: Home },
  { id: "chart", label: "Chart", icon: ChartLine },
  { id: "pumpfun", label: "Pump.fun", icon: Rocket, href: `https://pump.fun/coin/${TOKEN_ADDRESS}` },
  { id: "official-x", label: "Official X", icon: null, href: "https://x.com/itsbuckthebunny" },
  { id: "x-community", label: "X Community", icon: null, href: "https://x.com/i/communities/1960729088890691700" },
];

const XIcon = () => (
  <svg viewBox="0 0 24 24" className="w-4 h-4 fill-current">
    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
  </svg>
);

export const Header = () => {
  const { marketCap, isLoading } = useMarketData();
  const [menuOpen, setMenuOpen] = useState(false);

  const scrollToSection = (id: string) => {
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: "smooth" });
    }
    setMenuOpen(false);
  };

  return (
    <header className="fixed top-0 left-0 right-0 z-50 w-full bg-background/95 backdrop-blur-lg border-b border-border">
      <div className="max-w-6xl mx-auto px-3 py-2 sm:py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link to="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
              <img 
                src={buckLogo} 
                alt="Buck Logo" 
                className="w-8 h-8 sm:w-10 sm:h-10 rounded-full object-cover border-2 border-primary" 
              />
              <span className="font-display text-lg sm:text-2xl text-foreground tracking-wide">
                BUCK THE BUNNY
              </span>
            </Link>
          </div>
          
          <div className="flex items-center gap-2">
            {/* Market Cap Display */}
            <div className="flex items-center px-3 h-8 rounded-md btn-hero">
              <span className="font-display text-sm sm:text-base text-primary-foreground">
                {isLoading ? (
                  <span className="opacity-50">...</span>
                ) : marketCap ? (
                  formatMarketCap(marketCap)
                ) : (
                  "$BUCK"
                )}
              </span>
            </div>

            {/* X Community Button */}
            <a
              href="https://x.com/i/communities/1960729088890691700"
              target="_blank"
              rel="noopener noreferrer"
              className="w-8 h-8 rounded-md border border-border bg-secondary hover:bg-primary/20 flex items-center justify-center transition-all text-foreground hover:text-primary"
              aria-label="X Community"
            >
              <XIcon />
            </a>

            {/* Quick Nav Menu Button */}
            <div className="relative">
              <button
                onClick={() => setMenuOpen(!menuOpen)}
                className="w-8 h-8 rounded-md border border-border bg-secondary hover:bg-primary/20 flex items-center justify-center transition-all text-foreground hover:text-primary"
                aria-label="Quick navigation"
              >
                {menuOpen ? (
                  <X className="w-4 h-4" />
                ) : (
                  <Menu className="w-4 h-4" />
                )}
              </button>

              {/* Dropdown menu */}
              <div
                className={`absolute top-10 right-0 z-50 flex flex-col gap-1 p-2 bg-card border border-border rounded-lg shadow-lg transition-all duration-200 min-w-[140px] ${
                  menuOpen ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-2 pointer-events-none"
                }`}
              >
                {navItems.map((item) =>
                  item.href ? (
                    <a
                      key={item.id}
                      href={item.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 px-3 py-2 rounded-md hover:bg-primary/20 transition-all text-left"
                      onClick={() => setMenuOpen(false)}
                    >
                      {item.icon ? (
                        <item.icon className="w-4 h-4 text-primary" />
                      ) : (
                        <XIcon />
                      )}
                      <span className="font-body text-sm text-foreground">{item.label}</span>
                    </a>
                  ) : (
                    <button
                      key={item.id}
                      onClick={() => scrollToSection(item.id)}
                      className="flex items-center gap-2 px-3 py-2 rounded-md hover:bg-primary/20 transition-all text-left"
                    >
                      {item.icon && <item.icon className="w-4 h-4 text-primary" />}
                      <span className="font-body text-sm text-foreground">{item.label}</span>
                    </button>
                  )
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};
