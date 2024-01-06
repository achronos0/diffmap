/**
 * Image generation functions
 *
 * @module
 */

import {
	AbsBox,
	boxIntersect,
	fitBox
} from './box.js'
import {
	Intmap,
	Floatmap,
	RgbImage,
	RgbaImage,
	Valuemap,
	YiqImage
} from './image.js'
import {
	blend,
	flatten,
	greyscale,
	renderValues,
	yiq
} from './manipulate.js'
import {
	colorDistance,
	contrast
} from './pixel-yiq.js'

/**
 * Category flag for pixel significance: is foreground, i.e. important content
 */
export const FLAG_SGN_FOREGROUND = 1
/**
 * Category flag for pixel significance: is background, i.e. unimportant content
 */
export const FLAG_SGN_BACKGROUND = 2
/**
 * Category flag for pixel significance: is antialias, i.e. ignored content
 */
export const FLAG_SGN_ANTIALIAS = 4
/**
 * Category flag for pixel diff: is identical to original
 */
export const FLAG_DIFF_IDENTICAL = 8
/**
 * Category flag for pixel diff: is similar to original
 */
export const FLAG_DIFF_SIMILAR = 16
/**
 * Category flag for pixel diff: is different from original
 */
export const FLAG_DIFF_DIFFERENT = 32
/**
 * Category flag for pixel group: is a diff group fill pixel
 */
export const FLAG_GROUP_FILL = 64
/**
 * Category flag for pixel group: is a diff group border pixel
 */
export const FLAG_GROUP_BORDER = 128

/**
 * Options for {@link significance}
 */
export interface SignificanceOptions {
	/**
	 * Valuemap to store max colour distance for each pixel (compared to surrounding pixels)
	 */
	maxDistanceImage?: Floatmap
	/**
	 * Valuemap to store max contrast for each pixel (compared to surrounding pixels)
	 */
	maxContrastImage?: Floatmap
	/**
	 * Minimum colour distance for a pixel to be considered antialiasing
	 *
	 * Lower values match more pixels as antialias.
	 *
	 * Range: `0` to `255`
	 *
	 * Default: {@link DEFAULT_ANTIALIAS_MIN_DISTANCE}
	 */
	antialiasMinDistance?: number
	/**
	 * Maximum colour distance for a pixel to be considered antialiasing
	 *
	 * Higher values match more pixels as antialias (ignored content).
	 *
	 * Range: `0` to `255`
	 *
	 * Default: {@link DEFAULT_ANTIALIAS_MAX_DISTANCE}
	 */
	antialiasMaxDistance?: number
	/**
	 * Maximum contrast for a pixel to be considered background.
	 *
	 * Higher values match more pixels as background, i.e. unimportant content.
	 * Lower values match more pixels as foreground, i.e. important content.
	 *
	 * Range: `0` to `255`
	 *
	 * Default: {@link DEFAULT_BACKGROUND_MAX_CONTRAST}
	 */
	backgroundMaxContrast?: number
}

/**
 * Default minimum colour distance for a pixel to be considered antialiasing, for {@link significance}
 */
export const DEFAULT_ANTIALIAS_MIN_DISTANCE = 12

/**
 * Default maximum colour distance for a pixel to be considered antialiasing, for {@link significance}
 */
export const DEFAULT_ANTIALIAS_MAX_DISTANCE = 150

/**
 * Default maximum contrast for a pixel to be considered background, for {@link significance}
 */
export const DEFAULT_BACKGROUND_MAX_CONTRAST = 25

/**
 * Return value of {@link significance}
 */
export interface SignificanceResult {
	/**
	 * Number of pixels in image that are antialias (ignored content)
	 */
	countPixelsAntialias: number
	/**
	 * Number of pixels in image that are background, i.e. unimportant content
	 */
	countPixelsBackground: number
	/**
	 * Number of pixels in image that are foreground, i.e. important content
	 */
	countPixelsForeground: number
}

/**
 * Generate pixel significance from a YIQ image
 *
 * Optionally also generate max colour distance and max contrast maps.
 *
 * @param sourceImage YIQ image to generate stats from
 * @param flagsImage valuemap to store pixel category flags
 * @param options generation options
 * @returns pixel category stats
 */
export function significance (sourceImage: YiqImage, flagsImage: Intmap, options: SignificanceOptions = {}): SignificanceResult {
	const {
		maxDistanceImage = null,
		maxContrastImage = null,
		antialiasMinDistance = DEFAULT_ANTIALIAS_MIN_DISTANCE,
		antialiasMaxDistance = DEFAULT_ANTIALIAS_MAX_DISTANCE,
		backgroundMaxContrast = DEFAULT_BACKGROUND_MAX_CONTRAST
	} = options
	if (flagsImage.width !== sourceImage.width || flagsImage.height !== sourceImage.height) {
		throw new Error('flagsImage is not the same size as sourceImage')
	}
	if (maxDistanceImage && (maxDistanceImage.width !== sourceImage.width || maxDistanceImage.height !== sourceImage.height)) {
		throw new Error('maxDistanceImage is not the same size as sourceImage')
	}
	if (maxContrastImage && (maxContrastImage.width !== sourceImage.width || maxContrastImage.height !== sourceImage.height)) {
		throw new Error('maxContrastImage is not the same size as sourceImage')
	}
	const results: SignificanceResult = {
		countPixelsAntialias: 0,
		countPixelsBackground: 0,
		countPixelsForeground: 0
	}
	sourceImage.iterateAll(({ offset, x, y }) => {
		const pixel = sourceImage.pixel(offset)
		let flags = flagsImage.pixel(offset)

		// Calc pixel stats
		let maxDistance = 0
		let maxContrast = 0
		let countEqual = 0
		sourceImage.iterateAdjacent(x, y, ({ offset: adjacentOffset }) => {
			const adjacentPixel = sourceImage.pixel(adjacentOffset)
			const calcDistance = Math.abs(colorDistance(pixel, adjacentPixel))
			if (calcDistance) {
				if (calcDistance > maxDistance) {
					maxDistance = calcDistance
				}
				const calcContrast = Math.abs(contrast(pixel, adjacentPixel))
				if (calcContrast > maxContrast) {
					maxContrast = calcContrast
				}
			}
			else {
				countEqual++
			}
		})

		// Fill distance/contrast maps
		if (maxDistanceImage) {
			maxDistanceImage.setPixel(offset, maxDistance)
		}
		if (maxContrastImage) {
			maxContrastImage.setPixel(offset, maxContrast)
		}

		// Determine pixel significance category
		if (
			countEqual < 3 &&
			maxDistance >= antialiasMinDistance &&
			maxDistance <= antialiasMaxDistance &&
			maxContrast >= antialiasMinDistance &&
			maxContrast <= antialiasMaxDistance
		) {
			// Pixel is antialias
			results.countPixelsAntialias++
			flags |= FLAG_SGN_ANTIALIAS
		}
		else if (maxContrast <= backgroundMaxContrast) {
			// Pixel is background
			results.countPixelsBackground++
			flags |= FLAG_SGN_BACKGROUND
		}
		else {
			// Pixel is foreground
			results.countPixelsForeground++
			flags |= FLAG_SGN_FOREGROUND
		}

		flagsImage.setPixel(offset, flags)
	})
	return results
}

/**
 * Options for {@link diffPixels}
 */
export interface DiffPixelsOptions {
	/**
	 * Minimum colour distance for a pixel to be considered different, compared to original
	 *
	 * Range: `0` to `255`
	 *
	 * Default: {@link DEFAULT_DIFF_MIN_DISTANCE}
	 */
	diffMinDistance?: number
	/**
	 * Calculate diff for antialias pixels
	 *
	 * By default, antialias pixels are ignored.
	 */
	includeAntialias?: boolean
	/**
	 * Calculate diff for background pixels
	 *
	 * By default, background pixels are ignored.
	 */
	includeBackground?: boolean
}

/**
 * Default minimum colour distance for a pixel to be considered different, compared to original; for {@link diffPixels}
 */
export const DEFAULT_DIFF_MIN_DISTANCE = 40

/**
 * Return value of {@link diffPixels}
 */
export interface DiffPixelsResult {
	/**
	 * Number of pixels in image that were compared to original
	 */
	countPixelsCompared: number
	/**
	 * Number of pixels in image that are identical to original
	 */
	countPixelsIdentical: number
	/**
	 * Number of pixels in image that are close in colour, compared to original
	 */
	countPixelsSimilar: number
	/**
	 * Number of pixels in image that are notably different in colour compared to original
	 */
	countPixelsDifferent: number
}

/**
 * Generate image diff from two YIQ images
 *
 * @param changedImage YIQ image to generate diff for
 * @param originalImage YIQ image to compare against
 * @param flagsImage valuemap to store pixel category flags of changed image
 * @param options generation options
 * @returns diff pixel stats
 */
export function diffPixels (changedImage: YiqImage, originalImage: YiqImage, flagsImage: Intmap, options: DiffPixelsOptions = {}): DiffPixelsResult {
	if (originalImage.width !== changedImage.width || originalImage.height !== changedImage.height) {
		throw new Error('changedImage is not the same size as changedImage')
	}
	const {
		diffMinDistance = DEFAULT_DIFF_MIN_DISTANCE,
		includeAntialias = false,
		includeBackground = false
	} = options
	if (flagsImage.width !== changedImage.width || flagsImage.height !== changedImage.height) {
		throw new Error('flagsImage is not the same size as changedImage')
	}
	const results: DiffPixelsResult = {
		countPixelsCompared: 0,
		countPixelsIdentical: 0,
		countPixelsSimilar: 0,
		countPixelsDifferent: 0
	}
	changedImage.iterateAll(({ offset }) => {
		let flags = flagsImage.pixel(offset)
		if (
			((flags & FLAG_SGN_ANTIALIAS) && !includeAntialias) ||
			((flags & FLAG_SGN_BACKGROUND) && !includeBackground)
		) {
			return
		}
		const pixel = changedImage.pixel(offset)
		const originalPixel = originalImage.pixel(offset)
		const calcDistance = Math.abs(colorDistance(pixel, originalPixel))
		results.countPixelsCompared++
		if (calcDistance) {
			if (calcDistance >= diffMinDistance) {
				results.countPixelsDifferent++
				flags |= FLAG_DIFF_DIFFERENT
			}
			else {
				results.countPixelsSimilar++
				flags |= FLAG_DIFF_SIMILAR
			}
		}
		else {
			results.countPixelsIdentical++
			flags |= FLAG_DIFF_IDENTICAL
		}
		flagsImage.setPixel(offset, flags)
	})
	return results
}

/**
 * Options for {@link diffGroups}
 */
export interface DiffGroupsOptions {
	/**
	 * Group diff pixels that are this many pixels apart or closer
	 *
	 * Default: {@link DEFAULT_GROUP_MERGE_MAX_GAP_SIZE}
	 */
	groupMergeMaxGapSize?: number
	/**
	 * Thickness (in pixels) of border to draw around each diff group
	 *
	 * Default: {@link DEFAULT_DIFF_GROUP_BORDER_SIZE}
	 */
	groupBorderSize?: number
	/**
	 * Grow each diff group by this many pixels
	 *
	 * Default: {@link DEFAULT_DIFF_GROUP_PADDING_SIZE}
	 */
	groupPaddingSize?: number
}

/**
 * Default maximum gap between diff pixels in group, for {@link diffGroups}
 */
export const DEFAULT_GROUP_MERGE_MAX_GAP_SIZE = 80

/**
 * Default thickness of border to draw around each diff group, for {@link diffGroups}
 */
export const DEFAULT_DIFF_GROUP_BORDER_SIZE = 15

/**
 * Default number of pixels to grow each diff group by, for {@link diffGroups}
 */
export const DEFAULT_DIFF_GROUP_PADDING_SIZE = 80

/**
 * Return value of {@link diffGroups}
 */
export interface DiffGroupsResult {
	/**
	 * Diff groups
	 */
	groups: AbsBox[],
	/**
	 * Number of pixels in image that are part of a diff group
	 */
	countPixelsDiffGroup: number
}

/**
 * Generate diff groups from diff pixels
 *
 * @param flagsImage valuemap to store pixel category flags of changed image
 * @param options generation options
 * @returns diff group stats
 */
export function diffGroups (flagsImage: Intmap, options: DiffGroupsOptions = {}): DiffGroupsResult {
	const {
		groupMergeMaxGapSize = DEFAULT_GROUP_MERGE_MAX_GAP_SIZE,
		groupBorderSize = DEFAULT_DIFF_GROUP_BORDER_SIZE,
		groupPaddingSize = DEFAULT_DIFF_GROUP_PADDING_SIZE
	} = options
	let groups: AbsBox[] = []
	for (let currentY = 0; currentY < flagsImage.height; currentY++) {
		for (let currentX = 0; currentX < flagsImage.width; currentX++) {
			const offset = flagsImage.offset(currentX, currentY)
			const flags = flagsImage.pixel(offset)
			if (!(flags & FLAG_DIFF_DIFFERENT)) {
				continue
			}

			// Find existing group to merge into
			let foundGroup = false
			for (let i = 0; i < groups.length; i++) {
				const group = groups[i]
				if (
					currentX >= group.left - groupMergeMaxGapSize &&
					currentX <= group.right + groupMergeMaxGapSize &&
					currentY >= group.top - groupMergeMaxGapSize &&
					currentY <= group.bottom + groupMergeMaxGapSize
				) {
					if (currentX < group.left) {
						group.left = currentX
					}
					if (currentX > group.right) {
						group.right = currentX
					}
					if (currentY < group.top) {
						group.top = currentY
					}
					if (currentY > group.bottom) {
						group.bottom = currentY
					}
					foundGroup = true
					break
				}
			}
			if (foundGroup) {
				continue
			}

			// Create new group
			const group: AbsBox = {
				left: currentX,
				top: currentY,
				right: currentX,
				bottom: currentY
			}
			groups.push(group)
		}
	}

	// Grow groups by padding size
	if (groupPaddingSize) {
		groups = groups.map(group => fitBox(flagsImage.width, flagsImage.height, group, groupPaddingSize))
	}

	// Merge overlapping groups
	groups = groups.reduce((mergedGroups, group) => {
		let foundGroup = false
		for (let i = 0; i < mergedGroups.length; i++) {
			const mergedGroup = mergedGroups[i]
			if (boxIntersect(group, mergedGroup)) {
				if (group.left < mergedGroup.left) {
					mergedGroup.left = group.left
				}
				if (group.right > mergedGroup.right) {
					mergedGroup.right = group.right
				}
				if (group.top < mergedGroup.top) {
					mergedGroup.top = group.top
				}
				if (group.bottom > mergedGroup.bottom) {
					mergedGroup.bottom = group.bottom
				}
				foundGroup = true
				break
			}
		}
		if (!foundGroup) {
			mergedGroups.push(group)
		}
		return mergedGroups
	}, [] as AbsBox[])

	// Draw groups onto flags image
	let countPixelsDiffGroup = 0
	for (const group of groups) {
		countPixelsDiffGroup += (group.right - group.left + 1) * (group.bottom - group.top + 1)
		for (let y = group.top; y <= group.bottom; y++) {
			for (let x = group.left; x <= group.right; x++) {
				const flag =
					y < group.top + groupBorderSize ||
					y > group.bottom - groupBorderSize ||
					x < group.left + groupBorderSize ||
					x > group.right - groupBorderSize
						? FLAG_GROUP_BORDER
						: FLAG_GROUP_FILL
				const offset = flagsImage.offset(x, y)
				let pixel = flagsImage.pixel(offset)
				pixel |= flag
				flagsImage.setPixel(offset, pixel)
			}
		}
	}

	return {
		groups,
		countPixelsDiffGroup
	}
}

/**
 * Options for {@link diffStats}
 */
export interface DiffStatsOptions {
	/**
	 * Minimum percentage of diff pixels for comparison to be considered a mismatch
	 *
	 * A mismatch means the images being compared are so different that they are probably not based on the same image.
	 *
	 * Range: `0` to `100`
	 *
	 * Default: {@link DEFAULT_MISMATCH_MIN_PERCENT}
	 */
	mismatchMinPercent?: number
}

/**
 * Default minimum percentage of diff pixels for comparison to be considered a mismatch, for {@link diffStats}
 */
export const DEFAULT_MISMATCH_MIN_PERCENT = 50

/**
 * Return value of {@link diffStats}
 */
export interface DiffStatsResult {
	/**
	 * Overall result of diff comparison
	 *
	 * * `identical`: all pixels are identical
	 * * `similar`: all pixels are similar, but images are not identical
	 * * `different`: images are notably different
	 * * `mismatch`: images are so different that they are probably not based on the same image
	 */
	diffStatus: 'identical' | 'similar' | 'different' | 'mismatch'
	/**
	 * Total number of pixels in image
	 */
	countPixelsAll: number
	/**
	 * Percentage of pixels in image that are notably different in colour compared to original
	 */
	percentDiffPixels: number
	/**
	 * Percentage of pixels in image that are part of a diff group
	 */
	percentDiffGroup: number
}

/**
 * Generate diff stats from diff pixels and diff groups
 *
 * @param flagsImage valuemap of pixel category flags
 * @param diffPixelsResult result of {@link diffPixels}
 * @param diffGroupsResult result of {@link diffGroups}
 * @param options generation options
 * @returns overall diff stats
 */
export function diffStats (
	flagsImage: Intmap,
	diffPixelsResult: DiffPixelsResult,
	diffGroupsResult: DiffGroupsResult,
	options: DiffStatsOptions
): DiffStatsResult {
	const {
		mismatchMinPercent = DEFAULT_MISMATCH_MIN_PERCENT
	} = options
	const {
		countPixelsCompared,
		countPixelsSimilar,
		countPixelsDifferent
	} = diffPixelsResult
	const {
		countPixelsDiffGroup
	} = diffGroupsResult
	const countPixelsAll = flagsImage.width * flagsImage.height
	const percentDiffPixels = countPixelsDifferent / countPixelsCompared * 100
	const percentDiffGroup = countPixelsDiffGroup / countPixelsAll * 100

	let diffStatus: DiffStatsResult['diffStatus']
	if (countPixelsDifferent) {
		if (percentDiffPixels >= mismatchMinPercent) {
			diffStatus = 'mismatch'
		}
		else {
			diffStatus = 'different'
		}
	}
	else {
		if (countPixelsSimilar) {
			diffStatus = 'similar'
		}
		else {
			diffStatus = 'identical'
		}
	}

	const results: DiffStatsResult = {
		diffStatus,
		countPixelsAll,
		percentDiffPixels,
		percentDiffGroup
	}
	return results
}

/**
 * Image generation instruction for {@link output}
 */
export interface OutputInstruction {
	output: string,
	op: string,
	source: string,
	source2?: string,
	options?: Record<string, any>
}

export interface OutputProgram {
	defaultOptions?: Record<string, any>
	steps: OutputInstruction[]
	layers: string[]
}

/**
 * Options for {@link output}
 */
export interface OutputOptions {
	/**
	 * Preset name or output instructions
	 */
	output?: string | OutputProgram
	/**
	 * Output preset instructions
	 */
	presets?: Record<string, OutputProgram>
	/**
	 * If provided, object is populated with generated maps
	 *
	 * Pre-populated maps are used as inputs for output instructions, and generated maps are added to the object.
	 */
	maps?: Record<string, Floatmap | Intmap | RgbImage | RgbaImage>
	/**
	 * Options used by output instructions
	 */
	outputOptions?: Record<string, any>
}

/**
 * Default output presets for {@link output}
 */
export const DEFAULT_OUTPUT_PRESETS: Record<string, OutputProgram> = {
	greyscale: {
		defaultOptions: {
			fade: 0.2
		},
		steps: [
			{
				output: 'greyscaleValues',
				op: 'greyscale',
				source: 'changed',
				options: {
					alphaRatio: '@@fade'
				},
			},
			{
				output: 'greyscaleImage',
				op: 'renderValues',
				source: 'greyscaleValues',
			},
			{
				output: 'diffGroups',
				op: 'renderValues',
				source: 'flags',
				options: {
					palette: [
						{
							match: {
								mask: FLAG_GROUP_BORDER
							},
							color: { r: 255, g: 0, b: 0, a: 255 }
						},
						{
							match: {
								mask: FLAG_GROUP_FILL
							},
							color: { r: 255, g: 0, b: 255, a: 128 }
						},
					]
				}
			}
		],
		layers: ['greyscaleImage', 'diffGroups']
	}
}

/**
 *
 * @param changedImage image to generate diff for
 * @param originalImage image to compare against
 * @param flagsImage valuemap of pixel category flags
 * @param options output options
 * @returns output image and generated data
 */
export function output (
	changedImage: RgbImage | RgbaImage,
	originalImage: RgbImage | RgbaImage,
	flagsImage: Intmap,
	options: OutputOptions = {}
): RgbImage | RgbaImage {
	let {
		output = 'greyscale',
		presets = DEFAULT_OUTPUT_PRESETS,
		maps = {},
		outputOptions = {}
	} = options

	// Determine output program
	let program: OutputProgram
	if (typeof output === 'string') {
		if (!presets[output]) {
			throw new Error(`Invalid output preset: ${output}`)
		}
		program = presets[output]
	}
	else {
		program = output
	}

	// Apply program default options
	outputOptions = Object.assign({}, program.defaultOptions, outputOptions)

	// Assemble starting maps
	maps.changed = changedImage
	maps.original = originalImage
	maps.flags = flagsImage

	// Process each output instruction
	for (const instruction of program.steps) {
		const {
			output,
			op,
			source,
			source2 = null,
			options: instructionOptions = {}
		} = instruction

		// Map is already generated, skip
		if (maps[output]) {
			continue
		}

		// Lookup source image
		if (!maps[source]) {
			throw new Error(`Missing source image: ${source}`)
		}
		const sourceImage = maps[source]

		// Finalize instruction options
		for (const key in instructionOptions) {
			const value = instructionOptions[key]
			if (typeof value === 'string' && value.startsWith('@@')) {
				const optionKey = value.slice(2)
				if (!outputOptions[optionKey]) {
					throw new Error(`Missing option: ${optionKey}`)
				}
				instructionOptions[key] = outputOptions[optionKey]
			}
		}

		// Generate result image
		let result: Floatmap | Intmap | RgbImage | RgbaImage
		switch (op) {
			case 'flatten': {
				if (!(sourceImage instanceof RgbaImage)) {
					throw new Error('flatten source image must be RGBA')
				}
				result = flatten(sourceImage, instructionOptions)
				break
			}
			case 'greyscale': {
				if (!(sourceImage instanceof RgbImage || sourceImage instanceof RgbaImage)) {
					throw new Error('greyscale source image must be RGB/RGBA')
				}
				result = greyscale(sourceImage, instructionOptions)
				break
			}
			case 'renderValues': {
				if (!(sourceImage instanceof Valuemap)) {
					throw new Error('renderValues source image must be valuemap')
				}
				result = renderValues(sourceImage, instructionOptions)
				break
			}
			case 'blend': {
				if (!source2) {
					throw new Error('Missing source2 for blend')
				}
				const source2Image = maps[source2]
				if (!source2Image) {
					throw new Error(`Missing source2 image for blend: ${source2}`)
				}
				if (!(sourceImage instanceof RgbImage || sourceImage instanceof RgbaImage)) {
					throw new Error('greyscale source image must be RGB/RGBA')
				}
				if (!(source2Image instanceof RgbImage || source2Image instanceof RgbaImage)) {
					throw new Error('greyscale source2 image must be RGB/RGBA')
				}
				result = blend(sourceImage, source2Image, instructionOptions)
				break
			}
			default: {
				throw new Error(`Invalid output operation: ${op}`)
			}
		}
		maps[output] = result
	}

	// Composite layers to generate final output image
	if (!program.layers.length) {
		throw new Error('No output layers')
	}
	const layers = program.layers.map(layer => {
		const image = maps[layer]
		if (!(image instanceof RgbImage || image instanceof RgbaImage)) {
			throw new Error(`Invalid output image: ${layer}`)
		}
		return image
	})
	let resultImage: RgbImage | RgbaImage = layers.shift() as RgbImage | RgbaImage
	while (layers.length) {
		const layer = layers.shift() as RgbImage | RgbaImage
		resultImage = blend(resultImage, layer)
	}

	return resultImage
}

/**
 * Options for {@link diff}
 */
export type DiffOptions = (
	OutputOptions &
	DiffStatsOptions &
	DiffPixelsOptions &
	DiffGroupsOptions &
	SignificanceOptions
)

/**
 * Return value of {@link diff}
 */
export type DiffResult = (
	{
		resultImage: RgbImage | RgbaImage
	} &
	DiffStatsResult &
	DiffPixelsResult &
	DiffGroupsResult &
	SignificanceResult
)

/**
 * Generate image diff
 *
 * @param changedImage image to generate diff for
 * @param originalImage image to compare against
 * @param options diff options
 * @returns
 */
export function diff (
	changedImage: RgbImage | RgbaImage,
	originalImage: RgbImage | RgbaImage,
	options: DiffOptions = {}
): DiffResult {
	const yiqChanged = yiq(changedImage)
	const yiqOriginal = yiq(originalImage)
	const flags = Valuemap.createIntmap(yiqChanged.width, yiqChanged.height)
	const significanceResult = significance(yiqChanged, flags, options)
	const diffPixelsResult = diffPixels(yiqChanged, yiqOriginal, flags, options)
	const diffGroupsResult = diffGroups(flags, options)
	const diffStatsResult = diffStats(flags, diffPixelsResult, diffGroupsResult, options)
	const resultImage = output(changedImage, originalImage, flags, options)
	const result: DiffResult = Object.assign({ resultImage }, diffStatsResult, diffPixelsResult, diffGroupsResult, significanceResult)
	return result
}
