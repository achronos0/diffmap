/**
 * YIQ pixel manipulation functions
 *
 * @module
 */
/**
 * Convert YIQ (NTSC luminance/chrominance) pixel to RGB pixel
 *
 * Alpha channel is set to fully opaque.
 *
 * @param pixel YIQ pixel colour data
 * @returns RGB pixel colour data
 */
export function rgba(pixel) {
    const r = calcRgbR(pixel);
    const g = calcRgbG(pixel);
    const b = calcRgbB(pixel);
    return { r, g, b, a: 255 };
}
/**
 * Calculate RGB red channel from YIQ pixel
 *
 * @param pixel YIQ pixel colour data
 * @returns RGB red channel
 */
export function calcRgbR(pixel) {
    return pixel.y + 0.95629572 * pixel.i + 0.62102416 * pixel.q;
}
/**
 * Calculate RGB green channel from YIQ pixel
 *
 * @param pixel YIQ pixel colour data
 * @returns RGB green channel
 */
export function calcRgbG(pixel) {
    return pixel.y - 0.27212210 * pixel.i - 0.64738053 * pixel.q;
}
/**
 * Calculate RGB blue channel from YIQ pixel
 *
 * @param pixel YIQ pixel colour data
 * @returns RGB blue channel
 */
export function calcRgbB(pixel) {
    return pixel.y - 1.10797103 * pixel.i + 1.70461523 * pixel.q;
}
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
export function colorDistance(fromPixel, toPixel) {
    const diffY = fromPixel.y - toPixel.y;
    const diffI = fromPixel.i - toPixel.i;
    const diffQ = fromPixel.q - toPixel.q;
    if (diffY === 0 && diffI === 0 && diffQ === 0) {
        return 0;
    }
    let colorDiff = (0.5053 * diffY * diffY + 0.299 * diffI * diffI + 0.1957 * diffQ * diffQ) / 138.09803921568627;
    if (fromPixel.y > toPixel.y) {
        colorDiff = -1 * colorDiff;
    }
    return colorDiff;
}
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
export function contrast(fromPixel, toPixel) {
    return fromPixel.y - toPixel.y;
}
