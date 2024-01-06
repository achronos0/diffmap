/**
 * interface with {@link https://www.npmjs.com/package/sharp sharp} library
 *
 * @module
 */
import sharp from 'sharp';
import { DiffResult } from './generate.js';
import { RgbImage, RgbaImage } from './image.js';
/**
 *
 * @param changedImage file path of image to generate diff for
 * @param originalPath file path of image to compare against
 * @param diffPath file path to save diff image to
 * @returns
 */
export declare function diffFile(changedImage: string, originalPath: string, diffPath: string): Promise<DiffResult>;
/**
 * Load diffmap image from file using {@link https://www.npmjs.com/package/sharp sharp} library
 *
 * @param path image file path
 * @returns loaded image data
 */
export declare function loadImageFromFile(path: string): Promise<RgbaImage | RgbImage>;
/**
 * Save diffmap image to file using {@link https://www.npmjs.com/package/sharp sharp} library
 *
 * @param path image file path
 * @param image image data
 */
export declare function saveImageToFile(path: string, image: RgbaImage | RgbImage): Promise<void>;
/**
 * Create diffmap image from {@link https://www.npmjs.com/package/sharp sharp} object
 *
 * @param sharpImage sharp image object
 * @returns loaded image data
 */
export declare function sharpToImage(sharpImage: sharp.Sharp): Promise<RgbaImage | RgbImage>;
/**
 * Create {@link https://www.npmjs.com/package/sharp sharp} object from diffmap image
 *
 * @param image image data
 * @returns sharp object
 */
export declare function imageToSharp(image: RgbaImage | RgbImage): sharp.Sharp;
