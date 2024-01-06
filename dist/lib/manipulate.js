/**
 * image alteration functions
 *
 * @module
 */
import { RgbImage, RgbaImage, Valuemap, YiqImage } from './image.js';
import { blend as blendPixel, flatten as flattenPixel, greyscale as greyscalePixel, yiq as yiqPixel } from './pixel-rgb.js';
/**
 * Generate a YIQ (NTSC luminance/chrominance) image from a RGB/RGBA image
 *
 * @param sourceImage RGB/RGBA image
 * @returns new YIQ image
 */
export function yiq(sourceImage) {
    const yiqImage = new YiqImage({
        width: sourceImage.width,
        height: sourceImage.height,
        pixels: new Float64Array(sourceImage.byteLength)
    });
    sourceImage.iterateAll(({ offset }) => {
        const pixel = sourceImage.pixel(offset);
        yiqImage.setPixel(offset, yiqPixel(pixel));
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
    const resultImage = RgbImage.create(sourceImage.width, sourceImage.height);
    sourceImage.iterateAll(({ offset }) => {
        const pixel = sourceImage.pixel(offset);
        const resultPixel = flattenPixel(pixel, alphaRatio);
        resultImage.setPixel(offset, resultPixel);
    });
    return resultImage;
}
/**
 * Convert RGBA image to greyscale
 *
 * @param sourceImage image to convert to greyscale
 * @param alphaRatio alpha channel multiplier; apply this ratio to reduce pixel alpha (lighten image)
 * @returns single-channel image with greyscale pixel values
 */
export function greyscale(sourceImage, options = {}) {
    const { alphaRatio = 1 } = options;
    const resultImage = Valuemap.createIntmap(sourceImage.width, sourceImage.height);
    sourceImage.iterateAll(({ offset }) => {
        const pixel = sourceImage.pixel(offset);
        const resultPixel = greyscalePixel(pixel, alphaRatio);
        resultImage.setPixel(offset, resultPixel);
    });
    return resultImage;
}
/**
 * Blend (premultiply) RGBA image with another RGBA image
 *
 * @param originalImage image to blend into
 * @param newImage image to blend into original image
 * @param options blend options
 * @returns blended RGB image
 */
export function blend(originalImage, newImage, options = {}) {
    const { mode = 'average', channels = ['r', 'g', 'b'] } = options;
    if (originalImage.width !== newImage.width || originalImage.height !== newImage.height) {
        throw new Error('originalImage is not the same size as newImage');
    }
    const resultImage = RgbImage.create(originalImage.width, originalImage.height);
    originalImage.iterateAll(({ offset }) => {
        const originalPixel = originalImage.pixel(offset);
        const newPixel = newImage.pixel(offset);
        const resultPixel = blendPixel(originalPixel, newPixel, mode, channels);
        resultImage.setPixel(offset, resultPixel);
    });
    return resultImage;
}
/**
 * Render (draw) a valuemap as an RGBA image
 *
 * @param sourceImage valuemap of data to render
 * @param options rendering options
 * @returns RGB or RGBA image
 */
export function renderValues(sourceImage, options = {}) {
    const { palette = [{
            gradient: { from: { r: 0, g: 0, b: 0, a: 255 }, to: { r: 255, g: 255, b: 255, a: 255 } }
        }] } = options;
    const instructions = palette.map(instruction => {
        let { match = [], color = { r: 0, g: 0, b: 0, a: 255 }, gradient = null } = instruction;
        if (!Array.isArray(match)) {
            match = [match];
        }
        const finalMatches = match.map(match => {
            if (typeof match === 'number') {
                return {
                    value: [match]
                };
            }
            if ('value' in match) {
                return {
                    value: Array.isArray(match.value) ? match.value : [match.value]
                };
            }
            if ('mask' in match) {
                return {
                    mask: match.mask
                };
            }
            if ('range' in match) {
                return {
                    range: match.range
                };
            }
            return {
                all: true
            };
        });
        if (gradient) {
            return {
                match: finalMatches,
                gradient: {
                    from: gradient.from,
                    ratio: {
                        r: (gradient.to.r - gradient.from.r) / 255,
                        g: (gradient.to.g - gradient.from.g) / 255,
                        b: (gradient.to.b - gradient.from.b) / 255,
                        a: (gradient.to.a - gradient.from.a) / 255
                    }
                }
            };
        }
        return { match: finalMatches, color };
    });
    const resultImage = RgbaImage.create(sourceImage.width, sourceImage.height);
    sourceImage.iterateAll(({ offset }) => {
        const pixel = sourceImage.pixel(offset);
        for (const instruction of instructions) {
            // Check if pixel matches instruction
            let foundMatch = false;
            for (const match of instruction.match) {
                if (match.value != null) {
                    if (match.value.includes(pixel)) {
                        foundMatch = true;
                        break;
                    }
                    continue;
                }
                if (match.mask != null) {
                    if ((pixel & match.mask) === match.mask) {
                        foundMatch = true;
                        break;
                    }
                    continue;
                }
                if (match.range != null) {
                    if (pixel >= match.range[0] && pixel <= match.range[1]) {
                        foundMatch = true;
                        break;
                    }
                    continue;
                }
                foundMatch = true;
            }
            if (foundMatch) {
                if (instruction.gradient) {
                    const { from, ratio } = instruction.gradient;
                    const resultPixel = {
                        r: from.r + ratio.r * pixel,
                        g: from.g + ratio.g * pixel,
                        b: from.b + ratio.b * pixel,
                        a: from.a + ratio.a * pixel
                    };
                    resultImage.setPixel(offset, resultPixel);
                    return;
                }
                resultImage.setPixel(offset, instruction.color);
                return;
            }
        }
    });
    return resultImage;
}
