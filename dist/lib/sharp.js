/**
 * interface with {@link https://www.npmjs.com/package/sharp sharp} library
 *
 * @module
 */
import sharp from 'sharp';
import { diff } from './generate.js';
import { RgbImage, RgbaImage } from './image.js';
/**
 *
 * @param changedImage file path of image to generate diff for
 * @param originalPath file path of image to compare against
 * @param diffPath file path to save diff image to
 * @returns
 */
export async function diffFile(changedImage, originalPath, diffPath) {
    const originalImage = await loadImageFromFile(originalPath);
    const modifiedImage = await loadImageFromFile(changedImage);
    const diffResult = diff(originalImage, modifiedImage);
    const diffImage = diffResult.resultImage;
    if (!diffImage) {
        throw new Error('diff image not generated');
    }
    await saveImageToFile(diffPath, diffImage);
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
    const pixels = await sharpImage.raw().toBuffer();
    switch (channels) {
        case 3:
            return new RgbImage({ pixels, width, height });
        case 4:
            return new RgbaImage({ pixels, width, height });
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
