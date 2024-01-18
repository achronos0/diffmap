/**
 * diff generation functions
 *
 * @module
 */
import { diffGroups, diffPixels, diffStats, render, significance } from './flags.js';
import { yiq } from './image-rgb.js';
import { Valuemap } from './types.js';
/**
 * Generate raw diff flags image
 *
 * @param sourceImage image to generate diff for
 * @param originalImage image to compare against
 * @param options diff options
 * @returns flags image and diff results
 */
export function raw(sourceImage, originalImage, options = {}) {
    const yiqSourceImage = yiq(sourceImage);
    const yiqOriginalImage = yiq(originalImage);
    const flagsImage = Valuemap.createIntmap(yiqSourceImage.width, yiqSourceImage.height);
    const significanceResult = significance(flagsImage, yiqSourceImage, options);
    const diffPixelsResult = diffPixels(flagsImage, yiqSourceImage, yiqOriginalImage, options);
    const diffGroupsResult = diffGroups(flagsImage, options);
    const diffStatsResult = diffStats(flagsImage, diffPixelsResult, diffGroupsResult, options);
    return {
        flagsImage,
        ...diffStatsResult,
        ...diffPixelsResult,
        ...diffGroupsResult,
        ...significanceResult
    };
}
/**
 * Default value for {@link RgbDiffOptions.output}
 */
export const DEFAULT_RGB_DIFF_OUTPUT = 'groups';
/**
 * Generate image diff
 *
 * @param sourceImage image to generate diff for
 * @param originalImage image to compare against
 * @param options diff options
 * @returns
 */
export function rgb(sourceImage, originalImage, options = {}) {
    const { output = DEFAULT_RGB_DIFF_OUTPUT } = options;
    const result = rgbMultiple(sourceImage, originalImage, [output], options);
    const { resultImages } = result;
    const resultImage = resultImages[output];
    return { resultImage, ...result };
}
/**
 * Generate image diff in multiple formats
 *
 * @param sourceImage image to generate diff for
 * @param originalImage image to compare against
 * @param outputs output images to generate; each value is the name of an output program
 * @param options diff options
 * @returns
 */
export function rgbMultiple(sourceImage, originalImage, outputs, options = {}) {
    const { flagsImage, ...result } = raw(sourceImage, originalImage, options);
    const resultImages = render(flagsImage, sourceImage, originalImage, outputs, options);
    return { resultImages, ...result };
}
