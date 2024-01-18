import * as diffmap from '../sharp.js';
const testNum = 1;
const diffOutputs = ['flagsSignificance'];
const diffOptions = {
// diffAntialias: true,
// diffBackground: true
};
async function main() {
    const originalImage = `temp_test/inputs/${testNum}a-original.png`;
    const changedImage = `temp_test/inputs/${testNum}b-changed.png`;
    const diffOutputPaths = {};
    for (const key of diffOutputs) {
        diffOutputPaths[key] = `temp_test/outputs/${testNum}-${key}.png`;
    }
    const diffResult = await diffmap.diffFileMultiple(changedImage, originalImage, diffOutputPaths, diffOptions);
    console.log(diffResult);
}
main().catch(console.error);
