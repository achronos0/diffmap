/**
 * REWRITE diff generation functions
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
	greyscale,
	yiq as rgbToYiq
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
	AnyValuemap,
	IntValuemap,
	FloatValuemap,
	RgbaBitmap,
	Valuemap,
	YiqFloatmap
} from './types.js'

/**
 * Diff flag names
 */
export type DiffFlagName = 'diffNone' | 'diffDifferent' | 'diffGroup' | 'diffBorder'

/**
 * Similarity flag names
 */
export type SimilarityFlagName = 'identical' | 'similar' | 'changed'

/**
 * Significance flag names
 */
export type SignificanceFlagName = 'antialias' | 'background' | 'foreground'

/**
 * All possible flag names
 */
export type FlagName = DiffFlagName | SimilarityFlagName | SignificanceFlagName

/**
 * Flag bit values for each flag name
 *
 * Diff flags:
 * * `diffNone`: pixel is not part of a diff group
 * * `diffDifferent`: pixel is a changed pixel
 * * `diffGroup`: pixel is part of a diff group interior
 * * `diffBorder`: pixel is part of a diff group border
 *
 * Similarity flags:
 * * `identical`: pixel is the same in all images
 * * `similar`: pixel is similar in all images
 * * `changed`: pixel is distinct across images
 *
 * Significance flags:
 * * `background`: pixel is probably background
 * * `foreground`: pixel is probably foreground
 * * `antialias`: pixel is probably antialiasing
 *
 * Bit values:
 * * 0x00 - .....000 - diffNone
 * * 0x03 - .....011 - diffDifferent
 * * 0x02 - .....010 - diffGroup
 * * 0x06 - .....110 - diffBorder
 * * 0x07 - .....111 - diff mask
 * * 0x00 - ..00.... - identical
 * * 0x20 - ..10.... - similar
 * * 0x30 - ..11.... - changed
 * * 0x30 - ..11.... - similarity mask
 * * 0x00 - 00...... - background
 * * 0x40 - 01...... - foreground
 * * 0x80 - 10...... - antialias
 * * 0xC0 - 11...... - significance mask
 *
 */
export const FLAGS: Record<FlagName, { value: number, mask: number }> = {
	// Diff flags
	diffNone: {
		value: 0x00,
		mask: 0x07
	},
	diffDifferent: {
		value: 0x03,
		mask: 0x07
	},
	diffGroup: {
		value: 0x02,
		mask: 0x07
	},
	diffBorder: {
		value: 0x06,
		mask: 0x07,
	},
	// Similarity flags
	identical: {
		value: 0x00,
		mask: 0x30
	},
	similar: {
		value: 0x20,
		mask: 0x30
	},
	changed: {
		value: 0x30,
		mask: 0x30
	},
	// Significance flags
	background: {
		value: 0x00,
		mask: 0xC0
	},
	foreground: {
		value: 0x40,
		mask: 0xC0
	},
	antialias: {
		value: 0x80,
		mask: 0xC0
	}
}

/**
 * Generated output image from {@link diff}
 */
export type RenderOutputMap = FloatValuemap | IntValuemap | AnyRgbBitmap

/**
 * Map of generated output images from {@link diff}
 */
export type RenderOutputMapCollection = Record<string, RenderOutputMap>

/**
 * Render program for {@link diff} output
 */
export interface RenderProgram {
	options?: Record<string, any>
	inputs: string[]
	fn: (maps: RenderOutputMapCollection, options: Record<string, any>) => RenderOutputMap
}

/**
 * Options for {@link diff}
 */
export interface DiffOptions {
	/**
	 * Minimum colour distance for a pixel to be considered changed (different), compared to original
	 *
	 * Lower values match more pixels as changed.
	 * Higher values match more pixels as similar.
	 *
	 * Range: `0` to `255`
	 *
	 * Default: `40`
	 */
	changedMinDistance?: number
	/**
	 * Minimum colour distance for a pixel to be considered antialiasing
	 *
	 * Lower values match more pixels as antialias.
	 *
	 * Range: `0` to `255`
	 *
	 * Default: `12`
	 */
	antialiasMinDistance?: number
	/**
	 * Maximum colour distance for a pixel to be considered antialiasing
	 *
	 * Higher values match more pixels as antialias (ignored content).
	 *
	 * Range: `0` to `255`
	 *
	 * Default: `150`
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
	 * Default: `25`
	 */
	backgroundMaxContrast?: number
	/**
	 * Group diff pixels that are this many pixels apart or closer
	 *
	 * Default: `80`
	 */
	groupMergeMaxGapSize?: number
	/**
	 * Thickness (in pixels) of border to draw around each diff group
	 *
	 * Default: `15`
	 */
	groupBorderSize?: number
	/**
	 * Grow each diff group by this many pixels
	 *
	 * Default: `80`
	 */
	groupPaddingSize?: number
	/**
	 * Include antialias pixels in diff groups
	 *
	 * By default, antialias pixels are ignored.
	 *
	 * Default: `false`
	 */
	diffIncludeAntialias?: boolean
	/**
	 * Include background pixels in diff groups
	 *
	 * By default, background pixels are ignored.
	 *
	 * Default: `false`
	 */
	diffIncludeBackground?: boolean
	/**
	 * Include foreground pixels in diff groups
	 *
	 * Default: `true`
	 */
	diffIncludeForeground?: boolean
	/**
	 * Minimum percentage of diff pixels for comparison to be considered a mismatch
	 *
	 * A mismatch means the images being compared are so different that they are probably not based on the same image.
	 *
	 * Range: `0` to `100`
	 *
	 * Default: `50`
	 */
	mismatchMinPercent?: number
	/**
	 * Output image(s) to generate
	 *
	 * Each value is the name of an output program
	 */
	output?: string[]
	/**
	 * Options for output programs
	 */
	outputOptions?: Record<string, any>
	/**
	 * Named render programs for generating output images
	 *
	 * Default: {@link DEFAULT_OPTIONS.outputPrograms}
	 */
	outputPrograms?: Record<string, RenderProgram>
}

const DEFAULT_OPTIONS: Required<DiffOptions> = {
	changedMinDistance: 40,
	antialiasMinDistance: 12,
	antialiasMaxDistance: 150,
	backgroundMaxContrast: 25,
	groupMergeMaxGapSize: 80,
	groupBorderSize: 15,
	groupPaddingSize: 80,
	diffIncludeAntialias: false,
	diffIncludeBackground: false,
	diffIncludeForeground: true,
	mismatchMinPercent: 50,
	output: ['groups'],
	outputOptions: {},
	outputPrograms: {
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
								mask: FLAGS.diffDifferent.mask,
								value: FLAGS.diffDifferent.value
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
								mask: FLAGS.diffBorder.mask,
								value: FLAGS.diffBorder.value
							},
							color: groupBorderColor
						},
						{
							match: {
								mask: FLAGS.diffGroup.mask,
								value: FLAGS.diffGroup.value
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
								mask: FLAGS.antialias.mask,
								value: FLAGS.antialias.value
							},
							color: antialiasColor
						},
						{
							match: {
								mask: FLAGS.background.mask,
								value: FLAGS.background.value
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
}

/**
 * Overall result of diff comparison
 */
export type DiffStatus = 'identical' | 'similar' | 'different' | 'mismatch'

/**
 * Return value of {@link diff}
 */
export interface DiffResult {
	/**
	 * Generated output images
	 */
	outputImages: RenderOutputMapCollection
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
	 * Pixel counts
	 */
	pixelCounts: {
		/**
		 * Pixel count of all pixels in image
		 */
		all: number
		/**
		 * Pixel count of all pixels considered different
		 */
		diff: number
		/**
		 * Pixel count of all pixels compared for difference
		 */
		compared: number
		/**
		 * Pixel count of all pixels in a diff group
		 */
		group: number
		/**
		 * Pixel counts by significance flag
		 */
		significance: {
			/**
			 * Pixel count of all foreground pixels
			 */
			foreground: number
			/**
			 * Pixel count of all background pixels
			 */
			background: number
			/**
			 * Pixel count of all antialias pixels
			 */
			antialias: number
		}
		/**
		 * Pixel counts by similarity+significance flags
		 */
		similarity: {
			/**
			 * Pixels counts of pixels that are changed
			 */
			changed: {
				/**
				 * Pixel count of all changed pixels
				 */
				all: number
				/**
				 * Pixel count of all changed foreground pixels
				 */
				foreground: number
				/**
				 * Pixel count of all changed background pixels
				 */
				background: number
				/**
				 * Pixel count of all changed antialias pixels
				 */
				antialias: number
			}
			/**
			 * Pixels counts of pixels that are identical
			 */
			identical: {
				/**
				 * Pixel count of all identical pixels
				 */
				all: number
				/**
				 * Pixel count of all identical foreground pixels
				 */
				foreground: number
				/**
				 * Pixel count of all identical background pixels
				 */
				background: number
				/**
				 * Pixel count of all identical antialias pixels
				 */
				antialias: number
			}
			/**
			 * Pixels counts of pixels that are similar
			 */
			similar: {
				/**
				 * Pixel count of all similar pixels
				 */
				all: number
				/**
				 * Pixel count of all similar foreground pixels
				 */
				foreground: number
				/**
				 * Pixel count of all similar background pixels
				 */
				background: number
				/**
				 * Pixel count of all similar antialias pixels
				 */
				antialias: number
			}
		}
	}
	pixelPercent: {
		/**
		 * Percentage of all pixels in image that were compared for difference
		 */
		compared: number
		/**
		 * Percentage of all pixels in image that are different
		 */
		diff: number
		/**
		 * Percentage of all pixels in image that are in a diff group
		 */
		group: number
		/**
		 * Percentage of compared pixels that are different
		 */
		diffCompared: number
	}
	/**
	 * Diff groups
	 */
	diffGroups: AbsBox[],
}

/**
 * Generate image diff
 *
 * @param sourceImages images to generate diff for
 * @param options diff options
 * @returns diff flags valuemap and diff stats
 */
export function diff (sourceImages: AnyRgbBitmap[], options: DiffOptions = {}): DiffResult
{
	const {
		changedMinDistance,
		antialiasMinDistance,
		antialiasMaxDistance,
		backgroundMaxContrast,
		groupMergeMaxGapSize,
		groupBorderSize,
		groupPaddingSize,
		diffIncludeAntialias,
		diffIncludeBackground,
		diffIncludeForeground,
		mismatchMinPercent,
		output,
		outputOptions,
		outputPrograms
	} = {...DEFAULT_OPTIONS, ...options}

	// Validate images and conver to YIQ
	const { length } = sourceImages
	if (length < 2) {
		throw new Error(`diff requires at least 2 images, got ${length}`)
	}
	const { width, height } = sourceImages[0]
	const yiqImages = sourceImages.map(image => {
		if (image.width !== width || image.height !== height) {
			throw new Error(`diff requires all images to have the same dimensions, got ${width}x${height} and ${image.width}x${image.height}`)
		}
		return rgbToYiq(image)
	})

	// Generate similarity and significance flags
	const flagsImage = Valuemap.createIntmap(width, height)
	const { pixelCounts: pixelCountsDiff } = flags({
		flagsImage,
		images: yiqImages,
		changedMinDistance,
		antialiasMinDistance,
		antialiasMaxDistance,
		backgroundMaxContrast,
		diffIncludeAntialias,
		diffIncludeBackground,
		diffIncludeForeground
	})

	// Generate diff flags
	const { diffGroups, pixelCounts: pixelCountGroup } = groups({
		flagsImage,
		groupMergeMaxGapSize,
		groupBorderSize,
		groupPaddingSize
	})

	// Assemble pixel counts and percentages
	const pixelCounts = {...pixelCountsDiff, ...pixelCountGroup}
	const pixelPercent = {
		compared: 100 * pixelCounts.compared / pixelCounts.all,
		diff: 100 * pixelCounts.diff / pixelCounts.all,
		group: 100 * pixelCounts.group / pixelCounts.all,
		diffCompared: 100 * pixelCounts.diff / pixelCounts.compared
	}

	// Determine overall diff status
	let diffStatus: DiffStatus
	if (pixelCounts.diff) {
		if (pixelPercent.diff >= mismatchMinPercent) {
			diffStatus = 'mismatch'
		}
		else {
			diffStatus = 'different'
		}
	}
	else {
		if (pixelCounts.similarity.similar.all) {
			diffStatus = 'similar'
		}
		else {
			diffStatus = 'identical'
		}
	}

	// Generate output images
	const { outputImages } = render({
		flagsImage,
		sourceImages,
		output,
		outputOptions,
		outputPrograms
	})

	return {
		diffStatus,
		pixelCounts,
		pixelPercent,
		diffGroups,
		outputImages
	}
}

/**
 * Populate similarity and significance flags
 *
 * @param config config values passed from {@link diff}
 * @returns pixel stats
 */
export function flags (config: {
	flagsImage: IntValuemap
	images: YiqFloatmap[]
	changedMinDistance: number
	antialiasMinDistance: number
	antialiasMaxDistance: number
	backgroundMaxContrast: number
	diffIncludeAntialias: boolean
	diffIncludeBackground: boolean
	diffIncludeForeground: boolean
	distanceMap?: AnyValuemap,
	contrastMap?: AnyValuemap
}): {
	pixelCounts: {
		all: number
		diff: number
		compared: number
		significance: {
			foreground: number
			background: number
			antialias: number
		}
		similarity: {
			changed: {
				all: number
				foreground: number
				background: number
				antialias: number
			}
			identical: {
				all: number
				foreground: number
				background: number
				antialias: number
			}
			similar: {
				all: number
				foreground: number
				background: number
				antialias: number
			}
		}
	}
} {
	const {
		flagsImage,
		images,
		changedMinDistance,
		antialiasMinDistance,
		antialiasMaxDistance,
		backgroundMaxContrast,
		diffIncludeAntialias,
		diffIncludeBackground,
		diffIncludeForeground,
		distanceMap = null,
		contrastMap = null
	} = config
	const pixelCounts = {
		all: flagsImage.pixelLength,
		diff: 0,
		compared: 0,
		significance: {
			foreground: 0,
			background: 0,
			antialias: 0,
		},
		similarity: {
			changed: {
				all: 0,
				foreground: 0,
				background: 0,
				antialias: 0,
			},
			identical: {
				all: 0,
				foreground: 0,
				background: 0,
				antialias: 0,
			},
			similar: {
				all: 0,
				foreground: 0,
				background: 0,
				antialias: 0
			}
		}
	}
	images[0].iterateAll(({ x, y, index, offset }) => {
		// Get pixels to compare
		const comparePixels = images.map(image => image.pixel(offset))

		// Calculate max colour distance between pixels
		let maxDistance = 0
		for (let i = 0; i < comparePixels.length - 1; i++) {
			for (let j = i + 1; j < comparePixels.length; j++) {
				const distance = Math.abs(colorDistance(comparePixels[i], comparePixels[j]))
				if (distance > maxDistance) {
					maxDistance = distance
				}
			}
		}

		// Determine significance flag of pixel (is it antialias, background, or foreground)
		// Run this check for each image, and ensure all images agree on significance
		let significance: SignificanceFlagName | null = null
		for (let imageIndex = 0; imageIndex < images.length; imageIndex++) {
			const image = images[imageIndex]
			const sourcePixel = comparePixels[imageIndex]

			// Compare this pixel to adjacent pixels in its image; calculate max distance and contrast, and count equal pixels
			let maxDistance = 0
			let maxContrast = 0
			let countEqual = 0
			image.iterateAdjacent(x, y, ({ offset: adjacentOffset }) => {
				// Get adjacent pixel to compare
				const adjacentPixel = image.pixel(adjacentOffset)

				// Calculate colour distance and contrast
				const pixelDistance = Math.abs(colorDistance(sourcePixel, adjacentPixel))
				if (!pixelDistance) {
					// Pixels are identical
					countEqual++
				}
				else {
					// Record max distance
					if (pixelDistance > maxDistance) {
						maxDistance = pixelDistance
					}

					// Record max contrast (brightness only difference)
					const pixelContrast = Math.abs(contrast(sourcePixel, adjacentPixel))
					if (pixelContrast > maxContrast) {
						maxContrast = pixelContrast
					}
				}
			})

			// Optionally store distance and contrast to provided maps
			if (distanceMap) {
				distanceMap.setPixel(index, maxDistance)
			}
			if (contrastMap) {
				contrastMap.setPixel(index, maxContrast)
			}

			// Determine significance of this pixel (is it antialias, background, or foreground)
			let pixelSignificance: SignificanceFlagName
			if (
				countEqual < 3 &&
				maxDistance >= antialiasMinDistance &&
				maxDistance <= antialiasMaxDistance &&
				maxContrast >= antialiasMinDistance &&
				maxContrast <= antialiasMaxDistance
			) {
				// Pixel is antialias:
				pixelSignificance = 'antialias'
			}
			else if (maxContrast <= backgroundMaxContrast) {
				// Pixel is background
				pixelSignificance = 'background'
			}
			else {
				// Pixel is foreground
				pixelSignificance = 'foreground'
			}

			// Set overall significance for this pixel across all images
			if (
				pixelSignificance === 'foreground' ||
				(significance && pixelSignificance !== significance)
			) {
				// Pixel is foreground OR not all images agree on significance
				significance = 'foreground'
				// No need to check other images
				break
			}
			if (!significance) {
				significance = pixelSignificance
			}
		}
		if (!significance) {
			significance = 'foreground'
		}

		// Determine similarity flag for this pixel
		let similarity: SimilarityFlagName
		if (!maxDistance) {
			similarity = 'identical'
		}
		else if (maxDistance < changedMinDistance) {
			similarity = 'similar'
		}
		else {
			similarity = 'changed'
		}

		// Determine overall diff status for this pixel
		const compared = (
			(diffIncludeForeground && significance === 'foreground') ||
			(diffIncludeBackground && significance === 'background') ||
			(diffIncludeAntialias && significance === 'antialias')
		)
		const diff = similarity === 'changed' && compared

		// Set flags for this pixel
		let flags = FLAGS[similarity].value + FLAGS[significance].value
		if (diff) {
			flags += FLAGS.diffDifferent.value
		}
		flagsImage.setPixel(index, flags)

		// Increment pixel counts
		pixelCounts.significance[significance]++
		pixelCounts.similarity[similarity].all++
		pixelCounts.similarity[similarity][significance]++
		if (compared) {
			pixelCounts.compared++
		}
		if (diff) {
			pixelCounts.diff++
		}
	})
	return { pixelCounts }
}

/**
 * Populate diff flags with groups
 *
 * @param config config values passed from {@link diff}
 * @returns pixel stats and raw diff groups
 */
export function groups (config: {
	flagsImage: IntValuemap
	groupMergeMaxGapSize: number
	groupBorderSize: number
	groupPaddingSize: number
}): {
	diffGroups: AbsBox[]
	pixelCounts: {
		group: number
	}
} {
	const {
		flagsImage,
		groupMergeMaxGapSize,
		groupBorderSize,
		groupPaddingSize
	} = config

	// Find diff groups
	const diffFlagValue = FLAGS.diffDifferent.value
	let groups: AbsBox[] = []
	flagsImage.iterateAll(({ x: currentX, y: currentY, offset }) => {
		const flags = flagsImage.pixel(offset)
		if ((flags & diffFlagValue) === diffFlagValue) {
			return
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
			return
		}

		// Create new group
		const group: AbsBox = {
			left: currentX,
			top: currentY,
			right: currentX,
			bottom: currentY
		}
		groups.push(group)
	})

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
	let pixelCount = 0
	for (const group of groups) {
		pixelCount += (group.right - group.left + 1) * (group.bottom - group.top + 1)
		for (let y = group.top; y <= group.bottom; y++) {
			for (let x = group.left; x <= group.right; x++) {
				const flag =
					y < group.top + groupBorderSize ||
					y > group.bottom - groupBorderSize ||
					x < group.left + groupBorderSize ||
					x > group.right - groupBorderSize
						? FLAGS.diffBorder.value
						: FLAGS.diffGroup.value
				const offset = flagsImage.offset(x, y)
				let pixel = flagsImage.pixel(offset)
				pixel |= flag
				flagsImage.setPixel(offset, pixel)
			}
		}
	}

	return {
		diffGroups: groups,
		pixelCounts: {
			group: pixelCount
		}
	}
}

/**
 * Generate output images
 *
 * @param config config values passed from {@link diff}
 * @returns output images
 */
function render (config: {
	flagsImage: IntValuemap
	sourceImages: AnyRgbBitmap[]
	output: string[]
	outputOptions: Record<string, any>
	outputPrograms: Record<string, RenderProgram>
}): {
	outputImages: RenderOutputMapCollection
} {
	const {
		flagsImage,
		sourceImages,
		output,
		outputOptions,
		outputPrograms
	} = config

	const allMaps: RenderOutputMapCollection = {
		flags: flagsImage,
		original: sourceImages[0],
		changed: sourceImages[1]
	}
	const generateMap = (name: string): RenderOutputMap => {
		if (allMaps[name]) {
			return allMaps[name]
		}
		const program = outputPrograms[name]
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

	const outputImages: RenderOutputMapCollection = {}
	for (const outputName of output) {
		outputImages[outputName] = generateMap(outputName)
	}

	return { outputImages }
}
