# QUALUTION Video Production — Offline Blender Render Pipeline

This document defines the production render standards, performance benchmarks, and optimization guidelines for the QUALUTION educational motion graphics video pipeline.

---

## 1. Executive Summary & Benchmark Findings

A 24-second educational scene rendered as individual PNG frames previously required **~12–15 minutes** and consumed hundreds of megabytes of disk space. By profiling Blender 5.2's EEVEE engine and eliminating redundant shading overhead for 2D/vector flat graphics, we established a streamlined offline rendering pipeline that is **2.3× faster** while reducing disk usage by **99.4% (156× smaller)** with zero perceptible degradation in visual quality.

### Comparative Benchmark (5.0s / 150 Frames @ 30 FPS, 1920×1080)

Tested on `benchmark_scene02_render.blend` (Act 2: "TWO DISCRETE VALUES: 0 OR 1"):

| Render Mode | Engine Config | Output Format | Elapsed Time | Seconds / Frame | Render Rate | Output Size | Relative Speed |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **Mode A: Legacy PNG Sequence** | EEVEE 64 smp, Shadows On | 150 × PNG (16:9) | **99.41 s** | 0.663 s/fr | 1.51 FPS | **315.29 MB** | **1.0× (Baseline)** |
| **Mode B: Direct MP4 (Default)** | EEVEE 64 smp, Shadows On | 1 × MP4 (H.264) | **60.60 s** | 0.404 s/fr | 2.48 FPS | **2.02 MB** | **1.64× faster** |
| **Mode C: Optimized MP4 (Production)** | EEVEE 8 smp, Shadows Off | 1 × MP4 (H.264) | **43.86 s** | **0.292 s/fr** | **3.42 FPS** | **2.01 MB** | **2.27× faster** |

---

## 2. Root Cause Analysis: Shading & I/O Bottlenecks

1. **TAA Over-sampling (64 Samples)**:
   * QUALUTION graphics use clean, flat `ShaderNodeEmission` materials and orthographic camera projections.
   * There are no complex diffuse light bounces, glossy roughness microfacets, or volumetric scatter.
   * Evaluating 64 temporal samples per frame caused **$150 \times 64 = 9,600$** redundant GPU passes per 5 seconds.
   * **Resolution**: Setting `taa_render_samples = 8` provides full subpixel anti-aliasing on vector lines and curves with zero noise.
2. **Shadow Map Calculation Overhead**:
   * EEVEE enables shadow buffers (`use_shadows = True`) by default.
   * Since QUALUTION scenes use emission shaders and no shadow-casting lights, shadow map generation consumed GPU cycles without contributing to visual output.
   * **Resolution**: Explicitly disable `use_shadows`, `use_fast_gi`, and `use_raytracing`.
3. **PNG Compression & File I/O Overhead**:
   * Compressing and writing 150 to 720 individual 1920×1080 PNG files to the NTFS disk created significant file handle and compression latency (~0.25–0.35s per frame).
   * **Resolution**: Direct FFmpeg H.264 encoding streams frame buffers directly in memory into an MP4 container, eliminating hundreds of individual disk write operations.

---

## 3. Recommended Production Pipeline (The Default Standard)

For all scene development, animation checks, and final assembly:

```
Blender Scene (.blend)
  └── EEVEE Engine (8 Samples, Flat Shading Optimizations)
        └── Direct FFmpeg Encoder (H.264 in MP4, CRF 18-20)
              └── Preview & Final Assembly (.mp4)
```

### Blender 5.2 Python Configuration Snippet

```python
import bpy

scene = bpy.context.scene
render = scene.render
eevee = scene.eevee

# 1. Document & Frame Settings
render.resolution_x = 1920
render.resolution_y = 1080
render.resolution_percentage = 100
render.fps = 30
render.fps_base = 1.0

# 2. EEVEE Shading Optimizations (Preserves Pristine Vector Edges)
eevee.taa_render_samples = 8          # Sufficient for 8x anti-aliased geometry
eevee.use_shadows = False            # No shadow casters in flat vector style
eevee.use_fast_gi = False            # No global illumination required
eevee.use_raytracing = False         # No raytraced reflections
eevee.use_volumetric_shadows = False # No volumetrics
eevee.use_overscan = False

# 3. Direct FFmpeg Video Export Settings (Blender 5.2+)
render.image_settings.media_type = 'VIDEO'
render.image_settings.file_format = 'FFMPEG'
render.ffmpeg.format = 'MPEG4'
render.ffmpeg.codec = 'H264'
render.ffmpeg.constant_rate_factor = 'HIGH'  # Visually lossless (~CRF 18)
render.ffmpeg.ffmpeg_preset = 'GOOD'        # Optimal balance of speed and density

# 4. Color Management
scene.display_settings.display_device = 'sRGB'
scene.view_settings.view_transform = 'Standard'
scene.view_settings.look = 'None'
```

---

## 4. Decision Matrix: Direct MP4 vs. PNG Sequences

| Use Case | Recommended Format | Rationale |
| :--- | :--- | :--- |
| **Scene Prototyping & Iteration** | **Direct MP4** | Fast render turnaround (<0.3s/frame); immediate playback in any media player. |
| **Full Lesson Scene Review** | **Direct MP4** | Lightweight file transfer (~10–15 MB per minute vs 3+ GB for PNGs). |
| **Web / LMS Delivery** | **Direct MP4** | Direct native playback in web browsers with zero conversion needed. |
| **Multi-pass VFX / Compositing** | **PNG Sequence** | Only when external node compositing, After Effects passes, or alpha channel overlays are strictly required. |
| **Archive Master Plates** | **Direct MP4 (Lossless)** | Constant Rate Factor `PERC_LOSSLESS` provides archive quality at 1/10th PNG sequence size. |

---

## 5. Web & Mobile Delivery Standards

* **Container**: MP4 (`.mp4`)
* **Video Codec**: H.264 (`avc1`) / Progressive scan / High Profile Level 4.1
* **Framerate**: 30.00 FPS constant
* **Audio Track** *(when introduced in later steps)*: AAC-LC, 192 kbps, 48 kHz stereo
* **Bitrate Budget**: ~2.5 to 3.5 Mbps for 1080p 30 FPS flat vector motion graphics (clean solid colors compress efficiently without blocking artifacts).
* **Safe Areas**: Strict adherence to the QUALUTION mobile-safe boundary $X \in [-6.4, 6.4], Y \in [-3.6, 3.6]$ ensures legibility on smartphone screens without edge clipping.
