/**
 * RGB/RGBA pixel manipulation functions
 *
 * @module
 */
/**
 * Remove alpha from RGBA pixel by blending with white
 *
 * @param pixel pixel colour data
 * @param alphaRatio alpha channel multiplier; apply this ratio to reduce pixel alpha (lighten image)
 * @returns pixel colour data with alpha removed
 */
export function flatten(pixel, alphaRatio = 1) {
    if (pixel.a === 255) {
        return pixel;
    }
    const alphaFloat = pixel.a / 255 * alphaRatio;
    return {
        r: 255 + (pixel.r - 255) * alphaFloat,
        g: 255 + (pixel.g - 255) * alphaFloat,
        b: 255 + (pixel.b - 255) * alphaFloat,
        a: 255
    };
}
/**
 * Convert RGB pixel to greyscale
 *
 * @param pixel RGB pixel colour data
 * @param alphaRatio alpha channel multiplier; apply this ratio to reduce pixel alpha (lighten image)
 * @returns greyscale pixel int colour value
 */
export function greyscale(pixel, alphaRatio = 1) {
    const luminance = calcYiqY(pixel);
    const finalAlpha = 255 / pixel.a * alphaRatio;
    return Math.round(255 + (luminance - 255) * finalAlpha);
}
/**
 * Blend (premultiply) RGBA pixel with another RGBA pixel
 *
 * Blend modes:
 * * `add` - add new pixel to original pixel (brighten image)
 * * `average` - average new pixel with original pixel
 * * `max` - use brightest channel from both pixels
 *
 * @param originalPixel original pixel colour data
 * @param newPixel new pixel colour data
 * @param mode blend mode; default `average`
 * @param channels channels to blend; default all channels
 * @returns blended pixel colour data
 */
export function blend(originalPixel, newPixel, mode = 'average', channels = ['r', 'g', 'b']) {
    if (newPixel.a === 0) {
        return originalPixel;
    }
    if (newPixel.a === 255) {
        return newPixel;
    }
    const blendRatio = newPixel.a / 255;
    originalPixel = flatten(originalPixel);
    let blendR = originalPixel.r;
    let blendG = originalPixel.g;
    let blendB = originalPixel.b;
    switch (mode) {
        case 'add': {
            if (channels.includes('r')) {
                blendR = originalPixel.r + (newPixel.r - originalPixel.r) * blendRatio;
            }
            if (channels.includes('g')) {
                blendG = originalPixel.g + (newPixel.g - originalPixel.g) * blendRatio;
            }
            if (channels.includes('b')) {
                blendB = originalPixel.b + (newPixel.b - originalPixel.b) * blendRatio;
            }
            break;
        }
        case 'average': {
            if (channels.includes('r')) {
                blendR = (originalPixel.r / blendRatio + newPixel.r * blendRatio) / 2;
            }
            if (channels.includes('g')) {
                blendG = (originalPixel.g / blendRatio + newPixel.g * blendRatio) / 2;
            }
            if (channels.includes('b')) {
                blendB = (originalPixel.b / blendRatio + newPixel.b * blendRatio) / 2;
            }
            break;
        }
        case 'max': {
            if (channels.includes('r')) {
                blendR = Math.max(originalPixel.r, newPixel.r);
            }
            if (channels.includes('g')) {
                blendG = Math.max(originalPixel.g, newPixel.g);
            }
            if (channels.includes('b')) {
                blendB = Math.max(originalPixel.b, newPixel.b);
            }
            break;
        }
    }
    return {
        r: Math.max(0, Math.min(255, Math.round(blendR))),
        g: Math.max(0, Math.min(255, Math.round(blendG))),
        b: Math.max(0, Math.min(255, Math.round(blendB))),
        a: 255
    };
}
/**
 * Convert RGB pixel to YIQ (NTSC luminance/chrominance) pixel
 *
 * Alpha channel is ignored.
 *
 * @param pixel RGB pixel colour data
 * @returns YIQ pixel colour data
 */
export function yiq(pixel) {
    const y = calcYiqY(pixel);
    const i = calcYiqI(pixel);
    const q = calcYiqQ(pixel);
    return { y, i, q };
}
/**
 * Calculate YIQ luminance (Y channel) from RGB pixel
 *
 * Alpha channel is ignored.
 *
 * @param pixel RGB pixel colour data
 * @returns YIQ luminance (Y)
 */
export function calcYiqY(pixel) {
    return 0.29889531 * pixel.r + 0.58662247 * pixel.g + 0.11448223 * pixel.b;
}
/**
 * Calculate YIQ chrominance-I (I channel) from RGB pixel
 *
 * Alpha channel is ignored.
 *
 * @param pixel RGB pixel colour data
 * @returns YIQ chrominance-I (I)
 */
export function calcYiqI(pixel) {
    return 0.59597799 * pixel.r - 0.27417610 * pixel.g - 0.32180189 * pixel.b;
}
/**
 * Calculate YIQ chrominance-Q (Q channel) from RGB pixel
 *
 * Alpha channel is ignored.
 *
 * @param pixel RGB pixel colour data
 * @returns YIQ chrominance-Q (Q)
 */
export function calcYiqQ(pixel) {
    return 0.21147017 * pixel.r - 0.52261711 * pixel.g + 0.31114694 * pixel.b;
}
