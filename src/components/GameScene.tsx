/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */
import * as THREE from 'three';
import { useMemo, useRef, useEffect } from 'react';
import { useGameStore } from '../store/gameStore';
import { useFrame, useThree } from '@react-three/fiber';
import { EffectComposer, Bloom } from '@react-three/postprocessing';
import { Grid } from '@react-three/drei';

const WORLD_SIZE = 100;

function Snake({ playerId, color, isLocal }: { playerId: string, color: string, isLocal: boolean }) {
  const bodyRef = useRef<THREE.InstancedMesh>(null);
  const headRef = useRef<THREE.Group>(null);
  const dummy = useMemo(() => new THREE.Object3D(), []);
  const currentPositions = useRef<{x: number, y: number}[]>([]);

  useFrame((state, delta) => {
    if (!bodyRef.current || !headRef.current) return;
    const gs = useGameStore.getState().gameState;
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
      currentPositions.current.push({ x: player.segments[idx]?.x || 0, y: player.segments[idx]?.y || 0 });
    }

    for (let i = 0; i < count; i++) {
      let targetX = player.segments[i].x;
      let targetY = player.segments[i].y;
      const curr = currentPositions.current[i];

      if (isLocal) {
        curr.x = targetX;
        curr.y = targetY;
      } else {
        const dist = Math.abs(targetX - curr.x) + Math.abs(targetY - curr.y);
        if (dist > 10) {
          curr.x = targetX;
          curr.y = targetY;
        } else {
          const lerpFactor = 15;
          curr.x += (targetX - curr.x) * lerpFactor * delta;
          curr.y += (targetY - curr.y) * lerpFactor * delta;
        }
      }

      if (i === 0) {
        headRef.current.position.set(curr.x, curr.y, 0.8);
        // Prawidłowe obracanie trójwymiarowej głowy w osi Z
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
      {/* MODEL 3D: CYBER-WILK W OKULARACH (Zgodnie ze Screen 4) */}
      <group ref={headRef}>
        {/* Główna czaszka/głowa wilka */}
        <mesh castShadow>
          <boxGeometry args={[1.4, 0.9, 0.8]} />
          <meshStandardMaterial color="#334155" roughness={0.2} metalness={0.6} />
        </mesh>
        {/* Kufa / Pysk */}
        <mesh position={[0.6, 0, -0.1]}>
          <boxGeometry args={[0.7, 0.5, 0.45]} />
          <meshStandardMaterial color="#1e293b" roughness={0.3} />
        </mesh>
        {/* Uszy sterczące */}
        <mesh position={[-0.3, 0.3, 0.5]} rotation={[0, 0, -0.1]}>
          <coneGeometry args={[0.15, 0.4, 4]} />
          <meshStandardMaterial color="#1e293b" />
        </mesh>
        <mesh position={[-0.3, -0.3, 0.5]} rotation={[0, 0, 0.1]}>
          <coneGeometry args={[0.15, 0.4, 4]} />
          <meshStandardMaterial color="#1e293b" />
        </mesh>
        {/* NOWOCZESNE CIEMNE OKULARY PRZECIWSŁONECZNE */}
        <mesh position={[0.4, 0, 0.2]}>
          <boxGeometry args={[0.2, 0.85, 0.25]} />
          <meshStandardMaterial color="#020617" roughness={0.01} metalness={0.9} />
        </mesh>
        {/* Niebieski neonowy odblask na okularach */}
        <mesh position={[0.51, 0, 0.2]}>
          <boxGeometry args={[0.02, 0.75, 0.05]} />
          <meshStandardMaterial color="#00d2ff" emissive="#00d2ff" emissiveIntensity={3} toneMapped={false} />
        </mesh>
      </group>

      {/* Ogon Wilka - Lśniące kryształy */}
      <instancedMesh ref={bodyRef} args={[null as any, null as any, 1000]} castShadow>
        <icosahedronGeometry args={[0.5, 0]} />
        <meshStandardMaterial color={color} roughness={0.1} metalness={0.8} emissive={color} emissiveIntensity={0.4} />
      </instancedMesh>
    </group>
  );
}

function Orbs() {
  const glassRef = useRef<THREE.InstancedMesh>(null);
  const baseRef = useRef<THREE.InstancedMesh>(null);
  const dummyGlass = useMemo(() => new THREE.Object3D(), []);
  const dummyBase = useMemo(() => new THREE.Object3D(), []);
  const colorObj = useMemo(() => new THREE.Color(), []);

  useFrame((state) => {
    if (!glassRef.current || !baseRef.current) return;
    const gs = useGameStore.getState().gameState;
    if (!gs) return;
    
    let i = 0;
    for (const orbId in gs.orbs) {
      const orb = gs.orbs[orbId];
      const seed = parseInt(orbId.slice(0, 4), 16) || 0;
      const pulseSpeed = 4 + (seed % 2);
      const hover = Math.sin(state.clock.elapsedTime * pulseSpeed + seed) * 0.12;
      const scalePulse = 1 + Math.sin(state.clock.elapsedTime * 5 + seed) * 0.1;
      
      // Żaróweczka szklana
      dummyGlass.position.set(orb.x, orb.y, 0.7 + hover);
      dummyGlass.scale.set(scalePulse, scalePulse, scalePulse);
      dummyGlass.updateMatrix();
      glassRef.current.setMatrixAt(i, dummyGlass.matrix);

      // Gwint żarówki
      dummyBase.position.set(orb.x, orb.y, 0.3 + hover);
      dummyBase.updateMatrix();
      baseRef.current.setMatrixAt(i, dummyBase.matrix);

      colorObj.set(orb.color);
      glassRef.current.setColorAt(i, colorObj);
      i++;
    }
    glassRef.current.count = i;
    baseRef.current.count = i;
    glassRef.current.instanceMatrix.needsUpdate = true;
    baseRef.current.instanceMatrix.needsUpdate = true;
    if (glassRef.current.instanceColor) glassRef.current.instanceColor.needsUpdate = true;
  });

  return (
    <group>
      {/* Prawdziwe, lśniące żaróweczki retro-creative */}
      <instancedMesh ref={glassRef} args={[null as any, null as any, 1000]}>
        <sphereGeometry args={[0.35, 16, 16]} />
        <meshStandardMaterial roughness={0.02} metalness={0.0} toneMapped={false} onBeforeCompile={(shader) => {
          shader.fragmentShader = shader.fragmentShader.replace(
            '#include <emissivemap_fragment>',
            `#include <emissivemap_fragment>
             totalEmissiveRadiance += diffuseColor.rgb * 6.0;`
          );
        }} />
      </instancedMesh>
      <instancedMesh ref={baseRef} args={[null as any, null as any, 1000]}>
        <cylinderGeometry args={[0.15, 0.15, 0.25, 8]} />
        <meshStandardMaterial color="#64748b" roughness={0.3} metalness={0.8} />
      </instancedMesh>
    </group>
  );
}

export function GameScene() {
  const { gameState, playerId } = useGameStore();
  const { camera } = useThree();
  const inputs = useRef({ left: false, right: false, boost: false });

  // OBSŁUGA STEROWANIA KLAWIATURĄ (Przywrócona i naprawiona)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const key = e.key.toLowerCase();
      if (key === 'a' || e.key === 'ArrowLeft') inputs.current.left = true;
      if (key === 'd' || e.key === 'ArrowRight') inputs.current.right = true;
      if (e.key === ' ') inputs.current.boost = true;
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      const key = e.key.toLowerCase();
      if (key === 'a' || e.key === 'ArrowLeft') inputs.current.left = false;
      if (key === 'd' || e.key === 'ArrowRight') inputs.current.right = false;
      if (e.key === ' ') inputs.current.boost = false;
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, []);

  // PROFILOWANA, SPERSONALIZOWANA TEKSTURA BLATU PREMIUM (Zgodnie ze Screen 2)
  const premiumTexture = useMemo(() => {
    if (typeof window === 'undefined') return null;
    const canvas = document.createElement('canvas');
    canvas.width = 2048;
    canvas.height = 2048;
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;

    // Głębokie matowe tło command-center
    ctx.fillStyle = '#090d16';
    ctx.fillRect(0, 0, 2048, 2048);

    // Dyskretna, nowoczesna siatka techniczna (bardzo cienka)
    ctx.strokeStyle = 'rgba(51, 65, 85, 0.15)';
    ctx.lineWidth = 1;
    for (let x = 0; x < 2048; x += 64) {
      ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, 2048); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(0, x); ctx.lineTo(2048, x); ctx.stroke();
    }

    // --- PRECYZYJNE PROCEDURALNE ODWZOROWANIE LOGO STUDIO A7 (Screen 2) ---
    ctx.save();
    ctx.translate(1024, 960); // Środek stołu

    // Funkcja pomocnicza do rysowania pojedynczych poligonów z gradientami
    const drawTriangle = (p1: [number, number], p2: [number, number], p3: [number, number], colors: string[]) => {
      const grad = ctx.createLinearGradient(p1[0], p1[1], p3[0], p3[1]);
      grad.addColorStop(0, colors[0]);
      grad.addColorStop(1, colors[1]);
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.moveTo(p1[0], p1[1]);
      ctx.lineTo(p2[0], p2[1]);
      ctx.lineTo(p3[0], p3[1]);
      ctx.closePath();
      ctx.fill();
    };

    // Rysowanie poszczególnych fasetów sygnetu w odcieniach błękitu i granatu
    drawTriangle([-180, 180], [0, -160], [-60, 40], ['#003b73', '#005691']);
    drawTriangle([-60, 40], [0, -160], [0, 40], ['#005691', '#007cc7']);
    drawTriangle([0, 40], [0, -160], [60, 40], ['#007cc7', '#0099e5']);
    drawTriangle([60, 40], [0, -160], [180, 180], ['#0099e5', '#33b5e5']);
    drawTriangle([-180, 180], [-60, 40], [-40, 180], ['#002244', '#003b73']);
    drawTriangle([-40, 180], [-60, 40], [0, 40], ['#003b73', '#007cc7']);
    drawTriangle([-40, 180], [0, 40], [40, 180], ['#005691', '#0099e5']);
    drawTriangle([40, 180], [0, 40], [60, 40], ['#007cc7', '#33b5e5']);
    drawTriangle([60, 40], [180, 180], [40, 180], ['#0099e5', '#002244']);

    // Ostra, czysta biało-błękitna linia krawędziowa tworząca ramię "7"
    ctx.strokeStyle = '#f8fafc';
    ctx.lineWidth = 14;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.beginPath();
    ctx.moveTo(-10, -160);
    ctx.lineTo(210, -160);
    ctx.lineTo(60, 140);
    ctx.stroke();

    // Zielona, nowoczesna strzałka wzrostu SEO
    ctx.strokeStyle = '#22c55e';
    ctx.lineWidth = 14;
    ctx.beginPath();
    ctx.moveTo(110, -10);
    ctx.lineTo(230, -110);
    ctx.lineTo(160, -110);
    ctx.moveTo(230, -110);
    ctx.lineTo(230, -40);
    ctx.stroke();

    ctx.restore();

    // --- NOWOCZESNA TYPOGRAFIA INTERAKTYWNA ---
    ctx.textAlign = 'center';
    
    // Czysty, bezszeryfowy, nowoczesny font zamiast lat 80.
    ctx.font = '900 100px system-ui, -apple-system, sans-serif';
    ctx.fillStyle = '#ffffff';
    ctx.letterSpacing = '4px';
    ctx.fillText('WEB ENGINEERING', 1024, 1400);

    ctx.font = 'bold 42px monospace';
    ctx.fillStyle = '#38bdf8';
    ctx.letterSpacing = '2px';
    ctx.fillText('// STUDIO A7 AGENCY', 1024, 1490);

    ctx.font = '500 24px system-ui, -apple-system, sans-serif';
    ctx.fillStyle = '#475569';
    ctx.letterSpacing = '6px';
    ctx.fillText('DWELL TIME & ENGAGEMENT SHOWCASE', 1024, 1560);

    // Światełka pinballowe rozproszone estetycznie w tle
    for (let light = 0; light < 40; light++) {
      const x = 100 + (light * 521) % 1848;
      const y = 100 + (light * 713) % 1848;
      // Nie rysujemy świateł bezpośrednio na tekście i logo
      if (Math.abs(x - 1024) < 400 && Math.abs(y - 1200) < 500) continue;
      ctx.beginPath();
      ctx.arc(x, y, 6, 0, Math.PI * 2);
      ctx.fillStyle = light % 2 === 0 ? 'rgba(56, 189, 248, 0.2)' : 'rgba(34, 197, 94, 0.15)';
      ctx.fill();
    }

    const tex = new THREE.CanvasTexture(canvas);
    tex.wrapS = THREE.ClampToEdgeWrapping;
    tex.wrapT = THREE.ClampToEdgeWrapping;
    return tex;
  }, []);

  useFrame((state, delta) => {
    const gs = useGameStore.getState().gameState;
    const player = playerId && gs ? gs.players[playerId] : null;

    if (!player) return;
    
    // Płynna praca kamery podążającej za głową wilka
    const target = new THREE.Vector3(player.x, player.y, player.boost ? 16 : 22);
    camera.position.lerp(target, 0.1);
    camera.lookAt(player.x, player.y, 0);

    // Przesyłanie stanu sterowania do serwera multiplayer
    let angle = player.currentAngle;
    if (inputs.current.left) angle -= Math.PI * 1.5 * delta;
    if (inputs.current.right) angle += Math.PI * 1.5 * delta;
    useGameStore.getState().sendPlayerState(angle, inputs.current.boost);
  });

  return (
    <group>
      <ambientLight intensity={0.5} />
      <directionalLight position={[5, 15, 20]} intensity={0.9} />
      <pointLight position={[0, 0, 8]} intensity={0.4} color="#38bdf8" />

      <EffectComposer disableNormalPass>
        <Bloom luminanceThreshold={0.1} intensity={1.2} radius={0.5} />
      </EffectComposer>

      {gameState && Object.keys(gameState.players).map(pid => (
        <Snake key={pid} playerId={pid} color={gameState.players[pid].color} isLocal={pid === playerId} />
      ))}
      <Orbs />

      {/* Blat stołu z nowym, wyrenderowanym poligonowo logo */}
      <mesh position={[0, 0, -0.2]}>
        <planeGeometry args={[WORLD_SIZE * 2, WORLD_SIZE * 2]} />
        <meshStandardMaterial map={premiumTexture || undefined} roughness={0.3} metalness={0.2} />
      </mesh>

      <Grid position={[0, 0, -0.15]} rotation={[Math.PI / 2, 0, 0]} args={[WORLD_SIZE * 2, WORLD_SIZE * 2]} cellSize={5} cellThickness={0.2} cellColor="#1e293b" sectionSize={50} sectionThickness={0.5} sectionColor="#334155" fadeDistance={90} />
    </group>
  );
}
