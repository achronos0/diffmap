/**
 * RGB/RGBA image manipulation functions
 *
 * @module
 */

import { rgb as valuesToRgb } from './image-value.js'
import {
	blend as blendPixel,
	flatten as flattenPixel,
	greyscale as greyscalePixel,
	yiq as yiqPixel
} from './pixel-rgb.js'
import {
	AnyRgbBitmap,
	IntValuemap,
	RgbBitmap,
	RgbaBitmap,
	Valuemap,
	YiqFloatmap
} from './types.js'

/**
 * Generate a YIQ (NTSC luminance/chrominance) image from a RGB/RGBA image
 *
 * @param sourceImage RGB/RGBA image
 * @returns new YIQ image
 */
export function yiq (sourceImage: AnyRgbBitmap): YiqFloatmap {
	const yiqImage = new YiqFloatmap({
		width: sourceImage.width,
		height: sourceImage.height,
		pixels: new Float64Array(sourceImage.byteLength)
	})
	sourceImage.iterateAll(({ index, offset }) => {
		const sourcePixel = sourceImage.pixel(offset)
		const calcYiqPixel = yiqPixel(sourcePixel)
		const yiqOffset = yiqImage.offsetFromIndex(index)
		yiqImage.setPixel(yiqOffset, calcYiqPixel)
	})
	return yiqImage
}

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
	alphaRatio?: number
}

/**
 * Remove alpha from RGBA image by blending with white
 *
 * @param sourceImage image to flatten
 * @param options flatten options
 * @returns RGB image with alpha channel removed
 */
export function flatten (sourceImage: RgbaBitmap, options: FlattenOptions = {}): RgbBitmap {
	const {
		alphaRatio = 1
	} = options
	const resultImage = RgbBitmap.create(sourceImage.width, sourceImage.height)
	sourceImage.iterateAll(({ index, offset }) => {
		const sourcePixel = sourceImage.pixel(offset)
		const resultPixel = flattenPixel(sourcePixel, alphaRatio)
		const resultOffset = resultImage.offsetFromIndex(index)
		resultImage.setPixel(resultOffset, resultPixel)
	})
	return resultImage
}

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
	alphaRatio?: number
}

/**
 * Extract brightness values from RGBA image
 *
 * @param sourceImage image to convert to brightness values
 * @param options conversion options
 * @returns single-channel image with pixel brightness values
 */
export function brightness (sourceImage: RgbaBitmap, options: BrightnessOptions = {}): IntValuemap {
	const {
		alphaRatio = 1
	} = options
	const resultImage = Valuemap.createIntmap(sourceImage.width, sourceImage.height)
	sourceImage.iterateAll(({ index, offset }) => {
		const pixel = sourceImage.pixel(offset)
		const resultPixel = greyscalePixel(pixel, alphaRatio)
		resultImage.setPixel(index, resultPixel)
	})
	return resultImage
}

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
	fade?: number
}

/**
 * Convert RGBA image to greyscale
 *
 * @param sourceImage image to convert to greyscale
 * @param options conversion options
 * @returns greyscale RGB image
 */
export function greyscale (sourceImage: RgbaBitmap, options: GreyscaleOptions = {}): RgbaBitmap {
	const { fade = 0 } = options
	const alphaRatio = 1 - fade
	const values = brightness(sourceImage, { alphaRatio })
	return valuesToRgb(values)
}

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
	mode?: 'add' | 'average' | 'max'
	/**
	 * Channels to blend
	 *
	 * Default: all channels
	 */
	channels?: Array<'r' | 'g' | 'b'>
}

/**
 * Blend (premultiply) RGBA image with another RGBA image
 *
 * @param sourceImage image to blend into
 * @param blendImage image to blend into original image
 * @param options blend options
 * @returns blended RGB image
 */
export function blend (sourceImage: RgbaBitmap, blendImage: RgbaBitmap, options: BlendOptions = {}): RgbBitmap {
	const {
		mode = 'average',
		channels = ['r', 'g', 'b']
	} = options
	if (sourceImage.width !== blendImage.width || sourceImage.height !== blendImage.height) {
		throw new Error('originalImage is not the same size as newImage')
	}
	const resultImage = RgbBitmap.create(sourceImage.width, sourceImage.height)
	sourceImage.iterateAll(({ index, offset }) => {
		const originalPixel = sourceImage.pixel(offset)
		const newPixel = blendImage.pixel(offset)
		const resultPixel = blendPixel(originalPixel, newPixel, mode, channels)
		const resultOffset = resultImage.offsetFromIndex(index)
		resultImage.setPixel(resultOffset, resultPixel)
	})
	return resultImage
}
