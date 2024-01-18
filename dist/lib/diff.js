/**
 * REWRITE diff generation functions
 *
 * @module
 */
import { boxIntersect, fitBox } from './box.js';
import { blend, greyscale, yiq as rgbToYiq } from './image-rgb.js';
import { rgb as valuesToRgb } from './image-value.js';
import { colorDistance, contrast } from './pixel-yiq.js';
import { Valuemap } from './types.js';
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
export const FLAGS = {
    // Diff flags
    diffSame: {
        value: 0x00,
        mask: 0x01
    },
    diffDifferent: {
        value: 0x01,
        mask: 0x01
    },
    // Group flags
    groupNone: {
        value: 0x00,
        mask: 0x06
    },
    groupFill: {
        value: 0x02,
        mask: 0x06
    },
    groupBorder: {
        value: 0x06,
        mask: 0x06
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
};
const DEFAULT_OPTIONS = {
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
            inputs: ['changedFaded', 'flagsDiffGroups', 'flagsDiffPixels'],
            fn: (maps) => {
                const { changedFaded, flagsDiffGroups, flagsDiffPixels } = maps;
                const o1 = blend(changedFaded, flagsDiffGroups);
                return blend(o1, flagsDiffPixels);
            }
        },
        pixels: {
            inputs: ['changedFaded', 'flagsDiffPixels'],
            fn: (maps) => {
                const { changedFaded, flagsDiffPixels } = maps;
                return blend(changedFaded, flagsDiffPixels);
            }
        },
        changedFaded: {
            options: {
                fade: 0.5
            },
            inputs: ['changed'],
            fn: (maps, options) => {
                const { fade } = options;
                return greyscale(maps.changed, { fade });
            },
        },
        flagsDiffPixels: {
            options: {
                diffPixelColor: { r: 255, g: 64, b: 0, a: 255 },
            },
            inputs: ['flags'],
            fn: (maps, options) => {
                const { diffPixelColor } = options;
                return valuesToRgb(maps.flags, {
                    palette: [
                        {
                            match: {
                                mask: FLAGS.diffDifferent.mask,
                                value: FLAGS.diffDifferent.value
                            },
                            color: diffPixelColor
                        }
                    ]
                });
            }
        },
        flagsDiffGroups: {
            options: {
                groupBorderColor: { r: 255, g: 0, b: 0, a: 255 },
                groupFillColor: { r: 255, g: 0, b: 255, a: 128 }
            },
            inputs: ['flags'],
            fn: (maps, options) => {
                const { groupBorderColor, groupFillColor } = options;
                return valuesToRgb(maps.flags, {
                    palette: [
                        {
                            match: {
                                mask: FLAGS.groupBorder.mask,
                                value: FLAGS.groupBorder.value
                            },
                            color: groupBorderColor
                        },
                        {
                            match: {
                                mask: FLAGS.groupFill.mask,
                                value: FLAGS.groupFill.value
                            },
                            color: groupFillColor
                        }
                    ]
                });
            }
        },
        flagsSimilarity: {
            options: {
                identicalColor: { r: 0, g: 0, b: 0, a: 255 },
                similarColor: { r: 128, g: 128, b: 128, a: 255 },
                changedColor: { r: 255, g: 255, b: 255, a: 255 }
            },
            inputs: ['flags'],
            fn: (maps, options) => {
                const { identicalColor, similarColor, changedColor } = options;
                return valuesToRgb(maps.flags, {
                    palette: [
                        {
                            match: {
                                mask: FLAGS.changed.mask,
                                value: FLAGS.changed.value
                            },
                            color: changedColor
                        },
                        {
                            match: {
                                mask: FLAGS.similar.mask,
                                value: FLAGS.similar.value
                            },
                            color: similarColor
                        },
                        {
                            color: identicalColor
                        }
                    ]
                });
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
                const { antialiasColor, backgroundColor, foregroundColor } = options;
                return valuesToRgb(maps.flags, {
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
                });
            }
        },
    }
};
/**
 * Generate image diff
 *
 * @param sourceImages images to generate diff for
 * @param options diff options
 * @returns diff flags valuemap and diff stats
 */
export function diff(sourceImages, options = {}) {
    const { changedMinDistance, antialiasMinDistance, antialiasMaxDistance, backgroundMaxContrast, groupMergeMaxGapSize, groupBorderSize, groupPaddingSize, diffIncludeAntialias, diffIncludeBackground, diffIncludeForeground, mismatchMinPercent, output, outputOptions, outputPrograms } = { ...DEFAULT_OPTIONS, ...options };
    // Validate images and conver to YIQ
    const { length } = sourceImages;
    if (length < 2) {
        throw new Error(`diff requires at least 2 images, got ${length}`);
    }
    const { width, height } = sourceImages[0];
    const yiqImages = sourceImages.map(image => {
        if (image.width !== width || image.height !== height) {
            throw new Error(`diff requires all images to have the same dimensions, got ${width}x${height} and ${image.width}x${image.height}`);
        }
        return rgbToYiq(image);
    });
    // Generate similarity and significance flags
    const flagsImage = Valuemap.createIntmap(width, height);
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
    });
    // Generate diff flags
    const { diffGroups, pixelCounts: pixelCountGroup } = groups({
        flagsImage,
        groupMergeMaxGapSize,
        groupBorderSize,
        groupPaddingSize
    });
    // Assemble pixel counts and percentages
    const pixelCounts = { ...pixelCountsDiff, ...pixelCountGroup };
    const pixelPercent = {
        compared: 100 * pixelCounts.compared / pixelCounts.all,
        diff: 100 * pixelCounts.diff / pixelCounts.all,
        group: 100 * pixelCounts.group / pixelCounts.all,
        diffCompared: 100 * pixelCounts.diff / pixelCounts.compared
    };
    // Determine overall diff status
    let diffStatus;
    if (pixelCounts.diff) {
        if (pixelPercent.diff >= mismatchMinPercent) {
            diffStatus = 'mismatch';
        }
        else {
            diffStatus = 'different';
        }
    }
    else {
        if (pixelCounts.similarity.similar.all) {
            diffStatus = 'similar';
        }
        else {
            diffStatus = 'identical';
        }
    }
    // Generate output images
    const { outputImages } = render({
        flagsImage,
        sourceImages,
        output,
        outputOptions,
        outputPrograms
    });
    return {
        diffStatus,
        pixelCounts,
        pixelPercent,
        diffGroups,
        outputImages
    };
}
/**
 * Populate similarity and significance flags
 *
 * @param config config values passed from {@link diff}
 * @returns pixel stats
 */
export function flags(config) {
    const { flagsImage, images, changedMinDistance, antialiasMinDistance, antialiasMaxDistance, backgroundMaxContrast, diffIncludeAntialias, diffIncludeBackground, diffIncludeForeground, distanceMap = null, contrastMap = null } = config;
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
    };
    images[0].iterateAll(({ x, y, index, offset }) => {
        // Get pixels to compare
        const comparePixels = images.map(image => image.pixel(offset));
        // Calculate max colour distance between pixels
        let maxDistance = 0;
        for (let i = 0; i < comparePixels.length - 1; i++) {
            for (let j = i + 1; j < comparePixels.length; j++) {
                const distance = Math.abs(colorDistance(comparePixels[i], comparePixels[j]));
                if (distance > maxDistance) {
                    maxDistance = distance;
                }
            }
        }
        // Determine significance flag of pixel (is it antialias, background, or foreground)
        // Run this check for each image, and ensure all images agree on significance
        let significance = null;
        for (let imageIndex = 0; imageIndex < images.length; imageIndex++) {
            const image = images[imageIndex];
            const sourcePixel = comparePixels[imageIndex];
            // Compare this pixel to adjacent pixels in its image; calculate max distance and contrast, and count equal pixels
            let maxDistance = 0;
            let maxContrast = 0;
            let countEqual = 0;
            image.iterateAdjacent(x, y, ({ offset: adjacentOffset }) => {
                // Get adjacent pixel to compare
                const adjacentPixel = image.pixel(adjacentOffset);
                // Calculate colour distance and contrast
                const pixelDistance = Math.abs(colorDistance(sourcePixel, adjacentPixel));
                if (!pixelDistance) {
                    // Pixels are identical
                    countEqual++;
                }
                else {
                    // Record max distance
                    if (pixelDistance > maxDistance) {
                        maxDistance = pixelDistance;
                    }
                    // Record max contrast (brightness only difference)
                    const pixelContrast = Math.abs(contrast(sourcePixel, adjacentPixel));
                    if (pixelContrast > maxContrast) {
                        maxContrast = pixelContrast;
                    }
                }
            });
            // Optionally store distance and contrast to provided maps
            if (distanceMap) {
                distanceMap.setPixel(index, maxDistance);
            }
            if (contrastMap) {
                contrastMap.setPixel(index, maxContrast);
            }
            // Determine significance of this pixel (is it antialias, background, or foreground)
            let pixelSignificance;
            if (countEqual < 3 &&
                maxDistance >= antialiasMinDistance &&
                maxDistance <= antialiasMaxDistance &&
                maxContrast >= antialiasMinDistance &&
                maxContrast <= antialiasMaxDistance) {
                // Pixel is antialias:
                pixelSignificance = 'antialias';
            }
            else if (maxContrast <= backgroundMaxContrast) {
                // Pixel is background
                pixelSignificance = 'background';
            }
            else {
                // Pixel is foreground
                pixelSignificance = 'foreground';
            }
            // Set overall significance for this pixel across all images
            if (pixelSignificance === 'foreground' ||
                (significance && pixelSignificance !== significance)) {
                // Pixel is foreground OR not all images agree on significance
                significance = 'foreground';
                // No need to check other images
                break;
            }
            if (!significance) {
                significance = pixelSignificance;
            }
        }
        if (!significance) {
            significance = 'foreground';
        }
        // Determine similarity flag for this pixel
        let similarity;
        if (!maxDistance) {
            similarity = 'identical';
        }
        else if (maxDistance < changedMinDistance) {
            similarity = 'similar';
        }
        else {
            similarity = 'changed';
        }
        // Determine overall diff status for this pixel
        const compared = ((diffIncludeForeground && significance === 'foreground') ||
            (diffIncludeBackground && significance === 'background') ||
            (diffIncludeAntialias && significance === 'antialias'));
        const diff = similarity === 'changed' && compared;
        // Set flags for this pixel
        let flags = FLAGS[similarity].value + FLAGS[significance].value;
        if (diff) {
            flags += FLAGS.diffDifferent.value;
        }
        flagsImage.setPixel(index, flags);
        // Increment pixel counts
        pixelCounts.significance[significance]++;
        pixelCounts.similarity[similarity].all++;
        pixelCounts.similarity[similarity][significance]++;
        if (compared) {
            pixelCounts.compared++;
        }
        if (diff) {
            pixelCounts.diff++;
        }
    });
    return { pixelCounts };
}
/**
 * Populate diff flags with groups
 *
 * @param config config values passed from {@link diff}
 * @returns pixel stats and raw diff groups
 */
export function groups(config) {
    const { flagsImage, groupMergeMaxGapSize, groupBorderSize, groupPaddingSize } = config;
    // Find diff groups
    const diffFlagValue = FLAGS.diffDifferent.value;
    let groups = [];
    flagsImage.iterateAll(({ x: currentX, y: currentY, offset }) => {
        const flags = flagsImage.pixel(offset);
        if ((flags & diffFlagValue) !== diffFlagValue) {
            return;
        }
        // Find existing group to merge into
        let foundGroup = false;
        for (let i = 0; i < groups.length; i++) {
            const group = groups[i];
            if (currentX >= group.left - groupMergeMaxGapSize &&
                currentX <= group.right + groupMergeMaxGapSize &&
                currentY >= group.top - groupMergeMaxGapSize &&
                currentY <= group.bottom + groupMergeMaxGapSize) {
                if (currentX < group.left) {
                    group.left = currentX;
                }
                if (currentX > group.right) {
                    group.right = currentX;
                }
                if (currentY < group.top) {
                    group.top = currentY;
                }
                if (currentY > group.bottom) {
                    group.bottom = currentY;
                }
                foundGroup = true;
                break;
            }
        }
        if (foundGroup) {
            return;
        }
        // Create new group
        const group = {
            left: currentX,
            top: currentY,
            right: currentX,
            bottom: currentY
        };
        groups.push(group);
    });
    // Grow groups by padding size
    if (groupPaddingSize) {
        groups = groups.map(group => fitBox(flagsImage.width, flagsImage.height, group, groupPaddingSize));
    }
    // Merge overlapping groups
    groups = groups.reduce((mergedGroups, group) => {
        let foundGroup = false;
        for (let i = 0; i < mergedGroups.length; i++) {
            const mergedGroup = mergedGroups[i];
            if (boxIntersect(group, mergedGroup)) {
                if (group.left < mergedGroup.left) {
                    mergedGroup.left = group.left;
                }
                if (group.right > mergedGroup.right) {
                    mergedGroup.right = group.right;
                }
                if (group.top < mergedGroup.top) {
                    mergedGroup.top = group.top;
                }
                if (group.bottom > mergedGroup.bottom) {
                    mergedGroup.bottom = group.bottom;
                }
                foundGroup = true;
                break;
            }
        }
        if (!foundGroup) {
            mergedGroups.push(group);
        }
        return mergedGroups;
    }, []);
    // Draw groups onto flags image
    let pixelCount = 0;
    for (const group of groups) {
        pixelCount += (group.right - group.left + 1) * (group.bottom - group.top + 1);
        for (let y = group.top; y <= group.bottom; y++) {
            for (let x = group.left; x <= group.right; x++) {
                const flag = y < group.top + groupBorderSize ||
                    y > group.bottom - groupBorderSize ||
                    x < group.left + groupBorderSize ||
                    x > group.right - groupBorderSize
                    ? FLAGS.groupBorder.value
                    : FLAGS.groupFill.value;
                const offset = flagsImage.offset(x, y);
                let pixel = flagsImage.pixel(offset);
                pixel |= flag;
                flagsImage.setPixel(offset, pixel);
            }
        }
    }
    return {
        diffGroups: groups,
        pixelCounts: {
            group: pixelCount
        }
    };
}
/**
 * Generate output images
 *
 * @param config config values passed from {@link diff}
 * @returns output images
 */
function render(config) {
    const { flagsImage, sourceImages, output, outputOptions, outputPrograms } = config;
    const allMaps = {
        flags: flagsImage,
        original: sourceImages[0],
        changed: sourceImages[sourceImages.length - 1]
    };
    const generateMap = (name) => {
        if (allMaps[name]) {
            return allMaps[name];
        }
        const program = outputPrograms[name];
        if (!program) {
            throw new Error(`Missing program: ${name}`);
        }
        for (const input of program.inputs) {
            generateMap(input);
        }
        const result = program.fn(allMaps, { ...program.options, ...outputOptions });
        allMaps[name] = result;
        return result;
    };
    const outputImages = {};
    for (const outputName of output) {
        outputImages[outputName] = generateMap(outputName);
    }
    return { outputImages };
}
