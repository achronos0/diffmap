/**
 * image classes
 *
 * @module
 */
/**
 * An in-memory raster image (a bitmap) with any number of channels
 */
export class Image {
    /**
     * Create a new bitmap
     *
     * @param config bitmap config settings
     * @param config.width width in pixels
     * @param config.height height in pixels
     * @param config.channels number of colour channels
     * @param config.pixels raw pixel data
     */
    constructor(config) {
        this.width = config.width;
        this.height = config.height;
        this.channels = config.channels;
        this.pixels = config.pixels;
    }
    /**
     * Bitmap has alpha channel
     *
     * @type {boolean}
     */
    get hasAlpha() {
        return false;
    }
    /**
     * Bitmap size in bytes
     *
     * @type {UInt}
     */
    get byteLength() {
        return this.channels * this.pixelLength;
    }
    /**
     * Bitmap size in pixels
     *
     * @type {UInt}
     */
    get pixelLength() {
        return this.width * this.height;
    }
    /**
     * Return index of pixel into bitmap
     *
     * @param x horizontal position of pixel
     * @param y vertical position of pixel
     * @returns index of pixel into bitmap
     */
    index(x, y) {
        return y * this.width + x;
    }
    /**
     * Return array offset of pixel into bitmap
     *
     * @param x horizontal position of pixel
     * @param y vertical position of pixel
     * @returns array offset of pixel into bitmap
     */
    offset(x, y) {
        return this.index(x, y) * this.channels;
    }
    /**
     * Return pixel coordinates from index
     *
     * @param index index of pixel into bitmap
     * @returns pixel coordinates
     */
    xyFromIndex(index) {
        const x = index % this.width;
        const y = Math.floor(index / this.width);
        return { x, y };
    }
    /**
     * Return pixel coordinates from array offset
     *
     * @param offset array offset of pixel into bitmap
     * @returns pixel coordinates
     */
    xyFromOffset(offset) {
        return this.xyFromIndex(offset / this.channels);
    }
    /**
     * Create a copy of this bitmap
     *
     * @returns new Bitmap object
     */
    clone() {
        return new this.constructor({
            width: this.width,
            height: this.height,
            channels: this.channels,
            pixels: this.copyPixels()
        });
    }
    /**
     * Copy pixel data array
     *
     * @returns copy of this bitmap's pixel data
     */
    copyPixels() {
        if (this.pixels instanceof Uint8Array) {
            return new Uint8Array(this.pixels.buffer.slice(0));
        }
        return new Float64Array(this.pixels.buffer.slice(0));
    }
    /**
     * Call a function for each pixel
     *
     * @param fn function to call for each pixel, return true to stop iteration
     * @returns total number of pixels iterated (if iteration completed, this will be equal to {@link pixelLength})
     */
    iterateAll(fn) {
        let index = 0;
        let offset = 0;
        for (let posY = 0; posY < this.height; posY++) {
            for (let posX = 0; posX < this.width; posX++) {
                const data = {
                    index,
                    offset,
                    x: posX,
                    y: posY,
                    image: this
                };
                if (fn(data)) {
                    return offset;
                }
                index++;
                offset += this.channels;
            }
        }
        return index;
    }
    /**
     * Call a function for each pixel adjacent to a target pixel
     *
     * @param x target pixel horizontal position
     * @param y target pixel vertical position
     * @param {IterateFunction} fn function to call for each pixel, return true to stop iteration
     */
    iterateAdjacent(x, y, fn) {
        const width = this.width;
        const height = this.height;
        const maxX = x + 1;
        const maxY = y + 1;
        for (let posY = y - 1; posY <= maxY; posY += 2) {
            if (posY > 0 && posY < height) {
                for (let posX = x - 1; posX <= maxX; posX += 2) {
                    if (posX > 0 && posX < width) {
                        const index = this.index(posX, posY);
                        const offset = this.offset(posX, posY);
                        const data = {
                            index,
                            offset,
                            x: posX,
                            y: posY,
                            image: this
                        };
                        if (fn(data)) {
                            return;
                        }
                    }
                }
            }
        }
    }
}
/**
 * An in-memory RGB (red/green/blue) bitmap
 */
export class RgbImage extends Image {
    /**
     * Create a new empty RGB bitmap
     *
     * @param width width in pixels
     * @param height height in pixels
     * @returns new blank RGB bitmap
     */
    static create(width, height) {
        return new RgbImage({
            width,
            height,
            pixels: new Uint8Array(width * height * 3)
        });
    }
    /**
     * Create a new RGB bitmap
     *
     * @param config bitmap config settings
     * @param config.width width in pixels
     * @param config.height height in pixels
     * @param config.pixels raw pixel data
     */
    constructor(config) {
        super({
            width: config.width,
            height: config.height,
            channels: 3,
            pixels: config.pixels
        });
    }
    /**
     * Return colour data for pixel at array offset
     *
     * @param offset array offset of pixel into bitmap
     * @returns RGB pixel colour data
     */
    pixel(offset) {
        return {
            r: this.pixels[offset],
            g: this.pixels[offset + 1],
            b: this.pixels[offset + 2],
            a: 255
        };
    }
    /**
     * Set colour data for pixel at array offset
     *
     * @param offset array offset of pixel into bitmap
     * @param value RGB pixel colour data
     */
    setPixel(offset, value) {
        this.pixels[offset] = value.r;
        this.pixels[offset + 1] = value.g;
        this.pixels[offset + 2] = value.b;
        // ignore alpha
    }
}
/**
 * An in-memory RGBA (red/green/blue/alpha) bitmap
 */
export class RgbaImage extends Image {
    /**
     * Create a new empty RGBA bitmap
     *
     * @param width width in pixels
     * @param height height in pixels
     * @returns new blank RGBA bitmap
     */
    static create(width, height) {
        return new RgbaImage({
            width,
            height,
            pixels: new Uint8Array(width * height * 4)
        });
    }
    /**
     * Create a new RGBA bitmap
     *
     * @param config bitmap config settings
     * @param config.width width in pixels
     * @param config.height height in pixels
     * @param config.pixels raw pixel data
     */
    constructor(config) {
        super({
            width: config.width,
            height: config.height,
            channels: 4,
            pixels: config.pixels
        });
    }
    /**
     * Bitmap has alpha channel
     *
     * @type {boolean}
     */
    get hasAlpha() {
        return true;
    }
    /**
     * Return colour data for pixel at array offset
     *
     * @param offset array offset of pixel into bitmap
     * @returns RGBA pixel colour data
     */
    pixel(offset) {
        return {
            r: this.pixels[offset],
            g: this.pixels[offset + 1],
            b: this.pixels[offset + 2],
            a: this.pixels[offset + 3]
        };
    }
    /**
     * Set colour data for pixel at array offset
     *
     * @param offset array offset of pixel into bitmap
     * @param value RGBA pixel colour data
     */
    setPixel(offset, value) {
        this.pixels[offset] = value.r;
        this.pixels[offset + 1] = value.g;
        this.pixels[offset + 2] = value.b;
        this.pixels[offset + 3] = value.a;
    }
}
/**
 * An in-memory YIQ (NTSC luminance/chrominance) image using floating-point pixel colour values
 */
export class YiqImage extends Image {
    /**
     * Create a new empty YIQ image
     *
     * @param width width in pixels
     * @param height height in pixels
     * @returns new blank YIQ image
     */
    static create(width, height) {
        return new YiqImage({
            width,
            height,
            pixels: new Float64Array(width * height * 3)
        });
    }
    /**
     * Create a new YIQ bitmap
     *
     * @param config bitmap config settings
     * @param config.width width in pixels
     * @param config.height height in pixels
     * @param config.pixels raw pixel data
     */
    constructor(config) {
        super({
            width: config.width,
            height: config.height,
            channels: 3,
            pixels: config.pixels
        });
    }
    /**
     * Return colour data for pixel at array offset
     *
     * @param offset array offset of pixel into bitmap
     * @returns YIQ pixel colour data
     */
    pixel(offset) {
        return {
            y: this.pixels[offset],
            i: this.pixels[offset + 1],
            q: this.pixels[offset + 2]
        };
    }
    /**
     * Set colour data for pixel at array offset
     *
     * @param offset array offset of pixel into bitmap
     * @param value YIQ pixel colour data
     */
    setPixel(offset, value) {
        this.pixels[offset] = value.y;
        this.pixels[offset + 1] = value.i;
        this.pixels[offset + 2] = value.q;
    }
}
/**
 * An in-memory single-channel image (greyscale bitmap, or bit flags, or any other single-channel data)
 */
export class Valuemap extends Image {
    /**
     * Create a new empty single-channel floating-point valuemap
     *
     * @param width width in pixels
     * @param height height in pixels
     * @returns new blank valuemap
     */
    static createFloatmap(width, height) {
        return new Valuemap({
            width,
            height,
            pixels: new Float64Array(width * height)
        });
    }
    /**
     * Create a new empty single-channel bitmap
     *
     * @param width width in pixels
     * @param height height in pixels
     * @returns new blank bitmap
     */
    static createIntmap(width, height) {
        return new Valuemap({
            width,
            height,
            pixels: new Uint8Array(width * height)
        });
    }
    /**
     * Create a new single-channel image (bitmap or floatmap)
     *
     * @param config bitmap config settings
     * @param config.width width in pixels
     * @param config.height height in pixels
     * @param config.pixels raw pixel data
     */
    constructor(config) {
        super({
            width: config.width,
            height: config.height,
            channels: 1,
            pixels: config.pixels
        });
    }
    /**
     * Return colour data for pixel at array offset
     *
     * @param offset array offset of pixel into bitmap
     * @returns greyscale pixel colour data
     */
    pixel(offset) {
        return this.pixels[offset];
    }
    /**
     * Set colour data for pixel at array offset
     *
     * @param offset array offset of pixel into bitmap
     * @param value greyscale pixel colour data
     */
    setPixel(offset, value) {
        this.pixels[offset] = value;
    }
}
