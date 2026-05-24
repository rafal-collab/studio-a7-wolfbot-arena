/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import { useState } from 'react';
import { useGameStore } from '../store/gameStore';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ExternalLink, 
  Trophy, 
  Code2, 
  Terminal, 
  Copy, 
  Check, 
  Globe, 
  BookOpen,
  X,
  Sparkles,
  Server,
  Zap
} from 'lucide-react';

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

  const iframeCode = `<div class="a7-game-container" style="position: relative; width: 100%; max-width: 1200px; height: 650px; margin: 0 auto; border-radius: 16px; overflow: hidden; border: 1px solid #1e293b; box-shadow: 0 10px 30px rgba(0,0,0,0.5);">
  <iframe 
    src="${window.location.origin}" 
    style="width: 100%; height: 100%; border: none;" 
    allow="autoplay; fullscreen; pointer-lock;" 
    referrerpolicy="no-referrer">
  </iframe>
</div>`;

  const handleCopyCode = () => {
    navigator.clipboard.writeText(iframeCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="absolute inset-0 pointer-events-none flex flex-col justify-between p-4 font-mono select-none">
      {/* Top Bar / Telemetry Console */}
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
              <span className="text-slate-500">SYS_STATUS:</span> <span className="text-emerald-400 font-bold font-mono">STABLE_60HZ</span>
            </div>
            {isAlive && (
              <div>
                <span className="text-slate-500">WOLF_LENGTH:</span> <span className="text-blue-400 font-bold">{Math.floor(player.score)}</span>
              </div>
            )}
          </div>
        </div>
        
        {/* Middle Indicators / Guide Keybinds (Hidden on small screens) */}
        <div className="absolute left-1/2 -translate-x-1/2 top-0 flex flex-col items-center gap-1.5 opacity-90 hidden lg:flex">
          <div className="flex gap-2">
            <div className="flex items-center gap-1.5 text-[11px] text-slate-300 bg-slate-950/85 px-3 py-1 rounded border border-slate-800">
              <span className="font-bold bg-slate-800 px-1 py-0.5 rounded text-white text-[10px]">A</span>
              <span className="font-bold bg-slate-800 px-1 py-0.5 rounded text-white text-[10px]">D</span>
              <span className="text-slate-400 uppercase tracking-wider text-[9px]">STEER CLIENT</span>
            </div>
            <div className="flex items-center gap-1.5 text-[11px] text-slate-300 bg-slate-950/85 px-3 py-1 rounded border border-slate-800">
              <span className="font-bold bg-slate-800 px-1 py-0.5 rounded text-white text-[10px]">SPACE</span>
              <span className="text-slate-400 uppercase tracking-wider text-[9px]">BOOST PROPULSION</span>
            </div>
          </div>
          <p className="text-[10px] text-slate-500 tracking-tight font-sans">
            🐺 Steer the Wolf-bot, consume sparkling lights to grow!
          </p>
        </div>

        {/* System Utilities Corner */}
        <div className="flex gap-2 z-10">
          <button
            onClick={() => setShowEmbedModal(true)}
            className="flex items-center gap-2 px-3.5 py-2 bg-slate-900/95 hover:bg-slate-800/90 border border-slate-800 hover:border-slate-700 rounded text-slate-300 hover:text-white text-xs font-bold transition-all"
          >
            <Code2 size={14} className="text-blue-400" />
            <span>DEPLOY & EMBED</span>
          </button>

          <button
            onClick={handleOpenNewTab}
            className="flex items-center gap-2 px-3.5 py-2 bg-slate-900/95 hover:bg-slate-800/90 border border-slate-800 hover:border-slate-700 rounded text-slate-300 hover:text-white text-xs font-bold transition-all"
          >
            <ExternalLink size={14} />
            <span>NEW TAB</span>
          </button>
        </div>
      </div>

      {/* Leaderboard - Pure Slate Code Theme */}
      {gameState && gameState.leaderboard.length > 0 && (
        <div className="absolute top-24 right-4 w-64 bg-slate-950/90 border border-slate-800/80 backdrop-blur-md rounded px-4 py-3.5 pointer-events-auto">
          <div className="flex items-center justify-between border-b border-slate-800 pb-2 mb-2 w-full">
            <div className="flex items-center gap-2 text-slate-300 font-bold text-xs">
              <Trophy size={14} className="text-amber-400" />
              <span>ROBOT_RANKINGS // MULTI</span>
            </div>
            <span className="text-[10px] text-slate-500">PLAYERS: {Object.keys(gameState.players).length}</span>
          </div>
          
          <div className="flex flex-col gap-1.5 max-h-[180px] overflow-y-auto pr-1">
            {gameState.leaderboard.map((entry, i) => (
              <div key={entry.id} className="flex justify-between items-center text-xs">
                <div className="flex items-center gap-1.5 truncate">
                  <span className="text-slate-600 font-bold w-4 text-right">{i + 1}.</span>
                  <span 
                    style={{ color: entry.id === playerId ? '#ffffff' : entry.color }} 
                    className={`font-semibold truncate max-w-[130px] ${entry.id === playerId ? 'underline decoration-dotted underline-offset-2' : ''}`}
                  >
                    {entry.name}{entry.id === playerId ? ' (YOU)' : ''}
                  </span>
                </div>
                <span className="font-mono text-slate-400 font-bold text-[11px]">{entry.score}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Interactive Lobby & Respawn Overlays - Restyled to Dark Slate Terminal Code Editor */}
      <AnimatePresence>
        {(!player || isDead) && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 flex items-center justify-center pointer-events-auto bg-[#04060b]/80 backdrop-blur-sm z-50 p-4"
          >
            <div className="bg-slate-950 border border-slate-800 rounded-lg p-6 max-w-sm w-full shadow-2xl relative overflow-hidden">
              <div className="absolute right-0 top-0 text-[80px] opacity-5 select-none font-sans font-black pointer-events-none">
                A7
              </div>
              
              {/* Header */}
              <div className="flex items-center gap-2 text-xs text-slate-500 uppercase tracking-widest border-b border-slate-800/80 pb-3 mb-4">
                <Terminal size={14} className="text-indigo-400" />
                <span>STUDIO A7 // CENTRAL COMMAND</span>
              </div>

              {isDead ? (
                <div className="text-center mb-6">
                  <h2 className="text-2xl font-black text-rose-500 tracking-tight font-sans mb-1">
                    CLIENT DEACTIVATED
                  </h2>
                  <p className="text-slate-400 text-xs font-mono">
                    Your Wolf Bot collided! Length reached: <span className="text-emerald-400 font-bold">{Math.floor(player?.score || 0)}</span>.
                  </p>
                </div>
              ) : (
                <div className="mb-6">
                  <h2 className="text-2xl font-black text-white tracking-tight font-sans mb-2">
                    WOLF BOT ARENA
                  </h2>
                  <p className="text-slate-400 text-xs font-mono leading-relaxed">
                    Pilot the Studio A7 organic SEO crawler. Absorb twinkling keyword lights on the grid map to grow your indexing length!
                  </p>
                </div>
              )}

              {/* Functional Play Button */}
              <button
                onClick={joinGame}
                className="w-full py-3 bg-[#e2e8f0]/95 hover:bg-white text-slate-950 font-bold rounded text-sm transition-all shadow-lg active:scale-95 flex items-center justify-center gap-2 cursor-pointer"
              >
                <Zap size={14} />
                <span>{isDead ? 'REACTIVATE WOLF' : 'LAUNCH WOLF BOT'}</span>
              </button>

              <div className="mt-4 flex justify-between items-center text-[10px] text-slate-500 border-t border-slate-900 pt-3">
                <span>V.1.01_REALTIME</span>
                <button 
                  onClick={() => setShowEmbedModal(true)} 
                  className="text-blue-400 hover:underline hover:text-blue-300"
                >
                  Configure Website Integration
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Deploy & Embed Interactive Modal Guide */}
      <AnimatePresence>
        {showEmbedModal && (
          <div className="fixed inset-0 flex items-center justify-center pointer-events-auto bg-black/85 backdrop-blur-md z-50 p-4">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-slate-950 border border-slate-800 rounded-lg max-w-2xl w-full h-[520px] shadow-2xl flex flex-col relative overflow-hidden"
            >
              {/* Modal Topbar */}
              <div className="flex items-center justify-between px-4 py-3 border-b border-slate-800/80 bg-slate-900/60">
                <div className="flex items-center gap-2 text-xs font-bold text-white">
                  <Code2 size={15} className="text-blue-400" />
                  <span>STUDIO A7 // DIGITAL WEB SYSTEM DEPLOYER</span>
                </div>
                <button
                  onClick={() => setShowEmbedModal(false)}
                  className="p-1 hover:bg-slate-800 rounded text-slate-400 hover:text-white transition-colors"
                >
                  <X size={16} />
                </button>
              </div>

              {/* Tabs list */}
              <div className="flex bg-slate-900 border-b border-slate-800/60 overflow-x-auto text-[11px]">
                <button
                  onClick={() => setActiveTab('embed')}
                  className={`px-4 py-2.5 font-bold transition-all border-r border-slate-800 flex items-center gap-1.5 ${
                    activeTab === 'embed' ? 'bg-[#0f172a] text-white border-b-2 border-b-blue-500' : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <Code2 size={13} />
                  <span>1. Responsive Embed Code</span>
                </button>
                <button
                  onClick={() => setActiveTab('hosting')}
                  className={`px-4 py-2.5 font-bold transition-all border-r border-slate-800 flex items-center gap-1.5 ${
                    activeTab === 'hosting' ? 'bg-[#0f172a] text-white border-b-2 border-b-blue-500' : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <Server size={13} />
                  <span>2. Free Cloud Hosting</span>
                </button>
                <button
                  onClick={() => setActiveTab('seo')}
                  className={`px-4 py-2.5 font-bold transition-all border-r border-slate-800 flex items-center gap-1.5 ${
                    activeTab === 'seo' ? 'bg-[#0f172a] text-white border-b-2 border-b-blue-500' : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <Sparkles size={13} />
                  <span>3. SEO & WordPress</span>
                </button>
              </div>

              {/* Tab Contents */}
              <div className="flex-1 p-5 overflow-y-auto text-xs text-slate-300 leading-relaxed font-sans select-text">
                
                {/* Tab 1: Embed */}
                {activeTab === 'embed' && (
                  <div className="flex flex-col gap-4">
                    <div>
                      <h3 className="font-bold text-white text-sm font-mono mb-1">
                        HTML Iframe Embed Code
                      </h3>
                      <p className="text-slate-400 text-[11px]">
                        Copy this responsive HTML snippet into Webflow, WordPress (Custom HTML), Shopify, or customized HTML pages. It manages pointer locks, fullscreen capabilities, and touch parameters.
                      </p>
                    </div>

                    <div className="bg-slate-900 border border-slate-800 rounded p-3 relative font-mono text-[10px] text-slate-400 whitespace-pre-wrap select-all">
                      {iframeCode}
                      
                      <button
                        onClick={handleCopyCode}
                        className="absolute right-2 top-2 p-1.5 bg-slate-850 hover:bg-slate-800 border border-slate-700/65 rounded text-slate-300 hover:text-white transition-all flex items-center gap-1"
                      >
                        {copied ? <Check size={11} className="text-emerald-400" /> : <Copy size={11} />}
                        <span className="text-[10px]">{copied ? 'Copied' : 'Copy'}</span>
                      </button>
                    </div>

                    <div className="p-3 bg-blue-950/40 border border-blue-900/50 rounded text-[11px] text-blue-300 flex items-start gap-2">
                      <Terminal size={14} className="mt-0.5 shrink-0" />
                      <p>
                        <strong>Note:</strong> Make sure to replace <code className="bg-blue-900/50 px-1 rounded text-white font-mono">${window.location.origin}</code> with your live hosted cloud production URL once deployed!
                      </p>
                    </div>
                  </div>
                )}

                {/* Tab 2: Free Hosting */}
                {activeTab === 'hosting' && (
                  <div className="flex flex-col gap-4 font-sans">
                    <h3 className="font-bold text-white text-sm font-mono flex items-center gap-1.5">
                      <Globe size={14} className="text-emerald-400" />
                      <span>Node.js cloud deployment paths (Free Tiers)</span>
                    </h3>
                    <p className="text-slate-400 text-[11px]">
                      Because this is a real-time multiplayer multiplayer game using WebSockets, it runs on a custom **Node.js server** instead of static file servers. Here is how to run it for free:
                    </p>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-1">
                      <div className="bg-[#111827] p-3.5 rounded border border-slate-800">
                        <strong className="text-white text-[12px] block mb-1">A. Zeabur (Easiest)</strong>
                        <p className="text-slate-400 text-[11px] leading-relaxed">
                          1. Connect your Github or upload the ZIP of this repository.<br />
                          2. Zeabur automatically builds and hosts the Node.js server.<br />
                          3. Done! Generates robust WebSocket support on a secure domain.
                        </p>
                      </div>

                      <div className="bg-[#111827] p-3.5 rounded border border-slate-800">
                        <strong className="text-white text-[12px] block mb-1">B. Render (Stable Free Tier)</strong>
                        <p className="text-slate-400 text-[11px] leading-relaxed">
                          1. Setup a free account on Render, click **New Web Service**.<br />
                          2. Set Build command: <code className="text-slate-200 font-mono text-[9px] bg-slate-800/85 px-1 rounded">npm run build</code>.<br />
                          3. Set Start command: <code className="text-slate-200 font-mono text-[9px] bg-slate-800/85 px-1 rounded">npm run start</code>.<br />
                          4. Bind environment: <code className="text-slate-200 font-mono text-[9px] bg-slate-800/85 px-1 rounded">PORT=3000</code>.
                        </p>
                      </div>
                    </div>

                    <p className="text-[10px] text-slate-500 font-mono">
                      Check `/INSTALL_INSTRUCTIONS.md` at the project root for long-term production and VPS configuration options!
                    </p>
                  </div>
                )}

                {/* Tab 3: SEO */}
                {activeTab === 'seo' && (
                  <div className="flex flex-col gap-4">
                    <h3 className="font-bold text-white text-sm font-mono flex items-center gap-1.5">
                      <Sparkles size={14} className="text-yellow-400" />
                      <span>Drive organic SEO value for Studio A7 Agency</span>
                    </h3>
                    <p className="text-slate-400 text-[11px]">
                      How to turn this interactive cyber-wolf game into a powerful backlinks and domain ranking device:
                    </p>

                    <div className="flex flex-col gap-3">
                      <div className="bg-slate-900 border border-slate-800 p-3.5 rounded">
                        <span className="text-emerald-400 font-bold block mb-1 text-[11px]">1. BOOST DWELL TIME (ORGANIC CORE VIRTUALS)</span>
                        <span className="text-slate-400 text-[11px]">
                          Placing an interactive, fast 3D WebGL game on a landing page keeps visitors engaged for minutes. Google calculates dwell time (Time-on-Page) as a direct organic authority ranking metric.
                        </span>
                      </div>

                      <div className="bg-slate-900 border border-slate-800 p-3.5 rounded">
                        <span className="text-emerald-400 font-bold block mb-1 text-[11px]">2. WIDGET VIRALITY BACKLINKS</span>
                        <span className="text-slate-400 text-[11px]">
                          Allow your clients or guest bloggers to embed this game widget, and hardcode a backlink attribute in the footer pointing back to your prime agency landing page (e.g., <code className="text-slate-300 font-mono">Designed by Studio A7 SEO Agency</code>) to automatically accumulate backlink juice.
                        </span>
                      </div>
                    </div>
                  </div>
                )}

              </div>

              {/* Modal Footer */}
              <div className="px-4 py-3.5 border-t border-slate-800/80 bg-slate-900/60 flex items-center justify-between text-[11px] text-slate-500">
                <span>Deploy fully free with active Node.js runner</span>
                <button
                  onClick={() => setShowEmbedModal(false)}
                  className="px-4 py-1.5 bg-slate-850 hover:bg-slate-800 border border-slate-705/90 rounded text-slate-300 hover:text-white font-bold transition-all"
                >
                  Done
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Footer Branding Telemetry - Minimalist & Sleek */}
      <div className="w-full pointer-events-auto flex justify-between items-center text-[10px] text-slate-600 border-t border-slate-900 pt-3 z-10 select-none">
        <div>
          <span>SYSTEM_OPERATIONAL // SECURE SOCKETS ACTIVE (WSS)</span>
        </div>
        <div>
          <span>STUDIO A7 SEARCH Visibility Optimization Bot</span>
        </div>
      </div>
    </div>
  );
}
