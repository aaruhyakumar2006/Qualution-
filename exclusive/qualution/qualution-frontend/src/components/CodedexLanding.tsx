import React, { useState, useEffect, useRef } from 'react';
import {
  Search,
  ChevronDown,
  Flame,
  Terminal,
  Cpu,
  Zap,
  ArrowRight,
  Play,
  Globe,
  BarChart3,
  Sparkles,
  Users,
  Shield,
  Activity,
  Layers,
  BookOpen,
  FlaskConical,
  Network,
} from 'lucide-react';
import { useAuth } from '../features/auth/AuthContext';
import './CodedexLanding.css';

export interface CodedexLandingProps {
  onLaunchIDE: () => void;
  onOpenLogin: () => void;
  onOpenSignUp: () => void;
  onNavigateLearn: () => void;

}

interface FloatingCoin {
  id: number;
  x: number;
  y: number;
  amount: number;
}

interface Particle {
  id: number;
  x: number;
  size: number;
  duration: number;
  delay: number;
  color: string;
}

const MASCOT_DIALOGUES = [
  "Hey! I'm Erwin — your quantum AI tutor 🤖",
  "I fix misconceptions before they become habits! ⚛️",
  "Ask me anything about qubits, gates, or circuits! 🔮",
  "I teach through JSON-driven live lessons in the Workbench! ⚡",
  "Click me to see how smart I am! 🐱",
];

const LIVE_TICKERS = [
  "🔥 @Alex ran a 42-qubit Grover circuit in 158ms!",
  "🏆 @Sam's circuit auto-routed to Gottesman Stabilizer!",
  "⚡ @Taylor's MPS simulation completed in 0.3s!",
  "🚀 @Jordan's AI verification passed with 99.8% fidelity!",
  "✨ @Morgan joined the Quantum Community Dev channel!",
];

const PARTICLE_COLORS = [
  'rgba(255,199,0,0.9)',
  'rgba(255,220,80,0.7)',
  'rgba(0,200,255,0.6)',
  'rgba(180,130,255,0.6)',
  'rgba(255,255,255,0.5)',
];

const PLATFORM_FEATURES = [
  {
    icon: <Terminal size={28} />,
    title: 'Quantum Workbench',
    desc: 'A full-featured IDE with drag-and-drop circuit builder, real-time simulation, and multi-backend execution. Build, run, and iterate at quantum speed.',
    color: '#ffc700',
    tag: 'CORE',
  },
  {
    icon: <Sparkles size={28} />,
    title: 'Erwin AI Tutor',
    desc: 'Erwin detects misconceptions in real time as you build circuits. It corrects faulty mental models before they solidify — not just answering questions, but teaching correctly.',
    color: '#c084fc',
    tag: 'AI',
  },
  {
    icon: <BookOpen size={28} />,
    title: 'JSON-Driven Live Teaching',
    desc: 'Every lesson in the Workbench is powered by a structured JSON curriculum engine. Scenes, narration, animations, and checkpoints are all declarative — live and editable.',
    color: '#38bdf8',
    tag: 'CURRICULUM',
  },
  {
    icon: <Activity size={28} />,
    title: 'Telemetry Portal',
    desc: 'Live updates on circuit execution, simulation performance, and learner progress. The telemetry portal streams real-time quantum community development metrics.',
    color: '#34d399',
    tag: 'LIVE',
  },
  {
    icon: <Shield size={28} />,
    title: 'AI-Verifiable System',
    desc: 'Every circuit result is cross-verified by our AI validation layer. Fidelity scores, gate error bounds, and output distributions are cryptographically attestable.',
    color: '#fb7185',
    tag: 'TRUST',
  },
  {
    icon: <Cpu size={28} />,
    title: 'Smart Circuit Analyzer',
    desc: 'Automatically routes your circuit to the optimal simulator: Gottesman–Knill Stabilizer for Clifford circuits, MPS for low-entanglement, and cloud QPUs for high-depth.',
    color: '#f97316',
    tag: 'ENGINE',
  },
  {
    icon: <Layers size={28} />,
    title: 'Multi-Framework Backend',
    desc: 'Run circuits on Qiskit, PennyLane, Cirq, or Braket from a single interface. The backend abstraction layer handles transpilation, optimization, and result normalization.',
    color: '#e879f9',
    tag: 'INFRA',
  },
  {
    icon: <Users size={28} />,
    title: 'Quantum Community Dev',
    desc: 'Collaborate on circuits, share experiments, and contribute to open quantum curricula. The community portal tracks contributions, forks, and live co-simulation sessions.',
    color: '#38bdf8',
    tag: 'COMMUNITY',
  },
];

const CIRCUIT_BACKENDS = [
  { name: 'Gottesman–Knill Stabilizer', use: 'Clifford-only circuits', speed: '< 1ms', qubits: '1000+', color: '#ffc700' },
  { name: 'Matrix Product State (MPS)', use: 'Low entanglement circuits', speed: '< 50ms', qubits: '200+', color: '#38bdf8' },
  { name: 'Statevector (exact)', use: 'General small circuits', speed: '< 500ms', qubits: '30', color: '#34d399' },
  { name: 'Cloud QPU (IBM / Braket)', use: 'Real hardware execution', speed: 'Queue-based', qubits: '127+', color: '#c084fc' },
];

const TESTIMONIALS = [
  {
    name: 'Priya S.',
    role: 'CS Student · IIT Delhi',
    text: 'Erwin caught my misconception about superposition on day one. The JSON lesson engine made every concept click instantly.',
    avatar: '🎓',
    stars: 5,
  },
  {
    name: 'Marcus T.',
    role: 'Physics grad · MIT',
    text: 'The circuit analyzer auto-routed my 80-qubit Clifford circuit to the stabilizer backend. Zero config, instant results.',
    avatar: '⚛️',
    stars: 5,
  },
  {
    name: 'Yuki R.',
    role: 'High School Senior',
    text: 'The telemetry portal showed me exactly where my circuit was slow. I fixed it in minutes with Erwin guiding me.',
    avatar: '🌸',
    stars: 5,
  },
  {
    name: 'Dr. Chen L.',
    role: 'Professor · Quantum Lab',
    text: 'The AI-verifiable output system gives my students confidence their results are real. The multi-framework backend is a game changer.',
    avatar: '🔬',
    stars: 5,
  },
];

const HOW_IT_WORKS = [
  {
    step: '01',
    icon: <FlaskConical size={28} />,
    title: 'Build in the Workbench',
    desc: 'Drag gates onto the circuit grid. The smart analyzer instantly selects the best simulation backend for your circuit structure.',
    color: '#ffc700',
  },
  {
    step: '02',
    icon: <Sparkles size={28} />,
    title: 'Learn with Erwin',
    desc: 'Erwin monitors your circuit in real time, corrects misconceptions, and delivers JSON-driven lessons directly inside the Workbench.',
    color: '#c084fc',
  },
  {
    step: '03',
    icon: <Network size={28} />,
    title: 'Verify & Share',
    desc: 'AI-verifiable results with fidelity scores. Share circuits with the community, stream telemetry, and collaborate live.',
    color: '#34d399',
  },
];

function generateParticles(count: number): Particle[] {
  return Array.from({ length: count }, (_, i) => ({
    id: i,
    x: Math.random() * 100,
    size: 2 + Math.random() * 4,
    duration: 7 + Math.random() * 10,
    delay: Math.random() * 9,
    color: PARTICLE_COLORS[Math.floor(Math.random() * PARTICLE_COLORS.length)],
  }));
}

export const CodedexLanding: React.FC<CodedexLandingProps> = ({
  onLaunchIDE,
  onOpenLogin,
  onOpenSignUp,
  onNavigateLearn,
}) => {
  const { isAuthenticated, logout } = useAuth();

  const [dialogueIndex, setDialogueIndex]   = useState(0);
  const [tickerIndex, setTickerIndex]       = useState(0);
  const [tickerVisible, setTickerVisible]   = useState(true);
  const [floatingCoins, setFloatingCoins]   = useState<FloatingCoin[]>([]);
  const [totalXp, setTotalXp]               = useState(450);
  const [particles]                          = useState<Particle[]>(() => generateParticles(30));
  const [counters, setCounters]              = useState({ learners: 0, circuits: 0, backends: 0 });
  const statsRef                             = useRef<HTMLDivElement>(null);
  const countersDone                         = useRef(false);

  // Ticker fade-swap
  useEffect(() => {
    const id = setInterval(() => {
      setTickerVisible(false);
      setTimeout(() => {
        setTickerIndex(p => (p + 1) % LIVE_TICKERS.length);
        setTickerVisible(true);
      }, 350);
    }, 4800);
    return () => clearInterval(id);
  }, []);

  // Animated count-up on scroll into view
  useEffect(() => {
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting && !countersDone.current) {
        countersDone.current = true;
        const targets = { learners: 18400, circuits: 94200, backends: 4 };
        const duration = 1800;
        const start = performance.now();
        const tick = (now: number) => {
          const t = Math.min((now - start) / duration, 1);
          const ease = 1 - Math.pow(1 - t, 3);
          setCounters({
            learners: Math.round(targets.learners * ease),
            circuits: Math.round(targets.circuits * ease),
            backends: Math.round(targets.backends * ease),
          });
          if (t < 1) requestAnimationFrame(tick);
        };
        requestAnimationFrame(tick);
      }
    }, { threshold: 0.3 });
    if (statsRef.current) observer.observe(statsRef.current);
    return () => observer.disconnect();
  }, []);

  const handleMascotClick = (e: React.MouseEvent) => {
    setDialogueIndex(p => (p + 1) % MASCOT_DIALOGUES.length);
    const coin: FloatingCoin = { id: Date.now(), x: e.clientX, y: e.clientY, amount: 50 };
    setFloatingCoins(p => [...p, coin]);
    setTotalXp(p => p + 50);
    setTimeout(() => setFloatingCoins(p => p.filter(c => c.id !== coin.id)), 1600);
  };

  return (
    <div className="cdx-retro-root">

      {/* ══════════════════ NAVBAR ══════════════════ */}
      <header className="cdx-retro-nav">
        <div className="cdx-retro-nav-inner">
          <div className="cdx-retro-logo" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
            <span style={{ fontSize: '1.35rem' }}>🪙</span>
            <span className="cdx-retro-brand-name">Qualution</span>
          </div>

          <nav className="cdx-retro-nav-menu">
            <button onClick={onNavigateLearn} className="cdx-retro-menu-item">
              <span>Learn</span><ChevronDown size={13} />
            </button>
            <button onClick={onLaunchIDE} className="cdx-retro-menu-item">
              <span>Workbench</span>
            </button>
            <button onClick={onLaunchIDE} className="cdx-retro-menu-item"><span>Build</span></button>
            <button className="cdx-retro-menu-item"><span>Community</span><ChevronDown size={13} /></button>
          </nav>

          <div className="cdx-retro-nav-right">
            <div className="cdx-nav-xp-badge">🪙 {totalXp} XP</div>
            <button className="cdx-retro-icon-btn" title="Search"><Search size={17} /></button>
            {isAuthenticated ? (
              <>
                <button onClick={logout} className="cdx-retro-icon-btn" style={{ fontSize: '0.82rem', fontWeight: 600 }}>Sign out</button>
              </>
            ) : (
              <>
                <button onClick={onOpenLogin} className="cdx-nav-login-btn">Log in</button>
                <button onClick={onOpenSignUp} className="cdx-pixel-btn-gold"><span>Sign up free</span></button>
              </>
            )}
          </div>
        </div>
      </header>

      {/* ══════════════════ HERO ══════════════════ */}
      <section className="cdx-pixel-hero">
        <div className="cdx-pixel-hero-overlay" />
        <div className="cdx-scanlines" />

        {/* Particles */}
        <div className="cdx-particles">
          {particles.map(p => (
            <div key={p.id} className="cdx-particle" style={{
              left: `${p.x}%`, bottom: '-20px',
              width: `${p.size}px`, height: `${p.size}px`,
              background: p.color,
              animationDuration: `${p.duration}s`,
              animationDelay: `${p.delay}s`,
              boxShadow: `0 0 ${p.size * 2.5}px ${p.color}`,
            }} />
          ))}
        </div>

        {/* Drifting clouds */}
        <div className="cdx-hero-cloud cdx-cloud-1"><span style={{ fontSize: '2.8rem' }}>☁️</span></div>
        <div className="cdx-hero-cloud cdx-cloud-2"><span style={{ fontSize: '2rem' }}>☁️</span></div>

        {/* Stars */}
        {[
          { top: '13%', left: '17%', size: '1.1rem', d: '0s' },
          { top: '20%', right: '22%', size: '0.9rem', d: '1.2s' },
          { top: '8%',  right: '11%', size: '1.3rem', d: '0.6s' },
          { top: '33%', left: '7%',   size: '0.7rem', d: '1.9s' },
          { top: '5%',  left: '43%',  size: '0.8rem', d: '0.3s' },
          { top: '28%', right: '38%', size: '0.65rem',d: '2.4s' },
        ].map((s, i) => (
          <div key={i} className="cdx-hero-star" style={{ top: s.top, left: (s as any).left, right: (s as any).right, fontSize: s.size, animationDelay: s.d }}>
            {i % 2 === 0 ? '✦' : '✧'}
          </div>
        ))}

        <div className="cdx-hero-content">
          <div className="cdx-pixel-tag">⚛ START YOUR</div>
          <h1 className="cdx-pixel-hero-title">Quantum Learning<br />Adventure</h1>
          <p className="cdx-pixel-subtitle">
            The most fun and beginner-friendly way to learn quantum computing.<br />
            Build circuits, run algorithms, earn XP. ⋆˙⟡
          </p>
          <div className="cdx-hero-cta-row">
            <button onClick={onOpenSignUp} className="cdx-pixel-btn-gold cdx-hero-btn-lg">
              <span>Get started — it's free</span>
            </button>
            <button onClick={onLaunchIDE} className="cdx-hero-btn-ghost">
              <Play size={15} />
              <span>Try the IDE</span>
            </button>
          </div>

          <div className="cdx-hero-ticker">
            <Flame size={13} style={{ color: '#ffc700', flexShrink: 0 }} />
            <span className="cdx-ticker-text" style={{ opacity: tickerVisible ? 1 : 0 }}>
              {LIVE_TICKERS[tickerIndex]}
            </span>
          </div>
        </div>

        {/* Mascot */}
        <div className="cdx-mascot-wrapper" onClick={handleMascotClick} title="Click Erwin for XP!">
          <div className="cdx-mascot-speech-bubble">{MASCOT_DIALOGUES[dialogueIndex]}</div>
          <img src="/images/codedex_crt_mascot.png" alt="Erwin the Quantum Mascot" className="cdx-mascot-img-interactive" />
        </div>

        {/* XP coins */}
        {floatingCoins.map(c => (
          <div key={c.id} className="cdx-floating-xp-coin" style={{ left: `${c.x}px`, top: `${c.y}px` }}>
            +{c.amount} XP 🪙
          </div>
        ))}

        {/* Stats bar */}
        <div className="cdx-hero-stats" ref={statsRef}>
          {[
            { value: `${counters.learners.toLocaleString()}+`, label: 'Active Learners' },
            { value: `${counters.circuits.toLocaleString()}+`, label: 'Circuits Simulated' },
            { value: `${counters.backends}`,                   label: 'Simulation Backends' },
            { value: '100%',                                   label: 'Free to Start' },
          ].map((s, i) => (
            <div key={i} className="cdx-hero-stat">
              <span className="cdx-hero-stat-value">{s.value}</span>
              <span className="cdx-hero-stat-label">{s.label}</span>
            </div>
          ))}
        </div>
      </section>

      {/* ══════════════════ MARQUEE TICKER ══════════════════ */}
      <div className="cdx-marquee-track">
        <div className="cdx-marquee-inner">
          {['Qiskit', 'PennyLane', 'Cirq', 'Braket', 'IBM Quantum', 'NVIDIA cuQuantum', 'OpenQASM', 'Q#', 'QuTiP', 'Gottesman–Knill', 'MPS Simulator', 'Statevector', 'Qiskit', 'PennyLane', 'Cirq', 'Braket', 'IBM Quantum', 'NVIDIA cuQuantum'].map((t, i) => (
            <span key={i} className="cdx-marquee-item">
              <Zap size={12} style={{ color: '#ffc700' }} />
              {t}
            </span>
          ))}
        </div>
      </div>

      {/* ══════════════════ HOW IT WORKS ══════════════════ */}
      <section className="cdx-section cdx-section-alt">
        <div className="cdx-section-inner">
          <div className="cdx-section-label">HOW IT WORKS</div>
          <h2 className="cdx-section-title">From circuit to insight in 3 steps</h2>
          <p className="cdx-section-sub">Build, learn, and verify — all inside one platform.</p>
          <div className="cdx-how-grid">
            {HOW_IT_WORKS.map((step, i) => (
              <div key={i} className="cdx-how-card">
                <div className="cdx-how-step-num" style={{ color: step.color }}>{step.step}</div>
                <div className="cdx-how-icon" style={{ color: step.color, background: `${step.color}18`, border: `1px solid ${step.color}30` }}>
                  {step.icon}
                </div>
                <h3 className="cdx-how-title">{step.title}</h3>
                <p className="cdx-how-desc">{step.desc}</p>
                {i < HOW_IT_WORKS.length - 1 && <div className="cdx-how-arrow"><ArrowRight size={20} /></div>}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════ PLATFORM FEATURES ══════════════════ */}
      <section className="cdx-section">
        <div className="cdx-section-inner">
          <div className="cdx-section-label">THE PLATFORM</div>
          <h2 className="cdx-section-title">Everything inside Qualution</h2>
          <p className="cdx-section-sub">Eight core systems working together — from circuit building to AI-verified results.</p>
          <div className="cdx-pf-grid">
            {PLATFORM_FEATURES.map((f, i) => (
              <div key={i} className="cdx-pf-card" style={{ '--pf-color': f.color } as React.CSSProperties}>
                <div className="cdx-pf-tag">{f.tag}</div>
                <div className="cdx-pf-icon" style={{ color: f.color, background: `${f.color}15`, border: `1px solid ${f.color}30` }}>{f.icon}</div>
                <h3 className="cdx-pf-title">{f.title}</h3>
                <p className="cdx-pf-desc">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════ CIRCUIT ANALYZER ══════════════════ */}
      <section className="cdx-section cdx-section-alt">
        <div className="cdx-section-inner">
          <div className="cdx-section-label">SMART ROUTING</div>
          <h2 className="cdx-section-title">Circuit Analyzer picks the right backend</h2>
          <p className="cdx-section-sub">No manual config. The analyzer inspects your circuit structure and routes it automatically.</p>
          <div className="cdx-backends-grid">
            {CIRCUIT_BACKENDS.map((b, i) => (
              <div key={i} className="cdx-backend-card" style={{ '--bc': b.color } as React.CSSProperties}>
                <div className="cdx-backend-name" style={{ color: b.color }}>{b.name}</div>
                <div className="cdx-backend-use">{b.use}</div>
                <div className="cdx-backend-stats">
                  <span><BarChart3 size={12} /> {b.speed}</span>
                  <span><Cpu size={12} /> {b.qubits} qubits</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════ TESTIMONIALS ══════════════════ */}
      <section className="cdx-section">
        <div className="cdx-section-inner">
          <div className="cdx-section-label">COMMUNITY</div>
          <h2 className="cdx-section-title">What builders are saying</h2>
          <p className="cdx-section-sub">From students to professors — Qualution works at every level.</p>
          <div className="cdx-testimonials-grid">
            {TESTIMONIALS.map((t, i) => (
              <div key={i} className="cdx-testimonial-card">
                <div className="cdx-testimonial-stars">{'★'.repeat(t.stars)}</div>
                <p className="cdx-testimonial-text">"{t.text}"</p>
                <div className="cdx-testimonial-author">
                  <div className="cdx-testimonial-avatar">{t.avatar}</div>
                  <div>
                    <div className="cdx-testimonial-name">{t.name}</div>
                    <div className="cdx-testimonial-role">{t.role}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════ FINAL CTA ══════════════════ */}
      <section className="cdx-cta-banner">
        <div className="cdx-cta-glow" />
        <div className="cdx-cta-inner">
          <div className="cdx-cta-icon">⚛️</div>
          <h2 className="cdx-cta-title">Build quantum. Verify with AI. Share with the world.</h2>
          <p className="cdx-cta-sub">Join 18,000+ learners and researchers already using Qualution. Free forever — no credit card needed.</p>
          <div className="cdx-cta-buttons">
            <button onClick={onOpenSignUp} className="cdx-pixel-btn-gold" style={{ fontSize: '1rem', padding: '0.95rem 2.5rem' }}>
              <span>Get started free</span>
            </button>
            <button onClick={onLaunchIDE} className="cdx-hero-btn-ghost">
              <Globe size={15} />
              <span>Open Workbench</span>
            </button>
          </div>
        </div>
      </section>

      {/* ══════════════════ FOOTER ══════════════════ */}
      <footer className="cdx-pixel-footer">
        <div className="cdx-footer-top">
          <div className="cdx-footer-brand">
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
              <span style={{ fontSize: '1.3rem' }}>🪙</span>
              <span className="cdx-retro-brand-name" style={{ fontSize: '1.05rem' }}>Qualution</span>
            </div>
            <p className="cdx-footer-tagline">The quantum platform that builds, teaches, verifies, and connects.</p>
            <div className="cdx-footer-socials">
              {['Twitter', 'GitHub', 'Discord'].map(s => (
                <button key={s} className="cdx-footer-social-btn">{s}</button>
              ))}
            </div>
          </div>
          <div className="cdx-footer-links-grid">
            {[
              { heading: 'Platform', links: ['Workbench', 'Circuit Analyzer', 'Telemetry Portal', 'AI Verifier'] },
              { heading: 'Learn', links: ['Qubits', 'Circuits', 'Algorithms', 'Quantum AI'] },
              { heading: 'Community', links: ['Discord', 'Forum', 'Showcase', 'Events'] },
              { heading: 'Company', links: ['About', 'Blog', 'Careers', 'Contact'] },
            ].map(col => (
              <div key={col.heading} className="cdx-footer-col">
                <div className="cdx-footer-col-heading">{col.heading}</div>
                {col.links.map(link => (
                  <button key={link} className="cdx-footer-link">{link}</button>
                ))}
              </div>
            ))}
          </div>
        </div>
        <div className="cdx-footer-bottom">
          <span>© 2026 Qualution Platform. All rights reserved.</span>
          <div style={{ display: 'flex', gap: '1.5rem' }}>
            {['Privacy Policy', 'Terms of Service', 'Cookie Settings'].map(l => (
              <button key={l} className="cdx-footer-link">{l}</button>
            ))}
          </div>
        </div>
      </footer>
    </div>
  );
};

export default CodedexLanding;
