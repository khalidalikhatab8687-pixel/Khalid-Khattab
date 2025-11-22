
import React, { useEffect, useRef, useState } from 'react';

interface MuseumStatueProps {
  analyser: AnalyserNode | null;
  isSpeaking: boolean;
  isListening: boolean;
}

const MuseumStatue: React.FC<MuseumStatueProps> = ({ analyser, isSpeaking, isListening }) => {
  const [intensity, setIntensity] = useState(0);
  const requestRef = useRef<number>();

  useEffect(() => {
    if (!analyser || !isSpeaking) {
      // Smooth decay when stopping
      if (intensity > 0.01) {
        requestRef.current = requestAnimationFrame(() => setIntensity(intensity * 0.9));
      } else {
        setIntensity(0);
      }
      return;
    }

    const updateIntensity = () => {
      const dataArray = new Uint8Array(analyser.frequencyBinCount);
      analyser.getByteFrequencyData(dataArray);
      
      // Calculate volume energy
      let sum = 0;
      const range = Math.floor(dataArray.length / 2); // Low freqs
      for (let i = 0; i < range; i++) {
        sum += dataArray[i];
      }
      const average = sum / range;
      
      // Normalize
      const target = Math.min(1, average / 80);
      // Smooth transition
      setIntensity(prev => prev + (target - prev) * 0.3);
      
      requestRef.current = requestAnimationFrame(updateIntensity);
    };

    updateIntensity();

    return () => {
      if (requestRef.current) cancelAnimationFrame(requestRef.current);
    };
  }, [analyser, isSpeaking, intensity]);

  return (
    <div className="relative w-full h-full flex flex-col items-center justify-center">
      
      {/* Magical Aura Background */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-amber-500/5 blur-[100px] rounded-full pointer-events-none transition-all duration-100"
           style={{ opacity: 0.3 + intensity }} />

      {/* SVG Pharaoh Mask - Embedded to ensure visibility */}
      <div className="relative w-64 h-80 md:w-80 md:h-96 transition-transform duration-100"
           style={{ transform: `scale(${1 + intensity * 0.05})` }}>
        
        {/* Glow Filter */}
        <svg width="0" height="0">
            <filter id="gold-glow">
                <feGaussianBlur stdDeviation="2.5" result="coloredBlur"/>
                <feMerge>
                    <feMergeNode in="coloredBlur"/>
                    <feMergeNode in="SourceGraphic"/>
                </feMerge>
            </filter>
        </svg>

        {/* The Mask */}
        <svg viewBox="0 0 200 280" className="w-full h-full drop-shadow-2xl" style={{ filter: isSpeaking ? 'drop-shadow(0 0 15px rgba(217,119,6,0.6))' : 'none' }}>
            {/* Nemes (Headcloth) - Blue/Gold Stripes */}
            <path d="M30 60 Q 100 -20 170 60 L 190 180 Q 195 220 160 240 L 150 200 L 50 200 L 40 240 Q 5 220 10 180 Z" fill="#1e3a8a" stroke="#d97706" strokeWidth="3" />
            <path d="M35 70 Q 100 0 165 70" fill="none" stroke="#d97706" strokeWidth="3" />
            <path d="M25 90 Q 100 20 175 90" fill="none" stroke="#d97706" strokeWidth="3" />
            <path d="M20 110 Q 100 40 180 110" fill="none" stroke="#d97706" strokeWidth="3" />
            <path d="M15 130 Q 100 60 185 130" fill="none" stroke="#d97706" strokeWidth="3" />
            
            {/* Face - Gold */}
            <path d="M50 80 Q 100 70 150 80 L 155 160 Q 150 210 100 215 Q 50 210 45 160 Z" fill="#fbbf24" />
            
            {/* Eyes - Black & White with Cyan Glow when speaking */}
            <path d="M60 110 Q 75 100 90 110 Q 75 120 60 110" fill="#f8fafc" stroke="black" strokeWidth="1" />
            <circle cx="75" cy="110" r="3" fill={isSpeaking ? "#22d3ee" : "black"} className="transition-colors duration-100" />
            
            <path d="M110 110 Q 125 100 140 110 Q 125 120 110 110" fill="#f8fafc" stroke="black" strokeWidth="1" />
            <circle cx="125" cy="110" r="3" fill={isSpeaking ? "#22d3ee" : "black"} className="transition-colors duration-100" />
            
            {/* Nose */}
            <path d="M95 115 L 105 115 L 100 145 Z" fill="#d97706" opacity="0.5" />
            
            {/* Mouth */}
            <path d="M85 160 Q 100 170 115 160" fill="none" stroke="#92400e" strokeWidth="2" />

            {/* Beard */}
            <rect x="90" y="215" width="20" height="40" rx="5" fill="#1e3a8a" stroke="#d97706" strokeWidth="2" />
            
            {/* Cobra (Uraeus) */}
            <path d="M95 40 Q 100 20 105 40 L 100 60 Z" fill="#b91c1c" />
        </svg>
      </div>

      {/* Status Text */}
      <div className="mt-8 text-center">
        {isSpeaking ? (
            <div className="text-amber-400 font-bold tracking-widest text-lg animate-pulse">
                يتحدث...
            </div>
        ) : isListening ? (
            <div className="flex items-center justify-center gap-2">
                <span className="flex h-3 w-3 relative">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-cyan-500"></span>
                </span>
                <span className="text-cyan-400 text-sm font-light">يستمع إليك...</span>
            </div>
        ) : (
            <div className="text-slate-500 text-sm">في انتظار الإذن...</div>
        )}
      </div>

      {/* Audio Visualizer Ring when speaking */}
      {isSpeaking && (
        <div 
            className="absolute w-96 h-96 border-4 border-amber-500/30 rounded-full transition-all duration-75"
            style={{ 
                transform: `scale(${1 + intensity * 0.3})`,
                opacity: 0.5 - intensity * 0.2
            }}
        />
      )}
    </div>
  );
};

export default MuseumStatue;
