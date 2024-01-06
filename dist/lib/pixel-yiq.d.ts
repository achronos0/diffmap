/**
 * YIQ pixel manipulation functions
 *
 * @module
 */
import { RgbaPixelColor, YiqPixelColor } from './types.js';
/**
 * Convert YIQ (NTSC luminance/chrominance) pixel to RGB pixel
 *
 * Alpha channel is set to fully opaque.
 *
 * @param pixel YIQ pixel colour data
 * @returns RGB pixel colour data
 */
export declare function rgba(pixel: YiqPixelColor): RgbaPixelColor;
/**
 * Calculate RGB red channel from YIQ pixel
 *
 * @param pixel YIQ pixel colour data
 * @returns RGB red channel
 */
export declare function calcRgbR(pixel: YiqPixelColor): number;
/**
 * Calculate RGB green channel from YIQ pixel
 *
 * @param pixel YIQ pixel colour data
 * @returns RGB green channel
 */
export declare function calcRgbG(pixel: YiqPixelColor): number;
/**
 * Calculate RGB blue channel from YIQ pixel
 *
 * @param pixel YIQ pixel colour data
 * @returns RGB blue channel
 */
export declare function calcRgbB(pixel: YiqPixelColor): number;
/**
 * Calculate colour difference between two pixels
 *
 * Result is a float from -255 to 255 (inclusive).
 *
 * Negative value means the changed pixel is darker.
 * Positive value means the changed pixel is lighter.
 * Zero means the pixels are identical.
 * Further from zero means the pixels are more visualy different (in brightness and/or colour).
 *
 * @param fromPixel original pixel colour data
 * @param toPixel changed pixel colour data
 * @returns colour difference between two pixels
 */
export declare function colorDistance(fromPixel: YiqPixelColor, toPixel: YiqPixelColor): number;
/**
 * Calculate brightness (luminance) difference between two pixels
 *
 * Result is a float from -255 to 255 (inclusive).
 *
 * Negative value means the changed pixel is darker.
 * Positive value means the changed pixel is lighter.
 * Zero means the pixels are the same brightness.
 * Further from zero means the pixels are more visually different in brightness.
 *
 * @param fromPixel original pixel colour data
 * @param toPixel changed pixel colour data
 * @returns brightness (luminance) difference between two pixels
 */
export declare function contrast(fromPixel: YiqPixelColor, toPixel: YiqPixelColor): number;
