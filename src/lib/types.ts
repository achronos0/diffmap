/**
 * general-purpose type definitions
 *
 * @module
 */

/**
 * Position of pixel in bitmap
 */
export interface Point {
	x: number
	y: number
}

/**
 * Typed array of raw pixel data, each pixel channel is a one-byte integer
 */
export type IntRawPixels = Uint8Array

/**
 * Typed array of raw pixel data, each pixel channel is a floating-point number
 */
export type FloatRawPixels = Float64Array

/**
 * Typed array of raw pixel data
 */
export type AnyRawPixels = IntRawPixels | FloatRawPixels

/**
 * Pixel colour from an RGBA (red/green/blue/alpha) bitmap
 */
export interface RgbaPixelColor {
	r: number
	g: number
	b: number
	a: number
}

/**
 * Pixel colour from a YIQ (NTSC luminance/chrominance) image
 */
export interface YiqPixelColor {
	y: number,
	i: number,
	q: number
}

/**
 * Any pixel colour data
 */
export type AnyPixelColor = RgbaPixelColor | YiqPixelColor | number
