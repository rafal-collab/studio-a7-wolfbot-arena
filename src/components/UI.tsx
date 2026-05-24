/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */
import { useState } from 'react';
import { useGameStore } from '../store/gameStore';
import { motion, AnimatePresence } from 'framer-motion';
import { ExternalLink, Trophy, Code2, Terminal, Copy, Check, Globe, X, Sparkles, Server, Zap } from 'lucide-react';

export function UI() {
  const { gameState, playerId, joinGame } = useGameStore();
  const [showEmbedModal, setShowEmbedModal] = useState(false);
  const [activeTab, setActiveTab] = useState<'embed' | 'hosting' | 'seo'>('embed');
  const [copied, setCopied] = useState(false);

  const player = playerId && gameState ? gameState.players[playerId] : null;
  const isAlive = player?.state === 'alive';
  const isDead = player?.state === 'dead';

  const handleOpenNewTab = () => {
    window.open(window.location.href, '_blank');
  };

  const iframeCode = `<div class="a7-game-container" style="position: relative; width: 100%; max-width: 1200px; height: 650px; margin: 0 auto; border-radius: 16px; overflow: hidden; border: 1px solid #1e293b; box-shadow: 0 10px 30px rgba(0,0,0,0.5);"> <iframe src="${window.location.origin}" style="width: 100%; height: 100%; border: none;" allow="autoplay; fullscreen; pointer-lock;" referrerpolicy="no-referrer"> </iframe> </div>`;

  const handleCopyCode = () => {
    navigator.clipboard.writeText(iframeCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="absolute inset-0 pointer-events-none flex flex-col justify-between p-4 font-mono select-none">
      {/* Top Bar */}
      <div className="flex justify-between items-start pointer-events-auto relative">
        <div className="flex flex-col gap-2 z-10 bg-slate-950/70 p-4 rounded-xl border border-slate-800/60 backdrop-blur-md">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
            <h1 className="text-xl font-bold tracking-tight text-white flex items-center gap-1.5">
              STUDIO A7 <span className="text-slate-500 text-sm font-normal">// WOLF.BOT.ARENA</span>
            </h1>
          </div>
          <div className="flex gap-4 text-xs text-slate-400 border-t border-slate-800/80 pt-2">
            <div>
              <span className="text-slate-500">SYS_STATUS:</span>
              <span className="text-emerald-400 font-bold font-mono">STABLE_60HZ</span>
            </div>
            {isAlive && (
              <div>
                <span className="text-slate-500">WOLF_LENGTH:</span>
                <span className="text-blue-400 font-bold">{Math.floor(player.score)}</span>
              </div>
            )}
          </div>
        </div>

        {/* Middle Indicators */}
        <div className="absolute left-1/2 -translate-x-1/2 top-0 flex flex-col items-center gap-1.5 opacity-90 hidden lg:flex">
          <div className="flex gap-2">
            <div className="flex items-center gap-1.5 text-[11px] text-slate-300 bg-slate-950/85 px-3 py-1 rounded border border-slate-800">
              <span className="font-bold bg-slate-800 px-1 py-0.5 rounded text-white text-[10px]">A</span>
              <span className="font-bold bg-slate-800 px-1 py-0.5 rounded text-white text-[10px]">D</span>
              <span className="text-slate-400 uppercase tracking-wider text-[9px]">STEER WOLF</span>
            </div>
            <div className="flex items-center gap-1.5 text-[11px] text-slate-300 bg-slate-950/85 px-3 py-1 rounded border border-slate-800">
              <span className="font-bold bg-slate-800 px-1 py-0.5 rounded text-white text-[10px]">SPACE</span>
              <span className="text-slate-400 uppercase tracking-wider text-[9px]">BOOST SPEED</span>
            </div>
          </div>
        </div>

        <div className="flex gap-2 z-10">
          <button onClick={() => setShowEmbedModal(true)} className="flex items-center gap-2 px-3.5 py-2 bg-slate-900/95 hover:bg-slate-800/90 border border-slate-800 hover:border-slate-700 rounded text-slate-300 hover:text-white text-xs font-bold transition-all" >
            <Code2 size={14} className="text-blue-400" />
            <span>DEPLOY & EMBED</span>
          </button>
          <button onClick={handleOpenNewTab} className="flex items-center gap-2 px-3.5 py-2 bg-slate-900/95 hover:bg-slate-800/90 border border-slate-800 hover:border-slate-700 rounded text-slate-300 hover:text-white text-xs font-bold transition-all" >
            <ExternalLink size={14} />
            <span>NEW TAB</span>
          </button>
        </div>
      </div>

      {/* Leaderboard */}
      {gameState && gameState.leaderboard.length > 0 && (
        <div className="absolute top-24 right-4 w-64 bg-slate-950/90 border border-slate-800/80 backdrop-blur-md rounded px-4 py-3.5 pointer-events-auto">
          <div className="flex items-center justify-between border-b border-slate-800 pb-2 mb-2 w-full">
            <div className="flex items-center gap-2 text-slate-300 font-bold text-xs">
              <Trophy size={14} className="text-amber-400" />
              <span>ARENA_RANKINGS</span>
            </div>
            <span className="text-[10px] text-slate-500">PLAYERS: {Object.keys(gameState.players).length}</span>
          </div>
          <div className="flex flex-col gap-1.5 max-h-[180px] overflow-y-auto pr-1">
            {gameState.leaderboard.map((entry, i) => (
              <div key={entry.id} className="flex justify-between items-center text-xs">
                <div className="flex items-center gap-1.5 truncate">
                  <span className="text-slate-600 font-bold w-4 text-right">{i + 1}.</span>
                  <span style={{ color: entry.id === playerId ? '#ffffff' : entry.color }} className={`font-semibold truncate max-w-[130px] ${entry.id === playerId ? 'underline decoration-dotted underline-offset-2' : ''}`} >
                    {entry.name}{entry.id === playerId ? ' (YOU)' : ''}
                  </span>
                </div>
                <span className="font-mono text-slate-400 font-bold text-[11px]">{entry.score}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Lobby Overlay */}
      <AnimatePresence>
        {(!player || isDead) && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 flex items-center justify-center pointer-events-auto bg-[#04060b]/80 backdrop-blur-sm z-50 p-4" >
            <div className="bg-slate-950 border border-slate-800 rounded-lg p-6 max-w-sm w-full shadow-2xl relative overflow-hidden">
              <div className="absolute right-0 top-0 text-[80px] opacity-5 select-none font-sans font-black pointer-events-none"> A7 </div>
              <div className="flex items-center gap-2 text-xs text-slate-500 uppercase tracking-widest border-b border-slate-800/80 pb-3 mb-4">
                <Terminal size={14} className="text-indigo-400" />
                <span>STUDIO A7 // CENTRAL COMMAND</span>
              </div>
              {isDead ? (
                <div className="text-center mb-6">
                  <h2 className="text-2xl font-black text-rose-500 tracking-tight font-sans mb-1"> SYSTEM OFFLINE </h2>
                  <p className="text-slate-400 text-xs font-mono"> Twój Cyber-Wilk uległ kolizji! Wynik: <span className="text-emerald-400 font-bold">{Math.floor(player?.score || 0)}</span>. </p>
                </div>
              ) : (
                <div className="mb-6">
                  <h2 className="text-2xl font-black text-white tracking-tight font-sans mb-2"> WOLF BOT ARENA </h2>
                  <p className="text-slate-400 text-xs font-mono leading-relaxed"> Witaj w oficjalnym pokazie technologicznym Studio A7 3D WebGL. Steruj cybernetycznym Wilkiem, unikaj kolizji z innymi graczami i zbieraj kryształy energii, aby zdominować arenę! </p>
                </div>
              )}
              <button onClick={joinGame} className="w-full py-3 bg-[#e2e8f0]/95 hover:bg-white text-slate-950 font-bold rounded text-sm transition-all shadow-lg active:scale-95 flex items-center justify-center gap-2 cursor-pointer" >
                <Zap size={14} /> <span>{isDead ? 'RELAUNCH SYSTEM' : 'LAUNCH WOLF BOT'}</span>
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Footer Branding */}
      <div className="w-full pointer-events-auto flex justify-between items-center text-[10px] text-slate-600 border-t border-slate-900 pt-3 z-10 select-none">
        <div> <span>SYSTEM_OPERATIONAL // SECURE SOCKETS ACTIVE (WSS)</span> </div>
        <div> <span>// STUDIO A7: ADVANCED WEB INTERFACES SHOWCASE</span> </div>
      </div>
    </div>
  );
}
