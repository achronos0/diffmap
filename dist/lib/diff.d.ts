/**
 * REWRITE diff generation functions
 *
 * @module
 */
import { AbsBox } from './box.js';
import { AnyRgbBitmap, AnyValuemap, IntValuemap, FloatValuemap, YiqFloatmap, YiqPixelColor } from './types.js';
/**
 * Diff flag names
 */
export type DiffFlagName = 'diffSame' | 'diffDifferent';
/**
 * Group flag names
 */
export type GroupFlagName = 'groupNone' | 'groupFill' | 'groupBorder';
/**
 * Similarity flag names
 */
export type SimilarityFlagName = 'identical' | 'similar' | 'changed';
/**
 * Significance flag names
 */
export type SignificanceFlagName = 'antialias' | 'background' | 'foreground';
/**
 * All possible flag names
 */
export type FlagName = DiffFlagName | GroupFlagName | SimilarityFlagName | SignificanceFlagName;
/**
 * Flag bit values for each flag name
 *
 * Diff flags:
 * * `diffSame`: pixel is not part of a diff group
 * * `diffDifferent`: pixel is a changed pixel
 *
 * Group flags:
 * * `groupNone`: pixel is not part of a diff group
 * * `groupFill`: pixel is part of a diff group interior
 * * `groupBorder`: pixel is part of a diff group border
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
 * * 0x01 & 0x00 - .......0 - diffSame
 * * 0x01 & 0x01 - .......1 - diffDifferent
 * * 0x06 & 0x00 - .....00. - groupNone
 * * 0x06 & 0x02 - .....01. - groupFill
 * * 0x06 & 0x06 - .....11. - groupBorder
 * * 0x30 & 0x00 - ..00.... - identical
 * * 0x30 & 0x20 - ..10.... - similar
 * * 0x30 & 0x30 - ..11.... - changed
 * * 0xC0 & 0x00 - 00...... - background
 * * 0xC0 & 0x40 - 01...... - foreground
 * * 0xC0 & 0x80 - 10...... - antialias
 *
 */
export declare const FLAGS: Record<FlagName, {
    value: number;
    mask: number;
}>;
/**
 * Generated output image from {@link diff}
 */
export type RenderOutputMap = FloatValuemap | IntValuemap | AnyRgbBitmap;
/**
 * Map of generated output images from {@link diff}
 */
export type RenderOutputMapCollection = Record<string, RenderOutputMap>;
/**
 * Render program for {@link diff} output
 */
export interface RenderProgram {
    options?: Record<string, any>;
    inputs: string[];
    fn: (maps: RenderOutputMapCollection, options: Record<string, any>) => RenderOutputMap;
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
    changedMinDistance?: number;
    /**
     * Minimum colour distance for a pixel to be considered antialiasing
     *
     * Lower values match more pixels as antialias.
     *
     * Range: `0` to `255`
     *
     * Default: `12`
     */
    antialiasMinDistance?: number;
    /**
     * Maximum colour distance for a pixel to be considered antialiasing
     *
     * Higher values match more pixels as antialias (ignored content).
     *
     * Range: `0` to `255`
     *
     * Default: `150`
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
     * Default: `25`
     */
    backgroundMaxContrast?: number;
    /**
     * Group diff pixels that are this many pixels apart or closer
     *
     * Default: `80`
     */
    groupMergeMaxGapSize?: number;
    /**
     * Thickness (in pixels) of border to draw around each diff group
     *
     * Default: `15`
     */
    groupBorderSize?: number;
    /**
     * Grow each diff group by this many pixels
     *
     * Default: `80`
     */
    groupPaddingSize?: number;
    /**
     * Include antialias pixels in diff groups
     *
     * By default, antialias pixels are ignored.
     *
     * Default: `false`
     */
    diffIncludeAntialias?: boolean;
    /**
     * Include background pixels in diff groups
     *
     * By default, background pixels are ignored.
     *
     * Default: `false`
     */
    diffIncludeBackground?: boolean;
    /**
     * Include foreground pixels in diff groups
     *
     * Default: `true`
     */
    diffIncludeForeground?: boolean;
    /**
     * Minimum percentage of diff pixels for comparison to be considered a mismatch
     *
     * A mismatch means the images being compared are so different that they are probably not based on the same image.
     *
     * Range: `0` to `100`
     *
     * Default: `50`
     */
    mismatchMinPercent?: number;
    /**
     * Output image(s) to generate
     *
     * Each value is the name of an output program
     */
    output?: string[];
    /**
     * Options for output programs
     */
    outputOptions?: Record<string, any>;
    /**
     * Named render programs for generating output images
     *
     * Default: {@link DEFAULT_OPTIONS.outputPrograms}
     */
    outputPrograms?: Record<string, RenderProgram>;
}
/**
 * Overall result of diff comparison
 */
export type DiffStatus = 'identical' | 'similar' | 'different' | 'mismatch';
/**
 * Return value of {@link diff}
 */
export interface DiffResult {
    /**
     * Generated output images
     */
    outputImages: RenderOutputMapCollection;
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
     * Pixel counts
     */
    pixelCounts: {
        /**
         * Pixel count of all pixels in image
         */
        all: number;
        /**
         * Pixel count of all pixels considered different
         */
        diff: number;
        /**
         * Pixel count of all pixels compared for difference
         */
        compared: number;
        /**
         * Pixel count of all pixels in a diff group
         */
        group: number;
        /**
         * Pixel counts by significance flag
         */
        significance: {
            /**
             * Pixel count of all foreground pixels
             */
            foreground: number;
            /**
             * Pixel count of all background pixels
             */
            background: number;
            /**
             * Pixel count of all antialias pixels
             */
            antialias: number;
        };
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
                all: number;
                /**
                 * Pixel count of all changed foreground pixels
                 */
                foreground: number;
                /**
                 * Pixel count of all changed background pixels
                 */
                background: number;
                /**
                 * Pixel count of all changed antialias pixels
                 */
                antialias: number;
            };
            /**
             * Pixels counts of pixels that are identical
             */
            identical: {
                /**
                 * Pixel count of all identical pixels
                 */
                all: number;
                /**
                 * Pixel count of all identical foreground pixels
                 */
                foreground: number;
                /**
                 * Pixel count of all identical background pixels
                 */
                background: number;
                /**
                 * Pixel count of all identical antialias pixels
                 */
                antialias: number;
            };
            /**
             * Pixels counts of pixels that are similar
             */
            similar: {
                /**
                 * Pixel count of all similar pixels
                 */
                all: number;
                /**
                 * Pixel count of all similar foreground pixels
                 */
                foreground: number;
                /**
                 * Pixel count of all similar background pixels
                 */
                background: number;
                /**
                 * Pixel count of all similar antialias pixels
                 */
                antialias: number;
            };
        };
    };
    /**
     * Pixel counts expressed as percentages (0 to 100)
     */
    pixelPercent: {
        /**
         * Percentage of all pixels in image that were compared for difference
         */
        compared: number;
        /**
         * Percentage of all pixels in image that are different
         */
        diff: number;
        /**
         * Percentage of all pixels in image that are in a diff group
         */
        group: number;
        /**
         * Percentage of compared pixels that are different
         */
        diffCompared: number;
    };
    /**
     * Time spent generating diff
     */
    timer: {
        /**
         * Total time spent on diff, in seconds
         */
        total: number;
        /**
         * Time spent generating diff flags, in seconds
         */
        flags: number;
        /**
         * Time spent generating diff groups, in seconds
         */
        groups: number;
        /**
         * Time spent generating output images, in seconds
         */
        render: number;
    };
    /**
     * Diff groups
     */
    diffGroups: AbsBox[];
}
/**
 * Generate image diff
 *
 * @param sourceImages images to generate diff for
 * @param options diff options
 * @returns diff flags valuemap and diff stats
 */
export declare function diff(sourceImages: AnyRgbBitmap[], options?: DiffOptions): DiffResult;
/**
 * Populate similarity and significance flags
 *
 * @param config config values passed from {@link diff}
 * @returns pixel stats
 */
export declare function flags(config: {
    flagsImage: IntValuemap;
    images: YiqFloatmap[];
    changedMinDistance: number;
    antialiasMinDistance: number;
    antialiasMaxDistance: number;
    backgroundMaxContrast: number;
    diffIncludeAntialias: boolean;
    diffIncludeBackground: boolean;
    diffIncludeForeground: boolean;
    distanceMap?: AnyValuemap;
    contrastMap?: AnyValuemap;
}): {
    pixelCounts: {
        all: number;
        diff: number;
        compared: number;
        significance: {
            foreground: number;
            background: number;
            antialias: number;
        };
        similarity: {
            changed: {
                all: number;
                foreground: number;
                background: number;
                antialias: number;
            };
            identical: {
                all: number;
                foreground: number;
                background: number;
                antialias: number;
            };
            similar: {
                all: number;
                foreground: number;
                background: number;
                antialias: number;
            };
        };
    };
};
/**
 * Populate diff flags with groups
 *
 * @param config config values passed from {@link diff}
 * @returns pixel stats and raw diff groups
 */
export declare function groups(config: {
    flagsImage: IntValuemap;
    groupMergeMaxGapSize: number;
    groupBorderSize: number;
    groupPaddingSize: number;
}): {
    diffGroups: AbsBox[];
    pixelCounts: {
        group: number;
    };
};
/**
 * Calculate colour distance between two pixels, as a positive number
 *
 * @param fromPixel original pixel colour data
 * @param toPixel changed pixel colour data
 * @returns colour difference between two pixels, as a positive number
 */
export declare function absColorDistance(fromPixel: YiqPixelColor, toPixel: YiqPixelColor): number;
/**
 * Calculate similarity flag for pixel
 *
 * @param pixels set of pixels to compare
 * @param changedMinDistance minimum colour distance for a pixel to be considered changed (different), compared to original
 * @returns similarity flag
 */
export declare function similarityFlag(config: {
    images: YiqFloatmap[];
    x: number;
    y: number;
    changedMinDistance: number;
}): SimilarityFlagName;
/**
 * Calculate significance flag for pixel
 *
 * @param config data passed from {@link flags}
 * @returns significance flag
 */
export declare function significanceFlag(config: {
    images: YiqFloatmap[];
    x: number;
    y: number;
    antialiasMinDistance: number;
    antialiasMaxDistance: number;
    backgroundMaxContrast: number;
    distanceMap: AnyValuemap | null;
    contrastMap: AnyValuemap | null;
}): SignificanceFlagName;
