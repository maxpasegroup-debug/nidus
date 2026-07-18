"use client";

/**
 * Compact 60-second cinematic landing journey.
 * It uses React Three Fiber for depth and GSAP to choreograph the virtual camera from student to officer.
 */
import Link from "next/link";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import gsap from "gsap";
import { BookOpen, GraduationCap, LogIn, ShieldCheck } from "lucide-react";
import { Suspense, useEffect, useMemo, useRef, useState } from "react";
import type { Group, PerspectiveCamera } from "three";
import { MathUtils } from "three";
import { ExperienceErrorBoundary } from "../runtime";

const beats = [
  {
    eyebrow: "Chapter 01",
    title: "A student begins in silence.",
    body: "Before the uniform, there is the private decision to prepare.",
    tone: "from-[#041120] via-[#071d36] to-[#0f243d]"
  },
  {
    eyebrow: "Chapter 02",
    title: "Discipline enters the room.",
    body: "Books, breath, routine and correction become one training rhythm.",
    tone: "from-[#071d36] via-[#142d46] to-[#1d3348]"
  },
  {
    eyebrow: "Chapter 03",
    title: "The path becomes visible.",
    body: "NDA, CDS, AFCAT, SSB and service pathways connect into one mission.",
    tone: "from-[#091727] via-[#21354a] to-[#493d24]"
  },
  {
    eyebrow: "Chapter 04",
    title: "The future self stands ahead.",
    body: "Not a promise. A direction shaped by training, guidance and courage.",
    tone: "from-[#041120] via-[#0d1c2e] to-[#b9913f]"
  }
];

function CameraRig({ progress }: { progress: number }) {
  const { camera } = useThree();
  const timeline = useRef<gsap.core.Timeline | null>(null);
  const proxy = useMemo(() => ({ x: 0, y: 1.2, z: 7.6, rx: -0.08, ry: 0, rz: 0 }), []);

  useEffect(() => {
    timeline.current = gsap
      .timeline({ paused: true })
      .to(proxy, { x: -1.4, y: 1.05, z: 5.8, rx: -0.06, ry: 0.18, duration: 1, ease: "power2.inOut" })
      .to(proxy, { x: 0.7, y: 1.45, z: 4.3, rx: -0.13, ry: -0.12, duration: 1, ease: "power2.inOut" })
      .to(proxy, { x: 0, y: 1.8, z: 3.05, rx: -0.18, ry: 0, duration: 1, ease: "power3.inOut" });

    return () => {
      timeline.current?.kill();
      timeline.current = null;
    };
  }, [proxy]);

  useFrame(() => {
    timeline.current?.progress(progress);
    const perspective = camera as PerspectiveCamera;
    perspective.position.set(proxy.x, proxy.y, proxy.z);
    perspective.rotation.set(proxy.rx, proxy.ry, proxy.rz);
    perspective.lookAt(0, 0.6, 0);
  });

  return null;
}

function OfficerSilhouette({ progress }: { progress: number }) {
  const groupRef = useRef<Group>(null);

  useFrame(({ clock }) => {
    if (!groupRef.current) return;
    const breath = Math.sin(clock.elapsedTime * 0.8) * 0.025;
    groupRef.current.position.y = MathUtils.lerp(-0.35, 0.08, progress) + breath;
    groupRef.current.rotation.y = MathUtils.lerp(-0.38, 0.22, progress);
  });

  return (
    <group ref={groupRef}>
      <mesh position={[0, 1.25, 0]}>
        <sphereGeometry args={[0.32, 32, 32]} />
        <meshStandardMaterial color="#111827" roughness={0.62} metalness={0.08} />
      </mesh>
      <mesh position={[0, 0.45, 0]} scale={[0.72, 1.28, 0.32]}>
        <capsuleGeometry args={[0.42, 0.86, 8, 24]} />
        <meshStandardMaterial color="#0b1728" roughness={0.66} metalness={0.12} />
      </mesh>
      <mesh position={[-0.46, 0.3, 0]} rotation={[0, 0, -0.18]} scale={[0.13, 0.78, 0.13]}>
        <capsuleGeometry args={[0.22, 0.7, 8, 16]} />
        <meshStandardMaterial color="#111827" roughness={0.72} />
      </mesh>
      <mesh position={[0.46, 0.3, 0]} rotation={[0, 0, 0.18]} scale={[0.13, 0.78, 0.13]}>
        <capsuleGeometry args={[0.22, 0.7, 8, 16]} />
        <meshStandardMaterial color="#111827" roughness={0.72} />
      </mesh>
      <mesh position={[0, 1.63, 0]} scale={[0.72, 0.08, 0.28]}>
        <boxGeometry />
        <meshStandardMaterial color="#b9913f" roughness={0.4} metalness={0.25} />
      </mesh>
    </group>
  );
}

function JourneyWorld({ progress }: { progress: number }) {
  const groupRef = useRef<Group>(null);

  useFrame(({ clock }) => {
    if (!groupRef.current) return;
    groupRef.current.rotation.y = Math.sin(clock.elapsedTime * 0.18) * 0.035;
  });

  return (
    <>
      <CameraRig progress={progress} />
      <color attach="background" args={["#041120"]} />
      <fog attach="fog" args={["#041120", 5, 12]} />
      <ambientLight intensity={0.55} />
      <directionalLight position={[2.8, 4.5, 3]} intensity={2.2} color="#f4d98d" />
      <pointLight position={[-3, 1.6, 2]} intensity={2.2} color="#7ea6c7" />
      <group ref={groupRef}>
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.72, 0]}>
          <planeGeometry args={[9, 14, 32, 32]} />
          <meshStandardMaterial color="#101827" roughness={0.88} metalness={0.08} />
        </mesh>
        <mesh position={[-1.6, -0.14, 0.9]} rotation={[0.08, -0.36, 0.02]} scale={[1.05, 0.06, 0.72]}>
          <boxGeometry />
          <meshStandardMaterial color="#f6f1e6" roughness={0.72} />
        </mesh>
        <mesh position={[-1.22, -0.04, 0.88]} rotation={[0.1, -0.36, 0.03]} scale={[0.82, 0.05, 0.56]}>
          <boxGeometry />
          <meshStandardMaterial color="#d8c8a6" roughness={0.82} />
        </mesh>
        <mesh position={[1.45, -0.42, 0.6]} rotation={[0, 0.28, 0]} scale={[0.88, 0.18, 0.32]}>
          <boxGeometry />
          <meshStandardMaterial color="#2d3748" roughness={0.8} />
        </mesh>
        <mesh position={[1.5, -0.21, 0.55]} rotation={[0, 0.28, 0]} scale={[0.82, 0.08, 0.28]}>
          <boxGeometry />
          <meshStandardMaterial color="#b9913f" roughness={0.42} metalness={0.28} />
        </mesh>
        <mesh position={[0, -0.58, -1.7]} scale={[6.2, 0.035, 0.08]}>
          <boxGeometry />
          <meshStandardMaterial color="#b9913f" emissive="#5c441c" emissiveIntensity={0.2} />
        </mesh>
        <mesh position={[0, -0.56, -3.2]} scale={[4.6, 0.035, 0.08]}>
          <boxGeometry />
          <meshStandardMaterial color="#b9913f" emissive="#5c441c" emissiveIntensity={0.22} />
        </mesh>
        <OfficerSilhouette progress={progress} />
      </group>
    </>
  );
}

function useJourneyProgress() {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    let frame = 0;
    const update = () => {
      const documentHeight = Math.max(document.documentElement.scrollHeight - window.innerHeight, 1);
      setProgress(Math.min(1, Math.max(0, window.scrollY / documentHeight)));
    };
    const requestUpdate = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(update);
    };

    update();
    window.addEventListener("scroll", requestUpdate, { passive: true });
    window.addEventListener("resize", requestUpdate);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("scroll", requestUpdate);
      window.removeEventListener("resize", requestUpdate);
    };
  }, []);

  return progress;
}

function ActiveBeat({ progress }: { progress: number }) {
  const index = Math.min(beats.length - 1, Math.floor(progress * beats.length));
  const beat = beats[index];

  return (
    <div className="pointer-events-none fixed inset-0 z-20 flex items-end px-4 pb-[18vh] sm:px-6 lg:px-10">
      <div className="max-w-4xl text-white">
        <p className="text-xs font-black uppercase tracking-[0.36em] text-[#e7c873]">{beat.eyebrow}</p>
        <h1 className="mt-5 text-[clamp(3.5rem,8vw,8rem)] font-black leading-[0.92] tracking-normal drop-shadow-2xl">{beat.title}</h1>
        <p className="mt-6 max-w-2xl text-base font-semibold leading-8 text-white/76 sm:text-xl">{beat.body}</p>
      </div>
    </div>
  );
}

export function CinematicJourney() {
  const progress = useJourneyProgress();
  const activeTone = beats[Math.min(beats.length - 1, Math.floor(progress * beats.length))].tone;

  return (
    <ExperienceErrorBoundary boundaryId="cinematic-journey">
      <main id="main-content" className={`relative min-h-[460vh] overflow-x-hidden bg-gradient-to-br ${activeTone} text-white transition-colors duration-700`}>
        <div className="fixed inset-0 z-0">
          <Canvas camera={{ fov: 42, position: [0, 1.2, 7.6], near: 0.1, far: 100 }} dpr={[1, 1.55]} gl={{ antialias: true, alpha: false, powerPreference: "high-performance" }}>
            <Suspense fallback={null}>
              <JourneyWorld progress={progress} />
            </Suspense>
          </Canvas>
        </div>
        <div className="pointer-events-none fixed inset-0 z-10 bg-[radial-gradient(circle_at_50%_12%,transparent_0%,rgba(4,17,32,0.18)_38%,rgba(4,17,32,0.74)_100%)]" />
        <nav className="fixed left-0 right-0 top-0 z-40 flex h-20 items-center justify-between px-4 text-white sm:px-6 lg:px-10">
          <Link href="/" className="text-sm font-black uppercase tracking-[0.22em]">NIDUS</Link>
          <div className="hidden items-center gap-3 rounded-full border border-white/14 bg-white/8 px-4 py-2 text-xs font-black uppercase tracking-[0.18em] text-white/72 backdrop-blur-xl sm:flex">
            60-second journey
          </div>
        </nav>
        <ActiveBeat progress={progress} />
        <div className="fixed bottom-6 left-4 right-4 z-40 mx-auto max-w-[96rem]">
          <div className="h-1 overflow-hidden rounded-full bg-white/16">
            <div className="h-full rounded-full bg-[#e7c873]" style={{ width: `${Math.round(progress * 100)}%` }} />
          </div>
        </div>
        <section className="absolute bottom-0 left-0 right-0 z-30 flex min-h-screen items-center justify-center px-4 py-24">
          <div className="w-full max-w-4xl rounded-[2rem] border border-white/14 bg-[#041120]/78 p-6 text-center shadow-[0_40px_140px_rgba(0,0,0,0.42)] backdrop-blur-2xl sm:p-10">
            <p className="text-xs font-black uppercase tracking-[0.32em] text-[#e7c873]">The decision</p>
            <h2 className="mt-5 text-[clamp(2.8rem,7vw,6.5rem)] font-black leading-[0.95]">Begin the officer journey.</h2>
            <p className="mx-auto mt-5 max-w-2xl text-base font-semibold leading-8 text-white/72">Apply for admission, or log in if your NIDUS journey has already started.</p>
            <div className="mt-9 flex flex-col justify-center gap-4 sm:flex-row">
              <Link href="/admissions" className="inline-flex min-h-14 items-center justify-center gap-3 rounded-full bg-[#e7c873] px-8 text-sm font-black uppercase tracking-[0.18em] text-[#06172b] transition hover:bg-white focus:outline-none focus:ring-2 focus:ring-[#e7c873] focus:ring-offset-2 focus:ring-offset-[#041120]">
                <GraduationCap className="h-5 w-5" aria-hidden="true" />
                Apply Now
              </Link>
              <Link href="/login" className="inline-flex min-h-14 items-center justify-center gap-3 rounded-full border border-white/18 bg-white/8 px-8 text-sm font-black uppercase tracking-[0.18em] text-white transition hover:border-[#e7c873] focus:outline-none focus:ring-2 focus:ring-[#e7c873] focus:ring-offset-2 focus:ring-offset-[#041120]">
                <LogIn className="h-5 w-5" aria-hidden="true" />
                Login
              </Link>
            </div>
            <div className="mt-8 flex flex-wrap justify-center gap-3 text-xs font-black uppercase tracking-[0.18em] text-white/48">
              <span className="inline-flex items-center gap-2"><BookOpen className="h-4 w-4" aria-hidden="true" /> Study</span>
              <span className="inline-flex items-center gap-2"><ShieldCheck className="h-4 w-4" aria-hidden="true" /> Discipline</span>
              <span>Service</span>
            </div>
          </div>
        </section>
      </main>
    </ExperienceErrorBoundary>
  );
}
