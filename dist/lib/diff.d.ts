/**
 * diff generation functions
 *
 * @module
 */
import { DiffGroupsOptions, DiffGroupsResult, DiffPixelsOptions, DiffPixelsResult, DiffStatsOptions, DiffStatsResult, RenderOptions, RenderOutputMapCollection, SignificanceOptions, SignificanceResult } from './flags.js';
import { AnyRgbBitmap, IntValuemap } from './types.js';
/**
 * Diff options accepted by all diff functions
 */
export type BaseDiffOptions = (DiffStatsOptions & DiffPixelsOptions & DiffGroupsOptions & SignificanceOptions);
/**
 * Diff stats returned from all diff functions
 */
export type BaseDiffResult = (DiffStatsResult & DiffPixelsResult & DiffGroupsResult & SignificanceResult);
/**
 * Options for {@link raw}
 */
export type RawDiffOptions = BaseDiffOptions;
/**
 * Return value of {@link raw}
 */
export type RawDiffResult = ({
    flagsImage: IntValuemap;
} & BaseDiffResult);
/**
 * Generate raw diff flags image
 *
 * @param sourceImage image to generate diff for
 * @param originalImage image to compare against
 * @param options diff options
 * @returns flags image and diff results
 */
export declare function raw(sourceImage: AnyRgbBitmap, originalImage: AnyRgbBitmap, options?: RawDiffOptions): RawDiffResult;
/**
 * Options for {@link rgb}
 */
export type RgbDiffOptions = ({
    /**
     * Output image program name to generate
     *
     * Default: {@link DEFAULT_RGB_DIFF_OUTPUT}
     */
    output?: string;
} & BaseDiffOptions & RenderOptions);
/**
 * Default value for {@link RgbDiffOptions.output}
 */
export declare const DEFAULT_RGB_DIFF_OUTPUT = "groups";
/**
 * Return value of {@link rgb}
 */
export type RgbDiffResult = ({
    /**
     * Generated diff image
     */
    resultImage: AnyRgbBitmap;
} & BaseDiffResult);
/**
 * Generate image diff
 *
 * @param sourceImage image to generate diff for
 * @param originalImage image to compare against
 * @param options diff options
 * @returns
 */
export declare function rgb(sourceImage: AnyRgbBitmap, originalImage: AnyRgbBitmap, options?: RgbDiffOptions): RgbDiffResult;
/**
 * Options for {@link rgbMultiple}
 */
export type RgbMultiDiffOptions = (BaseDiffOptions & RenderOptions);
/**
 * Return value of {@link rgbMultiple}
 */
export type RgbMultiDiffResult = ({
    resultImages: RenderOutputMapCollection;
} & BaseDiffResult);
/**
 * Generate image diff in multiple formats
 *
 * @param sourceImage image to generate diff for
 * @param originalImage image to compare against
 * @param outputs output images to generate; each value is the name of an output program
 * @param options diff options
 * @returns
 */
export declare function rgbMultiple(sourceImage: AnyRgbBitmap, originalImage: AnyRgbBitmap, outputs: string[], options?: RgbMultiDiffOptions): RgbMultiDiffResult;
