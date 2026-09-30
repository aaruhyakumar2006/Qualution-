import React, { useState, useEffect } from 'react';
import {
  ArrowRight,
  MousePointer,
  CheckCircle2,
  Terminal,
  Brain,
  Activity,
  User as UserIcon,
  LogOut,
  GraduationCap,
  Users,
  Radio,
} from 'lucide-react';
import { useAuth } from '../features/auth/AuthContext';

export interface QuantumSlide {
  id: string;
  bg: string;
  bgGradient: string;
  panel: string;
  accent: string;
  accentGlow: string;
  borderAccent: string;
  badgeBg: string;
  title: string;
  subtitle: string;
  tag: string;
  metric: string;
  metricValue: string;
  metricPercent: number;
  acidColor1: string;
  acidColor2: string;
  acidColor3: string;
}

export const SLIDES: QuantumSlide[] = [
  {
    id: 'workbench',
    bg: '#040914',
    bgGradient:
      'radial-gradient(ellipse 90% 60% at 50% 25%, #07152b 0%, #040914 65%, #020408 100%)',
    panel: 'rgba(12, 26, 46, 0.7)',
    accent: '#38bdf8', // Electric Cyan
    accentGlow: 'rgba(56, 189, 248, 0.28)',
    borderAccent: 'rgba(56, 189, 248, 0.35)',
    badgeBg: 'rgba(56, 189, 248, 0.1)',
    title: 'QUALUTION WORKBENCH',
    subtitle: 'Interactive Quantum Circuits & Algorithm Simulation',
    tag: 'QISKIT AER · 2-QUBIT CORE',
    metric: 'State Fidelity',
    metricValue: '99.8%',
    metricPercent: 99,
    acidColor1: '#041226',
    acidColor2: '#38bdf8',
    acidColor3: '#ffffff',
  },
  {
    id: 'misconception-ai',
    bg: '#020d09',
    bgGradient:
      'radial-gradient(ellipse 90% 60% at 50% 25%, #052118 0%, #020d09 65%, #010604 100%)',
    panel: 'rgba(7, 34, 26, 0.7)',
    accent: '#34d399', // Coherent Emerald
    accentGlow: 'rgba(52, 211, 153, 0.28)',
    borderAccent: 'rgba(52, 211, 153, 0.35)',
    badgeBg: 'rgba(52, 211, 153, 0.1)',
    title: 'MISCONCEPTION-AWARE AI',
    subtitle: 'Real-time Mental Model Tracking & Cognitive Gap Interception',
    tag: 'NEURAL DIAGNOSTICS · ACTIVE SENSING',
    metric: 'Fallacy Interception',
    metricValue: '98.4%',
    metricPercent: 98,
    acidColor1: '#021b12',
    acidColor2: '#34d399',
    acidColor3: '#ffffff',
  },
  {
    id: 'live-teaching',
    bg: '#070412',
    bgGradient:
      'radial-gradient(ellipse 90% 60% at 50% 25%, #130a2b 0%, #070412 65%, #020108 100%)',
    panel: 'rgba(21, 16, 45, 0.7)',
    accent: '#a78bfa', // Quantum Violet
    accentGlow: 'rgba(167, 139, 250, 0.28)',
    borderAccent: 'rgba(167, 139, 250, 0.35)',
    badgeBg: 'rgba(167, 139, 250, 0.1)',
    title: 'JSON DRIVEN LIVE TEACHING',
    subtitle: 'Real-time Interactive Cursor & State Broadcast Engine',
    tag: 'LIVE STREAM · PROTOCOL v3',
    metric: 'Network Latency',
    metricValue: '12ms',
    metricPercent: 94,
    acidColor1: '#12082e',
    acidColor2: '#a78bfa',
    acidColor3: '#ffffff',
  },
];

import AcidSquares from './AcidSquares';
import './ToonhubHero.css';

export interface ToonhubHeroProps {
  onLaunchIDE?: () => void;
  onOpenLogin?: () => void;
  onOpenSignUp?: () => void;
  onNavigateLearn?: () => void;
  onNavigateTeacherPortal?: () => void;
  onNavigateStudentPortal?: () => void;
  onNavigateCollab?: () => void;
}

export const ToonhubHero: React.FC<ToonhubHeroProps> = ({
  onLaunchIDE,
  onOpenLogin,
  onOpenSignUp,
  onNavigateLearn,
  onNavigateTeacherPortal,
  onNavigateStudentPortal,
  onNavigateCollab,
}) => {
  const [activeIndex, setActiveIndex] = useState(0);
  const { user, isAuthenticated, logout } = useAuth();

  // Automated cyclic slide transition (advances every 4.5 seconds in a continuous cycle)
  useEffect(() => {
    const timer = setInterval(() => {
      setActiveIndex((prev) => (prev + 1) % SLIDES.length);
    }, 4500);

    return () => clearInterval(timer);
  }, []);

  const currentItem = SLIDES[activeIndex];

  return (
    <div
      className="relative w-full overflow-hidden text-slate-100"
      style={{
        backgroundColor: currentItem.bg,
        backgroundImage: currentItem.bgGradient,
        transition: 'background-color 650ms cubic-bezier(0.4,0,0.2,1), background-image 650ms cubic-bezier(0.4,0,0.2,1)',
        fontFamily: "'Inter', sans-serif",
      }}
    >
      {/* Top Laser Loading Pulse Line */}
      <div
        aria-hidden="true"
        className="pointer-events-none fixed inset-x-0 top-0 z-[100] h-[2px] overflow-hidden"
      >
        <div
          className="absolute inset-0 transition-colors duration-700"
          style={{ backgroundColor: `${currentItem.accent}33` }}
        />
        <div
          className="absolute top-0 h-full w-[28%] animate-[pulse_1.6s_ease-in-out_infinite] transition-colors duration-700"
          style={{
            backgroundColor: currentItem.accent,
            boxShadow: `0 0 12px ${currentItem.accent}`,
          }}
        />
      </div>

      <div
        className="relative w-full flex flex-col justify-between"
        style={{
          height: '100vh',
          overflow: 'hidden',
        }}
      >
        {/* AcidSquares WebGL Raymarching Corridor (React Bits) */}
        <div className="absolute inset-0 pointer-events-none" style={{ zIndex: 1 }}>
          <AcidSquares
            color1={currentItem.acidColor1}
            color2={currentItem.acidColor2}
            color3={currentItem.acidColor3}
            detail="medium"
            speed={0.65}
            waveDepth={1}
            zoom={1.25}
            density={9.0}
            glow={1.1}
            exposure={2600}
            spread={0.28}
            stepSize={0.002}
            colorShift={0}
            contrast={1.05}
            brightness={1.0}
            opacity={0.88}
            mouseInteraction={true}
            mouseStrength={0.12}
            mouseRadius={0.35}
            blur={0}
            grain={true}
            grainIntensity={0.04}
          />
        </div>

        {/* Subtle Depth Vignette */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background:
              'radial-gradient(ellipse 70% 60% at 50% 50%, transparent 40%, rgba(2, 4, 8, 0.75) 100%)',
            zIndex: 2,
          }}
          aria-hidden="true"
        />

        {/* Top-left brand label "QUALUTION ACADEMY" */}
        <div
          className="absolute top-6 left-6 sm:top-8 sm:left-10 lg:left-14 flex items-center gap-2 text-xs sm:text-sm font-semibold uppercase text-white select-none cursor-pointer"
          style={{
            zIndex: 60,
            opacity: 0.95,
            letterSpacing: '0.18em',
          }}
          onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
        >
          <span>QUALUTION</span>
          <span className="text-sky-400 font-bold">ACADEMY</span>
        </div>

        {/* Top-right header actions: Login / Sign Up / Portals */}
        <div
          className="absolute top-6 right-6 sm:top-8 sm:right-10 lg:right-14 flex items-center gap-2 select-none"
          style={{ zIndex: 60 }}
        >
          {/* Direct Portal Links */}
          {onNavigateTeacherPortal && (
            <button
              type="button"
              onClick={onNavigateTeacherPortal}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-sky-300 hover:text-white border border-sky-400/30 bg-sky-950/50 hover:bg-sky-900/70 backdrop-blur-md cursor-pointer transition-all hover:scale-105"
              title="Inspect Teacher Cohort Dashboard"
            >
              <Users size={13} className="text-sky-400" />
              <span className="hidden sm:inline">Teacher</span> Portal
            </button>
          )}

          {onNavigateStudentPortal && (
            <button
              type="button"
              onClick={onNavigateStudentPortal}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-emerald-300 hover:text-white border border-emerald-400/30 bg-emerald-950/50 hover:bg-emerald-900/70 backdrop-blur-md cursor-pointer transition-all hover:scale-105"
              title="View Student Learning Profile & Scores"
            >
              <GraduationCap size={13} className="text-emerald-400" />
              <span className="hidden sm:inline">Student</span> Portal
            </button>
          )}

          {onNavigateCollab && (
            <button
              type="button"
              onClick={onNavigateCollab}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-purple-300 hover:text-white border border-purple-400/30 bg-purple-950/50 hover:bg-purple-900/70 backdrop-blur-md cursor-pointer transition-all hover:scale-105"
              title="Join Real-Time Collaborative Quantum Lab"
            >
              <Radio size={13} className="text-purple-400" />
              <span className="hidden sm:inline">Collab</span> Lab
            </button>
          )}

          {isAuthenticated && user ? (
            <>
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-900/60 border border-white/10 text-xs font-medium text-slate-200 backdrop-blur-md">
                <UserIcon size={13} style={{ color: currentItem.accent }} />
                <span>{user.full_name || user.email.split('@')[0]}</span>
              </div>
              <button
                type="button"
                onClick={logout}
                title="Sign Out"
                className="p-2 rounded-xl border border-white/10 bg-slate-900/60 hover:bg-white/10 text-slate-300 hover:text-white transition-all cursor-pointer backdrop-blur-md"
              >
                <LogOut size={14} />
              </button>
            </>
          ) : (
            <>
              <button
                type="button"
                onClick={onOpenLogin}
                className="px-3.5 py-1.5 rounded-xl text-xs sm:text-sm font-medium text-slate-200 hover:text-white transition-all duration-200 border border-white/15 hover:border-white/30 bg-slate-950/60 hover:bg-slate-900/80 backdrop-blur-md cursor-pointer"
              >
                Sign In
              </button>
              <button
                type="button"
                onClick={onOpenSignUp}
                className="px-3.5 py-1.5 rounded-xl text-xs sm:text-sm font-semibold transition-all duration-200 border backdrop-blur-md cursor-pointer hover:scale-105"
                style={{
                  backgroundColor: `${currentItem.accent}20`,
                  borderColor: currentItem.borderAccent,
                  color: currentItem.accent,
                  boxShadow: `0 0 14px ${currentItem.accentGlow}`,
                }}
              >
                Sign Up
              </button>
            </>
          )}
        </div>

        {/* 2. CENTER HERO AREA (TYPOGRAPHY + HIGHLIGHTED DASHBOARDS) */}
        <div
          className="relative flex-1 flex flex-col items-center justify-center px-4 sm:px-8 select-none"
          style={{ zIndex: 10 }}
        >
          {/* TOP COMMON TITLE "LEARN QUANTUM COMPUTING" */}
          <h1
            className="text-center font-extrabold tracking-tight text-white m-0"
            style={{
              fontFamily: "'Anton', sans-serif",
              fontSize: 'clamp(34px, 6.2vw, 86px)',
              lineHeight: 1,
              textTransform: 'uppercase',
              letterSpacing: '-0.01em',
              textShadow: '0 8px 30px rgba(0,0,0,0.5)',
            }}
          >
            LEARN QUANTUM COMPUTING
          </h1>

          {/* DYNAMIC SECONDARY TITLE (COMMON SIZE) */}
          <div className="relative h-12 sm:h-16 flex items-center justify-center w-full mt-1.5 sm:mt-2">
            {SLIDES.map((item, index) => {
              const isActive = index === activeIndex;
              return (
                <span
                  key={index}
                  style={{
                    position: 'absolute',
                    fontFamily: "'Anton', sans-serif",
                    fontSize: 'clamp(20px, 4.2vw, 58px)',
                    fontWeight: 900,
                    color: item.accent,
                    opacity: isActive ? 1 : 0,
                    transform: isActive
                      ? 'translateY(0) scale(1)'
                      : 'translateY(14px) scale(0.96)',
                    transition:
                      'opacity 650ms cubic-bezier(0.4,0,0.2,1), transform 650ms cubic-bezier(0.4,0,0.2,1)',
                    lineHeight: 1,
                    textTransform: 'uppercase',
                    letterSpacing: '-0.02em',
                    whiteSpace: 'nowrap',
                    textShadow: `0 0 25px ${item.accentGlow}`,
                  }}
                >
                  {item.title}
                </span>
              );
            })}
          </div>

          {/* 3. HIGHLIGHTED PROFESSIONAL DASHBOARDS */}
          <div className="relative w-full max-w-4xl h-60 sm:h-72 mt-4 sm:mt-6 flex items-center justify-center">
            {/* Dashboard 0: QUALUTION WORKBENCH (Circuit Matrix Simulator) */}
            <div
              className={`absolute inset-0 flex items-center justify-center transition-all duration-700 ease-out ${
                activeIndex === 0
                  ? 'opacity-100 scale-100 pointer-events-auto'
                  : 'opacity-0 scale-95 pointer-events-none'
              }`}
            >
              <div
                className="w-full max-w-3xl rounded-2xl border bg-[#050811]/85 backdrop-blur-2xl p-5 sm:p-6 transition-all duration-500"
                style={{
                  borderColor: currentItem.borderAccent,
                  boxShadow: `0 25px 60px -15px rgba(0,0,0,0.9), 0 0 40px -10px ${currentItem.accentGlow}`,
                }}
              >
                {/* Header Strip */}
                <div className="flex items-center justify-between border-b border-white/[0.08] pb-3.5">
                  <div className="flex items-center gap-3">
                    <span className="w-2.5 h-2.5 rounded-full bg-sky-400 animate-pulse shadow-[0_0_8px_#38bdf8]" />
                    <span className="text-xs font-semibold text-white tracking-wide">
                      Bell State Circuit Simulator |Φ⁺⟩
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-mono text-sky-300 uppercase px-2.5 py-0.5 rounded-full bg-sky-500/10 border border-sky-400/25">
                      2 Qubits Active · Aer Core
                    </span>
                  </div>
                </div>

                {/* Circuit Grid Wires */}
                <div className="mt-4 space-y-2.5 font-mono text-xs">
                  {/* q0 Wire */}
                  <div className="flex items-center gap-3 p-2.5 rounded-xl bg-slate-900/60 border border-white/[0.05]">
                    <span className="font-bold text-sky-400 w-8">q[0]</span>
                    <span className="text-slate-500">|0⟩</span>
                    <div className="flex-1 flex items-center">
                      <div className="h-0.5 flex-1 bg-slate-700" />
                      <div className="w-9 h-9 rounded-lg bg-sky-500/15 border border-sky-400/50 flex items-center justify-center font-bold text-sky-300 shadow-[0_0_15px_rgba(56,189,248,0.25)]">
                        H
                      </div>
                      <div className="h-0.5 flex-1 bg-slate-700" />
                      <div className="w-9 h-9 rounded-lg bg-indigo-500/15 border border-indigo-400/50 flex items-center justify-center font-bold text-indigo-300">
                        •
                      </div>
                      <div className="h-0.5 flex-1 bg-slate-700" />
                      <div className="w-9 h-9 rounded-lg bg-emerald-500/15 border border-emerald-400/50 flex items-center justify-center font-bold text-emerald-300">
                        M
                      </div>
                      <div className="h-0.5 w-6 bg-slate-700" />
                    </div>
                  </div>

                  {/* q1 Wire */}
                  <div className="flex items-center gap-3 p-2.5 rounded-xl bg-slate-900/60 border border-white/[0.05]">
                    <span className="font-bold text-sky-400 w-8">q[1]</span>
                    <span className="text-slate-500">|0⟩</span>
                    <div className="flex-1 flex items-center">
                      <div className="h-0.5 flex-1 bg-slate-700" />
                      <div className="w-9 h-9 flex items-center justify-center text-slate-600">
                        ──
                      </div>
                      <div className="h-0.5 flex-1 bg-slate-700" />
                      <div className="w-9 h-9 rounded-lg bg-indigo-500/15 border border-indigo-400/50 flex items-center justify-center font-bold text-indigo-300">
                        ⊕
                      </div>
                      <div className="h-0.5 flex-1 bg-slate-700" />
                      <div className="w-9 h-9 rounded-lg bg-emerald-500/15 border border-emerald-400/50 flex items-center justify-center font-bold text-emerald-300">
                        M
                      </div>
                      <div className="h-0.5 w-6 bg-slate-700" />
                    </div>
                  </div>
                </div>

                {/* Footer Telemetry */}
                <div className="mt-4 pt-3.5 border-t border-white/[0.08] flex items-center justify-between text-xs">
                  <div className="flex items-center gap-4">
                    <span className="text-slate-400">Measurement Probabilities:</span>
                    <span className="font-mono text-sky-300 font-bold">|00⟩: 50%</span>
                    <span className="font-mono text-sky-300 font-bold">|11⟩: 50%</span>
                  </div>
                  <span className="text-[11px] text-emerald-400 font-medium flex items-center gap-1.5">
                    <CheckCircle2 size={13} /> Entangled State Confirmed
                  </span>
                </div>
              </div>
            </div>

            {/* Dashboard 1: MISCONCEPTION-AWARE AI (Cognitive Diagnostic Radar & Fallacy Interception) */}
            <div
              className={`absolute inset-0 flex items-center justify-center transition-all duration-700 ease-out ${
                activeIndex === 1
                  ? 'opacity-100 scale-100 pointer-events-auto'
                  : 'opacity-0 scale-95 pointer-events-none'
              }`}
            >
              <div
                className="w-full max-w-3xl rounded-2xl border bg-[#030a08]/85 backdrop-blur-2xl p-4 sm:p-5 transition-all duration-500 flex flex-col sm:flex-row items-center justify-between gap-5"
                style={{
                  borderColor: currentItem.borderAccent,
                  boxShadow: `0 25px 60px -15px rgba(0,0,0,0.9), 0 0 40px -10px ${currentItem.accentGlow}`,
                }}
              >
                {/* Visual: Cognitive Diagnostic Radar Scanner */}
                <div className="relative w-36 h-36 sm:w-44 sm:h-44 flex-shrink-0 flex items-center justify-center">
                  {/* Concentric Scanner Rings */}
                  <div className="absolute inset-0 rounded-full border border-emerald-500/20" />
                  <div className="absolute inset-3 rounded-full border border-emerald-500/30 border-dashed" />
                  <div className="absolute inset-7 rounded-full border border-emerald-400/40" />
                  <div className="absolute inset-12 rounded-full border border-emerald-500/25" />

                  {/* Crosshairs */}
                  <div className="absolute w-full h-[1px] bg-emerald-500/20" />
                  <div className="absolute h-full w-[1px] bg-emerald-500/20" />

                  {/* Rotating Radar Sweep */}
                  <div className="absolute inset-1 rounded-full overflow-hidden pointer-events-none">
                    <div
                      className="w-full h-full origin-center animate-[spin_4s_linear_infinite]"
                      style={{
                        background:
                          'conic-gradient(from 0deg, rgba(52, 211, 153, 0.4) 0deg, transparent 60deg, transparent 360deg)',
                      }}
                    />
                  </div>

                  {/* Central Neural Brain Core */}
                  <div className="relative z-10 w-11 h-11 rounded-full bg-emerald-950/90 border border-emerald-400/60 flex items-center justify-center shadow-[0_0_20px_rgba(52,211,153,0.5)]">
                    <Brain className="w-5 h-5 text-emerald-300 animate-pulse" />
                  </div>

                  {/* Detected Blip 1 (Misconception Detected) */}
                  <div className="absolute top-4 right-4 flex items-center gap-1.5 z-20">
                    <span className="relative flex h-2 w-2">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75" />
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-400" />
                    </span>
                    <span className="font-mono text-[9px] text-amber-300 bg-amber-950/80 px-1.5 py-0.5 rounded border border-amber-500/40 whitespace-nowrap shadow-sm">
                      Bias Detected
                    </span>
                  </div>

                  {/* Detected Blip 2 (Auto-Corrected Node) */}
                  <div className="absolute bottom-4 left-4 flex items-center gap-1.5 z-20">
                    <span className="relative flex h-2 w-2">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-400" />
                    </span>
                    <span className="font-mono text-[9px] text-emerald-300 bg-emerald-950/80 px-1.5 py-0.5 rounded border border-emerald-500/40 whitespace-nowrap shadow-sm">
                      Model Corrected
                    </span>
                  </div>
                </div>

                {/* Cognitive Diagnostics Panel Details */}
                <div className="flex-1 w-full space-y-2.5 text-left">
                  <div className="flex items-center justify-between">
                    <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-400/30 text-emerald-300 text-[10px] font-semibold uppercase tracking-wider">
                      <Activity size={12} className="text-emerald-400" />
                      Cognitive Diagnostic Engine
                    </div>
                    <span className="font-mono text-[10px] text-emerald-400/80 flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                      Active Sensing
                    </span>
                  </div>

                  {/* Fallacy Interception Card */}
                  <div className="p-3 rounded-xl bg-slate-950/60 border border-emerald-500/20 space-y-1.5 font-mono text-xs">
                    <div className="flex items-start gap-2 text-rose-300/90 text-[11px]">
                      <span className="px-1.5 py-0.5 rounded bg-rose-500/20 border border-rose-500/30 text-[9px] font-bold text-rose-300 uppercase tracking-wider flex-shrink-0">
                        Student Bias
                      </span>
                      <span className="leading-snug">"Measuring a qubit duplicates its state vector."</span>
                    </div>

                    <div className="flex items-start gap-2 text-emerald-300 text-[11px] pt-1 border-t border-white/[0.06]">
                      <span className="px-1.5 py-0.5 rounded bg-emerald-500/20 border border-emerald-500/30 text-[9px] font-bold text-emerald-300 uppercase tracking-wider flex-shrink-0">
                        AI Correction
                      </span>
                      <span className="leading-snug">Intercepted No-Cloning fallacy. Projected collapse simulated.</span>
                    </div>
                  </div>

                  {/* Real-time Telemetry Badges */}
                  <div className="pt-0.5 flex flex-wrap items-center gap-2">
                    <span className="px-2.5 py-1 rounded-lg bg-emerald-500/10 border border-emerald-500/25 text-[11px] text-emerald-300 font-mono flex items-center gap-1.5">
                      <CheckCircle2 size={12} />
                      98.4% Intercept Accuracy
                    </span>
                    <span className="px-2.5 py-1 rounded-lg bg-slate-900/80 border border-white/[0.08] text-[11px] text-slate-300 font-mono">
                      14ms Response
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Dashboard 2: JSON DRIVEN LIVE TEACHING (Real-Time Terminal & Cursor) */}
            <div
              className={`absolute inset-0 flex items-center justify-center transition-all duration-700 ease-out ${
                activeIndex === 2
                  ? 'opacity-100 scale-100 pointer-events-auto'
                  : 'opacity-0 scale-95 pointer-events-none'
              }`}
            >
              <div
                className="w-full max-w-3xl rounded-2xl border bg-[#070512]/85 backdrop-blur-2xl p-5 sm:p-6 transition-all duration-500"
                style={{
                  borderColor: currentItem.borderAccent,
                  boxShadow: `0 25px 60px -15px rgba(0,0,0,0.9), 0 0 40px -10px ${currentItem.accentGlow}`,
                }}
              >
                {/* Terminal Header */}
                <div className="flex items-center justify-between border-b border-white/[0.08] pb-3">
                  <div className="flex items-center gap-2.5">
                    <div className="flex gap-1.5">
                      <span className="w-2.5 h-2.5 rounded-full bg-rose-500/80" />
                      <span className="w-2.5 h-2.5 rounded-full bg-amber-500/80" />
                      <span className="w-2.5 h-2.5 rounded-full bg-emerald-500/80" />
                    </div>
                    <span className="text-xs font-mono text-slate-300 ml-2 flex items-center gap-1.5">
                      <Terminal size={12} className="text-violet-400" />
                      quantum_session_stream.json
                    </span>
                  </div>
                  <span className="text-[10px] font-mono text-violet-300 px-2.5 py-0.5 rounded-full bg-violet-500/10 border border-violet-400/25 flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-violet-400 animate-ping" />
                    Live 12ms WebSocket Stream
                  </span>
                </div>

                {/* Code Window with Live Cursor */}
                <div className="relative mt-3.5 p-4 rounded-xl bg-black/60 border border-white/[0.06] font-mono text-xs overflow-hidden">
                  <pre className="text-[11px] leading-relaxed">
                    <code>
                      <span className="text-slate-500">{`{\n`}</span>
                      <span className="text-violet-400">{`  "protocol"`}</span>
                      <span className="text-slate-400">{`: `}</span>
                      <span className="text-emerald-300">{`"Qualution Live Broadcast v3"`}</span>
                      <span className="text-slate-500">{`,\n`}</span>
                      <span className="text-violet-400">{`  "session"`}</span>
                      <span className="text-slate-400">{`: `}</span>
                      <span className="text-emerald-300">{`"Quantum Superposition & Entanglement"`}</span>
                      <span className="text-slate-500">{`,\n`}</span>
                      <span className="text-violet-400">{`  "active_qubits"`}</span>
                      <span className="text-slate-400">{`: `}</span>
                      <span className="text-amber-300">{`2`}</span>
                      <span className="text-slate-500">{`,\n`}</span>
                      <span className="text-violet-400">{`  "state_vector"`}</span>
                      <span className="text-slate-400">{`: `}</span>
                      <span className="text-sky-300">{`[0.7071, 0, 0, 0.7071]`}</span>
                      <span className="text-slate-500">{`,\n`}</span>
                      <span className="text-violet-400">{`  "ai_tutor"`}</span>
                      <span className="text-slate-400">{`: `}</span>
                      <span className="text-emerald-300">{`"Explaining Hadamard gate operation on q[0]"`}</span>
                      <span className="text-slate-500">{`\n}`}</span>
                    </code>
                  </pre>

                  {/* Simulated Live Teaching Cursor */}
                  <div className="absolute top-14 right-14 flex items-center gap-2 pointer-events-none animate-bounce">
                    <MousePointer size={18} className="text-violet-400 fill-violet-400 drop-shadow-[0_0_10px_#a78bfa]" />
                    <span className="px-2.5 py-0.5 rounded-full bg-violet-600 text-white font-sans font-bold text-[10px] shadow-lg">
                      AI Tutor: Live Teaching
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        {/* Bottom-right: DISCOVER NOW CTA */}
        <div
          className="absolute bottom-6 right-6 sm:bottom-8 sm:right-10 lg:right-14 select-none"
          style={{ zIndex: 60 }}
        >
          <a
            href="/learn"
            onClick={(e) => {
              e.preventDefault();
              if (onNavigateLearn) {
                onNavigateLearn();
              } else {
                window.location.href = '/learn';
              }
            }}
            className="group flex items-center gap-3 text-white no-underline transition-all duration-300 hover:scale-105 cursor-pointer"
            style={{
              fontFamily: "'Anton', sans-serif",
              fontSize: 'clamp(16px, 1.8vw, 22px)',
              fontWeight: 400,
              opacity: 0.95,
              letterSpacing: '-0.01em',
              lineHeight: 1,
              textTransform: 'uppercase',
              textDecoration: 'none',
            }}
          >
            <span>DISCOVER NOW</span>
            <div
              className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl border flex items-center justify-center backdrop-blur-md transition-all duration-300"
              style={{
                backgroundColor: `${currentItem.accent}18`,
                borderColor: currentItem.borderAccent,
                boxShadow: `0 0 12px ${currentItem.accentGlow}`,
              }}
            >
              <ArrowRight
                className="w-3.5 h-3.5 sm:w-4 sm:h-4 transition-transform duration-200 group-hover:translate-x-0.5"
                style={{ color: currentItem.accent }}
                strokeWidth={2.25}
              />
            </div>
          </a>
        </div>
      </div>
    </div>
  );
};

export default ToonhubHero;
