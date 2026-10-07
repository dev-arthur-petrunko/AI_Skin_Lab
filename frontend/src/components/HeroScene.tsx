'use client';
import { Canvas, useFrame } from '@react-three/fiber';
import { Float, MeshTransmissionMaterial, Environment, Lightformer, Sparkles } from '@react-three/drei';
import { useInView } from 'framer-motion';
import { useTheme } from 'next-themes';
import { useMemo, useRef } from 'react';
import * as THREE from 'three';

function Rig({ children }: { children: React.ReactNode }) {
  const g = useRef<THREE.Group>(null!);
  useFrame((s, dt) => {
    g.current.rotation.y = THREE.MathUtils.damp(g.current.rotation.y, s.pointer.x * 0.55, 4, dt);
    g.current.rotation.x = THREE.MathUtils.damp(g.current.rotation.x, -s.pointer.y * 0.3, 4, dt);
  });
  return <group ref={g}>{children}</group>;
}

function Glass({ color, position, scale = 1, children }: { color: string; position: [number, number, number]; scale?: number; children: React.ReactNode }) {
  return (
    <Float speed={1.5} rotationIntensity={0.9} floatIntensity={1.3}>
      <mesh position={position} scale={scale}>
        {children}
        <MeshTransmissionMaterial transmission={1} thickness={0.7} roughness={0.06} ior={1.3}
          chromaticAberration={0.06} anisotropicBlur={0.2} color={color} backside samples={5} resolution={512} />
      </mesh>
    </Float>
  );
}

export default function HeroScene() {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref);
  const { resolvedTheme } = useTheme();
  const c = useMemo(() => {
    const s = typeof document !== 'undefined' ? getComputedStyle(document.documentElement) : null;
    return {
      a: s?.getPropertyValue('--azure').trim() || '#4F8CFF',
      q: s?.getPropertyValue('--aqua').trim() || '#7DE3FF',
      p: '#FFB3D4'
    };
  }, [resolvedTheme]);

  return (
    <div ref={ref} className="absolute inset-0">
      <Canvas dpr={[1, 1.5]} camera={{ position: [0, 0, 6], fov: 38 }} gl={{ alpha: true, antialias: true }}
        frameloop={inView ? 'always' : 'never'}>
        <ambientLight intensity={0.6} />
        <directionalLight position={[4, 5, 4]} intensity={1.4} />
        <Rig>
          <Glass color={c.a} position={[0, 0.1, 0]} scale={1.15}>
            <mesh>
              <capsuleGeometry args={[0.7, 1.4, 12, 32]} />
            </mesh>
          </Glass>
          <Glass color={c.q} position={[-1.9, -0.9, -0.6]} scale={0.8}>
            <mesh>
              <sphereGeometry args={[0.8, 48, 48]} />
            </mesh>
          </Glass>
          <Glass color={c.p} position={[1.9, 0.9, -0.3]} scale={0.75}>
            <mesh>
              <cylinderGeometry args={[0.8, 0.8, 0.6, 48]} />
            </mesh>
          </Glass>
          <Glass color={c.a} position={[1.6, -1.4, 0.4]} scale={0.55}>
            <mesh>
              <torusGeometry args={[0.7, 0.22, 24, 64]} />
            </mesh>
          </Glass>
          <Sparkles count={40} scale={[7, 5, 3]} size={2.2} speed={0.4} color={c.q} />
        </Rig>
        <Environment resolution={256}>
          <Lightformer intensity={2.2} position={[0, 4, -5]} scale={[10, 3, 1]} />
          <Lightformer intensity={1.6} position={[-5, 1, 2]} rotation-y={Math.PI / 2} scale={[6, 4, 1]} />
          <Lightformer intensity={1.6} position={[5, -1, 2]} rotation-y={-Math.PI / 2} scale={[6, 4, 1]} />
        </Environment>
      </Canvas>
    </div>
  );
}