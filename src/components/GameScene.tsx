/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */
import * as THREE from 'three';
import { useMemo, useRef } from 'react';
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
        headRef.current.position.set(curr.x, curr.y, 0.6);
        headRef.current.rotation.set(Math.PI / 2, 0, player.currentAngle - Math.PI / 2);
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
      {/* WERSJA 3: CYBER-WILK W GARNITURZE I OKULARACH */}
      <group ref={headRef}>
        {/* Korpus / Garnitur */}
        <mesh position={[0, -0.2, -0.3]}>
          <coneGeometry args={[0.5, 0.8, 4]} />
          <meshStandardMaterial color="#1e293b" roughness={0.3} metalness={0.2} />
        </mesh>
        {/* Krawat */}
        <mesh position={[0, 0.1, -0.1]} rotation={[0, 0, 0]}>
          <boxGeometry args={[0.08, 0.3, 0.02]} />
          <meshStandardMaterial color="#e11d48" emissive="#e11d48" emissiveIntensity={0.5} />
        </mesh>
        {/* Biały Kołnierzyk */}
        <mesh position={[0, 0.18, -0.2]}>
          <boxGeometry args={[0.2, 0.05, 0.2]} />
          <meshStandardMaterial color="#f8fafc" />
        </mesh>

        {/* Głowa Wilka */}
        <mesh position={[0, 0.3, 0.1]} rotation={[0, 0, 0]}>
          <boxGeometry args={[0.6, 0.6, 0.5]} />
          <meshStandardMaterial color="#475569" roughness={0.4} metalness={0.5} />
        </mesh>
        {/* Pysk / Kufa */}
        <mesh position={[0, 0.6, -0.05]}>
          <boxGeometry args={[0.3, 0.4, 0.3]} />
          <meshStandardMaterial color="#334155" roughness={0.5} />
        </mesh>
        {/* Uszy */}
        <mesh position={[0.22, 0.2, 0.4]} rotation={[0, 0, -0.2]}>
          <coneGeometry args={[0.12, 0.3, 4]} />
          <meshStandardMaterial color="#334155" />
        </mesh>
        <mesh position={[-0.22, 0.2, 0.4]} rotation={[0, 0, 0.2]}>
          <coneGeometry args={[0.12, 0.3, 4]} />
          <meshStandardMaterial color="#334155" />
        </mesh>

        {/* CZARNE OKULARY PRZECIWSŁONECZNE (Zgodnie z obrazkiem) */}
        <mesh position={[0, 0.42, 0.18]}>
          <boxGeometry args={[0.55, 0.12, 0.08]} />
          <meshStandardMaterial color="#020617" roughness={0.05} metalness={0.9} />
        </mesh>
        {/* Odblask na okularach */}
        <mesh position={[0, 0.42, 0.22]}>
          <boxGeometry args={[0.5, 0.02, 0.01]} />
          <meshStandardMaterial color="#60a5fa" emissive="#3b82f6" emissiveIntensity={2} toneMapped={false} />
        </mesh>
      </group>

      {/* Ogon - Diamenty */}
      <instancedMesh ref={bodyRef} args={[null as any, null as any, 1000]} castShadow>
        <icosahedronGeometry args={[0.45, 0]} />
        <meshStandardMaterial color={color} roughness={0.2} metalness={0.7} emissive={color} emissiveIntensity={0.3} />
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
      const pulseSpeed = 3 + (seed % 3);
      const hover = Math.sin(state.clock.elapsedTime * pulseSpeed + seed) * 0.1;
      
      // Szklana bańka żarówki
      dummyGlass.position.set(orb.x, orb.y, 0.6 + hover);
      dummyGlass.updateMatrix();
      glassRef.current.setMatrixAt(i, dummyGlass.matrix);

      // Metalowy gwint / podstawka
      dummyBase.position.set(orb.x, orb.y, 0.2 + hover);
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
      {/* Bańka żarówki (Świecąca) */}
      <instancedMesh ref={glassRef} args={[null as any, null as any, 1000]}>
        <sphereGeometry args={[0.3, 16, 16]} />
        <meshStandardMaterial roughness={0.05} metalness={0.1} toneMapped={false} onBeforeCompile={(shader) => {
          shader.fragmentShader = shader.fragmentShader.replace(
            '#include <emissivemap_fragment>',
            `#include <emissivemap_fragment>
             totalEmissiveRadiance += diffuseColor.rgb * 4.0;`
          );
        }} />
      </instancedMesh>
      {/* Gwint żarówki (Metalowy) */}
      <instancedMesh ref={baseRef} args={[null as any, null as any, 1000]}>
        <cylinderGeometry args={[0.12, 0.12, 0.2, 8]} />
        <meshStandardMaterial color="#94a3b8" roughness={0.2} metalness={0.8} />
      </instancedMesh>
    </group>
  );
}

export function GameScene() {
  const { gameState, playerId } = useGameStore();
  const { camera } = useThree();

  // Tworzenie wysokiej jakości, ostrej tekstury Pinballa z Centralnym Logo i Napisem
  const pinballTexture = useMemo(() => {
    if (typeof window === 'undefined') return null;
    const canvas = document.createElement('canvas');
    canvas.width = 2048;
    canvas.height = 2048;
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;

    // Ciemne, głębokie tło stołu
    ctx.fillStyle = '#070a12';
    ctx.fillRect(0, 0, 2048, 2048);

    // Siatka technologiczna stołu pinballowego
    ctx.strokeStyle = 'rgba(30, 41, 59, 0.4)';
    ctx.lineWidth = 2;
    for (let x = 0; x < 2048; x += 128) {
      ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, 2048); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(0, x); ctx.lineTo(2048, x); ctx.stroke();
    }

    // Efektowne linie neonowe po bokach stołu
    ctx.strokeStyle = '#1e3a8a';
    ctx.lineWidth = 8;
    ctx.strokeRect(64, 64, 1920, 1920);

    // --- RYSOWANIE PRAWDZIWEGO LOGO (Fasetowy Trójkąt ze Screena 2) ---
    ctx.save();
    ctx.translate(1024, 1024); // Środek stołu

    // Duży fasetowy trójkąt logotypu
    ctx.lineWidth = 24;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    // Ciemnoniebieska podstawa fasetowa
    ctx.strokeStyle = '#0284c7';
    ctx.beginPath();
    ctx.moveTo(-150, 180);
    ctx.lineTo(0, -120);
    ctx.lineTo(150, 180);
    ctx.closePath();
    ctx.stroke();

    // Jasnoniebieska fasetowa linia wewnętrzna (tworząca efekt 3D)
    ctx.strokeStyle = '#38bdf8';
    ctx.lineWidth = 14;
    ctx.beginPath();
    ctx.moveTo(15, -120);
    ctx.lineTo(195, -120);
    ctx.lineTo(70, 140);
    ctx.stroke();

    // Zielona strzałka trendu SEO (Zgodnie z oryginalnym logo agencji)
    ctx.strokeStyle = '#22c55e';
    ctx.lineWidth = 12;
    ctx.beginPath();
    ctx.moveTo(110, 20);
    ctx.lineTo(190, -60);
    ctx.lineTo(140, -60);
    ctx.moveTo(190, -60);
    ctx.lineTo(190, -10);
    ctx.stroke();

    ctx.restore();

    // --- ELEMENTY FABULARNE STOŁU PINBALLOWEGO (Migające światła/Napisy) ---
    ctx.textAlign = 'center';
    
    // Główny, czytelny napis agencji
    ctx.font = 'bold 90px sans-serif';
    ctx.fillStyle = '#ffffff';
    ctx.fillText('WEB ENGINEERING', 1024, 1340);

    ctx.font = 'bold 50px monospace';
    ctx.fillStyle = '#60a5fa';
    ctx.fillText('// Studio A7 Agency', 1024, 1430);

    ctx.font = '30px monospace';
    ctx.fillStyle = '#475569';
    ctx.fillText('DWELL TIME & ENGAGEMENT SHOWCASE', 1024, 1500);

    // Dekoracyjne techniczne kontrolki na stole
    ctx.font = '24px monospace';
    ctx.fillStyle = '#334155';
    ctx.fillText('<studio_a7_interfaces_active>', 200, 150);
    ctx.fillText('SYS_LOG: DwellTime.Optimization=TRUE', 300, 1930);
    ctx.fillText('CORE_VITALS_ACTIVE: 100%', 1750, 150);

    // Rozmieszczenie kolorowych żarówek pinballowych w strategicznych miejscach tła
    for (let light = 0; light < 60; light++) {
      const x = 120 + (light * 317) % 1800;
      const y = 120 + (light * 431) % 1800;
      ctx.beginPath();
      ctx.arc(x, y, 12, 0, Math.PI * 2);
      ctx.fillStyle = light % 3 === 0 ? 'rgba(59, 130, 246, 0.2)' : light % 3 === 1 ? 'rgba(34, 197, 94, 0.15)' : 'rgba(225, 29, 72, 0.2)';
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
    const target = new THREE.Vector3(player.x, player.y, player.boost ? 18 : 25);
    camera.position.lerp(target, 0.1);
    camera.lookAt(player.x, player.y, 0);

    let angle = player.currentAngle;
    const inputs = useGameStore.getState().inputs || { left: false, right: false, boost: false };
    if (inputs.left) angle -= Math.PI * delta;
    if (inputs.right) angle += Math.PI * delta;
    useGameStore.getState().sendPlayerState(angle, inputs.boost);
  });

  return (
    <group>
      <ambientLight intensity={0.4} />
      <directionalLight position={[10, 20, 15]} intensity={0.8} />
      <pointLight position={[0, 0, 10]} intensity={0.5} color="#38bdf8" />

      <EffectComposer disableNormalPass>
        <Bloom luminanceThreshold={0.1} intensity={1.5} mipmapBlur radius={0.6} />
      </EffectComposer>

      {gameState && Object.keys(gameState.players).map(pid => (
        <Snake key={pid} playerId={pid} color={gameState.players[pid].color} isLocal={pid === playerId} />
      ))}
      <Orbs />

      {/* Wyśrodkowany, unikalny blat stołu pinballowego */}
      <mesh position={[0, 0, -0.2]}>
        <planeGeometry args={[WORLD_SIZE * 2, WORLD_SIZE * 2]} />
        <meshStandardMaterial map={pinballTexture || undefined} roughness={0.4} metalness={0.3} />
      </mesh>

      <Grid position={[0, 0, -0.15]} rotation={[Math.PI / 2, 0, 0]} args={[WORLD_SIZE * 2, WORLD_SIZE * 2]} cellSize={4} cellThickness={0.3} cellColor="#1e293b" sectionSize={40} sectionThickness={0.6} sectionColor="#334155" fadeDistance={100} />
    </group>
  );
}
