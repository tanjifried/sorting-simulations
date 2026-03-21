(function () {
  var SHIFT_FRAMES = 18;

  var colorCache = {};
  var lastTheme = null;

  function getCSSVarCached(name) {
    var theme = document.body.getAttribute('data-theme') || 'dark';
    if (theme !== lastTheme) { colorCache = {}; lastTheme = theme; }
    if (!colorCache[name]) {
      colorCache[name] = getComputedStyle(document.body).getPropertyValue(name).trim();
    }
    return colorCache[name];
  }

  function resolveContainer(containerRef) {
    return typeof containerRef === 'string' ? document.getElementById(containerRef) : containerRef;
  }

  function hexToRgb(hex) {
    hex = hex.replace('#', '');
    if (hex.length === 3) hex = hex.split('').map(function (c) { return c + c; }).join('');
    var n = parseInt(hex, 16);
    return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
  }

  function clamp(value, min, max) {
    return Math.max(min, Math.min(max, value));
  }

  function stateColor(state) {
    if (state === 'compare') return getCSSVarCached('--bar-compare');
    if (state === 'sorted')  return getCSSVarCached('--bar-sorted');
    if (state === 'noswap')  return getCSSVarCached('--bar-noswap');
    if (state === 'key')     return getCSSVarCached('--bar-key');
    if (state === 'shift')   return getCSSVarCached('--bar-shift');
    return getCSSVarCached('--bar-default');
  }

  function barStateForStep(index, step) {
    if (step.type === 'in_place' && step.keyIdx === index) return 'noswap';
    if (step.type === 'pick_key' && step.keyIdx === index) return 'key';
    if (step.type === 'insert' && step.insertIdx === index) return 'key';
    if (step.shiftedIdx === index) return 'shift';
    if (step.comparing === index) return 'compare';
    if (index < (step.sortedLen || 0)) return 'sorted';
    return 'default';
  }

  function getShiftAnimation(step) {
    if (step.type !== 'shift') return null;
    if (typeof step.shiftedIdx !== 'number' || typeof step.keyIdx !== 'number') return null;
    return { shiftedIdx: step.shiftedIdx, keyIdx: step.keyIdx };
  }

  function mountSketch(containerRef) {
    var sketch = function (p) {
      var bars = [];
      var maxVal = 100;
      var lerpSpeed = 0.12;
      var paddingTop = 20;
      var paddingBottom = 40;
      var paddingSides = 16;
      var barGap = 4;
      var canvasHeight = 340;
      var currentStep = null;
      var animating = false;
      var animFrame = 0;
      var shiftState = null;
      var registeredAnimation = false;

      function updateGlobalAnimation(active) {
        if (active && !registeredAnimation) {
          window.sortLabAnimationCount = (window.sortLabAnimationCount || 0) + 1;
          registeredAnimation = true;
        } else if (!active && registeredAnimation) {
          window.sortLabAnimationCount = Math.max(0, (window.sortLabAnimationCount || 1) - 1);
          registeredAnimation = false;
          if (!window.sortLabAnimationCount) {
            window.dispatchEvent(new Event('sortlab:animationend'));
          }
        }
        window.sortLabAnimating = !!window.sortLabAnimationCount;
      }

      function makeBar(value) {
        return { value: value, displayH: 0, state: 'default', label: String(value) };
      }

      function syncBarsFromArray(array) {
        for (var i = 0; i < array.length; i++) {
          if (!bars[i]) bars[i] = makeBar(array[i]);
          bars[i].value = array[i];
          bars[i].label = String(array[i]);
        }
        bars.length = array.length;
      }

      function syncStates(step) {
        for (var i = 0; i < bars.length; i++) {
          bars[i].state = barStateForStep(i, step);
        }
      }

      function stopAnimations() {
        animating = false;
        animFrame = 0;
        shiftState = null;
        updateGlobalAnimation(false);
      }

      function startShift(step) {
        var anim = getShiftAnimation(step);
        if (!anim) return false;
        if (!bars[anim.shiftedIdx] || !bars[anim.keyIdx]) { syncBarsFromArray(step.array); return false; }
        currentStep = step;
        maxVal = Math.max(1, Math.max.apply(null, step.array));
        syncStates(step);
        shiftState = { shiftedIdx: anim.shiftedIdx, keyIdx: anim.keyIdx };
        animating = true;
        animFrame = 0;
        updateGlobalAnimation(true);
        return true;
      }

      p.setup = function () {
        var container = resolveContainer(containerRef);
        canvasHeight = Number(container.dataset.height) || 340;
        var cnv = p.createCanvas(container.offsetWidth, canvasHeight);
        cnv.parent(container);
        p.textFont('DM Mono');
      };

      p.draw = function () {
        var bg = hexToRgb(getCSSVarCached('--surface-2'));
        var textColor = hexToRgb(getCSSVarCached('--muted'));
        p.background(bg[0], bg[1], bg[2]);
        if (!bars.length) return;

        var usableW = p.width - paddingSides * 2;
        var barW = (usableW - barGap * (bars.length - 1)) / bars.length;

        // key bar on top during shift
        var drawOrder = [];
        for (var k = 0; k < bars.length; k++) drawOrder.push(k);
        if (animating && shiftState) {
          drawOrder = [];
          for (var k = 0; k < bars.length; k++) {
            if (k !== shiftState.keyIdx) drawOrder.push(k);
          }
          drawOrder.push(shiftState.keyIdx);
        }

        for (var j = 0; j < drawOrder.length; j++) {
          var i = drawOrder[j];
          var targetH = (bars[i].value / maxVal) * (p.height - paddingTop - paddingBottom);
          var diff = targetH - bars[i].displayH;
          bars[i].displayH = Math.abs(diff) < 0.4 ? targetH : bars[i].displayH + diff * lerpSpeed;

          var x = paddingSides + i * (barW + barGap);
          var y = p.height - paddingBottom - bars[i].displayH;
          var alpha = 255;
          var scale = 1.0;
          var brightness = 1.0;

          if (animating && shiftState) {
            var t = animFrame / SHIFT_FRAMES;
            var arc = Math.sin(t * Math.PI);
            var ease = t * t * (3 - 2 * t);

            if (i === shiftState.shiftedIdx) {
              // slide right one slot
              var targetX = paddingSides + (i + 1) * (barW + barGap);
              x = x + (targetX - x) * ease;
              brightness = 1 - arc * 0.2;
              alpha = 255 * (1 - arc * 0.25);
            } else if (i === shiftState.keyIdx) {
              scale = 1 + arc * 0.10;
              y -= arc * 14;
              brightness = 1 + arc * 0.14;
            }
          }

          p.noStroke();
          var baseColor = p.color(stateColor(bars[i].state));
          p.fill(
            clamp(baseColor.levels[0] * brightness, 0, 255),
            clamp(baseColor.levels[1] * brightness, 0, 255),
            clamp(baseColor.levels[2] * brightness, 0, 255),
            alpha
          );
          var fw = barW * scale;
          var fh = bars[i].displayH * scale;
          p.rect(x + (barW - fw) / 2, y + (bars[i].displayH - fh), fw, fh, 4, 4, 0, 0);

          p.fill(textColor[0], textColor[1], textColor[2], alpha);
          p.textSize(10);
          p.textAlign(p.CENTER, p.TOP);
          p.text(bars[i].label, x + barW / 2, p.height - paddingBottom + 10);
        }

        if (animating) {
          animFrame++;
          if (animFrame >= SHIFT_FRAMES && shiftState) {
            animating = false;
            animFrame = 0;
            shiftState = null;
            syncBarsFromArray(currentStep.array);
            syncStates(currentStep);
            updateGlobalAnimation(false);
          }
        }
      };

      p.windowResized = function () {
        var container = resolveContainer(containerRef);
        p.resizeCanvas(container.offsetWidth, canvasHeight);
      };

      p.applyStep = function (step) {
        stopAnimations();
        currentStep = step;
        maxVal = Math.max(1, Math.max.apply(null, step.array));
        if (startShift(step)) return;
        syncBarsFromArray(step.array);
        syncStates(step);
      };

      p.resetBars = function (array) {
        stopAnimations();
        maxVal = Math.max(1, Math.max.apply(null, array));
        bars = array.map(function (v) { return makeBar(v); });
      };

      p.setLerpSpeed = function (value) { lerpSpeed = value; };

      p.destroy = function () { stopAnimations(); p.remove(); };
    };

    return new p5(sketch);
  }

  window.mountSketch = mountSketch;
})();
