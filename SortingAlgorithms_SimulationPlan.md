# Sorting Algorithms — Simulation Plan
## Algorithms & Complexity | Chapter II

> **Purpose:** This document outlines the design and implementation plan for three independent, browser-based visual simulations — one per sorting algorithm. Each simulation is self-contained in a single HTML file with embedded CSS and JavaScript.

---

## General Architecture

All three simulations share a common design philosophy:

- **Single-file HTML** (no external dependencies except optional CDN fonts)
- **Step-by-step animation** with pause/play/speed control
- **Color-coded visual states** (unsorted, comparing, swapping/inserting, sorted)
- **Live stats panel** showing comparison count, swap/shift count, and current pass number
- **Array input controls** (random generate, custom input, preset sizes)
- **Complexity display** that updates contextually per scenario

---

## Simulation 1 — Bubble Sort Visualizer

### File
`bubble_sort_simulation.html`

### UI Layout
```
┌─────────────────────────────────────────────────────┐
│  BUBBLE SORT VISUALIZER                    [?] Info │
├──────────────┬──────────────────────────────────────┤
│  Controls    │  Array Visualization (Bar Chart)     │
│  ─────────── │                                      │
│  [Generate]  │  ████ ██████ ███ █████ ██ ████████  │
│  [Custom]    │   34    64   12   25   11    90      │
│  Speed: ──○  │                                      │
│  [▶ Play]    │  ← Comparing  ← Swapping  ← Sorted  │
│  [⏸ Pause]  │                                      │
│  [↺ Reset]  ├──────────────────────────────────────┤
│              │  Pass: 1 / 6  |  Step: 3 / 15       │
│  Stats       │  Comparisons: 12  |  Swaps: 4       │
│  Comps: 12   │                                      │
│  Swaps: 4    │  Complexity: O(n²) worst             │
└──────────────┴──────────────────────────────────────┘
```

### Color Scheme
| State       | Color     | Meaning                          |
|-------------|-----------|----------------------------------|
| Default     | `#2E86C1` | Unsorted element                 |
| Comparing   | `#F0B429` | Currently being compared (pair)  |
| Swapping    | `#E74C3C` | Elements being swapped           |
| Sorted      | `#1E8449` | Element in final sorted position |
| No swap     | `#8E44AD` | Comparison with no swap needed   |

### Animation Steps (per pass)
1. Highlight bars at index `j` and `j+1` as **Comparing** (yellow)
2. If `A[j] > A[j+1]`: flash both as **Swapping** (red), animate bar height swap
3. If `A[j] <= A[j+1]`: briefly show **No swap** (purple), advance
4. After pass completes: mark last unsorted element as **Sorted** (green)
5. If no swaps in a pass: highlight entire array green (early exit)

### Key JavaScript Data Structures
```javascript
// Pre-compute all steps before animation starts
function computeSteps(arr) {
  const steps = [];
  const a = [...arr];
  const n = a.length;
  const sorted = new Set();

  for (let i = 0; i < n - 1; i++) {
    let swapped = false;
    for (let j = 0; j < n - 1 - i; j++) {
      steps.push({
        type: 'compare',
        array: [...a],
        indices: [j, j + 1],
        sorted: [...sorted],
        pass: i + 1,
        comparisons: steps.filter(s => s.type === 'compare').length + 1
      });

      if (a[j] > a[j + 1]) {
        [a[j], a[j + 1]] = [a[j + 1], a[j]];
        swapped = true;
        steps.push({
          type: 'swap',
          array: [...a],
          indices: [j, j + 1],
          sorted: [...sorted],
          pass: i + 1
        });
      }
    }
    sorted.add(n - 1 - i);
    if (!swapped) {
      // Mark all remaining as sorted (early exit)
      for (let k = 0; k <= n - 1 - i; k++) sorted.add(k);
      steps.push({ type: 'done', array: [...a], sorted: [...sorted] });
      break;
    }
  }
  return steps;
}
```

### Controls
- **Generate Random**: Fill array with 8–16 random values (range 5–100)
- **Custom Input**: Text field accepting comma-separated values
- **Speed Slider**: Controls animation interval (50ms to 1000ms)
- **Play / Pause**: Toggle animation
- **Step Forward / Step Back**: Manual stepping through pre-computed steps
- **Reset**: Return to initial state

### Stats Panel Updates (real-time)
```javascript
function updateStats(step) {
  document.getElementById('pass').textContent = step.pass;
  document.getElementById('comps').textContent = step.comparisons;
  document.getElementById('swaps').textContent = step.swaps;

  // Dynamic complexity label
  const complexity = step.isEarlyExit ? 'O(n) — Early Exit!' : 'O(n²)';
  document.getElementById('complexity').textContent = complexity;
}
```

---

## Simulation 2 — Selection Sort Visualizer

### File
`selection_sort_simulation.html`

### UI Layout
```
┌─────────────────────────────────────────────────────┐
│  SELECTION SORT VISUALIZER                 [?] Info │
├──────────────┬──────────────────────────────────────┤
│  Controls    │  ████ ██████ ███ █████ ██ ████████  │
│              │   64    25   12   22   11    90      │
│  [Generate]  │                                      │
│  [Custom]    │  ← Min Found  ← Scanning ← Sorted   │
│  Speed: ──○  │                                      │
│  [▶ Play]    ├──────────────────────────────────────┤
│  [⏸ Pause]  │  Pass: 2/5 | Sorted: 1 | Remaining:4│
│  [↺ Reset]  │  Comparisons: 8  |  Swaps: 1        │
│              │                                      │
│  Current Min │  Complexity: O(n²) — ALL cases      │
│  [  12  ]   │                                      │
└──────────────┴──────────────────────────────────────┘
```

### Color Scheme
| State       | Color     | Meaning                               |
|-------------|-----------|---------------------------------------|
| Default     | `#2E86C1` | Unsorted, not currently scanned       |
| Scanning    | `#F0B429` | Currently being scanned as candidate  |
| Current Min | `#E67E22` | Current minimum found so far          |
| Swapping    | `#E74C3C` | The swap being performed              |
| Sorted      | `#1E8449` | Element in its final sorted position  |

### Animation Steps (per pass)
1. Mark `A[i]` as **Current Min** initially (orange)
2. For each `j > i`: highlight `A[j]` as **Scanning** (yellow)
3. If `A[j] < A[minIndex]`: update **Current Min** marker to `j`, show "New minimum!"
4. After scan: animate swap between `A[i]` and `A[minIndex]` (red flash)
5. Move `A[i]` to **Sorted** state (green) and advance `i`

### Key JavaScript Data Structures
```javascript
function computeSelectionSteps(arr) {
  const steps = [];
  const a = [...arr];
  const n = a.length;
  const sorted = new Set();

  for (let i = 0; i < n - 1; i++) {
    let minIdx = i;

    steps.push({
      type: 'start_pass',
      array: [...a], pass: i + 1,
      currentMin: minIdx, sorted: [...sorted]
    });

    for (let j = i + 1; j < n; j++) {
      steps.push({
        type: 'scan',
        array: [...a], scanning: j,
        currentMin: minIdx, sorted: [...sorted], pass: i + 1
      });

      if (a[j] < a[minIdx]) {
        minIdx = j;
        steps.push({
          type: 'new_min',
          array: [...a], currentMin: minIdx,
          sorted: [...sorted], pass: i + 1
        });
      }
    }

    if (minIdx !== i) {
      [a[i], a[minIdx]] = [a[minIdx], a[i]];
      steps.push({
        type: 'swap',
        array: [...a], indices: [i, minIdx],
        sorted: [...sorted], pass: i + 1
      });
    }

    sorted.add(i);
  }
  sorted.add(n - 1);
  steps.push({ type: 'done', array: [...a], sorted: [...sorted] });
  return steps;
}
```

### Unique Feature — "Current Minimum" Indicator
A dedicated info box below the controls always shows the value currently held as the minimum for this pass, with its index. This reinforces the core concept visually and makes it easy to follow the algorithm's logic.

### Stats Panel
- Pass counter (e.g., "Pass 2 of 5")
- Sorted count and unsorted count
- Total comparisons (always = n(n-1)/2 regardless of input)
- Total swaps (always ≤ n−1)
- Fixed complexity note: "O(n²) in ALL cases — no early exit"

---

## Simulation 3 — Insertion Sort Visualizer

### File
`insertion_sort_simulation.html`

### UI Layout
```
┌─────────────────────────────────────────────────────┐
│  INSERTION SORT VISUALIZER                 [?] Info │
├──────────────┬──────────────────────────────────────┤
│  Controls    │  [Sorted Subarray]  [Unsorted]       │
│              │  ████ █████ ██  |  ███ █████ ██████  │
│  [Generate]  │   5    11   12     13   22    64     │
│  [Custom]    │                ↑                     │
│  Speed: ──○  │            Key = 13                  │
│  [▶ Play]    ├──────────────────────────────────────┤
│  [⏸ Pause]  │  i = 3 | key = 13 | Comparisons: 1  │
│  [↺ Reset]  │  Shifts: 0  |  Already in place!     │
│              │                                      │
│  Key Element │  Complexity: O(n) — Nearly Sorted!  │
│  [  13  ]   │                                      │
└──────────────┴──────────────────────────────────────┘
```

### Color Scheme
| State         | Color     | Meaning                                |
|---------------|-----------|----------------------------------------|
| Sorted subarray| `#1E8449`| Left portion — already sorted          |
| Key element   | `#E67E22` | The element being inserted             |
| Shifting      | `#E74C3C` | Element shifting right to make room    |
| Comparing     | `#F0B429` | Comparing with key                     |
| In Place      | `#8E44AD` | Key was already in correct position    |

### Animation Steps (per element `i`)
1. **Extract key**: Lift `A[i]` bar up/highlight as the Key (orange)
2. **Compare**: Highlight `A[j]` (yellow) — comparing with key
3. If `A[j] > key`: animate shift right (red), `j--`
4. If `A[j] <= key` or `j < 0`: drop key into `A[j+1]` — green flash
5. Entire left portion (index 0 to i) becomes green (sorted subarray grows)

### Key JavaScript Data Structures
```javascript
function computeInsertionSteps(arr) {
  const steps = [];
  const a = [...arr];
  const n = a.length;

  steps.push({ type: 'init', array: [...a], sortedLen: 1 });

  for (let i = 1; i < n; i++) {
    const key = a[i];
    let j = i - 1;
    let shifts = 0;

    steps.push({
      type: 'pick_key',
      array: [...a], keyIdx: i, key, sortedLen: i, j
    });

    while (j >= 0 && a[j] > key) {
      steps.push({
        type: 'compare',
        array: [...a], keyIdx: i, comparingIdx: j, key, sortedLen: i, shift: false
      });

      a[j + 1] = a[j];
      shifts++;

      steps.push({
        type: 'shift',
        array: [...a], shiftedIdx: j + 1, key, sortedLen: i, shifts
      });

      j--;
    }

    if (shifts === 0) {
      steps.push({ type: 'in_place', array: [...a], keyIdx: i, key, sortedLen: i + 1 });
    } else {
      a[j + 1] = key;
      steps.push({
        type: 'insert',
        array: [...a], insertIdx: j + 1, key, sortedLen: i + 1, shifts
      });
    }
  }

  steps.push({ type: 'done', array: [...a], sortedLen: n });
  return steps;
}
```

### Unique Feature — Sorted/Unsorted Divider
A vertical visual divider line separates the sorted subarray (left, green) from the unsorted portion (right, blue) at all times. As the algorithm progresses, the divider moves right. This makes the "building the sorted array one element at a time" concept immediately tangible.

### Adaptive Complexity Indicator
The complexity display updates live:
- If no shifts have occurred yet after many insertions → "Looking like O(n)!"
- If many shifts per element → "O(n²) — many shifts needed"
- If array was already sorted when done → "Best Case: O(n) — Array was already sorted!"
- Otherwise → "Complexity: O(n²)"

---

## Shared Implementation Patterns

### Bar Chart Rendering (Canvas API)
```javascript
function drawArray(canvas, state) {
  const ctx = canvas.getContext('2d');
  const W = canvas.width, H = canvas.height;
  const n = state.array.length;
  const barW = (W - 40) / n;
  const maxVal = Math.max(...state.array);

  ctx.clearRect(0, 0, W, H);

  state.array.forEach((val, i) => {
    const barH = ((val / maxVal) * (H - 60));
    const x = 20 + i * barW;
    const y = H - 40 - barH;

    ctx.fillStyle = getBarColor(i, state);
    ctx.fillRect(x + 2, y, barW - 4, barH);

    // Label
    ctx.fillStyle = '#333';
    ctx.font = '11px Arial';
    ctx.textAlign = 'center';
    ctx.fillText(val, x + barW / 2, H - 20);
  });
}

function getBarColor(idx, state) {
  if (state.sorted && state.sorted.includes(idx)) return '#1E8449';
  if (state.swapping && state.swapping.includes(idx)) return '#E74C3C';
  if (state.comparing && state.comparing.includes(idx)) return '#F0B429';
  if (state.key === idx) return '#E67E22';
  return '#2E86C1';
}
```

### Animation Loop
```javascript
let stepIndex = 0;
let animationTimer = null;
let steps = [];

function play() {
  if (stepIndex >= steps.length) return;
  animationTimer = setInterval(() => {
    if (stepIndex < steps.length) {
      applyStep(steps[stepIndex]);
      stepIndex++;
    } else {
      clearInterval(animationTimer);
    }
  }, getSpeed());
}

function pause() {
  clearInterval(animationTimer);
}

function stepForward() {
  pause();
  if (stepIndex < steps.length) {
    applyStep(steps[stepIndex]);
    stepIndex++;
  }
}

function stepBackward() {
  pause();
  if (stepIndex > 0) {
    stepIndex--;
    applyStep(steps[stepIndex]);
  }
}

function getSpeed() {
  const slider = document.getElementById('speed');
  // Slider value 1-10, maps to 900ms (slow) - 50ms (fast)
  return 1000 - (slider.value * 95);
}
```

---

## Suggested File Structure

```
sorting_simulations/
│
├── bubble_sort_simulation.html      # Simulation 1 (self-contained)
├── selection_sort_simulation.html   # Simulation 2 (self-contained)
├── insertion_sort_simulation.html   # Simulation 3 (self-contained)
│
└── README.md                        # Quick start guide for each simulation
```

---

## Dependencies

Each simulation is fully self-contained in a single HTML file with:
- **HTML5 Canvas** for bar chart rendering (no library needed)
- **Vanilla JavaScript** for algorithm logic and animation
- **CSS3** for layout, colors, and transitions
- **Google Fonts CDN** (optional): `Roboto` for clean UI typography

No npm packages or build tools required. Open in any modern browser.

---

## References

1. Cormen, T. H., Leiserson, C. E., Rivest, R. L., & Stein, C. (2009). *Introduction to Algorithms* (3rd ed.). MIT Press.
2. GeeksforGeeks. (2025). Comparison among Bubble Sort, Selection Sort and Insertion Sort. https://www.geeksforgeeks.org/dsa/comparison-among-bubble-sort-selection-sort-and-insertion-sort/
3. Wikipedia. (2026). Bubble sort. https://en.wikipedia.org/wiki/Bubble_sort
4. Wikipedia. (2026). Sorting algorithm. https://en.wikipedia.org/wiki/Sorting_algorithm
5. Codecademy. (n.d.). Time complexity of Bubble Sort explained with examples. https://www.codecademy.com/article/time-complexity-of-bubble-sort
6. VisuAlgo. (2025). Sorting — Bubble Sort, Selection Sort, Insertion Sort. National University of Singapore. https://visualgo.net/en/sorting
7. Bhatt, D., et al. (2025). A systematic analysis on performance and computational complexity of sorting algorithms. *Discover Computing*. Springer Nature. https://doi.org/10.1007/s10791-025-09724-w
8. Datta, K., et al. (2022). Parallel divide-and-conquer algorithms for Bubble Sort, Selection Sort and Insertion Sort. *The Computer Journal*, 65(10), 2709–2731. Oxford Academic.
