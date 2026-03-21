(function () {
  function computeSteps(arr) {
    const a = [...arr];
    const n = a.length;
    const result = [];
    const sorted = new Set();
    let comparisons = 0, swaps = 0;
    const totalPasses = Math.max(1, n - 1);

    result.push({ type:'init', array:[...a], sorted:[], pass:0, totalPasses, comparisons, swaps,
      action:'Ready to start: Bubble Sort compares neighboring bars from left to right.' });

    for (let i = 0; i < n - 1; i++) {
      let swapped = false;
      for (let j = 0; j < n - 1 - i; j++) {
        comparisons++;
        result.push({ type:'compare', array:[...a], compare:[j, j+1], sorted:[...sorted],
          pass:i+1, totalPasses, comparisons, swaps,
          action:`Comparing ${a[j]} and ${a[j+1]}.` });
        if (a[j] > a[j+1]) {
          [a[j], a[j+1]] = [a[j+1], a[j]];
          swaps++;
          swapped = true;
          result.push({ type:'swap', array:[...a], swap:[j, j+1], sorted:[...sorted],
            pass:i+1, totalPasses, comparisons, swaps,
            action:`Swapped because ${a[j+1]} was larger than ${a[j]} before the swap.` });
        } else {
          result.push({ type:'no_swap', array:[...a], noSwap:[j, j+1], sorted:[...sorted],
            pass:i+1, totalPasses, comparisons, swaps,
            action:'No swap needed because the pair is already in order.' });
        }
      }
      sorted.add(n - 1 - i);
      result.push({ type:'pass_complete', array:[...a], sorted:[...sorted],
        pass:i+1, totalPasses, comparisons, swaps,
        action:`Pass ${i+1} complete: the rightmost unsorted value is now fixed.` });
      if (!swapped) {
        for (let k = 0; k < n - 1 - i; k++) sorted.add(k);
        result.push({ type:'early_exit', array:[...a], sorted:[...sorted],
          pass:i+1, totalPasses, comparisons, swaps, isEarlyExit:true,
          action:'No swaps this pass — list is already sorted.' });
        break;
      }
    }
    for (let i = 0; i < n; i++) sorted.add(i);
    result.push({ type:'done', array:[...a], sorted:[...sorted],
      pass: Math.min(n-1, result[result.length-1]?.pass || 0), totalPasses, comparisons, swaps,
      action:'Finished: every bar is in ascending order.' });
    return result;
  }

  const BUBBLE_CODE_STRINGS = {
    pseudo: [
      'function bubbleSort(A):',
      '  n = length(A)',
      '  for i from 0 to n - 2:',
      '    swapped = false',
      '    for j from 0 to n - 2 - i:',
      '      compare A[j] and A[j+1]',
      '      if A[j] > A[j+1]:',
      '        swap A[j], A[j+1]',
      '        swapped = true',
      '      -- no swap, move to next',
      '    mark rightmost as sorted',
      '    if swapped == false:',
      '      break',
      '  return A'
    ],
    java: [
      'void bubbleSort(int[] A) {',
      '  int n = A.length;',
      '  for (int i = 0; i < n - 1; i++) {',
      '    boolean swapped = false;',
      '    for (int j = 0; j < n - 1 - i; j++) {',
      '      // compare A[j] and A[j + 1]',
      '      if (A[j] > A[j + 1]) {',
      '        int temp = A[j]; A[j] = A[j+1]; A[j+1] = temp;',
      '        swapped = true;',
      '      }',
      '      // no swap — condition was false',
      '    }',
      '    if (!swapped) break;',
      '  }',
      '}'
    ],
    cpp: [
      'void bubbleSort(vector<int>& A) {',
      '  int n = A.size();',
      '  for (int i = 0; i < n - 1; i++) {',
      '    bool swapped = false;',
      '    for (int j = 0; j < n - 1 - i; j++) {',
      '      // compare A[j] and A[j + 1]',
      '      if (A[j] > A[j + 1]) {',
      '        swap(A[j], A[j + 1]);',
      '        swapped = true;',
      '      }',
      '      // no swap — condition was false',
      '    }',
      '    if (!swapped) break;',
      '  }',
      '}'
    ],
    python: [
      'def bubble_sort(A):',
      '  n = len(A)',
      '  for i in range(n - 1):',
      '    swapped = False',
      '    for j in range(n - 1 - i):',
      '      # compare A[j] and A[j + 1]',
      '      if A[j] > A[j + 1]:',
      '        A[j], A[j + 1] = A[j + 1], A[j]',
      '        swapped = True',
      '      # no swap — condition was false',
      '    # mark sorted',
      '    if not swapped:',
      '      break',
      '  return A'
    ]
  };

  const BUBBLE_LINE_MAP = {
    pseudo: {
      init: 1, // "function bubbleSort(A):"
      compare: 6, // "      compare A[j] and A[j+1]"
      swap: 8, // "        swap A[j], A[j+1]"
      no_swap: 10, // "      -- no swap, move to next"
      pass_complete: 11, // "    mark rightmost as sorted"
      early_exit: 13, // "      break"
      done: 14 // "  return A"
    },
    java: {
      init: 1, // "void bubbleSort(int[] A) {"
      compare: 6, // "      // compare A[j] and A[j + 1]"
      swap: 8, // "        int temp = A[j]; A[j] = A[j+1]; A[j+1] = temp;"
      no_swap: 11, // "      // no swap — condition was false"
      pass_complete: 12, // "    }"
      early_exit: 13, // "    if (!swapped) break;"
      done: 15 // "}"
    },
    cpp: {
      init: 1, // "void bubbleSort(vector<int>& A) {"
      compare: 6, // "      // compare A[j] and A[j + 1]"
      swap: 8, // "        swap(A[j], A[j + 1]);"
      no_swap: 11, // "      // no swap — condition was false"
      pass_complete: 12, // "    }"
      early_exit: 13, // "    if (!swapped) break;"
      done: 15 // "}"
    },
    python: {
      init: 1, // "def bubble_sort(A):"
      compare: 6, // "      # compare A[j] and A[j + 1]"
      swap: 8, // "        A[j], A[j + 1] = A[j + 1], A[j]"
      no_swap: 10, // "      # no swap — condition was false"
      pass_complete: 11, // "    # mark sorted"
      early_exit: 13, // "      break"
      done: 14 // "  return A"
    }
  };

  window.BubbleAlgorithm = {
    computeSteps: computeSteps,
    CODE_STRINGS: BUBBLE_CODE_STRINGS,
    codeStrings: BUBBLE_CODE_STRINGS,
    stepToLineMap: BUBBLE_LINE_MAP,
    lineMap: BUBBLE_LINE_MAP,
  };
})();
