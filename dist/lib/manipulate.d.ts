/**
 * image alteration functions
 *
 * @module
 */
import { Intmap, RgbImage, RgbaImage, Valuemap, YiqImage } from './image.js';
import { RgbaPixelColor } from './types.js';
/**
 * Generate a YIQ (NTSC luminance/chrominance) image from a RGB/RGBA image
 *
 * @param sourceImage RGB/RGBA image
 * @returns new YIQ image
 */
export declare function yiq(sourceImage: RgbImage | RgbaImage): YiqImage;
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
export declare function flatten(sourceImage: RgbaImage, options?: FlattenOptions): RgbImage;
/**
 * Options for {@link greyscale}
 */
export interface GreyscaleOptions {
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
 * Convert RGBA image to brightness valuemap (greyscale)
 *
 * @param sourceImage image to convert to greyscale
 * @param alphaRatio alpha channel multiplier; apply this ratio to reduce pixel alpha (lighten image)
 * @returns single-channel image with greyscale pixel values
 */
export declare function greyscale(sourceImage: RgbaImage, options?: GreyscaleOptions): Intmap;
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
export declare function blend(sourceImage: RgbaImage, blendImage: RgbaImage, options?: BlendOptions): RgbImage;
export type RenderValuesMatch = (number | {
    value: number | number[];
} | {
    mask: number;
} | {
    range: [number, number];
});
export type RenderValuesInstruction = {
    match?: RenderValuesMatch | RenderValuesMatch[];
    color?: RgbaPixelColor;
    gradient?: {
        from: RgbaPixelColor;
        to: RgbaPixelColor;
    };
};
/**
 * Options for {@link renderValues}
 */
export interface RenderValuesOptions {
    palette?: RenderValuesInstruction[];
}
/**
 * Render (draw) a valuemap as an RGBA image
 *
 * @param sourceImage valuemap of data to render
 * @param options rendering options
 * @returns RGB or RGBA image
 */
export declare function renderValues(sourceImage: Valuemap<any>, options?: RenderValuesOptions): RgbImage | RgbaImage;
