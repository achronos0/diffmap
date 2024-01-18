/**
 * diff generation functions
 *
 * @module
 */
import { DiffGroupsOptions, DiffGroupsResult, DiffPixelsOptions, DiffPixelsResult, DiffStatsOptions, DiffStatsResult, RenderOptions, SignificanceOptions, SignificanceResult } from './flags.js';
import { IntValuemap, RgbBitmap, RgbaBitmap } from './types.js';
/**
 * Options for {@link raw}
 */
export type RawDiffOptions = (DiffStatsOptions & DiffPixelsOptions & DiffGroupsOptions & SignificanceOptions);
/**
 * Return value of {@link raw}
 */
export type RawDiffResult = ({
    flagsImage: IntValuemap;
} & DiffStatsResult & DiffPixelsResult & DiffGroupsResult & SignificanceResult);
/**
 * Generate raw diff flags image
 *
 * @param sourceImage image to generate diff for
 * @param originalImage image to compare against
 * @param options diff options
 * @returns flags image and diff results
 */
export declare function raw(sourceImage: RgbBitmap | RgbaBitmap, originalImage: RgbBitmap | RgbaBitmap, options?: RawDiffOptions): RawDiffResult;
/**
 * Options for {@link rgb}
 */
export type RgbDiffOptions = (RawDiffOptions & RenderOptions);
/**
 * Return value of {@link rgb}
 */
export type RgbDiffResult = ({
    resultImage: RgbBitmap | RgbaBitmap;
} & RawDiffResult);
/**
 * Generate image diff
 *
 * @param sourceImage image to generate diff for
 * @param originalImage image to compare against
 * @param options diff options
 * @returns
 */
export declare function rgb(sourceImage: RgbBitmap | RgbaBitmap, originalImage: RgbBitmap | RgbaBitmap, options?: RgbDiffOptions): RgbDiffResult;
