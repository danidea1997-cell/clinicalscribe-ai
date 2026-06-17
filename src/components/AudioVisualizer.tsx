import { useEffect, useState } from "react";

interface AudioVisualizerProps {
  isRecording: boolean;
}

export function AudioVisualizer({ isRecording }: AudioVisualizerProps) {
  const [heights, setHeights] = useState<number[]>([15, 20, 15, 25, 30, 15, 20, 25, 10, 15, 20, 35, 15, 20]);

  useEffect(() => {
    if (!isRecording) {
      setHeights(new Array(32).fill(6));
      return;
    }

    const interval = setInterval(() => {
      setHeights(
        Array.from({ length: 32 }, () => {
          // Generate a smooth clinical fluctuation
          const base = Math.sin(Date.now() / 200) * 10 + 20;
          const randomNoise = Math.random() * 25;
          return Math.max(6, Math.min(64, base + randomNoise));
        })
      );
    }, 120);

    return () => clearInterval(interval);
  }, [isRecording]);

  return (
    <div className="flex items-center justify-center gap-[4px] h-16 w-full max-w-md bg-stone-50 border border-stone-200/80 rounded-xl px-4 select-none">
      <div className="text-stone-400 font-mono text-[10px] tracking-wider uppercase mr-3">
        {isRecording ? "MIC SIGNAL" : "MIC MUTED"}
      </div>
      <div className="flex items-center gap-[3px] h-8 flex-1">
        {heights.map((h, i) => (
          <div
            key={i}
            className={`w-[3px] rounded-full transition-all duration-100 ${
              isRecording
                ? "bg-teal-500 shadow-[0_0_8px_rgba(20,184,166,0.3)] animate-pulse"
                : "bg-stone-300"
            }`}
            style={{
              height: `${h}%`,
            }}
          />
        ))}
      </div>
      <div className="flex items-center gap-1.5 ml-3">
        <span
          className={`h-2 w-2 rounded-full ${
            isRecording ? "bg-rose-500 animate-ping" : "bg-stone-300"
          }`}
        />
        <span className="font-mono text-[11px] font-medium text-stone-500">
          {isRecording ? "LIVE" : "STBY"}
        </span>
      </div>
    </div>
  );
}
