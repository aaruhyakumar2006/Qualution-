import type { LessonScript } from '../../types';
import { convertJsonToLessonScript, type JsonTeachingVideo } from '../../schema/jsonLessonSchema';
import groverJsonRaw from '../grover-2q-11.json';

export const grover2q11JsonData: JsonTeachingVideo = groverJsonRaw as unknown as JsonTeachingVideo;

export const grover2q11Lesson: LessonScript = convertJsonToLessonScript(grover2q11JsonData);

export default grover2q11Lesson;
