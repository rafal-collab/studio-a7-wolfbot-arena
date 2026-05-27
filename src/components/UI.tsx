/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */
import { useGameStore } from '../store/gameStore';
import { motion, AnimatePresence } from 'framer-motion';
import { ExternalLink, Trophy, Terminal, Zap, ArrowLeft, ArrowRight } from 'lucide-react';

export function UI() {
  const { gameState, playerId, joinGame } = useGameStore();

  const player = playerId && gameState ? gameState.players[playerId] : null;
  const isAlive = player?.state === 'alive';
  const isDead = player?.state === 'dead';

  const handleOpenNewTab = () => {
    window.open(window.location.href, '_blank');
  };

  // Funkcja symulująca wciskanie fizycznych klawiszy dla ekranów dotykowych
  const simulateKey = (type: 'keydown' | 'keyup', key: string, code: string) => {
    const event = new KeyboardEvent(type, {
      key: key,
      code: code,
      bubbles: true,
      cancelable: true
    });
    window.dispatchEvent(event);
  };

  return (
    <div className="absolute inset-0 pointer-events-none flex flex-col justify-between p-4 font-mono select-none">
      {/* Top Bar / Telemetry Console */}
      <div className="flex justify-between items-start pointer-events-auto relative">
        <div className="flex flex-col gap-1 sm:gap-2 z-10 bg-slate-950/70 p-2 sm:p-4 rounded-xl border border-slate-800/60 backdrop-blur-md max-w-[150px] sm:max-w-none">
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 sm:w-2.5 sm:h-2.5 rounded-full bg-emerald-500 animate-pulse" />
            <h1 className="text-[10px] sm:text-xl font-bold tracking-tight text-white flex flex-wrap items-center gap-0.5 sm:gap-1.5">
              STUDIO A7 <span className="text-slate-500 text-[9px] sm:text-sm font-normal">| WOLF BOT ARENA</span>
            </h1>
          </div>
          <div className="flex flex-col sm:flex-row gap-0.5 sm:gap-4 text-[8px] sm:text-xs text-slate-400 border-t border-slate-800/80 pt-1 sm:pt-2">
            <div>
              <span className="text-slate-500">SYS STATUS:</span>
              <span className="text-emerald-400 font-bold font-mono ml-1">STABLE 60HZ</span>
            </div>
            {isAlive && (
              <div>
                <span className="text-slate-500">Ogon SEO:</span>
                <span className="text-blue-400 font-bold ml-1">{Math.floor(player.score)}</span>
              </div>
            )}
          </div>
        </div>

        {/* Middle Indicators / Guide Keybinds */}
        <div className="absolute left-1/2 -translate-x-1/2 top-0 flex flex-col items-center gap-1.5 opacity-90 hidden lg:flex">
          <div className="flex gap-2">
            <div className="flex items-center gap-1.5 text-[11px] text-slate-300 bg-slate-950/85 px-3 py-1 rounded border border-slate-800">
              <span className="font-bold bg-slate-800 px-1 py-0.5 rounded text-white text-[10px]">A</span>
              <span className="font-bold bg-slate-800 px-1 py-0.5 rounded text-white text-[10px]">D</span>
              <span className="text-slate-400 uppercase tracking-wider text-[9px]">Wybór strategii SEO</span>
            </div>
            <div className="flex items-center gap-1.5 text-[11px] text-slate-300 bg-slate-950/85 px-3 py-1 rounded border border-slate-800">
              <span className="font-bold bg-slate-800 px-1 py-0.5 rounded text-white text-[10px]">SPACE</span>
              <span className="text-slate-400 uppercase tracking-wider text-[9px]">Dopalacz pozycji w SERP</span>
            </div>
          </div>
          <p className="text-[10px] text-slate-500 tracking-tight font-sans max-w-md text-center leading-normal">
            Przeprowadź audyt SEO, wybierz kierunek strategii i ruszaj na podbój Świata SEO, zbierając po drodze fotony i pokonując konkurencję!
          </p>
        </div>

        {/* System Utilities Corner */}
        <div className="flex gap-2 z-10">
          <button onClick={handleOpenNewTab} className="flex items-center gap-1.5 px-2 sm:px-3.5 py-1.5 sm:py-2 bg-slate-900/95 hover:bg-slate-800/90 border border-slate-800 hover:border-slate-700 rounded text-slate-300 hover:text-white text-[10px] sm:text-xs font-bold transition-all">
            <ExternalLink size={12} className="sm:w-3.5 sm:h-3.5" />
            <span>Pełny ekran</span>
          </button>
        </div>
      </div>

      {/* Leaderboard - Pure Slate Code Theme */}
      {gameState && gameState.leaderboard.length > 0 && (
        <div className="absolute top-20 sm:top-24 right-2 sm:right-4 w-36 sm:w-64 bg-slate-950/90 border border-slate-800/80 backdrop-blur-md rounded px-2 sm:px-4 py-2 sm:py-3.5 pointer-events-auto">
          <div className="flex items-center justify-between border-b border-slate-800 pb-1.5 sm:pb-2 mb-1.5 sm:mb-2 w-full">
            <div className="flex items-center gap-1 sm:gap-2 text-slate-300 font-bold text-[9px] sm:text-xs">
              <Trophy size={12} className="text-amber-400 sm:w-3.5 sm:h-3.5" />
              <span>Ranking Wilków SEO</span>
            </div>
            <span className="text-[8px] sm:text-[10px] text-slate-500">Gracze: {Object.keys(gameState.players).length}</span>
          </div>
          <div className="flex flex-col gap-1 max-h-[120px] sm:max-h-[180px] overflow-y-auto pr-1">
            {gameState.leaderboard.map((entry, i) => (
              <div key={entry.id} className="flex justify-between items-center text-[10px] sm:text-xs">
                <div className="flex items-center gap-1 truncate">
                  <span className="text-slate-600 font-bold w-3 sm:w-4 text-right">{i + 1}.</span>
                  <span style={{ color: entry.id === playerId ? '#ffffff' : entry.color }} className={`font-semibold truncate max-w-[55px] sm:max-w-[130px] ${entry.id === playerId ? 'underline decoration-dotted underline-offset-2' : ''}`}>
                    {entry.name}{entry.id === playerId ? ' (TY)' : ''}
                  </span>
                </div>
                <span className="font-mono text-slate-400 font-bold text-[10px] sm:text-[11px]">{entry.score}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Kontroler dotykowy dla urządzeń mobilnych */}
      {isAlive && (
        <div className="fixed bottom-14 left-4 right-4 flex justify-between items-center pointer-events-auto lg:hidden z-40">
          {/* Przyciski sterowania Lewo / Prawo */}
          <div className="flex gap-3">
            <button
              onTouchStart={() => simulateKey('keydown', 'a', 'KeyA')}
              onTouchEnd={() => simulateKey('keyup', 'a', 'KeyA')}
              onMouseDown={() => simulateKey('keydown', 'a', 'KeyA')}
              onMouseUp={() => simulateKey('keyup', 'a', 'KeyA')}
              className="w-14 h-14 bg-slate-950/80 border-2 border-slate-700 active:border-blue-500 rounded-full flex items-center justify-center text-white select-none active:scale-90 transition-transform"
            >
              <ArrowLeft size={24} />
            </button>
            <button
              onTouchStart={() => simulateKey('keydown', 'd', 'KeyD')}
              onTouchEnd={() => simulateKey('keyup', 'd', 'KeyD')}
              onMouseDown={() => simulateKey('keydown', 'd', 'KeyD')}
              onMouseUp={() => simulateKey('keyup', 'd', 'KeyD')}
              className="w-14 h-14 bg-slate-950/80 border-2 border-slate-700 active:border-blue-500 rounded-full flex items-center justify-center text-white select-none active:scale-90 transition-transform"
            >
              <ArrowRight size={24} />
            </button>
          </div>

          {/* Przycisk Dopalacza (Boost) */}
          <div>
            <button
              onTouchStart={() => simulateKey('keydown', ' ', 'Space')}
              onTouchEnd={() => simulateKey('keyup', ' ', 'Space')}
              onMouseDown={() => simulateKey('keydown', ' ', 'Space')}
              onMouseUp={() => simulateKey('keyup', ' ', 'Space')}
              className="w-16 h-16 bg-red-950/80 border-2 border-red-700 active:border-red-500 rounded-full flex flex-col items-center justify-center text-white select-none active:scale-90 transition-transform font-sans"
            >
              <Zap size={20} className="text-yellow-400 animate-pulse" />
              <span className="text-[9px] font-bold tracking-tighter mt-0.5">BOOST</span>
            </button>
          </div>
        </div>
      )}

      {/* Interactive Lobby & Respawn Overlays */}
      <AnimatePresence>
        {(!player || isDead) && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 flex items-center justify-center pointer-events-auto bg-[#04060b]/80 backdrop-blur-sm z-50 p-4">
            <div className="bg-slate-950 border border-slate-800 rounded-lg p-6 max-w-sm w-full shadow-2xl relative overflow-hidden">
              <div className="absolute right-0 top-0 text-[80px] opacity-5 select-none font-sans font-black pointer-events-none">
                A7
              </div>
              
              {/* Header */}
              <div className="flex items-center gap-2 text-xs text-slate-500 uppercase tracking-widest border-b border-slate-800/80 pb-3 mb-4">
                <Terminal size={14} className="text-indigo-400" />
                <span>STUDIO A7 | Centrum dowodzenia</span>
              </div>

              {isDead ? (
                <div className="text-center mb-6">
                  <h2 className="text-2xl font-black text-rose-500 tracking-tight font-sans mb-1">KLIENT ZDEAKTYWOWANY</h2>
                  <p className="text-slate-400 text-xs font-mono">
                    Twój Wilk SEO uległ kolizji! Osiągnięta długość: <span className="text-emerald-400 font-bold">{Math.floor(player?.score || 0)}</span>.
                  </p>
                </div>
              ) : (
                <div className="mb-6">
                  <h2 className="text-2xl font-black text-white tracking-tight font-sans mb-2">WOLF BOT ARENA</h2>
                  <p className="text-slate-400 text-xs font-mono leading-relaxed">
                    Wieloosobowa gra zręcznościowa (3D WebGL Multiplayer Online Game). Poprowadź swojego cybernetycznego Wilka SEO do galaktycznej dominacji! Unikaj kolizji z innymi graczami i zbieraj Fotony w kolorze Twojego wilka, by poszerzyć swoją ekspansję na cały świat SEO Universe. Niech Moc będzie z Tobą!
                  </p>
                </div>
              )}

              {/* Functional Play Button */}
              <button onClick={joinGame} className="w-full py-3 bg-[#e2e8f0]/95 hover:bg-white text-slate-950 font-bold rounded text-sm transition-all shadow-lg active:scale-95 flex items-center justify-center gap-2 cursor-pointer">
                <Zap size={14} />
                <span>{isDead ? 'REAKTYWUJ WILKA' : 'UWOLNIJ WILKA SEO'}</span>
              </button>

              <div className="mt-4 flex justify-between items-center text-[10px] text-slate-500 border-t border-slate-900 pt-3">
                <span>V.1.02 REALTIME</span>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Footer Branding Telemetry */}
      <div className="w-full pointer-events-auto flex justify-between items-center text-[10px] text-slate-600 border-t border-slate-900 pt-3 z-10 select-none">
        <div><span>SYSTEM OPERATIONAL | SECURE SOCKETS ACTIVE (WSS)</span></div>
        <div><span>STUDIO A7 | DIGITAL EXPERIENCE & INTERACTIVE SHOWCASE</span></div>
      </div>
    </div>
  );
}
