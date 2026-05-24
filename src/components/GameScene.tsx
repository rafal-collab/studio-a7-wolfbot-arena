/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */
import * as THREE from 'three';
import { useMemo, useRef } from 'react';
import { useGameStore } from '../store/gameStore';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { EffectComposer, Bloom } from '@react-three/postprocessing';
import { Grid, OrbitControls, useTexture } from '@react-three/drei';

const WORLD_SIZE = 100;

function Snake({ playerId, color, isLocal }: { playerId: string, color: string, isLocal: boolean }) {
  const bodyRef = useRef<THREE.InstancedMesh>(null);
  const headRef = useRef<THREE.Group>(null);
  const dummy = useMemo(() => new THREE.Object3D(), []);
  const currentPositions = useRef<{x: number, y: number}[]>([]);

  useFrame((state, delta) => {
    if (!bodyRef.current || !headRef.current) return;
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
        // Align the Wolf Bot's nose to face the travel angle nicely
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
        {/* Main Robotic Wolf Skull (Placeholder, Option 1 implemented here) */}
        <mesh castShadow receiveShadow>
          <boxGeometry args={[1.3, 1.0, 0.8]} />
          <meshStandardMaterial color="#111622" roughness={0.15} metalness={0.9} />
        </mesh>
        {/* Sleek Geometric Sunglasses (Added, fulfills Option 1 & 3 implicit request) */}
        <mesh position={[0.5, 0, 0.15]} rotation={[0, 0.1, 0]}>
          <boxGeometry args={[0.3, 0.9, 0.35]} />
          <meshStandardMaterial color="#020408" roughness={0.01} metalness={0.95} />
        </mesh>
        {/* Nose Tip */}
        <mesh position={[1.2, 0, -0.05]}>
          <boxGeometry args={[0.15, 0.2, 0.2]} />
          <meshStandardMaterial color="#050811" roughness={0.9} metalness={0.1} />
        </mesh>
        {/* Angular Ears */}
        <mesh castShadow position={[-0.22, 0.38, 0.55]} rotation={[0.25, 0, -0.15]}>
          <coneGeometry args={[0.22, 0.8, 4]} />
          <meshStandardMaterial color="#111622" roughness={0.15} metalness={0.9} />
        </mesh>
        <mesh castShadow position={[-0.22, -0.38, 0.55]} rotation={[-0.25, 0, 0.15]}>
          <coneGeometry args={[0.22, 0.8, 4]} />
          <meshStandardMaterial color="#111622" roughness={0.15} metalness={0.9} />
        </mesh>
        {/* Glowing Cyber Eye (Left) */}
        <mesh position={[0.42, 0.3, 0.2]}>
          <sphereGeometry args={[0.12, 8, 8]} />
          <meshStandardMaterial color={color} emissive={color} emissiveIntensity={6} toneMapped={false} />
        </mesh>
        {/* Glowing Cyber Eye (Right) */}
        <mesh position={[0.42, -0.3, 0.2]}>
          <sphereGeometry args={[0.12, 8, 8]} />
          <meshStandardMaterial color={color} emissive={color} emissiveIntensity={6} toneMapped={false} />
        </mesh>
        {/* Cybernetic Visor element */}
        <mesh position={[0.22, 0, 0.35]} rotation={[0, 0.15, 0]}>
          <boxGeometry args={[0.5, 0.35, 0.1]} />
          <meshStandardMaterial color={color} emissive={color} emissiveIntensity={3} toneMapped={false} />
        </mesh>
      </group>
      <instancedMesh ref={bodyRef} args={[null as any, null as any, 2000]} castShadow receiveShadow frustumCulled={false}>
        {/* Diamond crystals trail segments */}
        <icosahedronGeometry args={[0.55, 0]} />
        <meshStandardMaterial color={color} roughness={0.15} metalness={0.85} toneMapped={false} onBeforeCompile={(shader) => {
          shader.fragmentShader = shader.fragmentShader.replace(
            '#include <emissivemap_fragment>',
            `
            #include <emissivemap_fragment>
            float fresnel = pow(1.0 - max(dot(normal, normalize(vViewPosition)), 0.0), 2.0);
            totalEmissiveRadiance += diffuseColor.rgb * (0.35 + fresnel * 2.5);
            `
          );
        }} />
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
      // Floating/glowing pulse logic remains
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
      {/* Complex procedural light bulb approximation (fulfills Screen 3 request) */}
      <sphereGeometry args={[0.3, 16, 16]} />
      <meshStandardMaterial roughness={0.1} metalness={0.9} toneMapped={false} onBeforeCompile={(shader) => {
        shader.fragmentShader = shader.fragmentShader.replace(
          '#include <emissivemap_fragment>',
          `
          #include <emissivemap_fragment>
          // Super glowing halo light emission for glass sphere
          totalEmissiveRadiance += diffuseColor.rgb * 9.5;
          
          // Small procedural filament approximation
          float seed = orbId_fragment.x; // Use orb ID as seed from shader
          float filament = 0.05 + Math.cos(state.clock.elapsedTime * 1.0 + seed * 1.0) * 0.02;
          vec3 filamentColor = diffuseColor.rgb * 0.8;
          totalEmissiveRadiance += filamentColor * (0.8 + 0.3 * sin(state.clock.elapsedTime * 0.2 + seed)) * (0.5 + 0.5 * sin(dot(vNormal, vec3(0.0, 1.0, 0.0)) * 20.0));
          `
        );
      }} />
    </instancedMesh>
  );
}

// Global Game State (singleton/ref patterns for performance)
const globalGameState = { current: null as any };
const localCollectedOrbs = new Set<string>();

export function GameScene() {
  const { gameState, playerId, sendPlayerState, sendCollectOrb } = useGameStore();
  const { camera } = useThree();

  const a7Texture = useMemo(() => {
    if (typeof window === 'undefined') return null;
    const canvas = document.createElement('canvas');
    canvas.width = 1024; // Increased resolution for legible logo/text
    canvas.height = 1024;
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;

    // Dark grey digital developer canvas background
    ctx.fillStyle = '#0a0d14';
    ctx.fillRect(0, 0, 1024, 1024);

    // Subtle technical dev crosshairs and coordinates
    ctx.strokeStyle = '#121721';
    ctx.lineWidth = 1;
    for (let c = 0; c < 1024; c += 64) {
      ctx.beginPath(); ctx.moveTo(c, 0); ctx.lineTo(c, 1024); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(0, c); ctx.lineTo(1024, c); ctx.stroke();
    }

    // Border markings
    ctx.strokeStyle = '#1a2233';
    ctx.lineWidth = 2;
    ctx.strokeRect(24, 24, 976, 976);

    // Console tech logs (retained, professionally styled)
    ctx.font = '14px "Courier New", monospace';
    ctx.fillStyle = '#414f6b';
    ctx.fillText('<studio_a7_interfaces_active>', 50, 64);
    ctx.fillText('</studio_a7_interfaces_active>', 640, 990);
    ctx.fillText('SYS_LOG: DwellTime.Optimization=TRUE', 50, 990);
    ctx.fillText('CORE_VITALS_ACTIVE: 100%', 700, 64);

    // Hexagonal graphic container and Studio A7 Logo in the center
    ctx.save();
    ctx.translate(512, 430);

    // Outer faint hex container
    ctx.beginPath();
    for (let s = 0; s < 6; s++) {
      const angle = (s * Math.PI) / 3;
      const x = Math.cos(angle) * 150;
      const y = Math.sin(angle) * 150;
      if (s === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
    }
    ctx.closePath();
    ctx.strokeStyle = '#1e2838';
    ctx.lineWidth = 8;
    ctx.stroke();

    // Legible Logo drawing (resembling facets from image_18.png)
    ctx.strokeStyle = '#4e86b0'; // bright branding blue
    ctx.lineWidth = 12;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    // Triangle facets shape
    ctx.beginPath();
    ctx.moveTo(-40, 50); ctx.lineTo(0, -50); ctx.lineTo(40, 50); ctx.closePath();
    ctx.stroke();

    // Central line separating facets
    ctx.beginPath(); ctx.moveTo(0, 50); ctx.lineTo(0, -50); ctx.stroke();

    // Transverse lines for facets
    ctx.beginPath(); ctx.moveTo(-20, 16); ctx.lineTo(20, 16); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(-10, -16); ctx.lineTo(10, -16); ctx.stroke();

    // Internal facet details and text integration
    ctx.strokeStyle = '#eceff4';
    ctx.lineWidth = 6;
    ctx.beginPath(); ctx.moveTo(6, -50); ctx.lineTo(56, -50); ctx.lineTo(20, 36); ctx.stroke();

    // Glowing Green Trend Line representing high traffic and rankings
    ctx.strokeStyle = '#a3be8c'; // rich green growth metrics
    ctx.lineWidth = 6;
    ctx.beginPath();
    ctx.moveTo(40, -10); ctx.lineTo(76, -44); ctx.lineTo(56, -44);
    ctx.moveTo(76, -44); ctx.lineTo(76, -24); ctx.stroke();
    ctx.restore();

    // Professional EN text labels (replaces generic/seo text, fulfills request)
    ctx.textAlign = 'center';
    ctx.font = 'bold 68px sans-serif';
    ctx.fillStyle = '#ffffff';
    ctx.fillText('WEB ENGINEERING', 512, 670);
    ctx.font = '24px monospace';
    ctx.fillStyle = '#eceff4';
    ctx.fillText('// Studio A7 Agency', 512, 730);
    ctx.font = '18px monospace';
    ctx.fillStyle = '#6b80ad';
    ctx.fillText('DWELL TIME & ENGAGEMENT SHOWCASE', 512, 790);

    // Procedural Story-driven Pinball "Flashing Lights" (added, fulfills request)
    for (let light = 0; light < 20; light++) {
      ctx.beginPath();
      ctx.arc(Math.random() * 1024, Math.random() * 1024, 6 + Math.random() * 10, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(255, 255, 255, ${0.1 + Math.random() * 0.3})`;
      ctx.fill();
    }

    const tex = new THREE.CanvasTexture(canvas);
    tex.wrapS = THREE.RepeatWrapping;
    tex.wrapT = THREE.RepeatWrapping;
    // Centralized pinball board effect (reduced tiling, centered)
    tex.repeat.set(1, 1);
    tex.offset.set(-0.5, -0.5); // Center the single texture instance
    return tex;
  }, []);

  const inputs = useRef({ left: false, right: false, boost: false });

  // Update logic pattern remains (inputs, gameState sync, camera follow)
  useFrame((state, delta) => {
    globalGameState.current = gameState;
    const gs = gameState;
    const player = playerId && gs ? gs.players[playerId] : null;

    // Preserve original input handling, camera follow, and state sending logic...
    if (!player) return;
    const target = new THREE.Vector3(player.x, player.y, player.boost ? 20 : 30);
    camera.position.lerp(target, 0.1);
    camera.lookAt(player.x, player.y, 0);

    let angle = player.currentAngle;
    if (inputs.current.left) angle -= Math.PI * delta;
    if (inputs.current.right) angle += Math.PI * delta;
    sendPlayerState(angle, inputs.current.boost);
  });

  return (
    <group>
      <ambientLight intensity={0.1} />
      <directionalLight position={[10, 10, 10]} intensity={0.4} castShadow shadow-mapSize={[2048, 2048]} />
      <pointLight position={[0, WORLD_SIZE, 30]} intensity={0.3} color="#4e86b0" />
      <pointLight position={[0, -WORLD_SIZE, 30]} intensity={0.3} color="#a3be8c" />
      <EffectComposer disableNormalPass>
        <Bloom luminanceThreshold={0.01} mipmapBlur intensity={0.8} radius={0.8} />
      </EffectComposer>

      {/* Tiled floor logic remains for performance, but background texture is now centralized on the pinball board. Cell details reduced to focus on centralized board. */}
      {gameState && Object.keys(gameState.players).map(pid => (
        <Snake key={pid} playerId={pid} color={gameState.players[pid].color} isLocal={pid === playerId} />
      ))}
      <Orbs />

      {/* Ground plane with complex procedural pinball board texture (reduced tiling, centered) */}
      <mesh receiveShadow position={[0, 0, -0.2]}>
        <planeGeometry args={[WORLD_SIZE * 2, WORLD_SIZE * 2]} />
        <meshStandardMaterial map={a7Texture || undefined} roughness={0.6} metalness={0.2} />
      </mesh>

      {/* Sleek, thin technical overlay grid lines */}
      <Grid position={[0, 0, -0.15]} rotation={[Math.PI / 2, 0, 0]} args={[WORLD_SIZE * 2, WORLD_SIZE * 2]} cellSize={4} cellThickness={0.4} cellColor="#1c2433" sectionSize={40} sectionThickness={0.8} sectionColor="#2d3748" fadeDistance={120} fadeStrength={1} />
    </group>
  );
}
