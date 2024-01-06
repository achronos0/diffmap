/**
 * Node+sharp import entrypoint
 *
 * @module
 */
import { diff } from './index.js';
import { diffFile } from './lib/sharp.js';
export { diff, diffFile };
export default diffFile;
export * from './index.js';
export * as sharp from './lib/sharp.js';
