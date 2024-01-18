/**
 * interface with {@link https://www.npmjs.com/package/sharp sharp} library
 *
 * @module
 */
import sharp from 'sharp';
import { rgb, rgbMultiple } from './diff.js';
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
export async function diffFile(sourceImagePath, originalImagePath, diffOutputPath, options = {}) {
    const sourceImage = await loadImageFromFile(sourceImagePath);
    const originalImage = await loadImageFromFile(originalImagePath);
    const diffResult = rgb(sourceImage, originalImage, options);
    const diffImage = diffResult.resultImage;
    await saveImageToFile(diffOutputPath, diffImage);
    return diffResult;
}
/**
 * Generate image diff from file in multiple formats
 *
 * @param sourceImagePath file path of image to generate diff for
 * @param originalImagePath file path of image to compare against
 * @param diffOutputPaths output images to generate; keys are output program names, values are file paths
 * @param options diff options
 * @returns diff result stats
 */
export async function diffFileMultiple(sourceImagePath, originalImagePath, diffOutputPaths, options = {}) {
    const sourceImage = await loadImageFromFile(sourceImagePath);
    const originalImage = await loadImageFromFile(originalImagePath);
    const outputNames = Object.keys(diffOutputPaths);
    const { resultImages, ...result } = rgbMultiple(sourceImage, originalImage, outputNames, options);
    for (const [key, path] of Object.entries(diffOutputPaths)) {
        const image = resultImages[key];
        if (!image) {
            throw new Error('diff image not generated');
        }
        if (!(image instanceof RgbBitmap || image instanceof RgbaBitmap)) {
            throw new Error('unsupported image type');
        }
        await saveImageToFile(path, image);
    }
    return result;
}
/**
 * Load diffmap image from file using {@link https://www.npmjs.com/package/sharp sharp} library
 *
 * @param path image file path
 * @returns loaded image data
 */
export async function loadImageFromFile(path) {
    const sharpImage = sharp(path);
    return await sharpToImage(sharpImage);
}
/**
 * Save diffmap image to file using {@link https://www.npmjs.com/package/sharp sharp} library
 *
 * @param path image file path
 * @param image image data
 */
export async function saveImageToFile(path, image) {
    const sharpImage = imageToSharp(image);
    await sharpImage.toFile(path);
}
/**
 * Create diffmap image from {@link https://www.npmjs.com/package/sharp sharp} object
 *
 * @param sharpImage sharp image object
 * @returns loaded image data
 */
export async function sharpToImage(sharpImage) {
    const { width, height, channels } = await sharpImage.metadata();
    if (!width || !height || !channels) {
        throw new Error('cannot load image metadata');
    }
    const pixels = new Uint8Array((await sharpImage.raw().toBuffer()).buffer);
    switch (channels) {
        case 3:
            return new RgbBitmap({ pixels, width, height });
        case 4:
            return new RgbaBitmap({ pixels, width, height });
        default:
            throw new Error('unsupported image channels');
    }
}
/**
 * Create {@link https://www.npmjs.com/package/sharp sharp} object from diffmap image
 *
 * @param image image data
 * @returns sharp object
 */
export function imageToSharp(image) {
    const { width, height, channels, pixels } = image;
    const sharpImage = sharp(pixels, { raw: { width, height, channels } });
    return sharpImage;
}
