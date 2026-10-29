import { readFileSync } from 'fs';
import { resolve } from 'path';
import Ajv from 'ajv';

const dir = new URL('.', import.meta.url).pathname.replace(/^\/([A-Z]:)/, '$1');

const schema = JSON.parse(readFileSync(resolve(dir, 'schema.json'), 'utf8'));
const lesson = JSON.parse(readFileSync(resolve(dir, 'lesson.json'), 'utf8'));

const ajv = new Ajv({ allErrors: true });
const validate = ajv.compile(schema);
const valid = validate(lesson);

if (!valid) {
  console.error('❌  lesson.json is INVALID:\n');
  for (const err of validate.errors) {
    console.error(`  [${err.instancePath || '/'}] ${err.message}`);
    if (err.params && Object.keys(err.params).length) {
      console.error(`    params:`, JSON.stringify(err.params));
    }
  }
  process.exit(1);
}

// Extra semantic check: highlight_words must match {{tokens}} in narration
let semanticOk = true;
for (const kf of lesson.keyframes) {
  const tokens = [...kf.narration.matchAll(/\{\{(\w+)\}\}/g)].map(m => m[1]);
  const declared = kf.highlight_words;
  const missing = tokens.filter(t => !declared.includes(t));
  const extra = declared.filter(t => !tokens.includes(t));
  if (missing.length || extra.length) {
    console.error(`❌  keyframe "${kf.keyframe_id}" highlight_words mismatch:`);
    if (missing.length) console.error(`   in narration but not declared: ${missing.join(', ')}`);
    if (extra.length)   console.error(`   declared but not in narration: ${extra.join(', ')}`);
    semanticOk = false;
  }
}

if (!semanticOk) process.exit(1);

console.log('✅  lesson.json is valid — schema + semantic checks passed.');
