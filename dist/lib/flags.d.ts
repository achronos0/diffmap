/**
 * flags image (significance/diff/groups) generation functions
 *
 * @module
 */
import { AbsBox } from './box.js';
import { AnyRgbBitmap, IntValuemap, FloatValuemap, YiqFloatmap } from './types.js';
/**
 * Category flag for pixel significance: is foreground, i.e. important content
 */
export declare const FLAG_SGN_FOREGROUND = 1;
/**
 * Category flag for pixel significance: is background, i.e. unimportant content
 */
export declare const FLAG_SGN_BACKGROUND = 2;
/**
 * Category flag for pixel significance: is antialias, i.e. ignored content
 */
export declare const FLAG_SGN_ANTIALIAS = 4;
/**
 * Category flag for pixel diff: is identical to original
 */
export declare const FLAG_DIFF_IDENTICAL = 8;
/**
 * Category flag for pixel diff: is similar to original
 */
export declare const FLAG_DIFF_SIMILAR = 16;
/**
 * Category flag for pixel diff: is different from original
 */
export declare const FLAG_DIFF_DIFFERENT = 32;
/**
 * Category flag for pixel group: is a diff group fill pixel
 */
export declare const FLAG_GROUP_FILL = 64;
/**
 * Category flag for pixel group: is a diff group border pixel
 */
export declare const FLAG_GROUP_BORDER = 128;
/**
 * Options for {@link significance}
 */
export interface SignificanceOptions {
    /**
     * Valuemap to store max colour distance for each pixel (compared to surrounding pixels)
     */
    maxDistanceImage?: FloatValuemap;
    /**
     * Valuemap to store max contrast for each pixel (compared to surrounding pixels)
     */
    maxContrastImage?: FloatValuemap;
    /**
     * Minimum colour distance for a pixel to be considered antialiasing
     *
     * Lower values match more pixels as antialias.
     *
     * Range: `0` to `255`
     *
     * Default: {@link DEFAULT_ANTIALIAS_MIN_DISTANCE}
     */
    antialiasMinDistance?: number;
    /**
     * Maximum colour distance for a pixel to be considered antialiasing
     *
     * Higher values match more pixels as antialias (ignored content).
     *
     * Range: `0` to `255`
     *
     * Default: {@link DEFAULT_ANTIALIAS_MAX_DISTANCE}
     */
    antialiasMaxDistance?: number;
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
    backgroundMaxContrast?: number;
}
/**
 * Default minimum colour distance for a pixel to be considered antialiasing, for {@link significance}
 */
export declare const DEFAULT_ANTIALIAS_MIN_DISTANCE = 12;
/**
 * Default maximum colour distance for a pixel to be considered antialiasing, for {@link significance}
 */
export declare const DEFAULT_ANTIALIAS_MAX_DISTANCE = 150;
/**
 * Default maximum contrast for a pixel to be considered background, for {@link significance}
 */
export declare const DEFAULT_BACKGROUND_MAX_CONTRAST = 25;
/**
 * Return value of {@link significance}
 */
export interface SignificanceResult {
    /**
     * Number of pixels in image that are antialias (ignored content)
     */
    countPixelsAntialias: number;
    /**
     * Number of pixels in image that are background, i.e. unimportant content
     */
    countPixelsBackground: number;
    /**
     * Number of pixels in image that are foreground, i.e. important content
     */
    countPixelsForeground: number;
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
export declare function significance(flagsImage: IntValuemap, sourceImage: YiqFloatmap, options?: SignificanceOptions): SignificanceResult;
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
    diffMinDistance?: number;
    /**
     * Calculate diff for antialias pixels
     *
     * By default, antialias pixels are ignored.
     */
    diffAntialias?: boolean;
    /**
     * Calculate diff for background pixels
     *
     * By default, background pixels are ignored.
     */
    diffBackground?: boolean;
}
/**
 * Default minimum colour distance for a pixel to be considered different, compared to original; for {@link diffPixels}
 */
export declare const DEFAULT_DIFF_MIN_DISTANCE = 40;
/**
 * Return value of {@link diffPixels}
 */
export interface DiffPixelsResult {
    /**
     * Number of pixels in image that were compared to original
     */
    countPixelsCompared: number;
    /**
     * Number of pixels in image that are identical to original
     */
    countPixelsIdentical: number;
    /**
     * Number of pixels in image that are close in colour, compared to original
     */
    countPixelsSimilar: number;
    /**
     * Number of pixels in image that are notably different in colour compared to original
     */
    countPixelsDifferent: number;
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
export declare function diffPixels(flagsImage: IntValuemap, sourceImage: YiqFloatmap, originalImage: YiqFloatmap, options?: DiffPixelsOptions): DiffPixelsResult;
/**
 * Options for {@link diffGroups}
 */
export interface DiffGroupsOptions {
    /**
     * Group diff pixels that are this many pixels apart or closer
     *
     * Default: {@link DEFAULT_GROUP_MERGE_MAX_GAP_SIZE}
     */
    groupMergeMaxGapSize?: number;
    /**
     * Thickness (in pixels) of border to draw around each diff group
     *
     * Default: {@link DEFAULT_DIFF_GROUP_BORDER_SIZE}
     */
    groupBorderSize?: number;
    /**
     * Grow each diff group by this many pixels
     *
     * Default: {@link DEFAULT_DIFF_GROUP_PADDING_SIZE}
     */
    groupPaddingSize?: number;
}
/**
 * Default maximum gap between diff pixels in group, for {@link diffGroups}
 */
export declare const DEFAULT_GROUP_MERGE_MAX_GAP_SIZE = 80;
/**
 * Default thickness of border to draw around each diff group, for {@link diffGroups}
 */
export declare const DEFAULT_DIFF_GROUP_BORDER_SIZE = 15;
/**
 * Default number of pixels to grow each diff group by, for {@link diffGroups}
 */
export declare const DEFAULT_DIFF_GROUP_PADDING_SIZE = 80;
/**
 * Return value of {@link diffGroups}
 */
export interface DiffGroupsResult {
    /**
     * Diff groups
     */
    diffGroups: AbsBox[];
    /**
     * Number of pixels in image that are part of a diff group
     */
    countPixelsDiffGroup: number;
}
/**
 * Generate diff groups from diff pixels
 *
 * @param flagsImage valuemap to store pixel category flags of changed image
 * @param options generation options
 * @returns diff group stats
 */
export declare function diffGroups(flagsImage: IntValuemap, options?: DiffGroupsOptions): DiffGroupsResult;
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
    mismatchMinPercent?: number;
}
/**
 * Default minimum percentage of diff pixels for comparison to be considered a mismatch, for {@link diffStats}
 */
export declare const DEFAULT_MISMATCH_MIN_PERCENT = 50;
/**
 * Overall result of diff comparison
 */
export type DiffStatus = 'identical' | 'similar' | 'different' | 'mismatch';
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
    diffStatus: DiffStatus;
    /**
     * Total number of pixels in image
     */
    countPixelsAll: number;
    /**
     * Percentage of pixels in image that are notably different in colour compared to original
     */
    percentDiffPixels: number;
    /**
     * Percentage of pixels in image that are part of a diff group
     */
    percentDiffGroup: number;
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
export declare function diffStats(flagsImage: IntValuemap, diffPixelsResult: DiffPixelsResult, diffGroupsResult: DiffGroupsResult, options: DiffStatsOptions): DiffStatsResult;
/**
 * Generated image from {@link render}
 */
export type RenderOutputMap = FloatValuemap | IntValuemap | AnyRgbBitmap;
/**
 * Map of generated images from {@link render}
 */
export type RenderOutputMapCollection = Record<string, RenderOutputMap>;
/**
 * Render program for {@link render}
 */
export interface RenderProgram {
    options?: Record<string, any>;
    inputs: string[];
    fn: (maps: RenderOutputMapCollection, options: Record<string, any>) => RenderOutputMap;
}
/**
 * Options for {@link render}
 */
export interface RenderOptions {
    /**
     * Options for output programs
     */
    outputOptions?: Record<string, any>;
    /**
     * Instructions for generating output images
     *
     * Default: {@link DEFAULT_RENDER_PROGRAMS}
     */
    programs?: Record<string, RenderProgram>;
}
/**
 * Default named render programs for {@link render}
 */
export declare const DEFAULT_RENDER_PROGRAMS: Record<string, RenderProgram>;
/**
 *
 * @param flagsImage valuemap of pixel category flags
 * @param changedImage image to generate diff for
 * @param originalImage image to compare against
 * @param outputs output images to generate; each value is the name of an output program
 * @param options output options
 * @returns generated output images
 */
export declare function render(flagsImage: IntValuemap, changedImage: AnyRgbBitmap, originalImage: AnyRgbBitmap, outputs: string[], options?: RenderOptions): RenderOutputMapCollection;
