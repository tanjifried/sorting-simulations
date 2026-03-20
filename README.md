# Sorting Simulations

This folder contains four self-contained HTML simulations:

- Bubble Sort
- Selection Sort
- Insertion Sort
- Compare All (side-by-side race)

Each simulation is designed for non-coders:

- clear color legends
- plain-language step narration
- live counters (passes, comparisons, swaps/shifts)
- play, pause, step forward/back, reset
- scenario presets (best, average, worst, nearly sorted)
- custom input arrays
- faster playback controls (slider plus Normal/Fast/Turbo presets)

## Files

- `index.html` - landing page and quick algorithm comparison
- `bubble_sort_simulation.html`
- `selection_sort_simulation.html`
- `insertion_sort_simulation.html`
- `compare_all_simulation.html` - runs all 3 algorithms together on one array
- `run-local.sh` - quick local server script for Linux/macOS
- `run-local.bat` - quick local server script for Windows
- `SortingAlgorithms_SimulationPlan.md` - original implementation plan

## Quick Start (Clone)

```bash
git clone <your-repo-url>
cd sorting-simulation
bash run-local.sh
```

Then open `http://localhost:8080`.

## Quick Start (ZIP Download)

1. Download and extract the ZIP.
2. Open a terminal in the extracted `sorting-simulation` folder.
3. Start a local server:

   - Linux/macOS: `bash run-local.sh`
   - Windows: `run-local.bat`

4. Open `http://localhost:8080`.

## Manual Run (No Scripts)

No build tools are required.

1. Open `index.html` in a modern browser.
2. Click any algorithm card (including Compare All).

You can also open each simulation HTML file directly.

## Input Notes

- Custom input must be comma-separated numbers.
- Supported size: 5 to 20 values.
- Supported value range: 1 to 999.

## Teaching Tips

- Start with a small array (8-10 values) and slower speed.
- Use Step Forward while narrating what each color means.
- Try a nearly sorted input to observe how insertion and bubble can behave faster.
