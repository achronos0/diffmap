# diffmap

Image difference calculator

## Overview

### What

* Compare two raster images (images)
* Determine whether they are "equal"
* Generate a visual representation of the differences, if any (a "diff image")
* Calculate stats about the differences

### Why

Other JS libraries for generating image differences that I could find are ancient, browser-only, and/or not very supported.

Goals:

* Universal: runs anywhere, browser or server
* Stgandalone: no dependencies, no assumptions; does not require `<canvas>`, does not assume any specific image handling library
* Configurable: everything can be changed to suit your use case
* Readable: everything can be reasonably understood by reading the source
* Reusable: everything is structured to allow it to be extended, or decomposed and repurposed

### Prior art

Inspired by [`pixelmatch`](https://www.npmjs.com/package/pixelmatch), and fulfils the same purpose, but with added goals of clarity and reusability. Pixelmatch is great but (as of 2023) may be unsupported, is not well documented in its implementation, and can't really be reused without just rewriting it. Which is what `diffmap` does.

## Usage

TBD

## Dev plan

* write all basic functionality
* create unit tests
* write core helpers
* write sharp helpers
* write basic cli tool
* create integration tests
