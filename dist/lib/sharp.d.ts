/**
 * interface with {@link https://www.npmjs.com/package/sharp sharp} library
 *
 * @module
 */
import sharp from 'sharp';
import { DiffOptions, DiffResult } from './diff.js';
import { RgbBitmap, RgbaBitmap } from './types.js';
/**
 * Return value of {@link diffFile}
 */
export type DiffFileResult = Omit<DiffResult, 'outputImages'>;
/**
 * Generate image diff from file
 *
 * @param sourceImagePaths file path of images to generate diff for
 * @param diffOutputPaths file paths to save diff images to
 * @param options diff options
 * @returns diff result stats
 */
export declare function diffFile(sourceImagePaths: string[], diffOutputPaths: Record<string, string>, options?: Omit<DiffOptions, 'output'>): Promise<DiffFileResult>;
/**
 * Load diffmap image from file using {@link https://www.npmjs.com/package/sharp sharp} library
 *
 * @param path image file path
 * @returns loaded image data
 */
export declare function loadImageFromFile(path: string): Promise<RgbaBitmap | RgbBitmap>;
/**
 * Save diffmap image to file using {@link https://www.npmjs.com/package/sharp sharp} library
 *
 * @param path image file path
 * @param image image data
 */
export declare function saveImageToFile(path: string, image: RgbaBitmap | RgbBitmap): Promise<void>;
/**
 * Create diffmap image from {@link https://www.npmjs.com/package/sharp sharp} object
 *
 * @param sharpImage sharp image object
 * @returns loaded image data
 */
export declare function sharpToImage(sharpImage: sharp.Sharp): Promise<RgbaBitmap | RgbBitmap>;
/**
 * Create {@link https://www.npmjs.com/package/sharp sharp} object from diffmap image
 *
 * @param image image data
 * @returns sharp object
 */
export declare function imageToSharp(image: RgbaBitmap | RgbBitmap): sharp.Sharp;
