/**
 * Valuemap image manipulation functions
 *
 * @module
 */
import { RgbaBitmap, RgbaPixelColor, Valuemap } from './types.js';
export type RenderValuesMatch = (number | {
    value: number | number[];
} | {
    mask: number;
    value: number;
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
 * Options for {@link rgb}
 */
export interface RenderValuesOptions {
    palette?: RenderValuesInstruction[];
}
/**
 * Render (draw) a valuemap as an RGBA image
 *
 * @param sourceImage valuemap of data to render
 * @param options rendering options
 * @returns RGBA image
 */
export declare function rgb(sourceImage: Valuemap<any>, options?: RenderValuesOptions): RgbaBitmap;
