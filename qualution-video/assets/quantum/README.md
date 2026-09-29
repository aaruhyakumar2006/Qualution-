# QUALUTION Reusable Quantum Visual Assets

## 1. Overview

This directory and the accompanying Blender source libraries (`qualution-video/blender/templates/QUALUTION_ASSET_LIBRARY.blend` and `qualution-video/blender/scenes/QUALUTION_ASSETS.blend`) provide the standard set of 2D/vector-style educational quantum visual assets for the QUALUTION theoretical video pipeline.

> [!NOTE]
> **Source Asset Role**:
> These are source assets for offline rendering of lightweight, high-clarity educational animation videos (MP4/WebM) destined for web delivery in the QUALUTION Academy.

---

## 2. Assets Created

| # | Asset Identifier | Visual Element | Purpose & Behavior |
|---|---|---|---|
| 1 | `QUALUTION_Qubit` | 2D Stylized Qubit Node | Concentric glowing core disc, halo ring, and center dot for state transitions and qubit representation. |
| 2 | `QUALUTION_Ket0` | Computational Basis $|0\rangle$ | Dark badge container with crisp emerald border and $|0\rangle$ notation curve. |
| 3 | `QUALUTION_Ket1` | Computational Basis $|1\rangle$ | Dark badge container with crisp amber border and $|1\rangle$ notation curve. |
| 4 | `QUALUTION_StateVector` | Reusable State Vector Arrow | Arrow with origin positioned at the base tail dot for natural rotation and phase/state pointing. |
| 5 | `QUALUTION_ProbabilityBar` | Probability Gauge | Dark slate track, crisp border, electric cyan fill bar (scaled on X from 0.0 to 1.0), and percentage label. |
| 6 | `QUALUTION_QuantumWire` | Quantum Circuit Wire | Horizontal circuit wire with register identifier (`q[0]`). |
| 7 | `QUALUTION_Gate_X` | Pauli-X Gate Box | Dark slate box, quantum cyan border, and bold "X" label for bit-flip demonstrations. |
| 8 | `QUALUTION_Gate_H` | Hadamard Gate Box | Dark slate box, violet border, and bold "H" label for superposition demonstrations. |
| 9 | `QUALUTION_Gate_Z` | Pauli-Z Gate Box | Dark slate box, emerald border, and bold "Z" label for phase-flip demonstrations. |
| 10 | `QUALUTION_Measurement` | Measurement Unit | Meter container with dial arc, calibrated gauge, and amber indicator needle. |
| 11 | `QUALUTION_AnnotationArrow` | Pointer / Callout Arrow | High-visibility yellow pointer arrow with origin at base tail for dynamic explanations and highlights. |

---

## 3. Naming Conventions

- **Root Empty / Container**: All reusable assets are parented under an Empty object prefixed with `QUALUTION_` followed by the asset name (e.g., `QUALUTION_Qubit`, `QUALUTION_Gate_X`, `QUALUTION_StateVector`).
- **Child Mesh Objects**: Child elements follow descriptive suffixes (e.g., `QUALUTION_Qubit_Core`, `QUALUTION_Gate_X_Box`, `QUALUTION_ProbabilityBar_Fill`).
- **Materials**: Materials use the prefix `QUALUTION_Mat_` with descriptive color/purpose (e.g., `QUALUTION_Mat_Cyan`, `QUALUTION_Mat_BoxFill`).

---

## 4. Reuse & Animation Guidelines

1. **Linking / Appending**:
   - In lesson production scenes, append or link the asset collection or the parent empty object from `QUALUTION_ASSET_LIBRARY.blend`.
2. **Transform Controls**:
   - Each root object has its origin set to its natural functional pivot (e.g., center for gates/nodes, tail base for vectors/arrows, left edge for horizontal fill bars).
   - Animate translation, rotation, and scaling directly on the parent Empty without altering internal mesh vertices.
3. **Probability Bar Control**:
   - The fill bar (`QUALUTION_ProbabilityBar_Fill`) is anchored on the left; scaling its X dimension between `0.0` and `1.0` dynamically changes the represented probability from 0% to 100%.
4. **Mobile Readability**:
   - All text curves and line weights are calibrated to remain legible at scaled-down mobile resolutions (1080p rendered to 360p–720p web formats).

---

## 5. Storage Locations

- **Blender Master Template**: `qualution-video/blender/templates/QUALUTION_2D_MASTER.blend`
- **Blender Asset Library Template**: `qualution-video/blender/templates/QUALUTION_ASSET_LIBRARY.blend`
- **Blender Asset Scene / Showcase**: `qualution-video/blender/scenes/QUALUTION_ASSETS.blend`
- **Asset Showcase Render**: `qualution-video/renders/assets_showcase_0001.png`
- **Scripts**: `qualution-video/blender/scripts/create_asset_library.py`, `validate_asset_library.py`
