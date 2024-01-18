/**
 * Valuemap image manipulation functions
 *
 * @module
 */
import { RgbaBitmap } from './types.js';
/**
 * Render (draw) a valuemap as an RGBA image
 *
 * @param sourceImage valuemap of data to render
 * @param options rendering options
 * @returns RGBA image
 */
export function rgb(sourceImage, options = {}) {
    const { palette = [{
            gradient: { from: { r: 0, g: 0, b: 0, a: 255 }, to: { r: 255, g: 255, b: 255, a: 255 } }
        }] } = options;
    const instructions = palette.map(instruction => {
        let { match = [{}], color = { r: 0, g: 0, b: 0, a: 255 }, gradient = null } = instruction;
        if (!Array.isArray(match)) {
            match = [match];
        }
        const finalMatches = match.map(match => {
            if (typeof match === 'number') {
                return {
                    value: [match]
                };
            }
            if ('value' in match) {
                if ('mask' in match) {
                    return {
                        mask: match.mask,
                        value: match.value
                    };
                }
                return {
                    value: Array.isArray(match.value) ? match.value : [match.value]
                };
            }
            if ('range' in match) {
                return {
                    range: match.range
                };
            }
            return {
                all: true
            };
        });
        if (gradient) {
            return {
                match: finalMatches,
                gradient: {
                    from: gradient.from,
                    ratio: {
                        r: (gradient.to.r - gradient.from.r) / 255,
                        g: (gradient.to.g - gradient.from.g) / 255,
                        b: (gradient.to.b - gradient.from.b) / 255,
                        a: (gradient.to.a - gradient.from.a) / 255
                    }
                }
            };
        }
        return { match: finalMatches, color };
    });
    const resultImage = RgbaBitmap.create(sourceImage.width, sourceImage.height);
    sourceImage.iterateAll(({ index }) => {
        const pixel = sourceImage.pixel(index);
        for (const instruction of instructions) {
            // Check if pixel matches instruction
            let foundMatch = false;
            for (const match of instruction.match) {
                if (match.mask != null) {
                    if ((pixel & match.mask) === match.value) {
                        foundMatch = true;
                        break;
                    }
                    continue;
                }
                if (match.value != null) {
                    if (match.value.includes(pixel)) {
                        foundMatch = true;
                        break;
                    }
                    continue;
                }
                if (match.range != null) {
                    if (pixel >= match.range[0] && pixel <= match.range[1]) {
                        foundMatch = true;
                        break;
                    }
                    continue;
                }
                foundMatch = true;
            }
            if (foundMatch) {
                let resultPixel;
                if (instruction.gradient) {
                    const { from, ratio } = instruction.gradient;
                    resultPixel = {
                        r: from.r + ratio.r * pixel,
                        g: from.g + ratio.g * pixel,
                        b: from.b + ratio.b * pixel,
                        a: from.a + ratio.a * pixel
                    };
                }
                else {
                    resultPixel = instruction.color;
                }
                const resultOffset = resultImage.offsetFromIndex(index);
                resultImage.setPixel(resultOffset, resultPixel);
                return;
            }
        }
    });
    return resultImage;
}
