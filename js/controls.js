(function () {
  function clamp(value, min, max) {
    return Math.max(min, Math.min(max, value));
  }

  function shuffle(values) {
    var arr = values.slice();
    for (var i = arr.length - 1; i > 0; i -= 1) {
      var j = Math.floor(Math.random() * (i + 1));
      var temp = arr[i];
      arr[i] = arr[j];
      arr[j] = temp;
    }
    return arr;
  }

  function buildBaseValues(size) {
    var values = [];
    var min = 14;
    var max = 96;
    for (var i = 0; i < size; i += 1) {
      values.push(Math.round(min + ((max - min) * i) / Math.max(1, size - 1)));
    }
    return values;
  }

  function generateArray(size, pattern) {
    var count = clamp(Number(size) || 10, 6, 18);
    var base = buildBaseValues(count);

    if (pattern === 'reversed') {
      return base.slice().reverse();
    }

    if (pattern === 'nearly_sorted') {
      var nearly = base.slice();
      var swaps = Math.max(1, Math.floor(count / 4));
      for (var i = 0; i < swaps; i += 1) {
        var left = Math.floor(Math.random() * count);
        var right = Math.floor(Math.random() * count);
        var temp = nearly[left];
        nearly[left] = nearly[right];
        nearly[right] = temp;
      }
      return nearly;
    }

    if (pattern === 'few_unique') {
      var palette = [18, 34, 52, 76, 92];
      var few = [];
      for (var j = 0; j < count; j += 1) {
        few.push(palette[Math.floor(Math.random() * palette.length)]);
      }
      return few;
    }

    return shuffle(base);
  }

  function intervalToLerp(interval) {
    var progress = (1000 - clamp(interval, 10, 1000)) / 990;
    return 0.06 + progress * 0.29;
  }

  function initControls(options) {
    var getSteps = options.getSteps;
    var setSteps = options.setSteps;
    var buildSteps = options.buildSteps;
    var onStepChange = options.onStepChange;
    var speedEl = options.speedEl;
    var playBtn = options.playBtn;
    var pauseBtn = options.pauseBtn;
    var nextBtn = options.nextBtn;
    var backBtn = options.backBtn;
    var resetBtn = options.resetBtn;
    var speedNormalBtn = options.speedNormalBtn;
    var speedFastBtn = options.speedFastBtn;
    var speedTurboBtn = options.speedTurboBtn;
    var sizeEl = options.sizeEl || document.getElementById('sizeInput');
    var sizeValueEl = options.sizeValueEl || document.getElementById('sizeValue');
    var patternEl = options.patternEl || document.getElementById('patternSelect');
    var regenerateBtn = options.regenerateBtn || document.getElementById('regenerateBtn');
    var speedValueEl = options.speedValueEl || document.getElementById('speedValue');

    var currentArray = (options.initialArray || []).slice();
    var stepIndex = 0;
    var timer = null;
    var isPlaying = false;
    var queuedAutoAdvance = 0;
    var queuedManualAdvance = 0;

    function getSketch() {
      if (typeof options.getSketch === 'function') {
        return options.getSketch();
      }
      return options.sketch;
    }

    function isAnimating() {
      return !!window.sortLabAnimating;
    }

    function clearTimer() {
      if (timer) {
        window.clearTimeout(timer);
        timer = null;
      }
    }

    function getInterval() {
      return clamp(Number(speedEl.value) || 300, 10, 1000);
    }

    function syncPresetButtons() {
      var interval = getInterval();
      speedNormalBtn.classList.toggle('active', interval === 300);
      speedFastBtn.classList.toggle('active', interval === 80);
      speedTurboBtn.classList.toggle('active', interval === 16);
    }

    function syncSpeed() {
      var interval = getInterval();
      if (speedValueEl) {
        speedValueEl.textContent = interval + ' ms';
      }
      syncPresetButtons();
      var sketch = getSketch();
      if (sketch && typeof sketch.setLerpSpeed === 'function') {
        sketch.setLerpSpeed(intervalToLerp(interval));
      }
    }

    function applySpeedChange() {
      syncSpeed();
      if (isPlaying) {
        stopPlayback();
        isPlaying = true;
        syncButtons();
        scheduleNext();
      }
    }

    function stopPlayback() {
      isPlaying = false;
      queuedAutoAdvance = 0;
      clearTimer();
    }

    function syncButtons() {
      var steps = getSteps();
      var last = Math.max(0, steps.length - 1);
      var blocked = isAnimating();
      backBtn.disabled = blocked || stepIndex <= 0;
      nextBtn.disabled = blocked || stepIndex >= last;
      pauseBtn.disabled = !isPlaying;
      playBtn.disabled = isPlaying;
    }

    function applyCurrentStep(forceResetBars) {
      var steps = getSteps();
      if (!steps || !steps.length) {
        return;
      }

      stepIndex = clamp(stepIndex, 0, steps.length - 1);

      var sketch = getSketch();

      if (forceResetBars && sketch && typeof sketch.resetBars === 'function') {
        sketch.resetBars(currentArray);
      }

      var step = steps[stepIndex];
      if (sketch && typeof sketch.applyStep === 'function') {
        sketch.applyStep(step);
      }
      if (typeof onStepChange === 'function') {
        onStepChange(step, stepIndex, steps.length);
      }
      syncButtons();
    }

    function scheduleNext() {
      clearTimer();

      if (!isPlaying) {
        return;
      }

      var steps = getSteps();
      if (stepIndex >= steps.length - 1) {
        stopPlayback();
        syncButtons();
        return;
      }

      timer = window.setTimeout(function () {
        timer = null;
        if (isAnimating()) {
          queuedAutoAdvance += 1;
          syncButtons();
          return;
        }
        stepIndex += 1;
        applyCurrentStep(false);
        scheduleNext();
      }, getInterval());
    }

    function play() {
      var steps = getSteps();
      if (!steps.length) {
        return;
      }
      stopPlayback();
      queuedManualAdvance = 0;
      if (stepIndex >= steps.length - 1) {
        stepIndex = 0;
        applyCurrentStep(true);
      }
      isPlaying = true;
      syncButtons();
      scheduleNext();
    }

    function goTo(index) {
      stopPlayback();
      queuedManualAdvance = 0;
      stepIndex = index;
      applyCurrentStep(false);
    }

    function stepBy(delta) {
      if (!delta) {
        return;
      }

      if (delta > 0 && isAnimating()) {
        queuedManualAdvance += delta;
        syncButtons();
        return;
      }

      if (delta < 0 && isAnimating()) {
        return;
      }

      stopPlayback();
      queuedManualAdvance = 0;
      goTo(stepIndex + delta);
    }

    function flushQueuedAdvance() {
      if (isAnimating()) {
        syncButtons();
        return;
      }

      if (queuedManualAdvance > 0) {
        queuedManualAdvance -= 1;
      } else if (isPlaying && queuedAutoAdvance > 0) {
        queuedAutoAdvance -= 1;
      } else {
        syncButtons();
        return;
      }

      stepIndex = clamp(stepIndex + 1, 0, Math.max(0, getSteps().length - 1));
      applyCurrentStep(false);

      if (isAnimating()) {
        return;
      }

      if (queuedManualAdvance > 0 || (isPlaying && queuedAutoAdvance > 0)) {
        window.setTimeout(flushQueuedAdvance, 0);
        return;
      }

      if (isPlaying) {
        scheduleNext();
      }
    }

    function regenerate() {
      if (!buildSteps || !setSteps) {
        return;
      }
      stopPlayback();
      queuedManualAdvance = 0;
      currentArray = generateArray(sizeEl.value, patternEl.value);
      setSteps(buildSteps(currentArray));
      stepIndex = 0;
      applyCurrentStep(true);
    }

    if (sizeValueEl && sizeEl) {
      sizeValueEl.textContent = sizeEl.value;
      sizeEl.addEventListener('input', function () {
        sizeValueEl.textContent = sizeEl.value;
      });
    }

    speedEl.addEventListener('input', function () {
      applySpeedChange();
    });

    playBtn.addEventListener('click', play);
    pauseBtn.addEventListener('click', function () {
      stopPlayback();
      syncButtons();
    });
    nextBtn.addEventListener('click', function () {
      stepBy(1);
    });
    backBtn.addEventListener('click', function () {
      stepBy(-1);
    });
    resetBtn.addEventListener('click', function () {
      stopPlayback();
      queuedManualAdvance = 0;
      stepIndex = 0;
      applyCurrentStep(true);
    });

    speedNormalBtn.addEventListener('click', function () {
      speedEl.value = 300;
      applySpeedChange();
    });
    speedFastBtn.addEventListener('click', function () {
      speedEl.value = 80;
      applySpeedChange();
    });
    speedTurboBtn.addEventListener('click', function () {
      speedEl.value = 16;
      applySpeedChange();
    });

    if (regenerateBtn) {
      regenerateBtn.addEventListener('click', regenerate);
    }

    window.addEventListener('sortlab:animationend', flushQueuedAdvance);

    syncSpeed();
    if (setSteps && buildSteps && currentArray.length) {
      setSteps(buildSteps(currentArray));
    }
    applyCurrentStep(true);

    return {
      regenerate: regenerate,
      play: play,
      pause: function () {
        stopPlayback();
        syncButtons();
      },
      togglePlay: function () {
        if (isPlaying) {
          stopPlayback();
          syncButtons();
          return;
        }
        play();
      },
      next: function () {
        stepBy(1);
      },
      back: function () {
        stepBy(-1);
      },
      jump: function (delta) {
        stepBy(delta);
      },
      reset: function () {
        stopPlayback();
        queuedManualAdvance = 0;
        stepIndex = 0;
        applyCurrentStep(true);
      },
      isPlaying: function () {
        return isPlaying;
      },
      getCurrentArray: function () {
        return currentArray.slice();
      },
      getStepIndex: function () {
        return stepIndex;
      },
    };
  }

  window.initControls = initControls;
  window.SortLabControls = {
    initControls: initControls,
    generateArray: generateArray,
    intervalToLerp: intervalToLerp,
  };
})();
