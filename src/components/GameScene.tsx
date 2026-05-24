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
        headRef.current.position.set(curr.x, curr.y, 0.5);
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
      {/* TRÓJWYMIAROWY CYBER-WILK (Wersja z ciemnymi okularami) */}
      <group ref={headRef}>
        <mesh castShadow>
          <boxGeometry args={[1.4, 0.9, 0.8]} />
          <meshStandardMaterial color="#334155" roughness={0.2} metalness={0.6} />
        </mesh>
        <mesh position={[0.6, 0, -0.1]}>
          <boxGeometry args={[0.7, 0.5, 0.45]} />
          <meshStandardMaterial color="#1e293b" roughness={0.3} />
        </mesh>
        <mesh position={[-0.3, 0.3, 0.5]} rotation={[0, 0, -0.1]}>
          <coneGeometry args={[0.15, 0.4, 4]} />
          <meshStandardMaterial color="#1e293b" />
        </mesh>
        <mesh position={[-0.3, -0.3, 0.5]} rotation={[0, 0, 0.1]}>
          <coneGeometry args={[0.15, 0.4, 4]} />
          <meshStandardMaterial color="#1e293b" />
        </mesh>
        {/* Okulary przeciwsłoneczne cyber-wilka */}
        <mesh position={[0.4, 0, 0.2]}>
          <boxGeometry args={[0.2, 0.85, 0.25]} />
          <meshStandardMaterial color="#020617" roughness={0.01} metalness={0.9} />
        </mesh>
        <mesh position={[0.51, 0, 0.2]}>
          <boxGeometry args={[0.02, 0.75, 0.05]} />
          <meshStandardMaterial color="#38bdf8" emissive="#38bdf8" emissiveIntensity={2} toneMapped={false} />
        </mesh>
      </group>

      {/* Kryształowy ogon */}
      <instancedMesh ref={bodyRef} args={[null as any, null as any, 1000]} castShadow>
        <icosahedronGeometry args={[0.45, 0]} />
        <meshStandardMaterial color={color} roughness={0.15} metalness={0.7} emissive={color} emissiveIntensity={0.3} />
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
      
      dummyGlass.position.set(orb.x, orb.y, 0.6 + hover);
      dummyGlass.updateMatrix();
      glassRef.current.setMatrixAt(i, dummyGlass.matrix);

      dummyBase.position.set(orb.x, orb.y, 0.25 + hover);
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
      <instancedMesh ref={glassRef} args={[null as any, null as any, 1000]}>
        <sphereGeometry args={[0.32, 16, 16]} />
        <meshStandardMaterial roughness={0.02} metalness={0.0} toneMapped={false} onBeforeCompile={(shader) => {
          shader.fragmentShader = shader.fragmentShader.replace(
            '#include <emissivemap_fragment>',
            `#include <emissivemap_fragment>
             totalEmissiveRadiance += diffuseColor.rgb * 5.0;`
          );
        }} />
      </instancedMesh>
      <instancedMesh ref={baseRef} args={[null as any, null as any, 1000]}>
        <cylinderGeometry args={[0.14, 0.14, 0.22, 8]} />
        <meshStandardMaterial color="#475569" roughness={0.3} metalness={0.8} />
      </instancedMesh>
    </group>
  );
}

export function GameScene() {
  const { gameState, playerId } = useGameStore();
  const { camera } = useThree();
  const inputs = useRef({ left: false, right: false, boost: false });

  // PRZYWRÓCONE I ZABEZPIECZONE STEROWANIE KLAWIATURĄ
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

  // PLANSZA PREMIUM: SEO GALAXY / UNIVERSE Z POLIGONOWYM LOGO AGENCJI
  const pinballTexture = useMemo(() => {
    if (typeof window === 'undefined') return null;
    const canvas = document.createElement('canvas');
    canvas.width = 2048;
    canvas.height = 2048;
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;

    // Matowe, głębokie kosmiczne tło cyber-pinballa
    ctx.fillStyle = '#05070c';
    ctx.fillRect(0, 0, 2048, 2048);

    // Ultra-cienka, elegancka siatka technologiczna
    ctx.strokeStyle = 'rgba(51, 65, 85, 0.12)';
    ctx.lineWidth = 1;
    for (let x = 0; x < 2048; x += 64) {
      ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, 2048); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(0, x); ctx.lineTo(2048, x); ctx.stroke();
    }

    // --- PROCEDURALNA KOPIA IDEALNEGO LOGO Z SYSTEMU (Poligonowy Sygnet) ---
    ctx.save();
    ctx.translate(1024, 960);

    const drawPoly = (p1: [number, number], p2: [number, number], p3: [number, number], color: string) => {
      ctx.fillStyle = color;
      ctx.beginPath(); ctx.moveTo(p1[0], p1[1]); ctx.lineTo(p2[0], p2[1]); ctx.lineTo(p3[0], p3[1]); ctx.closePath();
      ctx.fill();
    };

    // Precyzyjne odcienie niebieskich trójkątów z Waszego logo
    drawPoly([-180, 180], [0, -160], [-60, 40], '#004b87');
    drawPoly([-60, 40], [0, -160], [0, 40], '#0066b2');
    drawPoly([0, 40], [0, -160], [60, 40], '#0080ff');
    drawPoly([60, 40], [0, -160], [180, 180], '#0099ff');
    drawPoly([-180, 180], [-60, 40], [-40, 180], '#002d54');
    drawPoly([-40, 180], [-60, 40], [0, 40], '#004b87');
    drawPoly([-40, 180], [0, 40], [40, 180], '#0066b2');
    drawPoly([40, 180], [0, 40], [60, 40], '#0080ff');
    drawPoly([60, 40], [180, 180], [40, 180], '#003366');

    // Górne, ostre ramię "7" w kolorze błękitu premium
    ctx.strokeStyle = '#00a3e0';
    ctx.lineWidth = 14;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.beginPath(); ctx.moveTo(-10, -160); ctx.lineTo(210, -160); ctx.lineTo(60, 140); ctx.stroke();

    // Zielona strzałka wzrostu SEO agencji
    ctx.strokeStyle = '#22c55e';
    ctx.lineWidth = 12;
    ctx.beginPath();
    ctx.moveTo(110, -10); ctx.lineTo(220, -100); ctx.lineTo(160, -110);
    ctx.moveTo(220, -100); ctx.lineTo(220, -40); ctx.stroke();
    ctx.restore();

    // --- SPERSONALIZOWANA TYPOGRAFIA GALAXY ---
    ctx.textAlign = 'center';
    ctx.font = '900 90px system-ui, sans-serif';
    ctx.fillStyle = '#ffffff';
    ctx.letterSpacing = '3px';
    ctx.fillText('WEB ENGINEERING', 1024, 1380);

    ctx.font = 'bold 36px monospace';
    ctx.fillStyle = '#38bdf8';
    ctx.fillText('// STUDIO A7 SEO AGENCY', 1024, 1460);

    // Strategicznie rozlokowane nazwy kosmicznych stref SEO, o które prosiłeś
    ctx.font = 'bold 28px monospace';
    ctx.fillStyle = 'rgba(56, 189, 248, 0.25)';
    ctx.fillText('SEO UNIVERSE', 350, 400);
    ctx.fillText('SEO GALAXY', 1700, 400);
    ctx.fillText('CORE VITALS PLATFORM', 1024, 200);

    // Delikatna mgławica i rozproszone światełka galaktyki
    for (let light = 0; light < 50; light++) {
      const x = (light * 613) % 2048;
      const y = (light * 877) % 2048;
      if (Math.abs(x - 1024) < 400 && Math.abs(y - 1100) < 500) continue; // omijamy środek z napisami
      ctx.beginPath(); ctx.arc(x, y, 4, 0, Math.PI * 2);
      ctx.fillStyle = light % 2 === 0 ? 'rgba(56, 189, 248, 0.18)' : 'rgba(34, 197, 94, 0.12)';
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
    
    // PERSPEKTYWA STOŁU PINBALLOWEGO (Kamera pod kątem od strony flipperów)
    const target = new THREE.Vector3(player.x, player.y - 14, player.boost ? 15 : 19);
    camera.position.lerp(target, 0.1);
    camera.lookAt(player.x, player.y + 2, 0);

    // Przesyłanie parametrów ruchu do klastra Node.js
    let angle = player.currentAngle;
    if (inputs.current.left) angle -= Math.PI * 1.4 * delta;
    if (inputs.current.right) angle += Math.PI * 1.4 * delta;
    useGameStore.getState().sendPlayerState(angle, inputs.current.boost);
  });

  return (
    <group>
      <ambientLight intensity={0.5} />
      <directionalLight position={[5, 12, 18]} intensity={0.8} />
      <pointLight position={[0, 0, 6]} intensity={0.4} color="#38bdf8" />

      <EffectComposer disableNormalPass>
        <Bloom luminanceThreshold={0.15} intensity={1.3} radius={0.5} />
      </EffectComposer>

      {gameState && Object.keys(gameState.players).map(pid => (
        <Snake key={pid} playerId={pid} color={gameState.players[pid].color} isLocal={pid === playerId} />
      ))}
      <Orbs />

      {/* Pochylony blat stołu z galaktycznymi elementami */}
      <mesh position={[0, 0, -0.2]}>
        <planeGeometry args={[WORLD_SIZE * 2, WORLD_SIZE * 2]} />
        <meshStandardMaterial map={pinballTexture || undefined} roughness={0.35} metalness={0.15} />
      </mesh>

      <Grid position={[0, 0, -0.15]} rotation={[Math.PI / 2, 0, 0]} args={[WORLD_SIZE * 2, WORLD_SIZE * 2]} cellSize={5} cellThickness={0.15} cellColor="#1e293b" sectionSize={50} sectionThickness={0.4} sectionColor="#334155" fadeDistance={85} />
    </group>
  );
}
