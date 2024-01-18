/**
 * interface with {@link https://www.npmjs.com/package/sharp sharp} library
 *
 * @module
 */
import sharp from 'sharp';
import { BaseDiffResult, BaseDiffOptions, RgbDiffOptions } from './diff.js';
import { RgbBitmap, RgbaBitmap } from './types.js';
/**
 * Generate image diff from file
 *
 * @param sourceImagePath file path of image to generate diff for
 * @param originalImagePath file path of image to compare against
 * @param diffOutputPath file path to save diff image to
 * @param options diff options
 * @returns diff result stats
 */
export declare function diffFile(sourceImagePath: string, originalImagePath: string, diffOutputPath: string, options?: RgbDiffOptions): Promise<BaseDiffResult>;
/**
 * Generate image diff from file in multiple formats
 *
 * @param sourceImagePath file path of image to generate diff for
 * @param originalImagePath file path of image to compare against
 * @param diffOutputPaths output images to generate; keys are output program names, values are file paths
 * @param options diff options
 * @returns diff result stats
 */
export declare function diffFileMultiple(sourceImagePath: string, originalImagePath: string, diffOutputPaths: Record<string, string>, options?: BaseDiffOptions): Promise<BaseDiffResult>;
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
