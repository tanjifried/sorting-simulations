# Sorting Simulations (Sort Lab)

Sort Lab is an educational, no-build sorting visualizer built with plain HTML, CSS, JavaScript, and local p5.js. It is designed to help students and developers understand how sorting algorithms work through smooth, staged performances.

## Highlights (v1.6.x)

- **Floating Key Animation**: Insertion Sort now physically "lifts" the key element and shows the "hole" shifting, making it much easier to follow.
- **Competition Mode**: Compare multiple algorithms side-by-side in a dynamic grid. Add as many panels as you want!
- **Adaptive Speed**: Animations automatically scale or skip based on playback speed to prevent visual bottlenecks.
- **Update System**: Built-in notification banner when a new version is released.
- **Live Code Trace**: Real-time line highlighting for Pseudocode, Java, C++, and Python.

## Requirements for New Users

To get the most out of Sort Lab, we recommend the following:

### 1. Git (Highly Recommended)
We use Git to manage updates. If you have Git installed, you can receive the latest features and bug fixes with a single click.
- **Download Git**: [https://git-scm.com/downloads](https://git-scm.com/downloads)
- **Why?**: It allows you to use the `update.bat` or `update.sh` scripts included in this folder.

Install Git by OS:

```bash
# Windows (PowerShell)
winget install --id Git.Git -e

# macOS (Homebrew)
brew install git

# Linux (Debian/Ubuntu)
sudo apt update && sudo apt install -y git
```

### 2. Local p5.js Runtime
The app expects p5.js at `lib/p5.min.js`. If you downloaded this via a `.zip` file, make sure the `lib` folder is present.
- If missing, download p5.js v1.9.4 from: [https://cdnjs.cloudflare.com/ajax/libs/p5.js/1.9.4/p5.min.js](https://cdnjs.cloudflare.com/ajax/libs/p5.js/1.9.4/p5.min.js) and save it as `lib/p5.min.js`.

## Quick Start

Project repository: https://github.com/tanjifried/sorting-simulations.git

1. **Open `index.html`** directly in any modern browser (Chrome, Firefox, Edge, Safari).
2. **Explore Algorithms**: Launch Bubble, Selection, or Insertion sort from the home page.
3. **Run a Race**: Open `compare.html` to see algorithms compete on the same data.

## Keeping Up to Date

If you cloned this repository via Git (https://github.com/tanjifried/sorting-simulations.git), simply run the update script for your OS:
- **Windows**: Double-click `update.bat`
- **Mac/Linux**: Run `./update.sh` in your terminal

A notification banner will appear in the app whenever a newer version is available on GitHub.

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
