(function () {
  var SWAP_FRAMES = 18;
  var PULSE_FRAMES = 8;

  function resolveContainer(containerRef) {
    return typeof containerRef === 'string' ? document.getElementById(containerRef) : containerRef;
  }

  function getCSSVar(name) {
    return getComputedStyle(document.body).getPropertyValue(name).trim();
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

  function easeInOut(t) {
    t = clamp(t, 0, 1);
    return t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;
  }

  function phaseProgress(frame, start, end) {
    return clamp((frame - start) / Math.max(1, end - start), 0, 1);
  }

  function stateColor(state) {
    if (state === 'compare') return getCSSVar('--bar-compare');
    if (state === 'swap') return getCSSVar('--bar-swap');
    if (state === 'sorted') return getCSSVar('--bar-sorted');
    if (state === 'noswap') return getCSSVar('--bar-noswap');
    return getCSSVar('--bar-default');
  }

  function barStateForStep(index, step) {
    if (step.swap && step.swap.indexOf(index) !== -1) return 'swap';
    if (step.noSwap && step.noSwap.indexOf(index) !== -1) return 'noswap';
    if (step.compare && step.compare.indexOf(index) !== -1) return 'compare';
    if (step.sorted && step.sorted.indexOf(index) !== -1) return 'sorted';
    return 'default';
  }

  function comparisonIndicesForStep(step) {
    if (step.noSwap && step.noSwap.length) return step.noSwap.slice();
    if (step.compare && step.compare.length) return step.compare.slice();
    return [];
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
      var nextBarId = 0;
      var currentStep = null;
      var animating = false;
      var animFrame = 0;
      var swapState = null;
      var pulseState = null;
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
        nextBarId += 1;
        return { id: nextBarId, value: value, displayH: 0, state: 'default', label: String(value) };
      }

      function syncBarsFromArray(array) {
        var i;
        for (i = 0; i < array.length; i += 1) {
          if (!bars[i]) bars[i] = makeBar(array[i]);
          bars[i].value = array[i];
          bars[i].label = String(array[i]);
        }
        bars.length = array.length;
      }

      function syncStates(step) {
        var i;
        for (i = 0; i < bars.length; i += 1) {
          bars[i].state = barStateForStep(i, step);
          bars[i].label = String(bars[i].value);
        }
      }

      function stopAnimations() {
        animating = false;
        animFrame = 0;
        swapState = null;
        pulseState = null;
        updateGlobalAnimation(false);
      }

      function startPulse(step) {
        var indices = comparisonIndicesForStep(step);
        pulseState = indices.length ? { indices: indices, frame: 0 } : null;
      }

      function startSwap(step) {
        if (!step.swap || step.swap.length !== 2) {
          return false;
        }

        var left = step.swap[0];
        var right = step.swap[1];
        if (!bars[left] || !bars[right]) {
          syncBarsFromArray(step.array);
          return false;
        }

        pulseState = null;
        currentStep = step;
        maxVal = Math.max(1, Math.max.apply(null, step.array));
        syncStates(step);
        swapState = { left: left, right: right };
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
        var bg = hexToRgb(getCSSVar('--surface-2'));
        var textColor = hexToRgb(getCSSVar('--muted'));
        p.background(bg[0], bg[1], bg[2]);
        if (!bars.length) return;

        var usableW = p.width - paddingSides * 2;
        var barW = (usableW - barGap * (bars.length - 1)) / bars.length;

        // 1. Determine draw order: Back bar, then Neutral bars, then Front bar
        var drawOrder = [];
        for (var k = 0; k < bars.length; k++) drawOrder.push(k);

        if (animating && swapState) {
          drawOrder = [];
          // Back bar first
          drawOrder.push(swapState.right);
          // All others
          for (var k = 0; k < bars.length; k++) {
            if (k !== swapState.left && k !== swapState.right) drawOrder.push(k);
          }
          // Front bar last
          drawOrder.push(swapState.left);
        }

        // 2. Render according to order
        for (var j = 0; j < drawOrder.length; j += 1) {
          var i = drawOrder[j];
          var targetH = (bars[i].value / maxVal) * (p.height - paddingTop - paddingBottom);
          bars[i].displayH = p.lerp(bars[i].displayH, targetH, lerpSpeed);

          var x = paddingSides + i * (barW + barGap);
          var y = p.height - paddingBottom - bars[i].displayH;
          var alpha = 255;
          var scale = 1.0;
          var brightness = 1.0;

          if (animating && swapState && (i === swapState.left || i === swapState.right)) {
            var t = animFrame / SWAP_FRAMES;
            var depth = Math.sin(t * Math.PI); // 0 -> 1 -> 0

            // Horizontal Slide
            var xEase = t * t * (3 - 2 * t); // Smooth ease
            var swapTargetIndex = i === swapState.left ? swapState.right : swapState.left;
            var startX = paddingSides + i * (barW + barGap);
            var targetX = paddingSides + swapTargetIndex * (barW + barGap);
            x = p.lerp(startX, targetX, xEase);

            if (i === swapState.left) {
              // Hover to Front
              scale = 1 + depth * 0.15;
              y -= depth * 20; // Lift up
              brightness = 1 + depth * 0.2;
            } else {
              // Sink to Back
              scale = 1 - depth * 0.15;
              y += depth * 10; // Sink down
              brightness = 1 - depth * 0.3;
              alpha = 255 * (1 - depth * 0.4);
            }
          } else if (pulseState && pulseState.indices.indexOf(i) !== -1) {
            var pulseT = pulseState.frame / Math.max(1, PULSE_FRAMES - 1);
            var pulseStrength = pulseT < 0.5 ? pulseT * 2 : (1 - pulseT) * 2;
            alpha = 255 * (1 - pulseStrength * 0.5);
          }

          p.noStroke();
          var baseColor = p.color(stateColor(bars[i].state));
          p.fill(
            clamp(baseColor.levels[0] * brightness, 0, 255),
            clamp(baseColor.levels[1] * brightness, 0, 255),
            clamp(baseColor.levels[2] * brightness, 0, 255),
            alpha
          );
          
          var finalW = barW * scale;
          var finalH = bars[i].displayH * scale;
          var xAdjust = (barW - finalW) / 2;
          var yAdjust = (bars[i].displayH - finalH);
          
          p.rect(x + xAdjust, y + yAdjust, finalW, finalH, 4 * scale, 4 * scale, 0, 0);

          p.fill(textColor[0], textColor[1], textColor[2], alpha);
          p.textSize(10 * scale);
          p.textAlign(p.CENTER, p.TOP);
          p.text(bars[i].label, x + barW / 2, p.height - paddingBottom + 12);
        }

        if (animating) {
          animFrame += 1;
          if (animFrame >= SWAP_FRAMES && swapState) {
            var temp = bars[swapState.left];
            bars[swapState.left] = bars[swapState.right];
            bars[swapState.right] = temp;
            animating = false;
            animFrame = 0;
            swapState = null;
            syncBarsFromArray(currentStep.array);
            syncStates(currentStep);
            updateGlobalAnimation(false);
          }
        }

        if (pulseState) {
          pulseState.frame += 1;
          if (pulseState.frame >= PULSE_FRAMES) {
            pulseState = null;
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
        if (startSwap(step)) {
          return;
        }
        syncBarsFromArray(step.array);
        syncStates(step);
        startPulse(step);
      };

      p.resetBars = function (array) {
        stopAnimations();
        maxVal = Math.max(1, Math.max.apply(null, array));
        bars = array.map(function (v) {
          return makeBar(v);
        });
      };

      p.setLerpSpeed = function (value) {
        lerpSpeed = value;
      };

      p.destroy = function () {
        stopAnimations();
        p.remove();
      };
    };

    return new p5(sketch);
  }

  window.mountSketch = mountSketch;
})();
