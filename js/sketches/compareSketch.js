(function () {
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

  function stateColor(state) {
    if (state === 'compare') return getCSSVar('--bar-compare');
    if (state === 'swap') return getCSSVar('--bar-swap');
    if (state === 'sorted') return getCSSVar('--bar-sorted');
    if (state === 'noswap') return getCSSVar('--bar-noswap');
    if (state === 'min') return getCSSVar('--bar-min');
    if (state === 'key') return getCSSVar('--bar-key');
    if (state === 'shift') return getCSSVar('--bar-shift');
    return getCSSVar('--bar-default');
  }

  function stateForAlgorithm(index, step, algorithm) {
    if (algorithm === 'bubble') {
      if (step.swap && step.swap.indexOf(index) !== -1) return 'swap';
      if (step.noSwap && step.noSwap.indexOf(index) !== -1) return 'noswap';
      if (step.compare && step.compare.indexOf(index) !== -1) return 'compare';
      if (step.sorted && step.sorted.indexOf(index) !== -1) return 'sorted';
      return 'default';
    }

    if (algorithm === 'selection') {
      if (step.swap && step.swap.indexOf(index) !== -1) return 'swap';
      if (step.currentMin === index) return 'min';
      if (step.scan === index) return 'compare';
      if (step.sorted && step.sorted.indexOf(index) !== -1) return 'sorted';
      return 'default';
    }

    // Insertion
    if (step.type === 'in_place' && step.keyIdx === index) return 'noswap';
    if (step.type === 'pick_key' && step.keyIdx === index) return 'key';
    if (step.type === 'insert' && step.insertIdx === index) return 'key';
    if (step.shiftedIdx === index) return 'shift';
    if (step.comparing === index) return 'compare';
    if (index < (step.sortedLen || 0)) return 'sorted';
    return 'default';
  }

  function comparisonIndicesForStep(step, algorithm) {
    if (step.swap && step.swap.length) return [];
    if (algorithm === 'bubble') {
      if (step.noSwap && step.noSwap.length) return step.noSwap.slice();
      if (step.compare && step.compare.length) return step.compare.slice();
      return [];
    }

    if (algorithm === 'selection') {
      if (typeof step.scan === 'number' && typeof step.currentMin === 'number') {
        return [step.scan, step.currentMin];
      }
      return [];
    }

    if (typeof step.comparing === 'number' && typeof step.keyIdx === 'number') {
      return [step.comparing, step.keyIdx];
    }
    return [];
  }

  function mountSketch(containerRef, algorithm) {
    var sketch = function (p) {
      var bars = [];
      var maxVal = 100;
      var lerpSpeed = 0.12;
      var animFrames = 18;
      var paddingTop = (algorithm === 'insertion') ? 40 : 18;
      var paddingBottom = 34;
      var paddingSides = 14;
      var barGap = 4;
      var canvasHeight = 220;
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
        return { value: value, displayH: 0, state: 'default', label: String(value) };
      }

      function syncBarsFromArray(array) {
        for (var i = 0; i < array.length; i += 1) {
          if (!bars[i]) bars[i] = makeBar(array[i]);
          bars[i].value = array[i];
          bars[i].label = String(array[i]);
        }
        bars.length = array.length;
      }

      function syncStates(step) {
        for (var i = 0; i < bars.length; i += 1) {
          bars[i].state = stateForAlgorithm(i, step, algorithm);
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
        var indices = comparisonIndicesForStep(step, algorithm);
        pulseState = indices.length ? { indices: indices, frame: 0 } : null;
      }

      function startSwap(step) {
        if (!step.swap || step.swap.length !== 2 || algorithm === 'insertion') {
          return false;
        }
        var left = step.swap[0];
        var right = step.swap[1];
        if (!bars[left] || !bars[right]) {
          syncBarsFromArray(step.array);
          return false;
        }
        
        if (animFrames < 1) {
          syncBarsFromArray(step.array);
          syncStates(step);
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
        canvasHeight = Number(container.dataset.height) || 220;
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
        var t = animating ? clamp(animFrame / Math.max(1, animFrames - 1), 0, 1) : 1;
        var ease = t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;

        var drawOrder = [];
        for (var k = 0; k < bars.length; k++) drawOrder.push(k);
        if (animating && swapState) {
          drawOrder = [];
          drawOrder.push(swapState.right);
          for (var k = 0; k < bars.length; k++) {
            if (k !== swapState.left && k !== swapState.right) drawOrder.push(k);
          }
          drawOrder.push(swapState.left);
        }

        for (var j = 0; j < drawOrder.length; j += 1) {
          var i = drawOrder[j];
          var targetH = (bars[i].value / maxVal) * (p.height - paddingTop - paddingBottom);
          bars[i].displayH = p.lerp(bars[i].displayH, targetH, lerpSpeed);

          var x = paddingSides + i * (barW + barGap);
          var y = p.height - paddingBottom - bars[i].displayH;
          var alpha = 255;
          var scale = 1.0;
          var brightness = 1.0;

          if (algorithm === 'insertion') {
              var isHole = currentStep && currentStep.holeIdx === i && currentStep.type !== 'insert' && currentStep.type !== 'init' && currentStep.type !== 'done';
              if (isHole) alpha = 40;
              if (animating && currentStep.type === 'shift' && i === currentStep.targetIdx) {
                  var startX = paddingSides + currentStep.shiftedIdx * (barW + barGap);
                  x = p.lerp(startX, x, ease);
                  alpha = 255;
              }
          }

          if (animating && swapState && (i === swapState.left || i === swapState.right)) {
            var depth = Math.sin(t * Math.PI);
            var swapTargetIndex = i === swapState.left ? swapState.right : swapState.left;
            var startX = paddingSides + i * (barW + barGap);
            var targetX = paddingSides + swapTargetIndex * (barW + barGap);
            x = p.lerp(startX, targetX, ease);
            if (i === swapState.left) {
              scale = 1 + depth * 0.15;
              y -= depth * 20;
              brightness = 1 + depth * 0.2;
            } else {
              scale = 1 - depth * 0.15;
              y += depth * 10;
              brightness = 1 - depth * 0.3;
              alpha = 255 * (1 - depth * 0.4);
            }
          } else if (pulseState && pulseState.indices.indexOf(i) !== -1) {
            var pulseStrength = t < 0.5 ? t * 2 : (1 - t) * 2;
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
          
          var fw = barW * scale;
          var fh = bars[i].displayH * scale;
          p.rect(x + (barW - fw) / 2, y + (bars[i].displayH - fh), fw, fh, 4, 4, 0, 0);

          if (!(algorithm === 'insertion' && currentStep && currentStep.holeIdx === i && currentStep.type !== 'insert')) {
            p.fill(textColor[0], textColor[1], textColor[2], alpha);
            p.textSize(9);
            p.textAlign(p.CENTER, p.TOP);
            p.text(bars[i].label, x + barW / 2, p.height - paddingBottom + 8);
          }
        }

        // Draw floating key for insertion
        if (algorithm === 'insertion' && currentStep && currentStep.key !== null && typeof currentStep.key !== 'undefined') {
            var keyVal = currentStep.key;
            var keyH = (keyVal / maxVal) * (p.height - paddingTop - paddingBottom);
            var keyColor = p.color(getCSSVar('--bar-key'));
            var targetHoleIdx = (typeof currentStep.holeIdx === 'number') ? currentStep.holeIdx : currentStep.keyIdx;
            var keyX = paddingSides + targetHoleIdx * (barW + barGap);
            var keyY = p.height - paddingBottom - keyH - 25;

            if (animating) {
                if (currentStep.type === 'pick_key') {
                    keyY = p.lerp(p.height - paddingBottom - keyH, keyY, ease);
                } else if (currentStep.type === 'insert' || currentStep.type === 'in_place') {
                    keyY = p.lerp(keyY, p.height - paddingBottom - keyH, ease);
                } else if (currentStep.type === 'shift') {
                    var prevX = paddingSides + (currentStep.targetIdx + 1) * (barW + barGap);
                    keyX = p.lerp(prevX, keyX, ease);
                }
            }
            p.fill(keyColor.levels[0], keyColor.levels[1], keyColor.levels[2], 255);
            p.rect(keyX, keyY, barW, keyH, 4, 4, 0, 0);
            p.fill(textColor[0], textColor[1], textColor[2]);
            p.textSize(9);
            p.text(String(keyVal), keyX + barW / 2, keyY - 12);
        }

        if (animating) {
          animFrame += 1;
          if (animFrame >= animFrames) {
            stopAnimations();
            syncBarsFromArray(currentStep.array);
            syncStates(currentStep);
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
        if (startSwap(step)) return;
        syncBarsFromArray(step.array);
        syncStates(step);
        if (algorithm === 'insertion' && ['pick_key', 'shift', 'insert', 'in_place'].indexOf(step.type) !== -1) {
            if (animFrames > 0) {
              animating = true;
              animFrame = 0;
              updateGlobalAnimation(true);
            }
        } else {
            startPulse(step);
        }
      };

      p.resetBars = function (array) {
        stopAnimations();
        currentStep = null;
        maxVal = Math.max(1, Math.max.apply(null, array));
        bars = array.map(function (v) { return makeBar(v); });
      };

      p.setLerpSpeed = function (value) { lerpSpeed = value; };

      p.setSpeed = function (ms) {
        if (ms < 50) {
          animFrames = 0;
        } else {
          animFrames = Math.floor((ms / 1000) * 60 * 0.6);
          animFrames = clamp(animFrames, 1, 40);
        }
      };

      p.destroy = function () { stopAnimations(); p.remove(); };
    };
    return new p5(sketch);
  }
  window.mountSketch = mountSketch;
})();
