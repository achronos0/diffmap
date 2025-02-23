/**
 * RGB/RGBA image manipulation functions
 *
 * @module
 */
import { AnyRgbBitmap, IntValuemap, RgbBitmap, RgbaBitmap, YiqFloatmap } from './types.js';
/**
 * Generate a YIQ (NTSC luminance/chrominance) image from a RGB/RGBA image
 *
 * @param sourceImage RGB/RGBA image
 * @returns new YIQ image
 */
export declare function yiq(sourceImage: AnyRgbBitmap): YiqFloatmap;
/**
 * Options for {@link flatten}
 */
export interface FlattenOptions {
    /**
     * Alpha channel multiplier; apply this ratio to reduce pixel alpha (lighten image)
     *
     * Range: `0` to `1`
     *
     * Default: `1`
     */
    alphaRatio?: number;
}
/**
 * Remove alpha from RGBA image by blending with white
 *
 * @param sourceImage image to flatten
 * @param options flatten options
 * @returns RGB image with alpha channel removed
 */
export declare function flatten(sourceImage: RgbaBitmap, options?: FlattenOptions): RgbBitmap;
/**
 * Options for {@link setAlpha}
 */
export interface SetAlphaOptions {
    /**
     * Alpha channel value
     *
     * Range: `0` to `255`
     *
     * Default: `255`
     */
    alpha?: number;
}
/**
 *
 * @param sourceImage image to convert to RGBA
 * @param options conversion options
 * @returns RGBA image with alpha channel set
 */
export declare function setAlpha(sourceImage: RgbBitmap, options?: SetAlphaOptions): RgbaBitmap;
/**
 * Options for {@link brightness}
 */
export interface BrightnessOptions {
    /**
     * Alpha channel multiplier; lower this ratio to reduce pixel alpha (lighten image)
     *
     * Range: `0` to `1`
     *
     * Default: `1`
     */
    alphaRatio?: number;
}
/**
 * Extract brightness values from RGBA image
 *
 * @param sourceImage image to convert to brightness values
 * @param options conversion options
 * @returns single-channel image with pixel brightness values
 */
export declare function brightness(sourceImage: RgbaBitmap, options?: BrightnessOptions): IntValuemap;
/**
 * Options for {@link greyscale}
 */
export interface GreyscaleOptions {
    /**
     * Reduce pixel alpha (lighten image) by this ratio
     *
     * Range: `0` to `1`
     *
     * Default: `0`
     */
    fade?: number;
}
/**
 * Convert RGBA image to greyscale
 *
 * @param sourceImage image to convert to greyscale
 * @param options conversion options
 * @returns greyscale RGB image
 */
export declare function greyscale(sourceImage: RgbaBitmap, options?: GreyscaleOptions): RgbaBitmap;
/**
 * Options for {@link blend}
 */
export interface BlendOptions {
    /**
     * Blend mode
     *
     * Values:
     * * `add` - add new pixel to original pixel (brighten image)
     * * `average` - average new pixel with original pixel
     * * `max` - use brightest channel from both pixels
     *
     * Default: `average`
     */
    mode?: 'add' | 'average' | 'max';
    /**
     * Channels to blend
     *
     * Default: all channels
     */
    channels?: Array<'r' | 'g' | 'b'>;
}
/**
 * Blend (premultiply) RGBA image with another RGBA image
 *
 * @param sourceImage image to blend into
 * @param blendImage image to blend into original image
 * @param options blend options
 * @returns blended RGB image
 */
export declare function blend(sourceImage: AnyRgbBitmap, blendImage: AnyRgbBitmap, options?: BlendOptions): RgbBitmap;
