/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */
import { useEffect, useRef, useState, useMemo } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { useGameStore, globalGameState } from '../store/gameStore';
import { WORLD_SIZE, TURN_SPEED, BOOST_SPEED, BASE_SPEED } from '../shared/types';
import * as THREE from 'three';
import { Sphere, Grid, useGLTF } from '@react-three/drei';
// IMPORT LOGO AGENCJI Z GŁÓWNEGO KATALOGU
// @ts-ignore
import logoUrl from '../../logo.png';
// ŚCIEŻKA TEKSTOWA DO MODELU WIEDŹMIŃSKIEGO WILKA (Zabezpiecza przed błędami Vite)
const wolfModelUrl = '/wolf.glb';
const localCollectedOrbs = new Set<string>();

// ? KLUCZ DO PŁYNNOŚCI: Oddzielna strefa pamięci dla lokalnego gracza, odporna na szarpanie sieciowe
const localSmoothPlayer = {
  segments: [] as { x: number; y: number }[],
  angle: 0,
  active: false
};

function Snake({ playerId, color, isLocal }: { playerId: string, color: string, isLocal: boolean }) {
  const bodyRef = useRef<THREE.InstancedMesh>(null);
  const headRef = useRef<THREE.Group>(null);
  const dummy = useMemo(() => new THREE.Object3D(), []);
  const currentPositions = useRef<{x: number, y: number}[]>([]);

  // Bezpieczne ładowanie trójwymiarowego modelu wolf.glb
  const { scene } = useGLTF(wolfModelUrl);
  const clonedWolfScene = useMemo(() => {
    const clone = scene.clone();
    clone.traverse((child: any) => {
      if ((child as THREE.Mesh).isMesh) {
        child.castShadow = true;
        child.receiveShadow = true;
      }
    });
    return clone;
  }, [scene]);

  useFrame((state, delta) => {
    if (!bodyRef.current || !headRef.current) return;

    // Opcja dla gracza lokalnego - pobieramy ultra płynne dane lokalne pomijając sieć
    if (isLocal) {
      if (!localSmoothPlayer.active || localSmoothPlayer.segments.length === 0) {
        bodyRef.current.count = 0;
        headRef.current.visible = false;
        return;
      }
      headRef.current.visible = true;
      const count = localSmoothPlayer.segments.length;
      bodyRef.current.count = Math.max(0, count - 1);

      while (currentPositions.current.length < count) {
        const idx = currentPositions.current.length;
        currentPositions.current.push({
          x: localSmoothPlayer.segments[idx]?.x || 0,
          y: localSmoothPlayer.segments[idx]?.y || 0
        });
      }

      for (let i = 0; i < count; i++) {
        const seg = localSmoothPlayer.segments[i];
        if (!seg) continue;
        // Przypisanie 1:1 bez żadnego opóźnienia lub cofania pozycji
        currentPositions.current[i].x = seg.x;
        currentPositions.current[i].y = seg.y;

        if (i === 0) {
          headRef.current.position.set(seg.x, seg.y, 0.45);
          headRef.current.rotation.set(0, 0, localSmoothPlayer.angle);
        } else {
          dummy.position.set(seg.x, seg.y, 0.5);
          dummy.updateMatrix();
          bodyRef.current.setMatrixAt(i - 1, dummy.matrix);
        }
      }
      bodyRef.current.instanceMatrix.needsUpdate = true;
      return;
    }

    // Opcja dla przeciwników (Remote Players) - tutaj zostaje płynny LERP sieciowy
    const gs = globalGameState.current;
    if (!gs) return;
    const player = gs.players[playerId];
    if (!player || player.segments.length === 0) {
      bodyRef.current.count = 0;
      headRef.current.visible = false;
      return;
    }

    headRef.current.visible = true;
    const count = player.segments.length;
    bodyRef.current.count = Math.max(0, count - 1);

    while (currentPositions.current.length < count) {
      const idx = currentPositions.current.length;
      currentPositions.current.push({
        x: player.segments[idx]?.x || 0,
        y: player.segments[idx]?.y || 0
      });
    }

    for (let i = 0; i < count; i++) {
      let targetX = player.segments[i].x;
      let targetY = player.segments[i].y;
      const curr = currentPositions.current[i];
      const dist = Math.abs(targetX - curr.x) + Math.abs(targetY - curr.y);
      if (dist > 10) {
        curr.x = targetX;
        curr.y = targetY;
      } else {
        const lerpFactor = 15;
        curr.x += (targetX - curr.x) * lerpFactor * delta;
        curr.y += (targetY - curr.y) * lerpFactor * delta;
      }

      if (i === 0) {
        headRef.current.position.set(curr.x, curr.y, 0.45);
        headRef.current.rotation.set(0, 0, player.currentAngle);
      } else {
        dummy.position.set(curr.x, curr.y, 0.5);
        dummy.updateMatrix();
        bodyRef.current.setMatrixAt(i - 1, dummy.matrix);
      }
    }
    bodyRef.current.instanceMatrix.needsUpdate = true;
  });

  return (
    <group>
      <group ref={headRef} castShadow receiveShadow>
        {/*
          MODEL WILKA:
          - position Z = 0.4 wyciąga głowę nad podłogę (wartość z wersji 1 - działa)
          - rotation [0, 0, Math.PI/2] ustawia pysk w kierunku ruchu (wartość z wersji 1 - działa)
          - UWAGA: wersja 2 zmieniła rotację na [0, Math.PI, -Math.PI/2] co obróciło
            model do góry nogami i schowało go pod podłogą - stąd tamten błąd
        */}
        <primitive
          object={clonedWolfScene}
          scale={1.2}
          position={[0, 0, 0.4]}
          rotation={[0, 0, Math.PI / 2]}
        />
      </group>

      {/* Kryształowe segmenty ogona węża */}
      <instancedMesh ref={bodyRef} args={[null as any, null as any, 2000]} castShadow receiveShadow frustumCulled={false}>
        <icosahedronGeometry args={[0.55, 0]} />
        <meshStandardMaterial
          color={color}
          roughness={0.15}
          metalness={0.85}
          toneMapped={false}
          onBeforeCompile={(shader) => {
            shader.fragmentShader = shader.fragmentShader.replace(
              '#include <emissivemap_fragment>',
              `
              #include <emissivemap_fragment>
              float fresnel = pow(1.0 - max(dot(normal, normalize(vViewPosition)), 0.0), 2.0);
              totalEmissiveRadiance += diffuseColor.rgb * (0.35 + fresnel * 2.5);
              `
            );
          }}
        />
      </instancedMesh>
    </group>
  );
}

function Orbs() {
  const meshRef = useRef<THREE.InstancedMesh>(null);
  const dummy = useMemo(() => new THREE.Object3D(), []);
  const colorObj = useMemo(() => new THREE.Color(), []);

  useFrame((state) => {
    if (!meshRef.current) return;
    const gs = globalGameState.current;
    if (!gs) return;
    let i = 0;
    for (const orbId in gs.orbs) {
      if (localCollectedOrbs.has(orbId)) continue;
      const orb = gs.orbs[orbId];
      const seed = parseInt(orbId.slice(0, 4), 16) || 0;
      const pulseSpeed = 4 + (seed % 3);
      const hover = Math.sin(state.clock.elapsedTime * pulseSpeed + seed) * 0.15;
      const pulse = 0.8 + Math.cos(state.clock.elapsedTime * pulseSpeed + seed) * 0.2;
      dummy.position.set(orb.x, orb.y, 0.6 + hover);
      dummy.scale.set(pulse, pulse, pulse);
      dummy.updateMatrix();
      meshRef.current.setMatrixAt(i, dummy.matrix);
      colorObj.set(orb.color);
      meshRef.current.setColorAt(i, colorObj);
      i++;
    }
    meshRef.current.count = i;
    meshRef.current.instanceMatrix.needsUpdate = true;
    if (meshRef.current.instanceColor) {
      meshRef.current.instanceColor.needsUpdate = true;
    }
  });

  return (
    <instancedMesh ref={meshRef} args={[null as any, null as any, 1000]} castShadow receiveShadow frustumCulled={false}>
      <dodecahedronGeometry args={[0.22, 0]} />
      <meshStandardMaterial
        roughness={0.1}
        metalness={0.9}
        toneMapped={false}
        onBeforeCompile={(shader) => {
          shader.fragmentShader = shader.fragmentShader.replace(
            '#include <emissivemap_fragment>',
            `
            #include <emissivemap_fragment>
            totalEmissiveRadiance += diffuseColor.rgb * 7.5;
            `
          );
        }}
      />
    </instancedMesh>
  );
}

export function GameScene() {
  const { gameState, playerId, sendPlayerState, sendCollectOrb } = useGameStore();
  const { camera } = useThree();
  const [a7Texture, setA7Texture] = useState<THREE.CanvasTexture | null>(null);

  useEffect(() => {
    const canvas = document.createElement('canvas');
    canvas.width = 1024;
    canvas.height = 1024;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Helper - rysuje napis "www.studioa7.pl" pod wskazanym punktem
    const drawDomain = (x: number, y: number, fontSize: number, alpha: number, color = '56, 189, 248') => {
      ctx.save();
      ctx.globalAlpha = alpha;
      ctx.textAlign = 'center';
      ctx.font = `${fontSize}px monospace`;
      ctx.fillStyle = `rgba(${color}, 1)`;
      ctx.letterSpacing = '1px';
      ctx.fillText('www.studioa7.pl', x, y);
      ctx.restore();
    };

    // Helper - pierścień / okrag dekoracyjny
    const drawRing = (x: number, y: number, r: number, color: string, alpha: number, dash: number[] = []) => {
      ctx.save();
      ctx.globalAlpha = alpha;
      ctx.strokeStyle = color;
      ctx.lineWidth = 1;
      if (dash.length) ctx.setLineDash(dash);
      ctx.beginPath();
      ctx.arc(x, y, r, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
    };

    // Helper - hexagon outline
    const drawHex = (x: number, y: number, r: number, color: string, alpha: number) => {
      ctx.save();
      ctx.globalAlpha = alpha;
      ctx.strokeStyle = color;
      ctx.lineWidth = 1;
      ctx.beginPath();
      for (let i = 0; i < 6; i++) {
        const angle = (Math.PI / 3) * i - Math.PI / 6;
        const px = x + r * Math.cos(angle);
        const py = y + r * Math.sin(angle);
        if (i === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
      }
      ctx.closePath();
      ctx.stroke();
      ctx.restore();
    };

    const drawBackgroundStructure = (logoImg?: HTMLImageElement) => {
      // --- TŁO ---
      ctx.fillStyle = '#05070c';
      ctx.fillRect(0, 0, 1024, 1024);

      // Mgławice - więcej, żywsze kolory
      const nebulae = [
        { cx: 200, cy: 200, r1: 20, r2: 400, color: '2, 132, 199', a: 0.20 },
        { cx: 820, cy: 800, r1: 40, r2: 500, color: '139, 92, 246', a: 0.16 },
        { cx: 512, cy: 512, r1: 60, r2: 320, color: '16, 185, 129', a: 0.08 },
        { cx: 100, cy: 750, r1: 10, r2: 280, color: '245, 158, 11', a: 0.09 },
        { cx: 900, cy: 150, r1: 15, r2: 260, color: '236, 72, 153', a: 0.10 },
        { cx: 650, cy: 350, r1: 5,  r2: 180, color: '99, 102, 241', a: 0.12 },
      ];
      nebulae.forEach(n => {
        const g = ctx.createRadialGradient(n.cx, n.cy, n.r1, n.cx, n.cy, n.r2);
        g.addColorStop(0, `rgba(${n.color}, ${n.a})`);
        g.addColorStop(1, 'rgba(0,0,0,0)');
        ctx.fillStyle = g;
        ctx.fillRect(0, 0, 1024, 1024);
      });

      // Siatka główna
      ctx.strokeStyle = 'rgba(51, 65, 85, 0.18)';
      ctx.lineWidth = 1;
      ctx.setLineDash([]);
      for (let c = 0; c < 1024; c += 64) {
        ctx.beginPath(); ctx.moveTo(c, 0); ctx.lineTo(c, 1024); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(0, c); ctx.lineTo(1024, c); ctx.stroke();
      }

      // Siatka diagonalna - subtelna
      ctx.strokeStyle = 'rgba(99, 102, 241, 0.06)';
      ctx.lineWidth = 1;
      for (let c = -1024; c < 2048; c += 128) {
        ctx.beginPath(); ctx.moveTo(c, 0); ctx.lineTo(c + 1024, 1024); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(c, 0); ctx.lineTo(c - 1024, 1024); ctx.stroke();
      }

      // Gwiazdy - różne rozmiary i jasności
      const starData = [
        { size: 1, count: 80, alphaBase: 0.15, alphaRange: 0.25 },
        { size: 2, count: 30, alphaBase: 0.20, alphaRange: 0.35 },
        { size: 3, count: 12, alphaBase: 0.30, alphaRange: 0.40 },
      ];
      starData.forEach(({ size, count, alphaBase, alphaRange }) => {
        for (let s = 0; s < count; s++) {
          const seed = s * (size * 317 + 83);
          const x = (seed * 417 + size * 111) % 1024;
          const y = (seed * 523 + size * 199) % 1024;
          ctx.globalAlpha = alphaBase + ((s % 5) / 5) * alphaRange;
          ctx.fillStyle = s % 3 === 0 ? '#a5f3fc' : s % 3 === 1 ? '#e9d5ff' : '#ffffff';
          ctx.fillRect(x, y, size, size);
        }
      });
      ctx.globalAlpha = 1.0;

      // Pierścienie / okręgi dekoracyjne
      drawRing(512, 512, 180, 'rgba(56, 189, 248, 0.12)', 1);
      drawRing(512, 512, 280, 'rgba(139, 92, 246, 0.08)', 1, [8, 12]);
      drawRing(512, 512, 420, 'rgba(16, 185, 129, 0.06)', 1, [4, 20]);
      drawRing(220, 300, 70,  'rgba(56, 189, 248, 0.15)', 1, [6, 8]);
      drawRing(804, 300, 70,  'rgba(139, 92, 246, 0.15)', 1, [6, 8]);
      drawRing(100, 750, 50,  'rgba(245, 158, 11, 0.18)', 1, [3, 6]);
      drawRing(900, 200, 55,  'rgba(236, 72, 153, 0.18)', 1, [3, 6]);
      drawRing(650, 700, 45,  'rgba(99, 102, 241, 0.20)', 1);

      // Hexagony dekoracyjne
      drawHex(150, 850, 40, 'rgba(245, 158, 11, 0.25)', 1);
      drawHex(880, 650, 35, 'rgba(236, 72, 153, 0.20)', 1);
      drawHex(370, 780, 28, 'rgba(56, 189, 248, 0.18)', 1);
      drawHex(720, 180, 32, 'rgba(16, 185, 129, 0.22)', 1);
      drawHex(60,  400, 22, 'rgba(139, 92, 246, 0.20)', 1);
      drawHex(960, 500, 25, 'rgba(56, 189, 248, 0.18)', 1);

      // Małe krosshaire / celowniki
      const crosshairs = [
        { x: 150, y: 850, color: 'rgba(245, 158, 11, 0.35)' },
        { x: 880, y: 650, color: 'rgba(236, 72, 153, 0.35)' },
        { x: 60,  y: 400, color: 'rgba(139, 92, 246, 0.35)' },
        { x: 960, y: 500, color: 'rgba(56, 189, 248, 0.35)' },
      ];
      crosshairs.forEach(({ x, y, color }) => {
        ctx.save();
        ctx.strokeStyle = color;
        ctx.lineWidth = 1;
        ctx.beginPath(); ctx.moveTo(x - 12, y); ctx.lineTo(x - 4, y); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(x + 4,  y); ctx.lineTo(x + 12, y); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(x, y - 12); ctx.lineTo(x, y - 4); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(x, y + 4);  ctx.lineTo(x, y + 12); ctx.stroke();
        ctx.restore();
      });

      // Scatter - frazy SEO rozsiane po planszy
      const seoLabels = [
        { text: 'LINK BUILDING',  x: 130, y: 130,  size: 10, color: '56, 189, 248',  a: 0.22 },
        { text: 'POZYCJONOWANIE', x: 870, y: 950,  size: 10, color: '139, 92, 246',  a: 0.22 },
        { text: 'CONTENT',        x: 900, y: 420,  size: 11, color: '16, 185, 129',  a: 0.25 },
        { text: 'BACKLINKS',      x: 90,  y: 600,  size: 10, color: '245, 158, 11',  a: 0.22 },
        { text: 'SERP',           x: 430, y: 900,  size: 12, color: '236, 72, 153',  a: 0.25 },
        { text: 'KEYWORD RANK',   x: 600, y: 80,   size: 10, color: '99, 102, 241',  a: 0.22 },
        { text: 'ORGANIC TRAFFIC',x: 310, y: 480,  size: 9,  color: '56, 189, 248',  a: 0.18 },
        { text: 'DA / DR',        x: 750, y: 870,  size: 11, color: '245, 158, 11',  a: 0.22 },
        { text: 'CRAWL',          x: 50,  y: 970,  size: 10, color: '16, 185, 129',  a: 0.20 },
        { text: 'INDEXING',       x: 950, y: 80,   size: 10, color: '236, 72, 153',  a: 0.20 },
        { text: 'CTR',            x: 480, y: 50,   size: 13, color: '139, 92, 246',  a: 0.28 },
        { text: 'ANCHOR TEXT',    x: 200, y: 650,  size: 9,  color: '99, 102, 241',  a: 0.20 },
      ];
      seoLabels.forEach(({ text, x, y, size, color, a }) => {
        ctx.save();
        ctx.globalAlpha = a;
        ctx.textAlign = 'center';
        ctx.font = `bold ${size}px monospace`;
        ctx.fillStyle = `rgba(${color}, 1)`;
        ctx.letterSpacing = '2px';
        ctx.fillText(text, x, y);
        // domenka pod każdą frazą
        drawDomain(x, y + size + 5, Math.max(7, size - 3), a * 0.75, color);
        ctx.restore();
      });

      // --- GŁÓWNE NAPISY (SEO UNIVERSE / SEO GALAXY) ---
      ctx.save();
      ctx.textAlign = 'center';

      // SEO UNIVERSE - lewy
      ctx.font = 'bold 24px monospace';
      ctx.fillStyle = 'rgba(56, 189, 248, 0.42)';
      ctx.letterSpacing = '5px';
      ctx.globalAlpha = 1;
      ctx.fillText('SEO UNIVERSE', 220, 175);
      drawDomain(220, 195, 11, 0.38);

      // SEO GALAXY - prawy
      ctx.font = 'bold 24px monospace';
      ctx.fillStyle = 'rgba(139, 92, 246, 0.42)';
      ctx.letterSpacing = '5px';
      ctx.fillText('SEO GALAXY', 804, 175);
      drawDomain(804, 195, 11, 0.38, '139, 92, 246');

      // STUDIO A7 - środek dołu
      ctx.font = 'bold 16px monospace';
      ctx.fillStyle = 'rgba(16, 185, 129, 0.35)';
      ctx.letterSpacing = '6px';
      ctx.fillText('STUDIO A7', 512, 870);
      drawDomain(512, 888, 11, 0.32, '16, 185, 129');

      ctx.restore();

      // --- LOGA (jeśli załadowane) ---
      if (logoImg) {
        // Środek - duże logo
        ctx.drawImage(logoImg, 512 - 120, 512 - 150, 240, 240);
        drawDomain(512, 512 + 110, 13, 0.45);

        // Lewy klaster
        ctx.drawImage(logoImg, 220 - 45, 210, 90, 90);
        drawDomain(220, 315, 10, 0.38);

        // Prawy klaster
        ctx.drawImage(logoImg, 804 - 45, 210, 90, 90);
        drawDomain(804, 315, 10, 0.38, '139, 92, 246');

        // Dodatkowe małe loga w rogach
        ctx.globalAlpha = 0.35;
        ctx.drawImage(logoImg, 30, 30, 55, 55);
        ctx.globalAlpha = 1;
        drawDomain(58, 95, 9, 0.28);

        ctx.globalAlpha = 0.35;
        ctx.drawImage(logoImg, 939, 30, 55, 55);
        ctx.globalAlpha = 1;
        drawDomain(966, 95, 9, 0.28, '139, 92, 246');

        ctx.globalAlpha = 0.30;
        ctx.drawImage(logoImg, 30, 939, 50, 50);
        ctx.globalAlpha = 1;
        drawDomain(55, 997, 9, 0.25, '245, 158, 11');

        ctx.globalAlpha = 0.30;
        ctx.drawImage(logoImg, 944, 939, 50, 50);
        ctx.globalAlpha = 1;
        drawDomain(969, 997, 9, 0.25, '16, 185, 129');
      }
    };

    drawBackgroundStructure();
    const tex = new THREE.CanvasTexture(canvas);
    tex.wrapS = THREE.RepeatWrapping;
    tex.wrapT = THREE.RepeatWrapping;
    tex.repeat.set(2, 2);
    setA7Texture(tex);

    const img = new Image();
    img.src = logoUrl;
    img.onload = () => {
      drawBackgroundStructure(img);
      tex.needsUpdate = true;
      setA7Texture(tex);
    };
  }, []);

  const inputs = useRef({ left: false, right: false, boost: false });
  const lightRef = useRef<THREE.DirectionalLight>(null);
  const [lightTarget] = useState(() => new THREE.Object3D());

  const localPlayerRef = useRef<{
    active: boolean;
    segments: {x: number, y: number}[];
    score: number;
    currentAngle: number;
    isBoosting: boolean;
    lastSendTime: number;
  }>({
    active: false,
    segments: [],
    score: 10,
    currentAngle: 0,
    isBoosting: false,
    lastSendTime: 0,
  });

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.key === 'a' || e.key === 'A' || e.key === 'ArrowLeft') && !inputs.current.left) { inputs.current.left = true; }
      if ((e.key === 'd' || e.key === 'D' || e.key === 'ArrowRight') && !inputs.current.right) { inputs.current.right = true; }
      if ((e.key === ' ' || e.key === 'w' || e.key === 'W' || e.key === 'ArrowUp') && !inputs.current.boost) { inputs.current.boost = true; }
    };
    const handleKeyUp = (e: KeyboardEvent) => {
      if ((e.key === 'a' || e.key === 'A' || e.key === 'ArrowLeft') && inputs.current.left) { inputs.current.left = false; }
      if ((e.key === 'd' || e.key === 'D' || e.key === 'ArrowRight') && inputs.current.right) { inputs.current.right = false; }
      if ((e.key === ' ' || e.key === 'w' || e.key === 'W' || e.key === 'ArrowUp') && inputs.current.boost) { inputs.current.boost = false; }
    };
    const handleBlur = () => {
      inputs.current = { left: false, right: false, boost: false };
    };
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    window.addEventListener('blur', handleBlur);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      window.removeEventListener('blur', handleBlur);
    };
  }, []);

  useFrame((state, delta) => {
    const gs = globalGameState.current;
    if (!gs || !playerId) return;

    const serverPlayer = gs.players[playerId];
    if (serverPlayer && serverPlayer.state === 'alive') {

      if (!localPlayerRef.current.active && serverPlayer.segments.length > 0) {
        localPlayerRef.current.active = true;
        localPlayerRef.current.segments = [...serverPlayer.segments];
        localPlayerRef.current.score = serverPlayer.score;
        localPlayerRef.current.currentAngle = serverPlayer.currentAngle;
        // Inicjalizacja płynnego lokalnego stanu
        localSmoothPlayer.active = true;
        localSmoothPlayer.segments = localPlayerRef.current.segments;
        localSmoothPlayer.angle = localPlayerRef.current.currentAngle;
      }

      if (!localPlayerRef.current.active) return;

      if (inputs.current.left) localPlayerRef.current.currentAngle += TURN_SPEED * delta;
      if (inputs.current.right) localPlayerRef.current.currentAngle -= TURN_SPEED * delta;

      localPlayerRef.current.isBoosting = inputs.current.boost && localPlayerRef.current.score > 10;
      const speed = localPlayerRef.current.isBoosting ? BOOST_SPEED : BASE_SPEED;

      const head = { ...localPlayerRef.current.segments[0] };
      head.x += Math.cos(localPlayerRef.current.currentAngle) * speed * delta;
      head.y += Math.sin(localPlayerRef.current.currentAngle) * speed * delta;

      const boundary = WORLD_SIZE / 2;
      if (head.x < -boundary) head.x = -boundary;
      if (head.x > boundary) head.x = boundary;
      if (head.y < -boundary) head.y = -boundary;
      if (head.y > boundary) head.y = boundary;

      localPlayerRef.current.segments.unshift(head);

      if (localPlayerRef.current.isBoosting) {
        localPlayerRef.current.score -= 2 * delta;
        if (localPlayerRef.current.score <= 10) {
          localPlayerRef.current.isBoosting = false;
          localPlayerRef.current.score = 10;
        }
      }

      const targetLength = Math.floor(localPlayerRef.current.score);
      while (localPlayerRef.current.segments.length > targetLength) {
        localPlayerRef.current.segments.pop();
      }

      for (const orbId in gs.orbs) {
        if (localCollectedOrbs.has(orbId)) continue;
        const orb = gs.orbs[orbId];
        const dx = head.x - orb.x;
        const dy = head.y - orb.y;
        if (dx * dx + dy * dy < 4) {
          localPlayerRef.current.score += orb.value;
          localCollectedOrbs.add(orbId);
          delete gs.orbs[orbId];
          sendCollectOrb(orbId);
        }
      }

      if (Math.random() < 0.05) {
        for (const id of localCollectedOrbs) {
          if (!gs.orbs[id]) localCollectedOrbs.delete(id);
        }
      }

      let collided = false;
      for (const otherId in gs.players) {
        if (otherId === playerId) continue;
        const other = gs.players[otherId];
        if (other.state !== 'alive') continue;
        for (const seg of other.segments) {
          const dx = head.x - seg.x;
          const dy = head.y - seg.y;
          if (dx * dx + dy * dy < 2.25) {
            collided = true;
            break;
          }
        }
        if (collided) break;
      }

      if (collided) {
        localPlayerRef.current.active = false;
        localSmoothPlayer.active = false;
        localSmoothPlayer.segments = [];
        sendPlayerState({
          segments: localPlayerRef.current.segments,
          score: localPlayerRef.current.score,
          currentAngle: localPlayerRef.current.currentAngle,
          isBoosting: localPlayerRef.current.isBoosting,
          state: 'dead'
        });
        return;
      }

      // Aktualizujemy pamięć podręczną płynnego ruchu
      localSmoothPlayer.segments = localPlayerRef.current.segments;
      localSmoothPlayer.angle = localPlayerRef.current.currentAngle;

      gs.players[playerId].segments = localPlayerRef.current.segments;
      gs.players[playerId].score = localPlayerRef.current.score;
      gs.players[playerId].currentAngle = localPlayerRef.current.currentAngle;
      gs.players[playerId].isBoosting = localPlayerRef.current.isBoosting;

      const now = Date.now();
      if (now - localPlayerRef.current.lastSendTime > 50) {
        sendPlayerState({
          segments: localPlayerRef.current.segments,
          score: localPlayerRef.current.score,
          currentAngle: localPlayerRef.current.currentAngle,
          isBoosting: localPlayerRef.current.isBoosting,
          state: 'alive'
        });
        localPlayerRef.current.lastSendTime = now;
      }

      const targetZ = Math.min(45, Math.max(20, 20 + localPlayerRef.current.score * 0.2));
      camera.position.x += (head.x - camera.position.x) * 10 * delta;
      camera.position.y += (head.y - camera.position.y) * 10 * delta;
      camera.position.z += (targetZ - camera.position.z) * 4 * delta;
      camera.lookAt(camera.position.x, camera.position.y, 0);

      if (lightRef.current) {
        lightRef.current.position.set(camera.position.x + 10, camera.position.y - 10, 30);
        lightTarget.position.set(camera.position.x, camera.position.y, 0);
      }
    } else {
      localPlayerRef.current.active = false;
      localSmoothPlayer.active = false;
      localSmoothPlayer.segments = [];
    }
  });

  if (!gameState) return null;

  return (
    <>
      <ambientLight intensity={0.4} />
      <directionalLight
        ref={lightRef}
        target={lightTarget}
        castShadow
        intensity={2}
        shadow-mapSize={[2048, 2048]}
        shadow-camera-left={-20}
        shadow-camera-right={20}
        shadow-camera-top={20}
        shadow-camera-bottom={-20}
        shadow-camera-near={0.1}
        shadow-camera-far={100}
        shadow-bias={-0.001}
      />
      <primitive object={lightTarget} />
      <mesh receiveShadow position={[0, 0, -0.2]}>
        <planeGeometry args={[WORLD_SIZE, WORLD_SIZE]} />
        <meshStandardMaterial
          map={a7Texture || undefined}
          roughness={0.6}
          metalness={0.2}
        />
      </mesh>
      <Grid
        position={[0, 0, -0.15]}
        rotation={[Math.PI / 2, 0, 0]}
        args={[WORLD_SIZE, WORLD_SIZE]}
        cellSize={2}
        cellThickness={0.4}
        cellColor="#1c2433"
        sectionSize={20}
        sectionThickness={0.8}
        sectionColor="#2d3748"
        fadeDistance={90}
        fadeStrength={1}
      />
      <Orbs />
      {Object.values(gameState.players).map((player) => {
        if (player.state !== 'alive' || player.segments.length === 0) return null;
        return (
          <Snake
            key={player.id}
            playerId={player.id}
            color={player.color}
            isLocal={player.id === playerId}
          />
        );
      })}
    </>
  );
}
