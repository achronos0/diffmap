/**
 * general-purpose types and classes
 *
 * @module
 */
/**
 * Position of pixel in bitmap
 */
export interface Point {
    x: number;
    y: number;
}
/**
 * Typed array of raw pixel data, each pixel channel is a one-byte integer
 */
export type IntRawPixels = Uint8Array;
/**
 * Typed array of raw pixel data, each pixel channel is a floating-point number
 */
export type FloatRawPixels = Float64Array;
/**
 * Typed array of raw pixel data
 */
export type AnyRawPixels = IntRawPixels | FloatRawPixels;
/**
 * Pixel colour from an RGBA (red/green/blue/alpha) bitmap
 */
export interface RgbaPixelColor {
    r: number;
    g: number;
    b: number;
    a: number;
}
/**
 * Pixel colour from a YIQ (NTSC luminance/chrominance) image
 */
export interface YiqPixelColor {
    y: number;
    i: number;
    q: number;
}
/**
 * Any pixel colour data
 */
export type AnyPixelColor = RgbaPixelColor | YiqPixelColor | number;
/**
 * Callback function passed to {@link Image.iterateAll}
 *
 * @param data pixel position data
 * @returns return `true` to stop iteration; no further pixels are processed
 */
export type PixelIteratorFunction<RawPixels extends AnyRawPixels, PixelColor extends AnyPixelColor> = (data: PixelIteratorData<RawPixels, PixelColor>) => void | true;
/**
 * Data pased to callback function for {@link Image['iterateAll']}
 */
export interface PixelIteratorData<RawPixels extends AnyRawPixels, PixelColor extends AnyPixelColor> {
    /**
     * Index of pixel into bitmap (increases `1` per pixel)
     */
    index: number;
    /**
     * Array offset of pixel into bitmap (increases by {@link Image.channels} per pixel)
     */
    offset: number;
    /**
     * Horizontal position of pixel, counting from left (`0`) to right (`width - 1`)
     */
    x: number;
    /**
     * Vertical position of pixel, counting from top (`0`) to bottom (`height - 1`)
     */
    y: number;
    /**
     * Bitmap object being iterated
     */
    image: Image<RawPixels, PixelColor>;
}
/**
 * An in-memory raster image with any number of channels
 */
export declare abstract class Image<RawPixels extends AnyRawPixels, PixelColor extends AnyPixelColor> {
    /**
     * Width in pixels
     */
    readonly width: number;
    /**
     * Height in pixels
     */
    readonly height: number;
    /**
     * Number of colour channels
     */
    readonly channels: 1 | 3 | 4;
    /**
     * Raw pixel data
     */
    readonly pixels: RawPixels;
    /**
     * Create a new bitmap
     *
     * @param config bitmap config settings
     * @param config.width width in pixels
     * @param config.height height in pixels
     * @param config.channels number of colour channels
     * @param config.pixels raw pixel data
     */
    constructor(config: {
        width: number;
        height: number;
        channels: 1 | 3 | 4;
        pixels: RawPixels;
    });
    /**
     * Bitmap has alpha channel
     *
     * @type {boolean}
     */
    get hasAlpha(): boolean;
    /**
     * Bitmap size in bytes
     *
     * @type {UInt}
     */
    get byteLength(): number;
    /**
     * Bitmap size in pixels
     *
     * @type {UInt}
     */
    get pixelLength(): number;
    /**
     * Return index of pixel into bitmap
     *
     * @param x horizontal position of pixel
     * @param y vertical position of pixel
     * @returns index of pixel into bitmap
     */
    index(x: number, y: number): number;
    /**
     * Return array offset of pixel into bitmap
     *
     * @param x horizontal position of pixel
     * @param y vertical position of pixel
     * @returns array offset of pixel into bitmap
     */
    offset(x: number, y: number): number;
    /**
     * Return pixel coordinates from index
     *
     * @param index index of pixel into bitmap
     * @returns pixel coordinates
     */
    xyFromIndex(index: number): Point;
    /**
     * Return pixel coordinates from array offset
     *
     * @param offset array offset of pixel into bitmap
     * @returns pixel coordinates
     */
    xyFromOffset(offset: number): Point;
    /**
     * Return array offset of pixel into bitmap from index
     *
     * @param index index of pixel into bitmap
     * @returns array offset of pixel into bitmap
     */
    offsetFromIndex(index: number): number;
    /**
     * Create a copy of this bitmap
     *
     * @returns new Bitmap object
     */
    clone(): this;
    /**
     * Copy pixel data array
     *
     * @returns copy of this bitmap's pixel data
     */
    copyPixels(): AnyRawPixels;
    /**
     * Call a function for each pixel
     *
     * @param fn function to call for each pixel, return true to stop iteration
     * @returns total number of pixels iterated (if iteration completed, this will be equal to {@link pixelLength})
     */
    iterateAll(fn: PixelIteratorFunction<RawPixels, PixelColor>): number;
    /**
     * Call a function for each pixel adjacent to a target pixel
     *
     * @param x target pixel horizontal position
     * @param y target pixel vertical position
     * @param {IterateFunction} fn function to call for each pixel, return true to stop iteration
     */
    iterateAdjacent(x: number, y: number, fn: PixelIteratorFunction<RawPixels, PixelColor>): void;
    /**
     * Return colour data for pixel at array offset
     *
     * @param offset array offset of pixel into bitmap
     * @returns pixel colour data
     */
    abstract pixel(offset: number): PixelColor;
    /**
     * Set colour data for pixel at array offset
     *
     * @param offset array offset of pixel into bitmap
     * @param value pixel colour data
     */
    abstract setPixel(offset: number, value: PixelColor): void;
}
/**
 * An in-memory RGB (red/green/blue) bitmap
 */
export declare class RgbBitmap extends Image<IntRawPixels, RgbaPixelColor> {
    /**
     * Create a new empty RGB bitmap
     *
     * @param width width in pixels
     * @param height height in pixels
     * @returns new blank RGB bitmap
     */
    static create(width: number, height: number): RgbBitmap;
    /**
     * Create a new RGB bitmap
     *
     * @param config bitmap config settings
     * @param config.width width in pixels
     * @param config.height height in pixels
     * @param config.pixels raw pixel data
     */
    constructor(config: {
        width: number;
        height: number;
        pixels: IntRawPixels;
    });
    /**
     * Return colour data for pixel at array offset
     *
     * @param offset array offset of pixel into bitmap
     * @returns RGB pixel colour data
     */
    pixel(offset: number): RgbaPixelColor;
    /**
     * Set colour data for pixel at array offset
     *
     * @param offset array offset of pixel into bitmap
     * @param value RGB pixel colour data
     */
    setPixel(offset: number, value: RgbaPixelColor): void;
}
/**
 * An in-memory RGBA (red/green/blue/alpha) bitmap
 */
export declare class RgbaBitmap extends Image<IntRawPixels, RgbaPixelColor> {
    /**
     * Create a new empty RGBA bitmap
     *
     * @param width width in pixels
     * @param height height in pixels
     * @returns new blank RGBA bitmap
     */
    static create(width: number, height: number): RgbaBitmap;
    /**
     * Create a new RGBA bitmap
     *
     * @param config bitmap config settings
     * @param config.width width in pixels
     * @param config.height height in pixels
     * @param config.pixels raw pixel data
     */
    constructor(config: {
        width: number;
        height: number;
        pixels: IntRawPixels;
    });
    /**
     * Bitmap has alpha channel
     *
     * @type {boolean}
     */
    get hasAlpha(): boolean;
    /**
     * Return colour data for pixel at array offset
     *
     * @param offset array offset of pixel into bitmap
     * @returns RGBA pixel colour data
     */
    pixel(offset: number): RgbaPixelColor;
    /**
     * Set colour data for pixel at array offset
     *
     * @param offset array offset of pixel into bitmap
     * @param value RGBA pixel colour data
     */
    setPixel(offset: number, value: RgbaPixelColor): void;
}
/**
 * An in-memory RGB or RGBA bitmap
 */
export type AnyRgbBitmap = RgbBitmap | RgbaBitmap;
/**
 * An in-memory YIQ (NTSC luminance/chrominance) image using floating-point pixel colour values
 */
export declare class YiqFloatmap extends Image<FloatRawPixels, YiqPixelColor> {
    /**
     * Create a new empty YIQ image
     *
     * @param width width in pixels
     * @param height height in pixels
     * @returns new blank YIQ image
     */
    static create(width: number, height: number): YiqFloatmap;
    /**
     * Create a new YIQ bitmap
     *
     * @param config bitmap config settings
     * @param config.width width in pixels
     * @param config.height height in pixels
     * @param config.pixels raw pixel data
     */
    constructor(config: {
        width: number;
        height: number;
        pixels: FloatRawPixels;
    });
    /**
     * Return colour data for pixel at array offset
     *
     * @param offset array offset of pixel into bitmap
     * @returns YIQ pixel colour data
     */
    pixel(offset: number): YiqPixelColor;
    /**
     * Set colour data for pixel at array offset
     *
     * @param offset array offset of pixel into bitmap
     * @param value YIQ pixel colour data
     */
    setPixel(offset: number, value: YiqPixelColor): void;
}
/**
 * An in-memory single-channel image (greyscale bitmap, or bit flags, or any other single-channel data)
 */
export declare class Valuemap<RawPixels extends AnyRawPixels> extends Image<RawPixels, number> {
    /**
     * Create a new empty single-channel floating-point valuemap
     *
     * @param width width in pixels
     * @param height height in pixels
     * @returns new blank valuemap
     */
    static createFloatmap(width: number, height: number): Valuemap<FloatRawPixels>;
    /**
     * Create a new empty single-channel bitmap
     *
     * @param width width in pixels
     * @param height height in pixels
     * @returns new blank bitmap
     */
    static createIntmap(width: number, height: number): Valuemap<IntRawPixels>;
    /**
     * Create a new single-channel image (bitmap or floatmap)
     *
     * @param config bitmap config settings
     * @param config.width width in pixels
     * @param config.height height in pixels
     * @param config.pixels raw pixel data
     */
    constructor(config: {
        width: number;
        height: number;
        pixels: RawPixels;
    });
    /**
     * Return colour data for pixel at array offset
     *
     * @param offset array offset of pixel into bitmap
     * @returns greyscale pixel colour data
     */
    pixel(offset: number): number;
    /**
     * Set colour data for pixel at array offset
     *
     * @param offset array offset of pixel into bitmap
     * @param value greyscale pixel colour data
     */
    setPixel(offset: number, value: number): void;
}
/**
 * An in-memory single-channel image of bit flags for each pixel
 */
export type IntValuemap = Valuemap<IntRawPixels>;
/**
 * An in-memory single-channel image with floating-point values for each pixel
 */
export type FloatValuemap = Valuemap<FloatRawPixels>;
