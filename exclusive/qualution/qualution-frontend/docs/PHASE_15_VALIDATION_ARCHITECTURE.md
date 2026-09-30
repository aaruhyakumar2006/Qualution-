# Phase 15: Lesson Validation & Playback Reliability

## Overview

Phase 15 implements comprehensive validation and error handling for the QUALUTION teacher-video system. The goal is to ensure that **no lesson JSON file can crash the application**, while providing developers with clear, actionable error messages.

## Validation Architecture

### Pipeline Flow

```
RAW INPUT (string or unknown)
    ↓
JSON PARSING (safe, catches syntax errors)
    ↓
SIZE VALIDATION (UTF-8 byte size limit: 80 KB)
    ↓
SCHEMA VALIDATION (structure, types, required fields)
    ↓
NUMERIC SAFETY (NaN, Infinity, negative durations, range checks)
    ↓
ACTION COUNT LIMIT (maximum: 5000 actions)
    ↓
SEMANTIC VALIDATION (references, coordinate ranges)
    ↓
VALIDATED LESSON DOC
    ↓
LESSON PLAYER
```

### Key Principle

Validation happens **once at load time**. The runtime player receives already-validated data and never re-validates during playback.

## Validation Rules

### 1. JSON Parsing Safety

**File:** `lessonValidator.ts`

- Uses `try-catch` around `JSON.parse()`
- Never throws — all errors are collected and returned
- Handles:
  - Empty input
  - Malformed JSON syntax
  - Truncated JSON
  - Invalid characters
  - Unexpected types (null, arrays, primitives)

**Error Category:** `JSON_PARSE`

### 2. Size Limits

**Maximum Lesson Size:** 80 KB (UTF-8 encoded)

Production lessons should be 5–80 KB. This limit prevents:
- Accidentally loading multi-megabyte files
- Memory exhaustion
- UI freezing during parse/load

**Size Calculation:**
- Uses `TextEncoder` for accurate UTF-8 byte counting
- Falls back to `Blob` if `TextEncoder` unavailable
- Measures the JSON string, not the parsed object

**Error Category:** `SIZE`

### 3. Schema Validation

**File:** `lessonSchema.ts` (existing)

Validates:
- Version number (must be `1`)
- Required fields: `v`, `id`, `title`, `steps`
- ID format (alphanumeric, dashes, underscores only)
- Step structure (id, cmds array)
- Command structure (opcode + arguments)
- Optional fields (difficulty, estimatedMinutes, objectives)
- Defaults block (color, mathColor, strokeWidth, fontSize)
- Styles block (scale, color, bold, italic)
- Objects block (type, label, length, size, color)

**Error Category:** `SCHEMA`

### 4. Numeric Safety

**File:** `lessonValidator.ts`

Validates all numeric values to prevent:
- `NaN` values (causes rendering corruption)
- `Infinity` / `-Infinity` (causes infinite loops)
- Negative durations (causes timing errors)
- Out-of-range coordinates (causes rendering issues)
- Invalid scale factors (causes element sizing bugs)
- Zero or negative dimensions (causes drawing errors)

**Checked Values:**
- Coordinates: `[MIN_COORDINATE, MAX_COORDINATE]` = `[-200, 2000]`
- Durations: `[0, MAX_DURATION_MS]` = `[0, 120000]` (2 minutes)
- Scales: `[MIN_SCALE, MAX_SCALE]` = `[0.1, 10.0]`
- Dimensions: `(0, reasonable_max]` (width, height, radius must be positive)

**Validation Types:**
- **CRITICAL errors:** NaN, Infinity, negative where invalid, extreme out-of-range
- **WARNINGS:** Out-of-normal-range but technically valid (e.g., coordinate at 1500)

**Error Category:** `NUMERIC`

### 5. Action Count Limit

**Maximum Actions:** 5000

Prevents lessons with millions of actions from freezing the application.

**Realistic Lesson Sizes:**
- Simple lesson: 50–200 actions
- Medium lesson: 200–500 actions
- Complex lesson: 500–1000 actions
- Safety limit: 5000 actions

**Error Category:** `ACTION_COUNT`

### 6. Reference Validation

**File:** `lessonSchema.ts` (existing)

Validates references to:
- **Style presets:** `["ws", text, x, y, styleId]` → `styleId` must exist in `styles` block
- **Object templates:** `["o", objectId, x, y]` → `objectId` must exist in `objects` block

Undefined references cause rendering errors, so they're caught during validation.

**Error Category:** `SCHEMA`

## Error Reporting

### Error Structure

```typescript
interface LessonValidationError {
  severity: 'CRITICAL' | 'WARNING';
  category: 'JSON_PARSE' | 'SIZE' | 'SCHEMA' | 'NUMERIC' | 'ACTION_COUNT' | 'SEMANTIC';
  message: string;
  lessonId?: string;
  stepId?: string;
  actionIndex?: number;
  actionType?: string;
  field?: string;
}
```

### Error Severity

- **CRITICAL:** Lesson cannot be loaded. Loading will fail.
- **WARNING:** Lesson can be loaded but may have issues (e.g., out-of-range coordinates).

### Error Messages

**Developer Mode (default):**
```
Lesson validation failed with 3 error(s):

  1. [CRITICAL] [NUMERIC] Lesson "qubit-intro": Step "s2": Action[5] (p): duration must be non-negative. Got: -100
  2. [CRITICAL] [SCHEMA] Lesson "qubit-intro": Step "s3": Action[2] (ws): unknown style "undefined-style".
  3. [WARNING] [NUMERIC] Lesson "qubit-intro": Step "s1": Action[0] (m): x is outside normal range [-200, 2000]. Got: 5000. This may cause rendering issues.
```

**User Mode (learner-friendly):**
```
Unable to load this lesson. The lesson file contains errors and cannot be displayed.
```

### Formatting API

```typescript
// Developer-friendly (full details)
const formatted = formatValidationErrors(errors, 'developer');

// Learner-friendly (hide technical details)
const formatted = formatValidationErrors(errors, 'user');
```

## LessonPlayer Integration

### Load Result

```typescript
interface PlayerLoadResult {
  ok: boolean;
  errors: string[];              // Human-readable error messages
  durationMs: number;            // 0 if load failed
  validationErrors?: LessonValidationError[];  // Detailed errors (development)
  warnings?: string[];           // Non-critical warnings
}
```

### Load Behavior

**Success:**
```typescript
const result = player.load(lessonJSON, paintCallback);
// result.ok === true
// result.durationMs === 45000
// result.warnings === ["coordinate out of range..."]
```

**Failure:**
```typescript
const result = player.load(invalidJSON, paintCallback);
// result.ok === false
// result.errors === ["Lesson validation failed..."]
// result.durationMs === 0
// result.validationErrors === [{ severity: 'CRITICAL', ... }]
```

**Safe State After Failure:**
- Player remains in `IDLE` state
- No partial lesson data loaded
- Can call `load()` again with valid lesson
- Can call `dispose()` safely
- All operations (play, pause, restart) are safe no-ops

### Development Logging

In development mode (`NODE_ENV === 'development'`):
```typescript
console.error('[LessonPlayer] Validation failed:\n', formatValidationErrors(...));
console.error('[LessonPlayer] Lesson metadata:', { lessonId, title, sizeBytes, totalActions });
```

Production builds do not log internal details.

## Playback Reliability

### Reset Safety

**Guarantee:** `restart()` always returns to the **exact same initial state**.

**Implementation:**
```typescript
public restart(): void {
  this._stopRaf();           // Stop animation frame loop
  this._clock.reset();       // currentTimeMs = 0, isPlaying = false
  this._engine.restart();    // Clear board, reset state
  this._narration.restart(); // Reset narration scheduler
  this._notify();            // Notify subscribers
}
```

**Test:** Run lesson, pause at various points, restart. Always returns to time=0, IDLE state.

### Pause/Resume Reliability

**Guarantee:** Pause/resume cycles do not:
- Cause timing drift
- Skip actions
- Duplicate actions
- Corrupt cursor position
- Duplicate narration

**Clock Model:**
```typescript
currentTimeMs = pausedAt + (now() - wallStart)

On play():   wallStart = now()
On pause():  pausedAt = currentTimeMs; wallStart = null
On resume:   wallStart = now() (continues from pausedAt)
```

**Test:** Play → Pause → Play → Pause → Play repeatedly. Time advances correctly without jumps.

### Deterministic Replay

**Guarantee:** Same lesson → same result, every time.

**Requirements:**
- No randomness in lesson execution
- No wall-clock dependencies (except for RAF timing)
- No eval() or dynamic code execution
- No mutable global state
- Clock is single source of truth

**Test:** Run same lesson 5 times. All runs produce identical:
- Action sequences
- Cursor positions
- Final state
- Timing behavior

### Audio Failure Fallback

**Guarantee:** Visual lesson continues even if audio/narration fails.

**Scenarios Handled:**
- TTS provider unavailable (`speak()` throws)
- Narration audio load failure
- TTS becomes unavailable mid-playback
- Lesson has no narration commands

**Behavior:**
- Lesson loads successfully (narration is optional)
- Visual actions execute normally
- Cursor moves correctly
- Board updates correctly
- No crash, no freeze

**Implementation:**
```typescript
try {
  this._narration.load(this._timeline);
} catch (e) {
  console.warn('[LessonPlayer] Narration load failed (non-critical):', e.message);
  // Continue anyway — narration is optional
}
```

## Usage Examples

### Basic Usage

```typescript
import { LessonPlayer } from './lessonPlayer';
import lessonJSON from './lessons/qubit-intro.json';

const player = new LessonPlayer();

// Load lesson
const result = player.load(lessonJSON, paintCallback);

if (!result.ok) {
  // Show error to user
  console.error('Failed to load lesson:', result.errors);
  // Optionally show detailed errors in development
  if (result.validationErrors) {
    console.table(result.validationErrors);
  }
  return;
}

// Show warnings if present
if (result.warnings && result.warnings.length > 0) {
  console.warn('Lesson loaded with warnings:', result.warnings);
}

// Play lesson
player.play();
```

### Manual Validation (Pre-Load)

```typescript
import { validateLesson, formatValidationErrors } from './lessonValidator';

// Validate before attempting to load
const validation = validateLesson(lessonJSON);

if (!validation.valid) {
  const formatted = formatValidationErrors(validation.errors, 'developer');
  console.error(formatted);
  
  // Show metadata even for invalid lessons
  console.log('Lesson ID:', validation.meta.lessonId);
  console.log('Size:', validation.meta.sizeBytes, 'bytes');
  console.log('Actions:', validation.meta.totalActions);
  
  return;
}

// Safe to load
const player = new LessonPlayer();
player.load(validation.lesson, paintCallback);
```

### React Integration (Safe Failure)

```typescript
function LessonViewer({ lessonData }: { lessonData: unknown }) {
  const [error, setError] = useState<string | null>(null);
  const { state, load, play, pause, restart } = useLessonPlayer();

  useEffect(() => {
    const result = load(lessonData, paintCallback);
    if (!result.ok) {
      // Show user-friendly error
      setError('Unable to load this lesson. Please try another.');
      // Log details for debugging
      console.error('Load failed:', result.errors);
    }
  }, [lessonData, load]);

  if (error) {
    return <div className="error">{error}</div>;
  }

  return (
    <div>
      <TeachingBoard />
      <LessonPlayerControls 
        state={state}
        onPlay={play}
        onPause={pause}
        onRestart={restart}
      />
    </div>
  );
}
```

## Testing

### Test Coverage

**50+ Invalid Lesson Tests** (`lessonValidator.test.ts`):
1. Empty JSON
2. Malformed JSON
3. Truncated JSON
4. Invalid commas
5. Missing version
6. Unsupported version
7. Missing ID
8. Empty ID
9. Missing title
10. Empty title
11. Missing steps
12. Empty steps array
13. NaN in pause duration
14. Infinity in pause duration
15. Negative duration
16. NaN in coordinates
17. Infinity in coordinates
18. Out-of-range coordinates (warning)
19. NaN in scale
20. Scale out of range
21. Negative scale
22. Unknown action type
23. Missing action parameters
24. Write with missing text
25. Draw with invalid subtype
26. Draw rect with negative width
27. Draw circle with negative radius
28. Unknown style reference
29. Unknown object reference
30. Valid style reference
31. Valid object reference
32. Oversized lesson (>80KB)
33. Excessive action count (>5000)
34. Null as lesson
35. Array as lesson
36. String as lesson
37. Step without ID
38. Step without cmds
39. Duplicate step IDs
40. All optional fields present
41. Multiple steps
42. Complex actions
43. Extremely long duration (warning)
44. Zero duration pause
45. Format errors for developers
46. Format errors for users
47. Empty error list
48. Multiple error types
49. Validation metadata
50. Pre-parsed object input

**Reliability Tests** (`lessonPlayer.reliability.test.ts`):
- Deterministic replay (5 identical runs)
- Identical cursor positions across replays
- Reset after play
- Play → pause → restart → play
- Restart while playing
- Restart at completion
- Play → pause → play (5 cycles)
- No duplicate actions after pause/resume
- TTS failure (lesson continues)
- Missing narration (lesson continues)
- TTS fails mid-playback (lesson continues)
- Invalid lesson load (safe failure)
- Play on invalid lesson (no-op)
- Load valid after failed load
- Multiple dispose calls (safe)
- Operations on disposed player (safe)
- Oversized lesson validation errors
- Excessive actions validation errors
- Warning collection

### Running Tests

```bash
# Run all validation tests
npm test lessonValidator.test.ts

# Run all reliability tests
npm test lessonPlayer.reliability.test.ts

# Run all lesson player tests
npm test lessonPlayer
```

## Limits Summary

| Limit | Value | Rationale |
|-------|-------|-----------|
| **Max Lesson Size** | 80 KB | Production target; prevents memory issues |
| **Max Action Count** | 5000 | Prevents UI freeze; realistic max ~1000 |
| **Max Coordinate** | 2000 | Board is 1200×700; allows margin |
| **Min Coordinate** | -200 | Allows off-board entry animations |
| **Max Duration** | 120,000 ms (2 min) | Per-action limit; prevents infinite pause |
| **Max Scale** | 10.0 | Prevents absurdly large elements |
| **Min Scale** | 0.1 | Prevents invisibly small elements |
| **Max Stroke Width** | 20 | Prevents excessive line thickness |

## Adding a New Action Type

When adding a new action type to the lesson schema:

1. **Update `lessonSchema.ts`:**
   - Add opcode to `CmdOpcode` union
   - Add validation in `validateCmd()` function
   - Document required arguments

2. **Update `lessonValidator.ts`:**
   - Add numeric safety checks in `validateNumericSafety()`
   - Add switch case for the new opcode
   - Validate all numeric arguments
   - Validate required fields

3. **Update `lessonParser.ts`:**
   - Add parser case in `parseCmd()` function
   - Map compact format to `BoardAction`

4. **Add Tests:**
   - Valid action test in `lessonSchema.test.ts`
   - Invalid action tests in `lessonValidator.test.ts`
   - Missing parameters test
   - Invalid numeric values test (NaN, Infinity, negative)

Example:
```typescript
// 1. Schema validation
case 'newop':
  if (!isStr(args[0]) || !isNum(args[1])) {
    errors.push(`${prefix} (newop): requires string param and numeric value.`);
  }
  break;

// 2. Numeric safety
case 'newop':
  validateCoord(args[1], 'value');
  break;

// 3. Parser
case 'newop':
  return [{ type: 'NEW_ACTION', param: args[0], value: args[1] }];

// 4. Test
it('rejects newop with invalid value', () => {
  const lesson = {
    ...MINIMAL_VALID,
    steps: [{ id: 's1', cmds: [['newop', 'param', NaN]] }],
  };
  expectInvalid(lesson, 'NUMERIC');
});
```

## Known Limitations

1. **No Seeking Support:** Progress bar is read-only. Seeking would require state reconstruction at arbitrary times (future enhancement).

2. **No Live Validation:** Validation occurs once at load time. Runtime changes to lesson data are not re-validated.

3. **UTF-8 Size Approximation:** Fallback to `Blob` API if `TextEncoder` unavailable may slightly overestimate size.

4. **No Circular Reference Detection:** Lesson schema is flat JSON with no references between objects, so circular references are impossible.

5. **No Rate Limiting:** Multiple rapid load() calls are allowed. Application layer should debounce if needed.

## Production Checklist

Before deploying lessons to production:

- [ ] Validate lesson with `validateLesson()`
- [ ] Check size: 5–80 KB range
- [ ] Check action count: <1000 recommended
- [ ] Test play/pause/restart cycles
- [ ] Test with audio enabled and disabled
- [ ] Test on slow devices
- [ ] Verify deterministic replay
- [ ] Check console for warnings
- [ ] Test in development mode first
- [ ] Review validation errors/warnings

## Debugging Tips

**Problem:** Lesson won't load

**Solution:**
```typescript
const validation = validateLesson(lessonJSON);
console.log('Valid:', validation.valid);
console.log('Errors:', validation.errors);
console.log('Metadata:', validation.meta);
console.log(formatValidationErrors(validation.errors, 'developer'));
```

**Problem:** Timing issues (drift, jumps)

**Solution:**
- Check `LessonClock` behavior in tests
- Verify RAF loop is running correctly
- Check for external time dependencies
- Use controlled clock in tests

**Problem:** Actions duplicated or skipped

**Solution:**
- Verify `pause()` freezes clock correctly
- Check `restart()` resets all state
- Ensure actions are indexed by time, not execution count
- Check timeline building in `lessonTimeline.ts`

**Problem:** Lesson works once, fails on replay

**Solution:**
- Check for mutable global state
- Verify `restart()` completely clears state
- Look for randomness or non-determinism
- Test with controlled clock

## Future Enhancements

Potential additions for later phases:

1. **Progressive Validation:** Validate lesson structure incrementally during load
2. **Schema Version Migration:** Auto-upgrade old lesson formats
3. **Compression:** Support gzip-compressed lessons for <5KB size
4. **Streaming Validation:** Validate large lessons in chunks
5. **Repair Mode:** Auto-fix common lesson errors
6. **Validation Cache:** Cache validation results for repeated loads
7. **Custom Validators:** Plugin system for custom validation rules
8. **Performance Profiling:** Track validation time and optimize

## Conclusion

Phase 15 establishes a robust validation and error handling system for the QUALUTION teacher-video engine. The system ensures that:

✓ No lesson can crash the application
✓ Invalid lessons fail safely with clear error messages
✓ Playback is deterministic and reliable
✓ Audio failures don't affect visual playback
✓ Reset/pause/resume operations work correctly
✓ Developers receive actionable error information
✓ Learners see user-friendly error messages

The validation pipeline processes lessons through multiple safety layers before allowing playback, and the player maintains safe state even when operations fail.
