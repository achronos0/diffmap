/**
 * RGB/RGBA pixel manipulation functions
 *
 * @module
 */
import { RgbaPixelColor, YiqPixelColor } from './types.js';
/**
 * Remove alpha from RGBA pixel by blending with white
 *
 * @param pixel pixel colour data
 * @param alphaRatio alpha channel multiplier; apply this ratio to reduce pixel alpha (lighten image)
 * @returns pixel colour data with alpha removed
 */
export declare function flatten(pixel: RgbaPixelColor, alphaRatio?: number): RgbaPixelColor;
/**
 * Convert RGB pixel to greyscale
 *
 * @param pixel RGB pixel colour data
 * @param alphaRatio alpha channel multiplier; apply this ratio to reduce pixel alpha (lighten image)
 * @returns greyscale pixel int colour value
 */
export declare function greyscale(pixel: RgbaPixelColor, alphaRatio?: number): number;
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
export declare function blend(originalPixel: RgbaPixelColor, newPixel: RgbaPixelColor, mode?: 'add' | 'average' | 'max', channels?: Array<'r' | 'g' | 'b'>): RgbaPixelColor;
/**
 * Convert RGB pixel to YIQ (NTSC luminance/chrominance) pixel
 *
 * Alpha channel is ignored.
 *
 * @param pixel RGB pixel colour data
 * @returns YIQ pixel colour data
 */
export declare function yiq(pixel: RgbaPixelColor): YiqPixelColor;
/**
 * Calculate YIQ luminance (Y channel) from RGB pixel
 *
 * Alpha channel is ignored.
 *
 * @param pixel RGB pixel colour data
 * @returns YIQ luminance (Y)
 */
export declare function calcYiqY(pixel: RgbaPixelColor): number;
/**
 * Calculate YIQ chrominance-I (I channel) from RGB pixel
 *
 * Alpha channel is ignored.
 *
 * @param pixel RGB pixel colour data
 * @returns YIQ chrominance-I (I)
 */
export declare function calcYiqI(pixel: RgbaPixelColor): number;
/**
 * Calculate YIQ chrominance-Q (Q channel) from RGB pixel
 *
 * Alpha channel is ignored.
 *
 * @param pixel RGB pixel colour data
 * @returns YIQ chrominance-Q (Q)
 */
export declare function calcYiqQ(pixel: RgbaPixelColor): number;
