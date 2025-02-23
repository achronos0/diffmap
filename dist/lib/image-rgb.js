/**
 * RGB/RGBA image manipulation functions
 *
 * @module
 */
import { rgb as valuesToRgb } from './image-value.js';
import { blend as blendPixel, flatten as flattenPixel, greyscale as greyscalePixel, yiq as yiqPixel } from './pixel-rgb.js';
import { RgbBitmap, RgbaBitmap, Valuemap, YiqFloatmap } from './types.js';
/**
 * Generate a YIQ (NTSC luminance/chrominance) image from a RGB/RGBA image
 *
 * @param sourceImage RGB/RGBA image
 * @returns new YIQ image
 */
export function yiq(sourceImage) {
    const yiqImage = new YiqFloatmap({
        width: sourceImage.width,
        height: sourceImage.height,
        pixels: new Float64Array(sourceImage.byteLength)
    });
    sourceImage.iterateAll(({ index, offset }) => {
        const sourcePixel = sourceImage.pixel(offset);
        const calcYiqPixel = yiqPixel(sourcePixel);
        const yiqOffset = yiqImage.offsetFromIndex(index);
        yiqImage.setPixel(yiqOffset, calcYiqPixel);
    });
    return yiqImage;
}
/**
 * Remove alpha from RGBA image by blending with white
 *
 * @param sourceImage image to flatten
 * @param options flatten options
 * @returns RGB image with alpha channel removed
 */
export function flatten(sourceImage, options = {}) {
    const { alphaRatio = 1 } = options;
    const resultImage = RgbBitmap.create(sourceImage.width, sourceImage.height);
    sourceImage.iterateAll(({ index, offset }) => {
        const sourcePixel = sourceImage.pixel(offset);
        const resultPixel = flattenPixel(sourcePixel, alphaRatio);
        const resultOffset = resultImage.offsetFromIndex(index);
        resultImage.setPixel(resultOffset, resultPixel);
    });
    return resultImage;
}
/**
 *
 * @param sourceImage image to convert to RGBA
 * @param options conversion options
 * @returns RGBA image with alpha channel set
 */
export function setAlpha(sourceImage, options = {}) {
    const { alpha = 255 } = options;
    const resultImage = RgbaBitmap.create(sourceImage.width, sourceImage.height);
    sourceImage.iterateAll(({ index, offset }) => {
        const sourcePixel = sourceImage.pixel(offset);
        const resultPixel = { ...sourcePixel, a: alpha };
        const resultOffset = resultImage.offsetFromIndex(index);
        resultImage.setPixel(resultOffset, resultPixel);
    });
    return resultImage;
}
/**
 * Extract brightness values from RGBA image
 *
 * @param sourceImage image to convert to brightness values
 * @param options conversion options
 * @returns single-channel image with pixel brightness values
 */
export function brightness(sourceImage, options = {}) {
    const { alphaRatio = 1 } = options;
    const resultImage = Valuemap.createIntmap(sourceImage.width, sourceImage.height);
    sourceImage.iterateAll(({ index, offset }) => {
        const pixel = sourceImage.pixel(offset);
        const resultPixel = greyscalePixel(pixel, alphaRatio);
        resultImage.setPixel(index, resultPixel);
    });
    return resultImage;
}
/**
 * Convert RGBA image to greyscale
 *
 * @param sourceImage image to convert to greyscale
 * @param options conversion options
 * @returns greyscale RGB image
 */
export function greyscale(sourceImage, options = {}) {
    const { fade = 0 } = options;
    const alphaRatio = 1 - fade;
    const values = brightness(sourceImage, { alphaRatio });
    return valuesToRgb(values);
}
/**
 * Blend (premultiply) RGBA image with another RGBA image
 *
 * @param sourceImage image to blend into
 * @param blendImage image to blend into original image
 * @param options blend options
 * @returns blended RGB image
 */
export function blend(sourceImage, blendImage, options = {}) {
    const { mode = 'average', channels = ['r', 'g', 'b'] } = options;
    if (sourceImage.width !== blendImage.width || sourceImage.height !== blendImage.height) {
        throw new Error('originalImage is not the same size as newImage');
    }
    const resultImage = RgbBitmap.create(sourceImage.width, sourceImage.height);
    sourceImage.iterateAll(({ index, offset }) => {
        const originalPixel = sourceImage.pixel(offset);
        const newOffset = blendImage.offsetFromIndex(index);
        const newPixel = blendImage.pixel(newOffset);
        const resultPixel = blendPixel(originalPixel, newPixel, mode, channels);
        const resultOffset = resultImage.offsetFromIndex(index);
        resultImage.setPixel(resultOffset, resultPixel);
    });
    return resultImage;
}
