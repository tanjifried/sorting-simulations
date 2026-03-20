import re
import os

file = "/home/jade/dev/projects/web/WEB Projects/sorting-simulation/compare_all_simulation.html"

with open(file, "r") as f:
    content = f.read()

# 1. Reduce margin-top in .value
content = re.sub(r'margin-top:\s*2px;', 'margin-top: 0;', content)

# 2. Add language selector to global controls
code_controls = """
      <div class="control-grid" style="margin-top: 10px;">
        <div>
          <label>Code Language</label>
          <select id="codeLanguage">
            <option value="pseudo">Pseudocode</option>
            <option value="java">Java</option>
            <option value="cpp">C++</option>
            <option value="python">Python</option>
          </select>
        </div>
        <div>
          <label>&nbsp;</label>
          <button id="toggleCodeBtn">Hide Code Trace</button>
        </div>
      </div>
"""
if 'id="codeLanguage"' not in content:
    content = content.replace('<div class="buttons">', code_controls + '\n      <div class="buttons">')

# Add JS ui bindings
js_ui_addition = """
      codeLanguage: document.getElementById("codeLanguage"),
      toggleCodeBtn: document.getElementById("toggleCodeBtn"),
"""
if 'codeLanguage: document' not in content:
    content = content.replace('bubbleBars: document.getElementById("bubbleBars"),', js_ui_addition + '      bubbleBars: document.getElementById("bubbleBars"),')

# Update CODE_LIBRARY
new_code_library = """
    const CODE_LIBRARY = {
      bubble: {
        pseudo: [
          "function bubbleSort(A):",
          "for i from 0 to n - 2:",
          "  swapped = false",
          "  for j from 0 to n - 2 - i:",
          "    compare A[j] and A[j + 1]",
          "    if A[j] > A[j + 1]:",
          "      swap A[j], A[j + 1]",
          "      swapped = true",
          "  if swapped == false: break",
          "return A"
        ],
        java: [
          "void bubbleSort(int[] A) {",
          "  for (int i = 0; i < n - 1; i++) {",
          "    boolean swapped = false;",
          "    for (int j = 0; j < n - 1 - i; j++) {",
          "      if (A[j] > A[j + 1]) {",
          "        swap(A, j, j + 1);",
          "        swapped = true;",
          "      }",
          "    }",
          "    if (!swapped) break;",
          "  }",
          "}"
        ],
        cpp: [
          "void bubbleSort(vector<int>& A) {",
          "  for (int i = 0; i < n - 1; i++) {",
          "    bool swapped = false;",
          "    for (int j = 0; j < n - 1 - i; j++) {",
          "      if (A[j] > A[j + 1]) {",
          "        swap(A[j], A[j + 1]);",
          "        swapped = true;",
          "      }",
          "    }",
          "    if (!swapped) break;",
          "  }",
          "}"
        ],
        python: [
          "def bubble_sort(A):",
          "  for i in range(n - 1):",
          "    swapped = False",
          "    for j in range(n - 1 - i):",
          "      if A[j] > A[j + 1]:",
          "        A[j], A[j + 1] = A[j + 1], A[j]",
          "        swapped = True",
          "    if not swapped: break",
          "  return A"
        ]
      },
      selection: {
        pseudo: [
          "function selectionSort(A):",
          "for i from 0 to n - 2:",
          "  minIndex = i",
          "  for j from i + 1 to n - 1:",
          "    compare A[j] with A[minIndex]",
          "    if A[j] < A[minIndex]:",
          "      minIndex = j",
          "  if minIndex != i:",
          "    swap A[i], A[minIndex]",
          "return A"
        ],
        java: [
          "void selectionSort(int[] A) {",
          "  for (int i = 0; i < n - 1; i++) {",
          "    int minIndex = i;",
          "    for (int j = i + 1; j < n; j++) {",
          "      if (A[j] < A[minIndex])",
          "        minIndex = j;",
          "    }",
          "    if (minIndex != i)",
          "      swap(A, i, minIndex);",
          "  }",
          "}"
        ],
        cpp: [
          "void selectionSort(vector<int>& A) {",
          "  for (int i = 0; i < n - 1; i++) {",
          "    int minIndex = i;",
          "    for (int j = i + 1; j < n; j++) {",
          "      if (A[j] < A[minIndex])",
          "        minIndex = j;",
          "    }",
          "    if (minIndex != i)",
          "      swap(A[i], A[minIndex]);",
          "  }",
          "}"
        ],
        python: [
          "def selection_sort(A):",
          "  for i in range(n - 1):",
          "    min_idx = i",
          "    for j in range(i + 1, n):",
          "      if A[j] < A[min_idx]:",
          "        min_idx = j",
          "    if min_idx != i:",
          "      A[i], A[min_idx] = A[min_idx], A[i]",
          "  return A"
        ]
      },
      insertion: {
        pseudo: [
          "function insertionSort(A):",
          "for i from 1 to n - 1:",
          "  key = A[i]",
          "  j = i - 1",
          "  while j >= 0:",
          "    compare key with A[j]",
          "    if A[j] > key:",
          "      A[j + 1] = A[j]",
          "      j = j - 1",
          "    else: break",
          "  A[j + 1] = key",
          "return A"
        ],
        java: [
          "void insertionSort(int[] A) {",
          "  for (int i = 1; i < n; i++) {",
          "    int key = A[i];",
          "    int j = i - 1;",
          "    while (j >= 0) {",
          "      if (A[j] > key) {",
          "        A[j + 1] = A[j];",
          "        j = j - 1;",
          "      } else break;",
          "    }",
          "    A[j + 1] = key;",
          "  }",
          "}"
        ],
        cpp: [
          "void insertionSort(vector<int>& A) {",
          "  for (int i = 1; i < n; i++) {",
          "    int key = A[i];",
          "    int j = i - 1;",
          "    while (j >= 0) {",
          "      if (A[j] > key) {",
          "        A[j + 1] = A[j];",
          "        j = j - 1;",
          "      } else break;",
          "    }",
          "    A[j + 1] = key;",
          "  }",
          "}"
        ],
        python: [
          "def insertion_sort(A):",
          "  for i in range(1, n):",
          "    key = A[i]",
          "    j = i - 1",
          "    while j >= 0:",
          "      if A[j] > key:",
          "        A[j + 1] = A[j]",
          "        j -= 1",
          "      else: break",
          "    A[j + 1] = key",
          "  return A"
        ]
      }
    };
"""
old_code_library = re.search(r'const CODE_LIBRARY = \{.*?\n    \};\n', content, re.DOTALL)
if old_code_library:
    content = content.replace(old_code_library.group(0), new_code_library)

# Update buildCodeViews
new_build = """
    function buildCodeViews() {
      const lang = ui.codeLanguage ? ui.codeLanguage.value : "pseudo";
      const targets = [
        { key: "bubble", el: ui.bubbleCode },
        { key: "selection", el: ui.selectionCode },
        { key: "insertion", el: ui.insertionCode }
      ];

      targets.forEach((target) => {
        target.el.innerHTML = "";
        const lines = CODE_LIBRARY[target.key][lang] || CODE_LIBRARY[target.key].pseudo;
        lines.forEach((line, idx) => {
          const row = document.createElement("div");
          row.className = "code-mini-line";
          row.dataset.line = String(idx + 1);

          const ln = document.createElement("span");
          ln.className = "ln";
          ln.textContent = String(idx + 1);

          const text = document.createElement("span");
          text.textContent = line;

          row.append(ln, text);
          target.el.append(row);
        });
      });
    }
"""
old_build = re.search(r'function buildCodeViews\(\) \{.*?\n    \}\n', content, re.DOTALL)
if old_build:
    content = content.replace(old_build.group(0), new_build)

# Update codeLineForStep map logic
new_code_line = """
    function codeLineForStep(simKey, step) {
      const lang = ui.codeLanguage ? ui.codeLanguage.value : "pseudo";
      if (simKey === "bubble") {
        const map = {
          pseudo: { init: 1, compare: 5, swap: 7, no_swap: 6, mark: 2, early: 9, done: 10, default: 2 },
          java: { init: 1, compare: 5, swap: 6, no_swap: 5, mark: 2, early: 10, done: 12, default: 2 },
          cpp: { init: 1, compare: 5, swap: 6, no_swap: 5, mark: 2, early: 10, done: 12, default: 2 },
          python: { init: 1, compare: 5, swap: 6, no_swap: 5, mark: 2, early: 8, done: 9, default: 2 }
        };
        const m = map[lang] || map.pseudo;
        if (step.type === "init") return m.init;
        if (step.type === "compare") return m.compare;
        if (step.type === "swap") return m.swap;
        if (step.type === "no_swap") return m.no_swap;
        if (step.type === "mark") return m.mark;
        if (step.type === "early") return m.early;
        if (step.type === "done") return m.done;
        return m.default;
      }

      if (simKey === "selection") {
        const map = {
          pseudo: { init: 1, start: 3, scan: 5, new_min: 7, swap: 9, mark: 2, done: 10, default: 2 },
          java: { init: 1, start: 3, scan: 5, new_min: 6, swap: 9, mark: 2, done: 11, default: 2 },
          cpp: { init: 1, start: 3, scan: 5, new_min: 6, swap: 9, mark: 2, done: 11, default: 2 },
          python: { init: 1, start: 3, scan: 5, new_min: 6, swap: 8, mark: 2, done: 9, default: 2 }
        };
        const m = map[lang] || map.pseudo;
        if (step.type === "init") return m.init;
        if (step.type === "start") return m.start;
        if (step.type === "scan") return m.scan;
        if (step.type === "new_min") return m.new_min;
        if (step.type === "swap") return m.swap;
        if (step.type === "mark") return m.mark;
        if (step.type === "done") return m.done;
        return m.default;
      }

      const map = {
        pseudo: { init: 1, pick: 3, compare: 6, shift: 8, insert: 11, in_place: 11, done: 12, default: 2 },
        java: { init: 1, pick: 3, compare: 6, shift: 7, insert: 10, in_place: 10, done: 12, default: 2 },
        cpp: { init: 1, pick: 3, compare: 6, shift: 7, insert: 10, in_place: 10, done: 12, default: 2 },
        python: { init: 1, pick: 3, compare: 6, shift: 7, insert: 10, in_place: 10, done: 11, default: 2 }
      };
      const m = map[lang] || map.pseudo;
      if (step.type === "init") return m.init;
      if (step.type === "pick") return m.pick;
      if (step.type === "compare") return m.compare;
      if (step.type === "shift") return m.shift;
      if (step.type === "insert" || step.type === "in_place") return m.insert;
      if (step.type === "done") return m.done;
      return m.default;
    }
"""
old_code_line = re.search(r'function codeLineForStep\(simKey, step\) \{.*?\n    \}\n', content, re.DOTALL)
if old_code_line:
    content = content.replace(old_code_line.group(0), new_code_line)

js_events = """
    let codeHidden = false;
    if (ui.toggleCodeBtn) {
      ui.toggleCodeBtn.addEventListener("click", () => {
        codeHidden = !codeHidden;
        const displays = codeHidden ? "none" : "";
        document.querySelectorAll(".code-mini").forEach(el => el.style.display = displays);
        ui.toggleCodeBtn.textContent = codeHidden ? "Show Code Trace" : "Hide Code Trace";
      });
    }

    if (ui.codeLanguage) {
      ui.codeLanguage.addEventListener("change", () => {
        buildCodeViews();
        renderCode("bubble", state.bubble.steps[state.bubble.index]);
        renderCode("selection", state.selection.steps[state.selection.index]);
        renderCode("insertion", state.insertion.steps[state.insertion.index]);
      });
    }
"""

if 'codeHidden =' not in content:
    content = content.replace('buildCodeViews();', js_events + '\n    buildCodeViews();')

with open(file, "w") as f:
    f.write(content)

print("Updated compare_all_simulation.html")
