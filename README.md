# Sorting Simulations

Sort Lab is a no-build sorting visualizer built with plain HTML, CSS, JavaScript, and local p5.js.

It includes:

- Bubble Sort
- Selection Sort
- Insertion Sort
- Compare All

The current version uses a shared shell and p5-based bar rendering so every simulation page has the same layout, controls, and code-trace behavior.

## Highlights

- Smooth lerp-based bar animation in p5.js
- Shared three-column simulation layout across all algorithm pages
- Live code trace for pseudocode, Java, C++, and Python
- Play, pause, next, previous, and reset controls
- Speed slider plus Normal, Fast, and Turbo presets
- Random, reversed, nearly sorted, and few-unique input patterns
- Theme switcher with persisted selection
- Present mode for projection or classroom demos
- Direct `file://` support with no server required

## Project Structure

- `index.html` - home page
- `bubble.html` - Bubble Sort simulation
- `selection.html` - Selection Sort simulation
- `insertion.html` - Insertion Sort simulation
- `compare.html` - synchronized comparison page
- `css/theme.css` - theme variables
- `css/shell.css` - shared layout, controls, code trace, present mode
- `js/shell.js` - nav injection, theme persistence, present mode, panel collapse
- `js/controls.js` - shared playback and array generation logic
- `js/codeTrace.js` - shared code trace renderer and line highlighting
- `js/algorithms/` - step generators, code strings, and line maps
- `js/sketches/` - p5 sketches for each simulation view
- `lib/p5.min.js` - local p5.js runtime

## Quick Start

Open `index.html` directly in a modern browser.

You can also open `bubble.html`, `selection.html`, `insertion.html`, or `compare.html` directly.

No npm install, bundler, or local dev server is required.

## Local p5.js Runtime

The app expects p5.js at `lib/p5.min.js`.

If that file is missing, download p5.js v1.9.4 from:

`https://cdnjs.cloudflare.com/ajax/libs/p5.js/1.9.4/p5.min.js`

and save it as:

`lib/p5.min.js`

## Controls

- `Play` / `Pause` - run or stop playback
- `Prev` / `Next` - step backward or forward
- `Reset` - return to step 1 of the current array
- `Generate Array` - create a new array from the selected size and pattern
- `Present` - hide side panels and navigation for fullscreen-style demos

## Input Options

- Array size: 6 to 18 values
- Patterns: Random, Reversed, Nearly Sorted, Few Unique
- Compare All uses the same starting array for all three algorithms

## Themes

Available themes:

- Dark
- Light
- Ocean
- Forest

The selected theme is stored in `localStorage` and persists across page navigation.

## Optional Local Server

The included helper scripts still work if you prefer serving the files locally:

- `run-local.sh`
- `run-local.bat`

They are optional because the project is designed to work without a server.
