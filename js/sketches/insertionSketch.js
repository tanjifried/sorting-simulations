(function () {
  var ANIM_FRAMES = 24;

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

  function mountSketch(containerRef) {
    var sketch = function (p) {
      var bars = [];
      var maxVal = 100;
      var lerpSpeed = 0.15;
      var animFrames = 24;
      var paddingTop = 60; // Extra room for floating key
      var paddingBottom = 40;
      var paddingSides = 20;
      var barGap = 6;
      var canvasHeight = 340;
      var currentStep = null;
      var animating = false;
      var animFrame = 0;
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
        updateGlobalAnimation(false);
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
        var t = animating ? clamp(animFrame / (animFrames - 1), 0, 1) : 1;
        var ease = t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;

        for (var i = 0; i < bars.length; i++) {
          var targetH = (bars[i].value / maxVal) * (p.height - paddingTop - paddingBottom);
          bars[i].displayH = p.lerp(bars[i].displayH, targetH, lerpSpeed);

          var x = paddingSides + i * (barW + barGap);
          var y = p.height - paddingBottom - bars[i].displayH;
          var alpha = 255;
          var isHole = currentStep && currentStep.holeIdx === i && currentStep.type !== 'insert' && currentStep.type !== 'init' && currentStep.type !== 'done';
          
          if (isHole) {
             alpha = 40; // Render hole as ghost
          }

          // Special animation for shifting
          if (animating && currentStep.type === 'shift' && i === currentStep.targetIdx) {
              var startX = paddingSides + currentStep.shiftedIdx * (barW + barGap);
              x = p.lerp(startX, x, ease);
              alpha = 255;
          }

          p.noStroke();
          p.fill(p.color(stateColor(bars[i].state + (isHole ? '' : ''))).levels[0], 
                 p.color(stateColor(bars[i].state)).levels[1], 
                 p.color(stateColor(bars[i].state)).levels[2], 
                 alpha);
          
          p.rect(x, y, barW, bars[i].displayH, 4, 4, 0, 0);

          if (!isHole) {
            p.fill(textColor[0], textColor[1], textColor[2], alpha);
            p.textSize(10);
            p.textAlign(p.CENTER, p.TOP);
            p.text(bars[i].label, x + barW / 2, p.height - paddingBottom + 10);
          }
        }

        // Draw floating key
        if (currentStep && currentStep.key !== null && typeof currentStep.key !== 'undefined') {
            var keyVal = currentStep.key;
            var keyH = (keyVal / maxVal) * (p.height - paddingTop - paddingBottom);
            var keyColor = p.color(getCSSVarCached('--bar-key'));
            
            var targetHoleIdx = (typeof currentStep.holeIdx === 'number') ? currentStep.holeIdx : currentStep.keyIdx;
            var keyX = paddingSides + targetHoleIdx * (barW + barGap);
            var keyY = p.height - paddingBottom - keyH - 40; // Default lift height

            if (animating) {
                if (currentStep.type === 'pick_key') {
                    keyY = p.lerp(p.height - paddingBottom - keyH, keyY, ease);
                } else if (currentStep.type === 'insert' || currentStep.type === 'in_place') {
                    keyY = p.lerp(keyY, p.height - paddingBottom - keyH, ease);
                } else if (currentStep.type === 'shift') {
                    var prevHoleIdx = currentStep.targetIdx;
                    var prevX = paddingSides + prevHoleIdx * (barW + barGap);
                    keyX = p.lerp(prevX, keyX, ease);
                }
            }

            // Glow effect for key
            p.noStroke();
            p.fill(keyColor.levels[0], keyColor.levels[1], keyColor.levels[2], 100);
            p.rect(keyX - 2, keyY - 2, barW + 4, keyH + 4, 6, 6, 0, 0);
            
            p.fill(keyColor.levels[0], keyColor.levels[1], keyColor.levels[2], 255);
            p.rect(keyX, keyY, barW, keyH, 4, 4, 0, 0);
            
            p.fill(textColor[0], textColor[1], textColor[2]);
            p.text(String(keyVal), keyX + barW / 2, keyY - 15);
        }

        if (animating) {
          animFrame++;
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
        syncBarsFromArray(step.array);
        syncStates(step);
        
        // Only animate if we have frames to spare
        if (animFrames > 0 && ['pick_key', 'shift', 'insert', 'in_place'].indexOf(step.type) !== -1) {
            animating = true;
            animFrame = 0;
            updateGlobalAnimation(true);
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
          animFrames = Math.floor((ms / 1000) * 60 * 0.7); // 70% of delay
          animFrames = clamp(animFrames, 1, 40);
        }
      };

      p.destroy = function () { stopAnimations(); p.remove(); };
    };

    return new p5(sketch);
  }

  window.mountSketch = mountSketch;
})();
