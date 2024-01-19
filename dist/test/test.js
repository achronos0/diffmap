import * as diffmap from '../sharp.js';
const testNum = 1;
const diffOutputs = ['pixels', 'groups', 'flagsDiffGroups', 'flagsDiffPixels', 'flagsSimilarity', 'flagsSignificance'];
const diffOptions = {
// diffIncludeAntialias: true,
// diffIncludeBackground: true
};
const repeat = 1;
async function main() {
    const originalImage = `temp_test/inputs/${testNum}a-original.png`;
    const changedImage = `temp_test/inputs/${testNum}b-changed.png`;
    const diffOutputPaths = {};
    for (const key of diffOutputs) {
        diffOutputPaths[key] = `temp_test/outputs/${testNum}-${key}.png`;
    }
    const timers = {
        total: [],
        flags: [],
        groups: [],
        render: [],
    };
    for (let i = 0; i < repeat; i++) {
        const diffResult = await diffmap.diffFile([changedImage, originalImage], diffOutputPaths, diffOptions);
        if (i === 0) {
            console.log(diffResult);
        }
        timers.total.push(diffResult.timer.total);
        timers.flags.push(diffResult.timer.flags);
        timers.groups.push(diffResult.timer.groups);
        timers.render.push(diffResult.timer.render);
    }
    console.log('Runs:', repeat);
    for (const key of Object.keys(timers)) {
        const values = timers[key];
        const sum = values.reduce((a, b) => a + b, 0);
        const avg = sum / values.length;
        const min = Math.min(...values);
        const max = Math.max(...values);
        console.log(`${key} avg:`, avg);
        console.log(`${key} min:`, min);
        console.log(`${key} max:`, max);
    }
}
main().catch(console.error);
