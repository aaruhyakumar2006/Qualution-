import {
  AbsoluteFill,
  interpolate,
  useCurrentFrame,
  spring,
  useVideoConfig,
} from "remotion";
import React from "react";

const COLORS = {
  bg: "#070b14",
  cyan: "#00f0ff",
  cyanGlow: "rgba(0, 240, 255, 0.4)",
  text: "#ffffff",
  textDim: "#8892b0",
  orange: "#ff8c00", // contrast for classical vs quantum
  orangeGlow: "rgba(255, 140, 0, 0.4)",
};

export const TraditionalVsQuantum: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Basic timeline math
  // Scene 1: 0 - 60 (Intro Question)
  // Scene 2: 60 - 200 (Classical Bit & Logic)
  // Scene 3: 200 - 450 (Qubit & Superposition)
  // Scene 4: 450 - 650 (Comparison & Measurement)

  const typeText = (text: string, startFrame: number, speed = 2) => {
    const charsToShow = Math.max(0, Math.floor((frame - startFrame) / speed));
    return text.slice(0, charsToShow);
  };

  const getNarration = () => {
    if (frame < 60) return typeText("How does a computer represent information?", 0);
    if (frame < 200) return typeText("In traditional computing, we use a classical bit: 0 or 1.", 60);
    if (frame < 300) return typeText("Quantum computers use a QUBIT, represented by probability amplitudes.", 200);
    if (frame < 450) return typeText("A Hadamard gate creates a superposition of |0⟩ and |1⟩.", 300);
    if (frame < 550) return typeText("Measurement forces the qubit into a single classical outcome.", 450);
    return typeText("Quantum computing leverages interference before measurement.", 550);
  };

  // Intro fade out
  const introOpacity = interpolate(frame, [50, 70], [1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  
  // Classical Bit Opacity
  const classicalOpacity = interpolate(frame, [80, 100, 250, 280], [0, 1, 1, 0.3], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const classicalScale = spring({ frame: frame - 80, fps, config: { damping: 12 } });

  // Qubit Opacity
  const qubitOpacity = interpolate(frame, [220, 250], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const qubitScale = spring({ frame: frame - 220, fps, config: { damping: 12 } });

  // Math Opacity
  const mathOpacity = interpolate(frame, [260, 280], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });

  // Circuit
  const circuitOpacity = interpolate(frame, [320, 350], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const hGateScale = spring({ frame: frame - 380, fps, config: { damping: 12 } });
  
  // Measurement
  const mGateScale = spring({ frame: frame - 480, fps, config: { damping: 12 } });
  
  // Cursor Path
  let cursorX = 640;
  let cursorY = 600;

  if (frame > 60 && frame < 100) {
    cursorX = interpolate(frame, [60, 100], [640, 320], { extrapolateRight: "clamp" });
    cursorY = interpolate(frame, [60, 100], [600, 360], { extrapolateRight: "clamp" });
  } else if (frame >= 100 && frame < 200) {
    cursorX = 320;
    cursorY = 360;
  } else if (frame >= 200 && frame < 250) {
    cursorX = interpolate(frame, [200, 250], [320, 960], { extrapolateRight: "clamp" });
    cursorY = 360;
  } else if (frame >= 250 && frame < 320) {
    cursorX = 960;
    cursorY = 360;
  } else if (frame >= 320 && frame < 380) {
    cursorX = interpolate(frame, [320, 380], [960, 750], { extrapolateRight: "clamp" });
    cursorY = interpolate(frame, [320, 380], [360, 500], { extrapolateRight: "clamp" });
  } else if (frame >= 380 && frame < 480) {
    cursorX = 750;
    cursorY = 500;
  } else if (frame >= 480 && frame < 520) {
    cursorX = interpolate(frame, [480, 520], [750, 950], { extrapolateRight: "clamp" });
    cursorY = 500;
  } else if (frame >= 520) {
    cursorX = 950;
    cursorY = 500;
  }

  return (
    <AbsoluteFill
      style={{
        backgroundColor: COLORS.bg,
        backgroundImage: `radial-gradient(circle at center, rgba(0, 240, 255, 0.03) 0%, transparent 100%),
                          linear-gradient(rgba(255, 255, 255, 0.02) 1px, transparent 1px)`,
        backgroundSize: "100% 100%, 40px 40px",
        color: COLORS.text,
        fontFamily: "sans-serif",
      }}
    >
      {/* Header */}
      <div style={{ position: "absolute", top: 30, left: 40, fontFamily: "monospace", fontSize: 12, letterSpacing: 2, color: COLORS.textDim }}>
        QUALUTION THEORY ENGINE ACTIVE // TRADITIONAL VS QUANTUM
      </div>

      {/* Narration */}
      <div style={{ position: "absolute", top: "15%", width: "100%", textAlign: "center", fontSize: 28, fontWeight: 300, letterSpacing: 1 }}>
        {getNarration()}
      </div>

      {/* Intro Question */}
      <div style={{ position: "absolute", top: "45%", width: "100%", textAlign: "center", fontSize: 40, fontFamily: "monospace", opacity: introOpacity }}>
        How does a computer represent information?
      </div>

      {/* Classical Bit */}
      <div style={{ position: "absolute", top: "45%", left: "15%", width: "30%", textAlign: "center", opacity: classicalOpacity, transform: `scale(${classicalScale})` }}>
        <div style={{ fontSize: 24, fontFamily: "monospace", color: COLORS.orange, marginBottom: 20 }}>CLASSICAL BIT</div>
        <div style={{ fontSize: 48, fontWeight: "bold", border: `2px solid ${COLORS.orange}`, padding: 20, borderRadius: 10, display: "inline-block", boxShadow: `0 0 20px ${COLORS.orangeGlow}` }}>
          {frame > 120 && frame < 150 ? "1" : "0"}
        </div>
        <div style={{ marginTop: 20, fontSize: 16, color: COLORS.textDim, fontFamily: "monospace" }}>
          Definite States: {frame > 120 && frame < 150 ? "1" : "0"}
        </div>
      </div>

      {/* Qubit */}
      <div style={{ position: "absolute", top: "45%", right: "15%", width: "30%", textAlign: "center", opacity: qubitOpacity, transform: `scale(${qubitScale})` }}>
        <div style={{ fontSize: 24, fontFamily: "monospace", color: COLORS.cyan, marginBottom: 20 }}>QUBIT</div>
        <div style={{ fontSize: 48, fontWeight: "bold", border: `2px solid ${COLORS.cyan}`, padding: 20, borderRadius: 10, display: "inline-block", boxShadow: `0 0 20px ${COLORS.cyanGlow}` }}>
          |ψ⟩
        </div>
        <div style={{ marginTop: 20, fontSize: 20, color: "white", fontFamily: "monospace", opacity: mathOpacity }}>
          α|0⟩ + β|1⟩
        </div>
      </div>

      {/* Circuit for Qubit */}
      <div style={{ position: "absolute", top: "70%", right: "15%", width: "30%", height: 100, display: "flex", alignItems: "center", opacity: circuitOpacity }}>
        <div style={{ position: "relative", width: "100%", height: 2, background: COLORS.cyan }}>
          <div style={{ position: "absolute", left: -30, top: -10, fontFamily: "monospace" }}>q0</div>
          
          <div style={{
            position: "absolute", left: 80, top: -20, width: 40, height: 40,
            border: `1px solid ${COLORS.cyan}`, background: COLORS.bg,
            display: "flex", alignItems: "center", justifyContent: "center",
            fontFamily: "monospace", fontSize: 20, color: COLORS.cyan,
            transform: `scale(${hGateScale})`, opacity: hGateScale
          }}>H</div>

          <div style={{
            position: "absolute", left: 240, top: -20, width: 40, height: 40,
            border: `1px solid ${COLORS.cyan}`, background: COLORS.bg,
            display: "flex", alignItems: "center", justifyContent: "center",
            fontFamily: "monospace", fontSize: 20, color: COLORS.cyan,
            transform: `scale(${mGateScale})`, opacity: mGateScale
          }}>M</div>
        </div>
      </div>

      {/* Math update after H */}
      {frame > 420 && (
        <div style={{ position: "absolute", top: "85%", right: "15%", width: "30%", textAlign: "center", fontSize: 18, fontFamily: "monospace", color: COLORS.cyan }}>
          |ψ⟩ = (|0⟩ + |1⟩) / √2
        </div>
      )}
      
      {/* Math update after M */}
      {frame > 520 && (
        <div style={{ position: "absolute", top: "85%", right: "15%", width: "30%", textAlign: "center", fontSize: 24, fontWeight: "bold", fontFamily: "monospace", color: "white", background: COLORS.bg, padding: 10 }}>
          Collapsed: 0 or 1
        </div>
      )}

      {/* Cursor */}
      <div style={{
        position: "absolute", width: 30, height: 30, border: `2px solid ${COLORS.cyan}`, borderRadius: "50%",
        boxShadow: `0 0 15px ${COLORS.cyanGlow}, inset 0 0 10px ${COLORS.cyanGlow}`, left: cursorX, top: cursorY,
        transform: "translate(-50%, -50%)", zIndex: 9999
      }}>
        <div style={{ position: "absolute", top: "50%", left: "50%", width: 4, height: 4, background: "white", borderRadius: "50%", transform: "translate(-50%, -50%)" }} />
      </div>
    </AbsoluteFill>
  );
};
