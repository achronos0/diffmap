
import * as diffmap from '../sharp.js'

const testNum = 1
const diffOutputs: string[] = ['pixels', 'groups', 'flagsDiffGroups', 'flagsDiffPixels', 'flagsSimilarity', 'flagsSignificance']
const diffOptions: diffmap.diff.DiffOptions = {
	// diffIncludeAntialias: true,
	// diffIncludeBackground: true
}

async function main () {
	const originalImage = `temp_test/inputs/${testNum}a-original.png`
	const changedImage = `temp_test/inputs/${testNum}b-changed.png`
	const diffOutputPaths: Record<string, string> = {}
	for (const key of diffOutputs) {
		diffOutputPaths[key] = `temp_test/outputs/${testNum}-${key}.png`
	}
	const diffResult = await diffmap.diffFile(
		[changedImage, originalImage],
		diffOutputPaths,
		diffOptions
	)
	console.log(diffResult)
}
main().catch(console.error)
