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
    let comparisons = 0, shifts = 0;

    result.push(makeStep('init', { array:[...a], pass:0, sortedLen: n > 0 ? 1 : 0,
      comparisons, shifts, key:null, keyIdx:null,
      action:'Ready: the first element is considered sorted by default.' }, INSERTION_STEP_LINES));

    for (let i = 1; i < n; i++) {
      const key = a[i];
      let j = i - 1;
      let passShifts = 0;

      result.push(makeStep('pick_key', { array:[...a], pass:i, sortedLen:i,
        comparisons, shifts, key, keyIdx:i,
        action:`Picked key ${key} at index ${i}. Now compare leftward to insert it correctly.` }, INSERTION_STEP_LINES));

      while (j >= 0) {
        comparisons++;
        result.push(makeStep('compare', { array:[...a], pass:i, sortedLen:i,
          comparisons, shifts, key, keyIdx:i, comparing:j,
          action:`Comparing key ${key} with ${a[j]} at index ${j}.` }, INSERTION_STEP_LINES));

        if (a[j] > key) {
          a[j + 1] = a[j];
          shifts++;
          passShifts++;
          result.push(makeStep('shift', { array:[...a], pass:i, sortedLen:i,
            comparisons, shifts, key, keyIdx:j, shiftedIdx:j+1,
            action:`${a[j+1]} shifts right to make room for key ${key}.` }, INSERTION_STEP_LINES));
          j--;
        } else {
          break;
        }
      }

      if (passShifts === 0) {
        result.push(makeStep('in_place', { array:[...a], pass:i, sortedLen:i+1,
          comparisons, shifts, key, keyIdx:i,
          action:`Key ${key} was already in the correct position.` }, INSERTION_STEP_LINES));
      } else {
        a[j + 1] = key;
        result.push(makeStep('insert', { array:[...a], pass:i, sortedLen:i+1,
          comparisons, shifts, key, keyIdx:j+1, insertIdx:j+1,
          action:`Inserted key ${key} at index ${j+1}. Sorted side grows by one.` }, INSERTION_STEP_LINES));
      }
    }

    result.push(makeStep('done', { array:[...a], pass:Math.max(0, n-1), sortedLen:n,
      comparisons, shifts, key:null, keyIdx:null,
      action:'Finished: every element has been inserted into its sorted position.' }, INSERTION_STEP_LINES));
    return result;
  }

  const INSERTION_CODE_STRINGS = {
    pseudo: [
      'function insertionSort(A):',
      '  for i from 1 to length(A) - 1:',
      '    key = A[i]',
      '    j = i - 1',
      '    while j >= 0:',
      '      compare key and A[j]',
      '      if A[j] > key:',
      '        A[j + 1] = A[j]',
      '        j = j - 1',
      '      else:',
      '        break',
      '    if j == i - 1:',
      '      keep key in place',
      '    else:',
      '      A[j + 1] = key',
      '  return A'
    ],
    java: [
      'void insertionSort(int[] A) {',
      '  for (int i = 1; i < A.length; i++) {',
      '    int key = A[i];',
      '    int j = i - 1;',
      '    while (j >= 0) {',
      '      // compare key and A[j]',
      '      if (A[j] > key) {',
      '        A[j + 1] = A[j];',
      '        j--;',
      '      } else {',
      '        break;',
      '      }',
      '    }',
      '    if (j == i - 1) {',
      '      // keep key in place',
      '    } else {',
      '      A[j + 1] = key;',
      '    }',
      '  }',
      '}'
    ],
    cpp: [
      'void insertionSort(vector<int>& A) {',
      '  for (int i = 1; i < static_cast<int>(A.size()); i++) {',
      '    int key = A[i];',
      '    int j = i - 1;',
      '    while (j >= 0) {',
      '      // compare key and A[j]',
      '      if (A[j] > key) {',
      '        A[j + 1] = A[j];',
      '        j--;',
      '      } else {',
      '        break;',
      '      }',
      '    }',
      '    if (j == i - 1) {',
      '      // keep key in place',
      '    } else {',
      '      A[j + 1] = key;',
      '    }',
      '  }',
      '}'
    ],
    python: [
      'def insertion_sort(A):',
      '  for i in range(1, len(A)):',
      '    key = A[i]',
      '    j = i - 1',
      '    while j >= 0:',
      '      # compare key and A[j]',
      '      if A[j] > key:',
      '        A[j + 1] = A[j]',
      '        j -= 1',
      '      else:',
      '        break',
      '    if j == i - 1:',
      '      pass',
      '    else:',
      '      A[j + 1] = key',
      '  return A'
    ]
  };

  const INSERTION_STEP_LINES = {
    init: createCodeLine(1, 1, 1, 1),
    pick_key: createCodeLine(3, 3, 3, 3),
    compare: createCodeLine(6, 6, 6, 6),
    shift: createCodeLine(8, 8, 8, 8),
    in_place: createCodeLine(13, 15, 15, 13),
    insert: createCodeLine(15, 17, 17, 15),
    done: createCodeLine(16, 20, 20, 16),
  };

  const INSERTION_LINE_MAP = {
    pseudo: {
      init: 1,
      pick_key: 3,
      compare: 6,
      shift: 8,
      in_place: 13,
      insert: 15,
      done: 16
    },
    java: {
      init: 1,
      pick_key: 3,
      compare: 6,
      shift: 8,
      in_place: 15,
      insert: 17,
      done: 20
    },
    cpp: {
      init: 1,
      pick_key: 3,
      compare: 6,
      shift: 8,
      in_place: 15,
      insert: 17,
      done: 20
    },
    python: {
      init: 1,
      pick_key: 3,
      compare: 6,
      shift: 8,
      in_place: 13,
      insert: 15,
      done: 16
    }
  };

  window.InsertionAlgorithm = {
    computeSteps: computeSteps,
    CODE_STRINGS: INSERTION_CODE_STRINGS,
    codeStrings: INSERTION_CODE_STRINGS,
    stepToLineMap: INSERTION_LINE_MAP,
    lineMap: INSERTION_LINE_MAP,
  };
})();
