/**
 * interface with {@link https://www.npmjs.com/package/sharp sharp} library
 *
 * @module
 */
import sharp from 'sharp';
import { diff } from './diff.js';
import { RgbBitmap, RgbaBitmap } from './types.js';
/**
 * Generate image diff from file
 *
 * @param sourceImagePaths file path of images to generate diff for
 * @param diffOutputPaths file paths to save diff images to
 * @param options diff options
 * @returns diff result stats
 */
export async function diffFile(sourceImagePaths, diffOutputPaths, options = {}) {
    const sourceImages = await Promise.all(sourceImagePaths.map(loadImageFromFile));
    const finalOptions = {
        ...options,
        output: Object.keys(diffOutputPaths)
    };
    const { outputImages, ...diffResult } = diff(sourceImages, finalOptions);
    for (const [key, path] of Object.entries(diffOutputPaths)) {
        const image = outputImages[key];
        if (!image) {
            continue;
        }
        if (!(image instanceof RgbBitmap || image instanceof RgbaBitmap)) {
            throw new Error(`unsupported image type for output image: ${key}`);
        }
        await saveImageToFile(path, image);
    }
    return diffResult;
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
