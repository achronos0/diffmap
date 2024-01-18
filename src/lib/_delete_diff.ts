/**
 * diff generation functions
 *
 * @module
 */

import {
	diffGroups,
	DiffGroupsOptions,
	DiffGroupsResult,
	DiffPixelsOptions,
	DiffPixelsResult,
	DiffStatsOptions,
	DiffStatsResult,
	RenderOptions,
	RenderOutputMapCollection,
	SignificanceOptions,
	SignificanceResult,
	diffPixels,
	diffStats,
	render,
	significance
} from './_delete_flags.js'
import { yiq as rgbToYiq } from './image-rgb.js'
import {
	AnyRgbBitmap,
	IntValuemap,
	RgbaBitmap,
	Valuemap
} from './types.js'

/**
 * Diff options accepted by all diff functions
 */
export type BaseDiffOptions = (
	DiffStatsOptions &
	DiffPixelsOptions &
	DiffGroupsOptions &
	SignificanceOptions
)

/**
 * Diff stats returned from all diff functions
 */
export type BaseDiffResult = (
	DiffStatsResult &
	DiffPixelsResult &
	DiffGroupsResult &
	SignificanceResult
)

/**
 * Options for {@link raw}
 */
export type RawDiffOptions = BaseDiffOptions

/**
 * Return value of {@link raw}
 */
export type RawDiffResult = (
	{
		flagsImage: IntValuemap
	} &
	BaseDiffResult
)

/**
 * Generate raw diff flags image
 *
 * @param sourceImage image to generate diff for
 * @param originalImage image to compare against
 * @param options diff options
 * @returns flags image and diff results
 */
export function raw (
	sourceImage: AnyRgbBitmap,
	originalImage: AnyRgbBitmap,
	options: RawDiffOptions = {}
): RawDiffResult {
	const yiqSourceImage = rgbToYiq(sourceImage)
	const yiqOriginalImage = rgbToYiq(originalImage)
	const flagsImage = Valuemap.createIntmap(yiqSourceImage.width, yiqSourceImage.height)
	const significanceResult = significance(flagsImage, yiqSourceImage, options)
	const diffPixelsResult = diffPixels(flagsImage, yiqSourceImage, yiqOriginalImage, options)
	const diffGroupsResult = diffGroups(flagsImage, options)
	const diffStatsResult = diffStats(flagsImage, diffPixelsResult, diffGroupsResult, options)
	return {
		flagsImage,
		...diffStatsResult,
		...diffPixelsResult,
		...diffGroupsResult,
		...significanceResult
	}
}

/**
 * Options for {@link rgb}
 */
export type RgbDiffOptions = (
	{
		/**
		 * Output image program name to generate
		 *
		 * Default: {@link DEFAULT_RGB_DIFF_OUTPUT}
		 */
		output?: string
	} &
	BaseDiffOptions &
	RenderOptions
)

/**
 * Default value for {@link RgbDiffOptions.output}
 */
export const DEFAULT_RGB_DIFF_OUTPUT = 'groups'

/**
 * Return value of {@link rgb}
 */
export type RgbDiffResult = (
	{
		/**
		 * Generated diff image
		 */
		resultImage: AnyRgbBitmap
	} &
	BaseDiffResult
)

/**
 * Generate image diff
 *
 * @param sourceImage image to generate diff for
 * @param originalImage image to compare against
 * @param options diff options
 * @returns
 */
export function rgb (
	sourceImage: AnyRgbBitmap,
	originalImage: AnyRgbBitmap,
	options: RgbDiffOptions = {}
): RgbDiffResult {
	const { output = DEFAULT_RGB_DIFF_OUTPUT } = options
	const result = rgbMultiple(sourceImage, originalImage, [output], options)
	const { resultImages } = result
	const resultImage = resultImages[output] as RgbaBitmap
	return { resultImage, ...result }
}

/**
 * Options for {@link rgbMultiple}
 */
export type RgbMultiDiffOptions = (
	BaseDiffOptions &
	RenderOptions
)

/**
 * Return value of {@link rgbMultiple}
 */
export type RgbMultiDiffResult = (
	{
		resultImages: RenderOutputMapCollection
	} &
	BaseDiffResult
)

/**
 * Generate image diff in multiple formats
 *
 * @param sourceImage image to generate diff for
 * @param originalImage image to compare against
 * @param outputs output images to generate; each value is the name of an output program
 * @param options diff options
 * @returns
 */
export function rgbMultiple (
	sourceImage: AnyRgbBitmap,
	originalImage: AnyRgbBitmap,
	outputs: string[],
	options: RgbMultiDiffOptions = {}
): RgbMultiDiffResult {
	const { flagsImage, ...result } = raw(sourceImage, originalImage, options)
	const resultImages = render(flagsImage, sourceImage, originalImage, outputs, options)
	return { resultImages, ...result }
}
