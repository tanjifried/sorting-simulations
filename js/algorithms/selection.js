(function () {
  function createCodeLine(pseudo, java, cpp, python) {
    return {
      pseudo: pseudo,
      java: java,
      cpp: cpp,
      python: python,
    };
  }

  function makeStep(type, data, lineMap) {
    return Object.assign({ type: type, codeLine: lineMap[type] }, data);
  }

  function computeSteps(arr) {
    const a = [...arr];
    const n = a.length;
    const result = [];
    const sorted = new Set();
    let comparisons = 0, swaps = 0;
    const totalPasses = Math.max(1, n - 1);

    result.push(makeStep('init', { array:[...a], sorted:[], pass:0, totalPasses, comparisons, swaps,
      currentMin:0, action:'Ready to start: each pass finds the smallest unsorted value.' }, SELECTION_STEP_LINES));

    for (let i = 0; i < n - 1; i++) {
      let minIdx = i;
      result.push(makeStep('start_pass', { array:[...a], sorted:[...sorted], pass:i+1, totalPasses,
        comparisons, swaps, currentMin:minIdx,
        action:`Pass ${i+1}: start by assuming index ${i} (${a[i]}) is the minimum.` }, SELECTION_STEP_LINES));

      for (let j = i + 1; j < n; j++) {
        comparisons++;
        result.push(makeStep('scan', { array:[...a], sorted:[...sorted], pass:i+1, totalPasses,
          comparisons, swaps, currentMin:minIdx, scan:j,
          action:`Scanning index ${j} (${a[j]}) against current minimum ${a[minIdx]}.` }, SELECTION_STEP_LINES));
        if (a[j] < a[minIdx]) {
          minIdx = j;
          result.push(makeStep('new_min', { array:[...a], sorted:[...sorted], pass:i+1, totalPasses,
            comparisons, swaps, currentMin:minIdx,
            action:`New minimum found: ${a[minIdx]} at index ${minIdx}.` }, SELECTION_STEP_LINES));
        }
      }

      if (minIdx !== i) {
        [a[i], a[minIdx]] = [a[minIdx], a[i]];
        swaps++;
        result.push(makeStep('swap', { array:[...a], sorted:[...sorted], pass:i+1, totalPasses,
          comparisons, swaps, currentMin:i, swap:[i, minIdx],
          action:`Swapped index ${i} with index ${minIdx} to place the minimum in front.` }, SELECTION_STEP_LINES));
      } else {
        result.push(makeStep('keep', { array:[...a], sorted:[...sorted], pass:i+1, totalPasses,
          comparisons, swaps, currentMin:i,
          action:'No swap needed. The front value was already the minimum.' }, SELECTION_STEP_LINES));
      }

      sorted.add(i);
      result.push(makeStep('mark_sorted', { array:[...a], sorted:[...sorted], pass:i+1, totalPasses,
        comparisons, swaps, currentMin:minIdx,
        action:`Index ${i} is now permanently sorted.` }, SELECTION_STEP_LINES));
    }

    for (let i = 0; i < n; i++) sorted.add(i);
    result.push(makeStep('done', { array:[...a], sorted:[...sorted], pass:Math.max(0, n-1),
      totalPasses, comparisons, swaps, currentMin:n-1,
      action:'Finished: Selection Sort placed each minimum into position.' }, SELECTION_STEP_LINES));
    return result;
  }

  const SELECTION_CODE_STRINGS = {
    pseudo: [
      'function selectionSort(A):',
      '  n = length(A)',
      '  for i from 0 to n - 2:',
      '    minIdx = i',
      '    for j from i + 1 to n - 1:',
      '      compare A[j] and A[minIdx]',
      '      if A[j] < A[minIdx]:',
      '        minIdx = j',
      '    if minIdx != i:',
      '      swap A[i], A[minIdx]',
      '    else:',
      '      keep A[i] in place',
      '    mark A[i] as sorted',
      '  return A'
    ],
    java: [
      'void selectionSort(int[] A) {',
      '  int n = A.length;',
      '  for (int i = 0; i < n - 1; i++) {',
      '    int minIdx = i;',
      '    for (int j = i + 1; j < n; j++) {',
      '      // compare A[j] and A[minIdx]',
      '      if (A[j] < A[minIdx]) {',
      '        minIdx = j;',
      '      }',
      '    }',
      '    if (minIdx != i) {',
      '      int temp = A[i]; A[i] = A[minIdx]; A[minIdx] = temp;',
      '    } else {',
      '      // keep A[i] in place',
      '    }',
      '    // mark A[i] as sorted',
      '  }',
      '}'
    ],
    cpp: [
      'void selectionSort(vector<int>& A) {',
      '  int n = A.size();',
      '  for (int i = 0; i < n - 1; i++) {',
      '    int minIdx = i;',
      '    for (int j = i + 1; j < n; j++) {',
      '      // compare A[j] and A[minIdx]',
      '      if (A[j] < A[minIdx]) {',
      '        minIdx = j;',
      '      }',
      '    }',
      '    if (minIdx != i) {',
      '      swap(A[i], A[minIdx]);',
      '    } else {',
      '      // keep A[i] in place',
      '    }',
      '    // mark A[i] as sorted',
      '  }',
      '}'
    ],
    python: [
      'def selection_sort(A):',
      '  n = len(A)',
      '  for i in range(n - 1):',
      '    min_idx = i',
      '    for j in range(i + 1, n):',
      '      # compare A[j] and A[min_idx]',
      '      if A[j] < A[min_idx]:',
      '        min_idx = j',
      '    if min_idx != i:',
      '      A[i], A[min_idx] = A[min_idx], A[i]',
      '    else:',
      '      pass',
      '    # mark A[i] as sorted',
      '  return A'
    ]
  };

  const SELECTION_STEP_LINES = {
    init: createCodeLine(1, 1, 1, 1),
    start_pass: createCodeLine(4, 4, 4, 4),
    scan: createCodeLine(6, 6, 6, 6),
    new_min: createCodeLine(8, 8, 8, 8),
    swap: createCodeLine(10, 12, 12, 10),
    keep: createCodeLine(12, 14, 14, 12),
    mark_sorted: createCodeLine(13, 16, 16, 13),
    done: createCodeLine(14, 18, 18, 14),
  };

  const SELECTION_LINE_MAP = {
    pseudo: {
      init: 1,
      start_pass: 4,
      scan: 6,
      new_min: 8,
      swap: 10,
      keep: 12,
      mark_sorted: 13,
      done: 14
    },
    java: {
      init: 1,
      start_pass: 4,
      scan: 6,
      new_min: 8,
      swap: 12,
      keep: 14,
      mark_sorted: 16,
      done: 18
    },
    cpp: {
      init: 1,
      start_pass: 4,
      scan: 6,
      new_min: 8,
      swap: 12,
      keep: 14,
      mark_sorted: 16,
      done: 18
    },
    python: {
      init: 1,
      start_pass: 4,
      scan: 6,
      new_min: 8,
      swap: 10,
      keep: 12,
      mark_sorted: 13,
      done: 14
    }
  };

  window.SelectionAlgorithm = {
    computeSteps: computeSteps,
    CODE_STRINGS: SELECTION_CODE_STRINGS,
    codeStrings: SELECTION_CODE_STRINGS,
    stepToLineMap: SELECTION_LINE_MAP,
    lineMap: SELECTION_LINE_MAP,
  };
})();
