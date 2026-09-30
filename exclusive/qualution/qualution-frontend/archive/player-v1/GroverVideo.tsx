import {
  AbsoluteFill,
  interpolate,
  useCurrentFrame,
  Sequence,
  spring,
  useVideoConfig,
} from "remotion";
import React from "react";

// Theme constants
const COLORS = {
  bg: "#070b14",
  cyan: "#00f0ff",
  cyanGlow: "rgba(0, 240, 255, 0.4)",
  text: "#ffffff",
  textDim: "#8892b0",
};

export const GroverVideo: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Basic timeline math
  // Scene 1: 0 - 60 (Intro)
  // Scene 2: 60 - 150 (Four states)
  // Scene 3: 150 - 240 (Target)
  // Scene 4: 240 - 400 (Circuit / Superposition)
  // Scene 5: 400 - 550 (Oracle)
  // Scene 6: 550 - 750 (Diffuser)
  // Scene 7: 750 - 900 (Measurement)
  
  // Helpers for text animation
  const typeText = (text: string, startFrame: number, speed = 2) => {
    const charsToShow = Math.max(0, Math.floor((frame - startFrame) / speed));
    return text.slice(0, charsToShow);
  };

  const getNarration = () => {
    if (frame < 60) return typeText("Let's understand Grover's algorithm.", 0);
    if (frame < 150) return typeText("We want to find one state.", 60);
    if (frame < 240) return typeText("Our target is |11⟩.", 150);
    if (frame < 400) return typeText("First, we create a superposition.", 240);
    if (frame < 550) return typeText("The oracle marks the target state.", 400);
    if (frame < 750) return typeText("The diffuser amplifies its amplitude.", 550);
    if (frame < 900) return typeText("Measure, and we find the marked state.", 750);
    return typeText("Grover: Superposition → Oracle → Diffuser → Measurement", 900);
  };

  // State opacities
  const statesOpacity = interpolate(frame, [60, 80, 220, 240], [0, 1, 1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // Circuit opacity
  const circuitOpacity = interpolate(frame, [240, 260], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // Target Highlight scale
  const targetHighlight = spring({
    frame: frame - 180,
    fps,
    config: { damping: 12 },
  });

  // Wire drawing
  const wireWidth = interpolate(frame, [260, 300], [0, 100], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // Gate animations
  const hGateScale = spring({ frame: frame - 320, fps, config: { damping: 12 } });
  const oracleScale = spring({ frame: frame - 450, fps, config: { damping: 12 } });
  const diffuserScale = spring({ frame: frame - 600, fps, config: { damping: 12 } });
  const measureScale = spring({ frame: frame - 800, fps, config: { damping: 12 } });

  // Probabilities
  const probOpacity = interpolate(frame, [350, 380], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const p00 = interpolate(frame, [380, 420, 700, 750], [0, 25, 25, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const p01 = interpolate(frame, [380, 420, 700, 750], [0, 25, 25, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const p10 = interpolate(frame, [380, 420, 700, 750], [0, 25, 25, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const p11 = interpolate(frame, [380, 420, 700, 750], [0, 25, 25, 100], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });

  // Cursor movement
  let cursorX = 640;
  let cursorY = 600;

  if (frame > 60 && frame < 90) {
    cursorX = interpolate(frame, [60, 90], [640, 460], { extrapolateRight: "clamp" });
    cursorY = interpolate(frame, [60, 90], [600, 300], { extrapolateRight: "clamp" });
  } else if (frame >= 90 && frame < 120) {
    cursorX = interpolate(frame, [90, 120], [460, 580], { extrapolateRight: "clamp" });
    cursorY = 300;
  } else if (frame >= 120 && frame < 150) {
    cursorX = interpolate(frame, [120, 150], [580, 700], { extrapolateRight: "clamp" });
    cursorY = 300;
  } else if (frame >= 150 && frame < 180) {
    cursorX = interpolate(frame, [150, 180], [700, 820], { extrapolateRight: "clamp" });
    cursorY = 300;
  } else if (frame >= 180 && frame < 240) {
    cursorX = 820;
    cursorY = 300;
  } else if (frame >= 240 && frame < 320) {
    cursorX = interpolate(frame, [240, 280], [820, 450], { extrapolateRight: "clamp" });
    cursorY = interpolate(frame, [240, 280], [300, 360], { extrapolateRight: "clamp" });
  } else if (frame >= 320 && frame < 450) {
    cursorX = 450;
    cursorY = 360;
  } else if (frame >= 450 && frame < 600) {
    cursorX = interpolate(frame, [450, 490], [450, 600], { extrapolateRight: "clamp" });
    cursorY = 360;
  } else if (frame >= 600 && frame < 800) {
    cursorX = interpolate(frame, [600, 640], [600, 750], { extrapolateRight: "clamp" });
    cursorY = 360;
  } else if (frame >= 800 && frame < 900) {
    cursorX = interpolate(frame, [800, 840], [750, 900], { extrapolateRight: "clamp" });
    cursorY = 360;
  }

  return (
    <AbsoluteFill
      style={{
        backgroundColor: COLORS.bg,
        backgroundImage: `radial-gradient(circle at center, rgba(0, 240, 255, 0.03) 0%, transparent 100%),
                          linear-gradient(rgba(255, 255, 255, 0.02) 1px, transparent 1px),
                          linear-gradient(90deg, rgba(255, 255, 255, 0.02) 1px, transparent 1px)`,
        backgroundSize: "100% 100%, 40px 40px, 40px 40px",
        color: COLORS.text,
        fontFamily: "sans-serif",
      }}
    >
      {/* Header */}
      <div
        style={{
          position: "absolute",
          top: 30,
          left: 40,
          fontFamily: "monospace",
          fontSize: 12,
          letterSpacing: 2,
          color: COLORS.textDim,
          display: "flex",
          alignItems: "center",
          gap: 10,
        }}
      >
        <div style={{ width: 8, height: 8, background: COLORS.cyan, borderRadius: "50%", boxShadow: `0 0 10px ${COLORS.cyan}` }} />
        QUALUTION THEORY ENGINE ACTIVE // REMOTION RENDERER
      </div>

      {/* Narration */}
      <div
        style={{
          position: "absolute",
          top: "15%",
          width: "100%",
          textAlign: "center",
          fontSize: 28,
          fontWeight: 300,
          letterSpacing: 1,
        }}
      >
        {getNarration()}
      </div>

      {/* Search Space */}
      <div
        style={{
          position: "absolute",
          top: "40%",
          width: "100%",
          display: "flex",
          justifyContent: "center",
          gap: 60,
          fontFamily: "monospace",
          fontSize: 32,
          opacity: statesOpacity,
        }}
      >
        {["|00⟩", "|01⟩", "|10⟩", "|11⟩"].map((state, i) => (
          <div key={state} style={{ position: "relative", padding: 10 }}>
            <span style={{ color: i === 3 && frame > 180 ? COLORS.cyan : "white", textShadow: i === 3 && frame > 180 ? `0 0 15px ${COLORS.cyanGlow}` : "none" }}>{state}</span>
            {i === 3 && (
              <div
                style={{
                  position: "absolute",
                  top: -10,
                  left: -15,
                  right: -15,
                  bottom: -10,
                  border: `2px solid ${COLORS.cyan}`,
                  borderRadius: "50%",
                  boxShadow: `0 0 20px ${COLORS.cyanGlow} inset`,
                  transform: `scale(${targetHighlight})`,
                  opacity: targetHighlight,
                }}
              />
            )}
          </div>
        ))}
      </div>

      {/* Circuit */}
      <div
        style={{
          position: "absolute",
          top: "45%",
          left: "20%",
          width: "60%",
          height: 150,
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          gap: 60,
          opacity: circuitOpacity,
        }}
      >
        {/* Wires */}
        {[0, 1].map((q) => (
          <div
            key={q}
            style={{
              position: "relative",
              width: `${wireWidth}%`,
              height: 2,
              background: COLORS.cyan,
              boxShadow: `0 0 5px ${COLORS.cyan}`,
            }}
          >
            <div style={{ position: "absolute", left: -40, top: -12, fontFamily: "monospace", color: COLORS.textDim }}>q{q}</div>
            
            {/* H Gate */}
            <div
              style={{
                position: "absolute",
                left: 80,
                top: -20,
                width: 40,
                height: 40,
                border: `1px solid ${COLORS.cyan}`,
                background: COLORS.bg,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontFamily: "monospace",
                fontSize: 20,
                color: COLORS.cyan,
                transform: `scale(${hGateScale})`,
                opacity: hGateScale,
              }}
            >
              H
            </div>
            
            {/* Measurement Gate */}
            <div
              style={{
                position: "absolute",
                left: 600,
                top: -20,
                width: 40,
                height: 40,
                border: `1px solid ${COLORS.cyan}`,
                background: COLORS.bg,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontFamily: "monospace",
                fontSize: 20,
                color: COLORS.cyan,
                transform: `scale(${measureScale})`,
                opacity: measureScale,
              }}
            >
              M
            </div>
          </div>
        ))}
        
        {/* Oracle Box */}
        <div
          style={{
            position: "absolute",
            left: 200,
            width: 80,
            top: -40,
            bottom: -40,
            border: `1px dashed ${COLORS.cyan}`,
            display: "flex",
            alignItems: "flex-start",
            justifyContent: "center",
            paddingTop: 10,
            fontFamily: "monospace",
            fontSize: 12,
            color: COLORS.cyan,
            transform: `scale(${oracleScale})`,
            opacity: oracleScale,
          }}
        >
          Oracle
        </div>
        
        {/* Diffuser Box */}
        <div
          style={{
            position: "absolute",
            left: 320,
            width: 200,
            top: -40,
            bottom: -40,
            border: `1px dashed ${COLORS.cyan}`,
            display: "flex",
            alignItems: "flex-start",
            justifyContent: "center",
            paddingTop: 10,
            fontFamily: "monospace",
            fontSize: 12,
            color: COLORS.cyan,
            transform: `scale(${diffuserScale})`,
            opacity: diffuserScale,
          }}
        >
          Diffuser
        </div>
      </div>

      {/* Probabilities */}
      <div
        style={{
          position: "absolute",
          bottom: "10%",
          width: "100%",
          display: "flex",
          justifyContent: "center",
          gap: 40,
          alignItems: "flex-end",
          height: 100,
          opacity: probOpacity,
        }}
      >
        {[
          { label: "|00⟩", p: p00 },
          { label: "|01⟩", p: p01 },
          { label: "|10⟩", p: p10 },
          { label: "|11⟩", p: p11, isTarget: true },
        ].map((state) => (
          <div key={state.label} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 10, fontFamily: "monospace", fontSize: 14 }}>
            <div
              style={{
                width: 30,
                height: `${state.p}%`,
                background: state.isTarget && frame > 700 ? "white" : COLORS.cyan,
                boxShadow: state.isTarget && frame > 700 ? `0 0 15px white` : `0 0 10px ${COLORS.cyanGlow}`,
              }}
            />
            <span style={{ color: state.isTarget && frame > 700 ? COLORS.cyan : "white" }}>{state.label}</span>
          </div>
        ))}
      </div>

      {/* Cursor */}
      <div
        style={{
          position: "absolute",
          width: 30,
          height: 30,
          border: `2px solid ${COLORS.cyan}`,
          borderRadius: "50%",
          boxShadow: `0 0 15px ${COLORS.cyanGlow}, inset 0 0 10px ${COLORS.cyanGlow}`,
          left: cursorX,
          top: cursorY,
          transform: "translate(-50%, -50%)",
          zIndex: 9999,
        }}
      >
        <div
          style={{
            position: "absolute",
            top: "50%",
            left: "50%",
            width: 4,
            height: 4,
            background: "white",
            borderRadius: "50%",
            transform: "translate(-50%, -50%)",
          }}
        />
      </div>
    </AbsoluteFill>
  );
};
