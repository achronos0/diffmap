
import * as diffmap from '../src/sharp.js'

const TEST_COUNT = 3
const REPEAT_COUNT = 1
const DIFF_OUTPUTS: string[] = ['pixels', 'groups', 'flagsDiffGroups', 'flagsDiffPixels', 'flagsSimilarity', 'flagsSignificance']
const DIFF_OPTIONS: diffmap.diff.DiffOptions = {
	outputWhenStatus: diffmap.diff.DIFF_STATUS_ALL,
}

async function main () {
	for (let testNum = 1; testNum <= TEST_COUNT; testNum++) {
		const originalImage = `test/inputs/${testNum}a.png`
		const changedImage = `test/inputs/${testNum}b.png`
		const diffOutputPaths: Record<string, string> = {}
		for (const key of DIFF_OUTPUTS) {
			diffOutputPaths[key] = `test/outputs/${testNum}-${key}.png`
		}
		const timers: {
			total: number[]
			flags: number[]
			groups: number[]
			render: number[]
		} = {
			total: [],
			flags: [],
			groups: [],
			render: [],
		}
		for (let i = 0; i < REPEAT_COUNT; i++) {
			console.log(`Running test ${testNum} iteration ${i + 1}`)
			const diffResult = await diffmap.diffFile(
				[changedImage, originalImage],
				diffOutputPaths,
				DIFF_OPTIONS
			)
			if (i === 0) {
				const deepConsole = new console.Console({
					stdout: process.stdout,
					stderr: process.stderr,
					ignoreErrors: true,
					inspectOptions: { colors: true, depth: 15, maxArrayLength: 100, breakLength: 120, compact: 3 }
				})
				deepConsole.log(`Test ${testNum} results:`, diffResult)
			}
			timers.total.push(diffResult.timer.total)
			timers.flags.push(diffResult.timer.flags)
			timers.groups.push(diffResult.timer.groups)
			timers.render.push(diffResult.timer.render)
		}
		for (const key of Object.keys(timers)) {
			const values = timers[key as keyof typeof timers]
			const sum = values.reduce((a, b) => a + b, 0)
			const avg = sum / values.length
			const min = Math.min(...values)
			const max = Math.max(...values)
			console.log(`Test ${testNum} ${key} avg:`, avg)
			console.log(`Test ${testNum} ${key} min:`, min)
			console.log(`Test ${testNum} ${key} max:`, max)
		}
	}
}
main().catch(console.error)
