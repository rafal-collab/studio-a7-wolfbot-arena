/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { create } from 'zustand';
import { io, Socket } from 'socket.io-client';
import { GameState, Player } from '../shared/types';

interface GameStore {
  socket: Socket | null;
  gameState: GameState | null;
  playerId: string | null;
  connect: () => void;
  joinGame: () => void;
  sendPlayerState: (data: any) => void;
  sendCollectOrb: (orbId: string) => void;
}

export const globalGameState: { current: GameState | null } = { current: null };
let lastUiUpdate = 0;

export const useGameStore = create<GameStore>((set, get) => ({
  socket: null,
  gameState: null,
  playerId: null,

  connect: () => {
    if (get().socket) return;

    const socket = io(window.location.hostname === 'localhost' ?
  'http://localhost:3000' : 'https://culpable-cabana-sharper.ngrok-free.dev',
  {
    extraHeaders: {
      "ngrok-skip-browser-warning": "true"
    }
  }
);
    socket.on('connect', () => {
      console.log('Connected to server');
    });

    socket.on('init', (id: string) => {
      set({ playerId: id });
    });

    socket.on('state', (state: GameState) => {
      // 🧠 OPTYMALIZACJA ODBIORU: 
      // Jeśli serwer przysłał odchudzony pakiet bez orbs, doklejamy ostatnio zapamiętane
      if (!state.orbs && globalGameState.current) {
        state.orbs = globalGameState.current.orbs;
      }
      
      globalGameState.current = state;

      const now = Date.now();
      if (now - lastUiUpdate > 100) { // Ograniczenie odświeżania widoku do 10Hz
        set({ gameState: state });
        lastUiUpdate = now;
      }
    });

    set({ socket });
  },

  joinGame: () => {
    const { socket } = get();
    if (socket) {
      socket.emit('join');
    }
  },

  sendPlayerState: (data) => {
    const { socket } = get();
    if (socket) {
      socket.emit('update_state', data);
    }
  },

  sendCollectOrb: (orbId) => {
    const { socket } = get();
    if (socket) {
      socket.emit('collect_orb', orbId);
    }
  }
}));