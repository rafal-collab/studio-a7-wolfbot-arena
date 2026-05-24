/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import { useEffect, useRef, useState, useMemo } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { useGameStore, globalGameState } from '../store/gameStore';
import { WORLD_SIZE, TURN_SPEED, BOOST_SPEED, BASE_SPEED } from '../shared/types';
import * as THREE from 'three';
import { Sphere, Grid } from '@react-three/drei';

const localCollectedOrbs = new Set<string>();

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
      currentPositions.current.push({ 
        x: player.segments[idx]?.x || 0, 
        y: player.segments[idx]?.y || 0 
      });
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
        {/* Main Robotic Wolf Skull */}
        <mesh castShadow receiveShadow>
          <boxGeometry args={[1.3, 1.0, 0.8]} />
          <meshStandardMaterial color="#111622" roughness={0.15} metalness={0.9} />
        </mesh>
        
        {/* Cyber Muzzle / Jaw */}
        <mesh castShadow receiveShadow position={[0.75, 0, -0.1]}>
          <boxGeometry args={[0.85, 0.5, 0.45]} />
          <meshStandardMaterial color="#1e2535" roughness={0.25} metalness={0.8} />
        </mesh>

        {/* Nose Tip */}
        <mesh position={[1.2, 0, -0.05]}>
          <boxGeometry args={[0.15, 0.2, 0.2]} />
          <meshStandardMaterial color="#050811" roughness={0.9} metalness={0.1} />
        </mesh>

        {/* Angular Left Ear */}
        <mesh castShadow position={[-0.22, 0.38, 0.55]} rotation={[0.25, 0, -0.15]}>
          <coneGeometry args={[0.22, 0.8, 4]} />
          <meshStandardMaterial color="#111622" roughness={0.15} metalness={0.9} />
        </mesh>

        {/* Angular Right Ear */}
        <mesh castShadow position={[-0.22, -0.38, 0.55]} rotation={[-0.25, 0, 0.15]}>
          <coneGeometry args={[0.22, 0.8, 4]} />
          <meshStandardMaterial color="#111622" roughness={0.15} metalness={0.9} />
        </mesh>

        {/* Glowing Cyber Eye (Left) - Colored according to player theme */}
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
        {/* Diamond crystals instead of spheres */}
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
      
      // Floating/glowing pulse using ID as offset seed
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
      {/* Dynamic light star shapes instead of balls */}
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
            // Super glowing halo light emission
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

  const a7Texture = useMemo(() => {
    if (typeof window === 'undefined') return null;
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 512;
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;

    // Dark grey digital developer canvas background
    ctx.fillStyle = '#0a0d14';
    ctx.fillRect(0, 0, 512, 512);

    // Subtle technical dev crosshairs and coordinates
    ctx.strokeStyle = '#121721';
    ctx.lineWidth = 1;
    for (let c = 0; c < 512; c += 32) {
      ctx.beginPath();
      ctx.moveTo(c, 0); ctx.lineTo(c, 512);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(0, c); ctx.lineTo(512, c);
      ctx.stroke();
    }

    // Border markings
    ctx.strokeStyle = '#1a2233';
    ctx.lineWidth = 2;
    ctx.strokeRect(12, 12, 488, 488);

    // Console tech logs
    ctx.font = '10px "Courier New", monospace';
    ctx.fillStyle = '#414f6b';
    ctx.fillText('<studio_a7_seo_node_active>', 25, 32);
    ctx.fillText('</studio_a7_seo_node_active>', 320, 495);
    ctx.fillText('INDEX_STATUS: RANK_1', 25, 495);
    ctx.fillText('SYS.MEM_STABLE: 100%', 350, 32);

    // Hexagonal graphic container and Studio A7 Logo icon in the center
    ctx.save();
    ctx.translate(256, 215);

    // Outer faint hex
    ctx.beginPath();
    for (let s = 0; s < 6; s++) {
      const angle = (s * Math.PI) / 3;
      const x = Math.cos(angle) * 75;
      const y = Math.sin(angle) * 75;
      if (s === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.closePath();
    ctx.strokeStyle = '#1e2838';
    ctx.lineWidth = 4;
    ctx.stroke();

    // Stylized "A" symbol indicating Google Search visibility / upward growth / SEO optimization
    ctx.strokeStyle = '#4e86b0'; // bright branding blue
    ctx.lineWidth = 6;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.beginPath();
    ctx.moveTo(-20, 25);
    ctx.lineTo(0, -25);
    ctx.lineTo(20, 25);
    ctx.stroke();

    // Intersecting horizontal bar
    ctx.beginPath();
    ctx.moveTo(-10, 8);
    ctx.lineTo(10, 8);
    ctx.stroke();

    // Intersecting "7" keyline
    ctx.strokeStyle = '#eceff4';
    ctx.beginPath();
    ctx.moveTo(3, -25);
    ctx.lineTo(28, -25);
    ctx.lineTo(10, 18);
    ctx.stroke();

    // Glowing Green Trend Line representing high traffic and rankings
    ctx.strokeStyle = '#a3be8c'; // rich green for Google growth metrics
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(20, -5);
    ctx.lineTo(38, -22);
    ctx.lineTo(28, -22);
    ctx.moveTo(38, -22);
    ctx.lineTo(38, -12);
    ctx.stroke();

    ctx.restore();

    // Text labels
    ctx.textAlign = 'center';
    
    ctx.font = 'bold 34px sans-serif';
    ctx.fillStyle = '#ffffff';
    ctx.fillText('STUDIO A7', 256, 335);

    ctx.font = '12px monospace';
    ctx.fillStyle = '#6b80ad';
    ctx.fillText('S E O   A G E N C Y', 256, 365);

    ctx.font = '9px monospace';
    ctx.fillStyle = '#414f6b';
    ctx.fillText('ORGANIC TRAFFIC BOT PLATFORM', 256, 395);

    const tex = new THREE.CanvasTexture(canvas);
    tex.wrapS = THREE.RepeatWrapping;
    tex.wrapT = THREE.RepeatWrapping;
    
    // We want the texture repeated across the ground.
    // 15x15 repetitions covers the grid nicely without feeling too crowded
    tex.repeat.set(15, 15);
    return tex;
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
      
      // Initialize from server if not active
      if (!localPlayerRef.current.active && serverPlayer.segments.length > 0) {
        localPlayerRef.current.active = true;
        localPlayerRef.current.segments = [...serverPlayer.segments];
        localPlayerRef.current.score = serverPlayer.score;
        localPlayerRef.current.currentAngle = serverPlayer.currentAngle;
      }

      if (!localPlayerRef.current.active) return;

      // Local movement logic
      if (inputs.current.left) localPlayerRef.current.currentAngle += TURN_SPEED * delta;
      if (inputs.current.right) localPlayerRef.current.currentAngle -= TURN_SPEED * delta;
      
      localPlayerRef.current.isBoosting = inputs.current.boost && localPlayerRef.current.score > 10;
      const speed = localPlayerRef.current.isBoosting ? BOOST_SPEED : BASE_SPEED;
      
      const head = { ...localPlayerRef.current.segments[0] };
      head.x += Math.cos(localPlayerRef.current.currentAngle) * speed * delta;
      head.y += Math.sin(localPlayerRef.current.currentAngle) * speed * delta;

      // Boundary check
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

      // Check orb collisions
      for (const orbId in gs.orbs) {
        if (localCollectedOrbs.has(orbId)) continue;
        const orb = gs.orbs[orbId];
        const dx = head.x - orb.x;
        const dy = head.y - orb.y;
        if (dx * dx + dy * dy < 4) {
          localPlayerRef.current.score += orb.value;
          localCollectedOrbs.add(orbId);
          delete gs.orbs[orbId]; // predict locally
          sendCollectOrb(orbId);
        }
      }

      // Cleanup localCollectedOrbs occasionally
      if (Math.random() < 0.05) {
        for (const id of localCollectedOrbs) {
          if (!gs.orbs[id]) localCollectedOrbs.delete(id);
        }
      }

      // Check player collisions
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
        sendPlayerState({
          segments: localPlayerRef.current.segments,
          score: localPlayerRef.current.score,
          currentAngle: localPlayerRef.current.currentAngle,
          isBoosting: localPlayerRef.current.isBoosting,
          state: 'dead'
        });
        return;
      }

      // Overwrite global state for local rendering
      gs.players[playerId].segments = localPlayerRef.current.segments;
      gs.players[playerId].score = localPlayerRef.current.score;
      gs.players[playerId].currentAngle = localPlayerRef.current.currentAngle;
      gs.players[playerId].isBoosting = localPlayerRef.current.isBoosting;

      // Send state to server at 20Hz
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
      
      // Smooth camera follow predicted head
      camera.position.x += (head.x - camera.position.x) * 10 * delta;
      camera.position.y += (head.y - camera.position.y) * 10 * delta;
      camera.position.z += (targetZ - camera.position.z) * 4 * delta;
      camera.lookAt(camera.position.x, camera.position.y, 0);

      // Make the directional light follow the camera to keep shadows crisp
      if (lightRef.current) {
        lightRef.current.position.set(camera.position.x + 10, camera.position.y - 10, 30);
        lightTarget.position.set(camera.position.x, camera.position.y, 0);
      }
    } else {
      localPlayerRef.current.active = false;
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

      {/* Ground plane with custom repeating Studio A7 branding texture */}
      <mesh receiveShadow position={[0, 0, -0.2]}>
        <planeGeometry args={[WORLD_SIZE, WORLD_SIZE]} />
        <meshStandardMaterial 
          map={a7Texture || undefined} 
          roughness={0.6}
          metalness={0.2}
        />
      </mesh>

      {/* Sleek, thin technical overlay grid lines */}
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
