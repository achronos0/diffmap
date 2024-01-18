/**
 * Default import entrypoint
 *
 * @module
 */
export * as box from './lib/box.js';
export * as diff from './lib/diff.js';
export * as imageRgb from './lib/image-rgb.js';
export * as imageValue from './lib/image-value.js';
export * as pixelRgb from './lib/pixel-rgb.js';
export * as pixelYiq from './lib/pixel-yiq.js';
export * as types from './lib/types.js';
import { diff as diffImage } from './lib/diff.js';
export { diffImage };
export default diffImage;
