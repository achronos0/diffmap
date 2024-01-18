/**
 * Node+sharp import entrypoint
 *
 * @module
 */
export * from './index.js';
export * as sharp from './lib/sharp.js';
import { diffImage } from './index.js';
import { diffFile, diffFileMultiple } from './lib/sharp.js';
export { diffImage, diffFile, diffFileMultiple };
export default diffFile;
