/**
 * flags image (significance/diff/groups) generation functions
 *
 * @module
 */

import {
	AbsBox,
	boxIntersect,
	fitBox
} from './box.js'
import {
	blend,
	greyscale
} from './image-rgb.js'
import {
	rgb as valuesToRgb
} from './image-value.js'
import {
	colorDistance,
	contrast
} from './pixel-yiq.js'
import {
	AnyRgbBitmap,
	IntValuemap,
	FloatValuemap,
	RgbaBitmap,
	YiqFloatmap
} from './types.js'

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
	maxDistanceImage?: FloatValuemap
	/**
	 * Valuemap to store max contrast for each pixel (compared to surrounding pixels)
	 */
	maxContrastImage?: FloatValuemap
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
 * @param flagsImage valuemap to store pixel category flags
 * @param sourceImage YIQ image to generate stats from
 * @param options generation options
 * @returns pixel category stats
 */
export function significance (flagsImage: IntValuemap, sourceImage: YiqFloatmap, options: SignificanceOptions = {}): SignificanceResult {
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
	sourceImage.iterateAll(({ index, offset, x, y }) => {
		const sourcePixel = sourceImage.pixel(offset)
		let flags = flagsImage.pixel(index)

		// Calc pixel stats
		let maxDistance = 0
		let maxContrast = 0
		let countEqual = 0
		sourceImage.iterateAdjacent(x, y, ({ offset: adjacentOffset }) => {
			const adjacentPixel = sourceImage.pixel(adjacentOffset)
			const calcDistance = Math.abs(colorDistance(sourcePixel, adjacentPixel))
			if (calcDistance) {
				if (calcDistance > maxDistance) {
					maxDistance = calcDistance
				}
				const calcContrast = Math.abs(contrast(sourcePixel, adjacentPixel))
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

		flagsImage.setPixel(index, flags)
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
	diffAntialias?: boolean
	/**
	 * Calculate diff for background pixels
	 *
	 * By default, background pixels are ignored.
	 */
	diffBackground?: boolean
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
 * @param flagsImage valuemap to store pixel category flags of changed image
 * @param sourceImage YIQ image to generate diff for
 * @param originalImage YIQ image to compare against
 * @param options generation options
 * @returns diff pixel stats
 */
export function diffPixels (flagsImage: IntValuemap, sourceImage: YiqFloatmap, originalImage: YiqFloatmap, options: DiffPixelsOptions = {}): DiffPixelsResult {
	if (originalImage.width !== sourceImage.width || originalImage.height !== sourceImage.height) {
		throw new Error('changedImage is not the same size as changedImage')
	}
	const {
		diffMinDistance = DEFAULT_DIFF_MIN_DISTANCE,
		diffAntialias = false,
		diffBackground = false
	} = options
	if (flagsImage.width !== sourceImage.width || flagsImage.height !== sourceImage.height) {
		throw new Error('flagsImage is not the same size as changedImage')
	}
	const results: DiffPixelsResult = {
		countPixelsCompared: 0,
		countPixelsIdentical: 0,
		countPixelsSimilar: 0,
		countPixelsDifferent: 0
	}
	sourceImage.iterateAll(({ index, offset }) => {
		let flags = flagsImage.pixel(index)
		if (
			((flags & FLAG_SGN_ANTIALIAS) && !diffAntialias) ||
			((flags & FLAG_SGN_BACKGROUND) && !diffBackground)
		) {
			return
		}
		const sourcePixel = sourceImage.pixel(offset)
		const originalPixel = originalImage.pixel(offset)
		const calcDistance = Math.abs(colorDistance(sourcePixel, originalPixel))
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
		flagsImage.setPixel(index, flags)
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
	diffGroups: AbsBox[],
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
export function diffGroups (flagsImage: IntValuemap, options: DiffGroupsOptions = {}): DiffGroupsResult {
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
		diffGroups: groups,
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
 * Overall result of diff comparison
 */
export type DiffStatus = 'identical' | 'similar' | 'different' | 'mismatch'

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
	diffStatus: DiffStatus
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
	flagsImage: IntValuemap,
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

	let diffStatus: DiffStatus
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
 * Generated image from {@link render}
 */
export type RenderOutputMap = FloatValuemap | IntValuemap | AnyRgbBitmap

/**
 * Map of generated images from {@link render}
 */
export type RenderOutputMapCollection = Record<string, RenderOutputMap>

/**
 * Render program for {@link render}
 */
export interface RenderProgram {
	options?: Record<string, any>
	inputs: string[]
	fn: (maps: RenderOutputMapCollection, options: Record<string, any>) => RenderOutputMap
}

/**
 * Options for {@link render}
 */
export interface RenderOptions {
	/**
	 * Options for output programs
	 */
	outputOptions?: Record<string, any>
	/**
	 * Instructions for generating output images
	 *
	 * Default: {@link DEFAULT_RENDER_PROGRAMS}
	 */
	programs?: Record<string, RenderProgram>
}

/**
 * Default named render programs for {@link render}
 */
export const DEFAULT_RENDER_PROGRAMS: Record<string, RenderProgram> = {
	groups: {
		inputs: ['changedFaded', 'flagsDiffPixels', 'flagsDiffGroups'],
		fn: (maps) => {
			const { changedFaded, flagsDiffGroups } = maps
			return blend(changedFaded as RgbaBitmap, flagsDiffGroups as RgbaBitmap)
		}
	},
	pixels: {
		inputs: ['changedFaded', 'flagsDiffPixels'],
		fn: (maps) => {
			const { changedFaded, flagsDiffPixels } = maps
			return blend(changedFaded as RgbaBitmap, flagsDiffPixels as RgbaBitmap)
		}
	},
	flagsrgb: {
		inputs: ['flagsDiffPixels', 'flagsDiffGroups', 'flagsSignificance'],
		fn: (maps) => {
			const { flagsDiffPixels, flagsDiffGroups, flagsSignificance } = maps
			const r1 = blend(flagsSignificance as RgbaBitmap, flagsDiffPixels as RgbaBitmap)
			return blend(r1, flagsDiffGroups as RgbaBitmap)
		}
	},
	changedFaded: {
		options: {
			fade: 0.5
		},
		inputs: ['changed'],
		fn: (maps, options) => {
			const { fade } = options
			return greyscale(maps.changed as RgbaBitmap, { fade })
		},
	},
	flagsDiffPixels: {
		options: {
			diffPixelColor: { r: 255, g: 128, b: 0, a: 255 },
		},
		inputs: ['flags'],
		fn: (maps, options) => {
			const { diffPixelColor } = options
			return valuesToRgb(maps.flags as IntValuemap, {
				palette: [
					{
						match: {
							mask: FLAG_DIFF_DIFFERENT,
							value: FLAG_DIFF_DIFFERENT
						},
						color: diffPixelColor
					}
				]
			})
		}
	},
	flagsDiffGroups: {
		options: {
			groupBorderColor: { r: 255, g: 0, b: 0, a: 255 },
			groupFillColor: { r: 255, g: 0, b: 255, a: 128 }
		},
		inputs: ['flags'],
		fn: (maps, options) => {
			const {
				groupBorderColor,
				groupFillColor
			} = options
			return valuesToRgb(maps.flags as IntValuemap, {
				palette: [
					{
						match: {
							mask: FLAG_GROUP_BORDER,
							value: FLAG_GROUP_BORDER
						},
						color: groupBorderColor
					},
					{
						match: {
							mask: FLAG_GROUP_FILL,
							value: FLAG_GROUP_FILL
						},
						color: groupFillColor
					}
				]
			})
		}
	},
	flagsSignificance: {
		options: {
			antialiasColor: { r: 0, g: 0, b: 128, a: 255 },
			backgroundColor: { r: 0, g: 0, b: 0, a: 255 },
			foregroundColor: { r: 255, g: 255, b: 255, a: 255 }
		},
		inputs: ['flags'],
		fn: (maps, options) => {
			const {
				antialiasColor,
				backgroundColor,
				foregroundColor
			} = options
			return valuesToRgb(maps.flags as IntValuemap, {
				palette: [
					{
						match: {
							mask: FLAG_SGN_ANTIALIAS,
							value: FLAG_SGN_ANTIALIAS
						},
						color: antialiasColor
					},
					{
						match: {
							mask: FLAG_SGN_BACKGROUND,
							value: FLAG_SGN_BACKGROUND
						},
						color: backgroundColor
					},
					{
						color: foregroundColor
					}
				]
			})
		}
	},
}

/**
 *
 * @param flagsImage valuemap of pixel category flags
 * @param changedImage image to generate diff for
 * @param originalImage image to compare against
 * @param outputs output images to generate; each value is the name of an output program
 * @param options output options
 * @returns generated output images
 */
export function render (
	flagsImage: IntValuemap,
	changedImage: AnyRgbBitmap,
	originalImage: AnyRgbBitmap,
	outputs: string[],
	options: RenderOptions = {}
): RenderOutputMapCollection {
	const {
		outputOptions = {},
		programs = DEFAULT_RENDER_PROGRAMS
	} = options
	const allMaps: RenderOutputMapCollection = {
		changed: changedImage,
		original: originalImage,
		flags: flagsImage
	}
	const generateMap = (name: string): RenderOutputMap => {
		if (allMaps[name]) {
			return allMaps[name]
		}
		const program = programs[name]
		if (!program) {
			throw new Error(`Missing program: ${name}`)
		}
		for (const input of program.inputs) {
			generateMap(input)
		}
		const result = program.fn(allMaps, { ...program.options, ...outputOptions })
		allMaps[name] = result
		return result
	}
	const outputMaps: RenderOutputMapCollection = {}
	for (const outputName of outputs) {
		outputMaps[outputName] = generateMap(outputName)
	}
	return outputMaps
}
