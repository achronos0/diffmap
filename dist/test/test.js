import { diffFile } from '../sharp.js';
const originalImage = 'test/inputs/1a-original.png';
const changedImage = 'test/inputs/1b-changed.png';
const diffImage = 'test/outputs/1-diff.png';
async function main() {
    await diffFile(changedImage, originalImage, diffImage);
}
main().catch(console.error);
