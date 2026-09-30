# QUALUTION Video Production — Scene Specification Schema

## 1. Overview

This document specifies the standard JSON and Markdown data contracts used to define educational animation scenes for the QUALUTION video pipeline. Specifications defined under this schema serve as the single source of truth for storyboarding, voice narration, Blender procedural generation, and automated rendering.

---

## 2. JSON Schema Definition (`scene-spec.json`)

```json
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "title": "QualutionLessonSpec",
  "type": "object",
  "required": [
    "lessonId",
    "lessonTitle",
    "sprintId",
    "targetDurationSeconds",
    "fps",
    "resolution",
    "aspectRatio",
    "learningObjectives",
    "scenes"
  ],
  "properties": {
    "lessonId": { "type": "string", "example": "s1-theory-what-is-quantum" },
    "lessonTitle": { "type": "string", "example": "What Is Quantum Computing?" },
    "sprintId": { "type": "string", "example": "sprint-01" },
    "targetDurationSeconds": { "type": "integer", "example": 248 },
    "fps": { "type": "integer", "default": 30 },
    "resolution": {
      "type": "object",
      "properties": {
        "width": { "type": "integer", "default": 1920 },
        "height": { "type": "integer", "default": 1080 }
      },
      "required": ["width", "height"]
    },
    "aspectRatio": { "type": "string", "default": "16:9" },
    "learningObjectives": {
      "type": "array",
      "items": { "type": "string" }
    },
    "curriculumBoundaries": {
      "type": "object",
      "properties": {
        "topicsCovered": { "type": "array", "items": { "type": "string" } },
        "topicsDeferred": { "type": "array", "items": { "type": "string" } }
      }
    },
    "scenes": {
      "type": "array",
      "items": {
        "$ref": "#/definitions/SceneItem"
      }
    }
  },
  "definitions": {
    "SceneItem": {
      "type": "object",
      "required": [
        "id",
        "title",
        "durationSeconds",
        "startFrame",
        "endFrame",
        "narration",
        "captions",
        "onScreenText",
        "visualElements",
        "animationActions",
        "assetsRequired",
        "educationalPurpose",
        "transitionOut"
      ],
      "properties": {
        "id": { "type": "string", "example": "scene-01" },
        "title": { "type": "string", "example": "The Hook" },
        "durationSeconds": { "type": "number", "example": 18 },
        "startFrame": { "type": "integer", "example": 1 },
        "endFrame": { "type": "integer", "example": 540 },
        "narration": {
          "type": "object",
          "properties": {
            "speaker": { "type": "string", "default": "QUALUTION Narrator" },
            "text": { "type": "string" },
            "tone": { "type": "string" },
            "pacingWpm": { "type": "integer", "default": 135 }
          },
          "required": ["text"]
        },
        "captions": {
          "type": "array",
          "items": {
            "type": "object",
            "properties": {
              "text": { "type": "string" },
              "startFrame": { "type": "integer" },
              "endFrame": { "type": "integer" }
            },
            "required": ["text", "startFrame", "endFrame"]
          }
        },
        "onScreenText": {
          "type": "array",
          "items": {
            "type": "object",
            "properties": {
              "id": { "type": "string" },
              "text": { "type": "string" },
              "role": { "type": "string", "enum": ["header", "subtext", "math", "badge", "callout"] },
              "position": { "type": "array", "items": { "type": "number" } }
            },
            "required": ["id", "text", "role", "position"]
          }
        },
        "visualElements": {
          "type": "array",
          "items": {
            "type": "object",
            "properties": {
              "name": { "type": "string" },
              "type": { "type": "string" },
              "description": { "type": "string" },
              "coordinates": { "type": "array", "items": { "type": "number" } }
            },
            "required": ["name", "type", "description"]
          }
        },
        "animationActions": {
          "type": "array",
          "items": {
            "type": "object",
            "properties": {
              "target": { "type": "string" },
              "action": { "type": "string" },
              "startFrame": { "type": "integer" },
              "endFrame": { "type": "integer" },
              "easing": { "type": "string" }
            },
            "required": ["target", "action", "startFrame", "endFrame"]
          }
        },
        "assetsRequired": {
          "type": "array",
          "items": { "type": "string" }
        },
        "educationalPurpose": { "type": "string" },
        "transitionOut": {
          "type": "object",
          "properties": {
            "type": { "type": "string", "enum": ["fade_to_black", "crossfade", "slide_left", "scale_out", "cut"] },
            "durationFrames": { "type": "integer" }
          },
          "required": ["type", "durationFrames"]
        }
      }
    }
  }
}
```

---

## 3. Scene Markdown Documentation Standard

Each lesson directory (`qualution-video/lessons/<sprint-id>/<lesson-dir>/`) must include:
1. `storyboard.md`: Visual descriptions, shot-by-shot timeline, camera framing, layout diagrams, and animation curves.
2. `narration.md`: Spoken script, line-by-line timing, inflection guides, pronunciation keys, and exact caption sync.
3. `scene-spec.json`: Machine-readable implementation spec compliant with the JSON schema above.
