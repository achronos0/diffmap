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
 * Generate image diff
 *
 * @param sourceImage image to generate diff for
 * @param originalImage image to compare against
 * @param options diff options
 * @returns
 */
export function rgb(sourceImage, originalImage, options = {}) {
    const result = raw(sourceImage, originalImage, options);
    const { flagsImage } = result;
    const resultImage = render(flagsImage, sourceImage, originalImage, options);
    return { resultImage, ...result };
}
