import { useState } from "react";
import countdownVideo from "@/assets/countdown-animation.mp4";

export const CountdownVideo = ({ className = "" }: { className?: string }) => {
  const [loaded, setLoaded] = useState(false);

  return (
    <div className={`relative ${className}`}>
      {!loaded && (
        <div className="absolute inset-0 flex items-center justify-center bg-card rounded-xl animate-pulse">
          <span className="text-muted-foreground font-body text-sm">Loading animation…</span>
        </div>
      )}
      <video
        src={countdownVideo}
        autoPlay
        loop
        muted
        playsInline
        preload="auto"
        onCanPlay={() => setLoaded(true)}
        className={`w-full rounded-xl transition-opacity duration-500 ${loaded ? "opacity-100" : "opacity-0"}`}
      />
    </div>
  );
};
