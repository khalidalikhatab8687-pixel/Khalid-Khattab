
import React from 'react';
import VoiceAgent from './components/VoiceAgent';

const App: React.FC = () => {
  return (
    <div className="h-screen w-screen bg-[#0a0a0a] text-slate-100 font-['Cairo'] overflow-hidden flex flex-col relative">
      
      {/* --- Grand Egyptian Museum (GEM) Theme --- */}
      
      {/* 1. Geometric Triangular Facade Pattern (CSS) */}
      <div className="absolute inset-0 z-0 opacity-20 pointer-events-none"
           style={{
             backgroundImage: `
                linear-gradient(30deg, #1a1a1a 12%, transparent 12.5%, transparent 87%, #1a1a1a 87.5%, #1a1a1a),
                linear-gradient(150deg, #1a1a1a 12%, transparent 12.5%, transparent 87%, #1a1a1a 87.5%, #1a1a1a),
                linear-gradient(30deg, #1a1a1a 12%, transparent 12.5%, transparent 87%, #1a1a1a 87.5%, #1a1a1a),
                linear-gradient(150deg, #1a1a1a 12%, transparent 12.5%, transparent 87%, #1a1a1a 87.5%, #1a1a1a),
                radial-gradient(circle at 50% 0%, #2d2d2d 0%, #000000 80%)
             `,
             backgroundSize: '80px 140px, 80px 140px, 80px 140px, 80px 140px, 100% 100%',
             backgroundPosition: '0 0, 0 0, 40px 70px, 40px 70px, 0 0'
           }}
      />

      {/* 2. Dark Stone Texture Overlay */}
      <div className="absolute inset-0 z-0 opacity-30 pointer-events-none mix-blend-overlay url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI0IiBoZWlnaHQ9IjQiPgo8cmVjdCB3aWR0aD0iNCIgaGVpZ2h0PSI0IiBmaWxsPSIjZmZmIiAvPgo8cmVjdCB3aWR0aD0iMSIgaGVpZ2h0PSIxIiBmaWxsPSIjMDAwIiAvPgo8L3N2Zz4=')"></div>

      {/* 3. The GEM Hall Ambience (Light Shafts) */}
      <div className="absolute inset-0 z-0 pointer-events-none bg-[conic-gradient(from_90deg_at_50%_-20%,#000000_0deg,#1e1b4b_20deg,#000000_40deg)] opacity-40 mix-blend-screen"></div>
      
      {/* 4. Gold Dust Particles */}
      <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden">
          {[...Array(20)].map((_, i) => (
              <div 
                key={i}
                className="absolute bg-amber-500/30 rounded-full blur-[1px] animate-pulse"
                style={{
                    top: `${Math.random() * 100}%`,
                    left: `${Math.random() * 100}%`,
                    width: `${Math.random() * 4 + 1}px`,
                    height: `${Math.random() * 4 + 1}px`,
                    animationDuration: `${Math.random() * 5 + 3}s`,
                    opacity: Math.random() * 0.5
                }}
              />
          ))}
      </div>

      {/* 5. Cartouche Border (Simplified for GEM modern look) */}
      <div className="absolute inset-4 z-50 pointer-events-none border border-amber-700/30 rounded-sm">
        {/* Decorative Corners */}
        <div className="absolute top-0 left-0 w-4 h-4 border-t border-l border-amber-600"></div>
        <div className="absolute top-0 right-0 w-4 h-4 border-t border-r border-amber-600"></div>
        <div className="absolute bottom-0 left-0 w-4 h-4 border-b border-l border-amber-600"></div>
        <div className="absolute bottom-0 right-0 w-4 h-4 border-b border-r border-amber-600"></div>
        
        {/* Top Center Label */}
        <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-4 bg-[#0a0a0a]">
            <span className="text-amber-700/80 text-[10px] tracking-[0.4em] uppercase">GEM • Hall 1</span>
        </div>
      </div>

      {/* Vignette */}
      <div className="absolute inset-0 z-0 pointer-events-none bg-[radial-gradient(circle,transparent_40%,#000000_100%)]" />

      <main className="relative z-10 flex-1 w-full h-full">
        <VoiceAgent />
      </main>
    </div>
  );
};

export default App;
