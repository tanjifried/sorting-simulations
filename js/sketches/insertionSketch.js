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
    if (state === 'sorted') return getCSSVar('--bar-sorted');
    if (state === 'noswap') return getCSSVar('--bar-noswap');
    if (state === 'key') return getCSSVar('--bar-key');
    if (state === 'shift') return getCSSVar('--bar-shift');
    return getCSSVar('--bar-default');
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

  function comparisonIndicesForStep(step) {
    if (typeof step.comparing === 'number' && typeof step.keyIdx === 'number') {
      return [step.comparing, step.keyIdx];
    }
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
      var pulseState = null;

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

        for (var i = 0; i < bars.length; i += 1) {
          var targetH = (bars[i].value / maxVal) * (p.height - paddingTop - paddingBottom);
          bars[i].displayH = p.lerp(bars[i].displayH, targetH, lerpSpeed);

          var x = paddingSides + i * (barW + barGap);
          var y = p.height - paddingBottom - bars[i].displayH;
          var alpha = 255;

          if (pulseState && pulseState.indices.indexOf(i) !== -1) {
            var pulseT = pulseState.frame / Math.max(1, PULSE_FRAMES - 1);
            var pulseStrength = pulseT < 0.5 ? pulseT * 2 : (1 - pulseT) * 2;
            alpha = 255 * (1 - pulseStrength * 0.5);
          }

          p.noStroke();
          var fillColor = p.color(stateColor(bars[i].state));
          p.fill(fillColor.levels[0], fillColor.levels[1], fillColor.levels[2], alpha);
          p.rect(x, y, barW, bars[i].displayH, 4, 4, 0, 0);

          p.fill(textColor[0], textColor[1], textColor[2]);
          p.textSize(10);
          p.textAlign(p.CENTER, p.TOP);
          p.text(bars[i].label, x + barW / 2, p.height - paddingBottom + 12);
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
        pulseState = null;
        window.sortLabAnimating = !!window.sortLabAnimationCount;
        maxVal = Math.max(1, Math.max.apply(null, step.array));
        step.array.forEach(function (val, i) {
          if (!bars[i]) bars[i] = { value: val, displayH: 0, state: 'default', label: String(val) };
          bars[i].value = val;
          bars[i].state = barStateForStep(i, step);
          bars[i].label = String(val);
        });
        bars.length = step.array.length;
        var indices = comparisonIndicesForStep(step);
        if (indices.length) {
          pulseState = { indices: indices, frame: 0 };
        }
      };

      p.resetBars = function (array) {
        pulseState = null;
        maxVal = Math.max(1, Math.max.apply(null, array));
        bars = array.map(function (v) {
          return { value: v, displayH: 0, state: 'default', label: String(v) };
        });
      };

      p.setLerpSpeed = function (value) {
        lerpSpeed = value;
      };

      p.destroy = function () {
        pulseState = null;
        p.remove();
      };
    };

    return new p5(sketch);
  }

  window.mountSketch = mountSketch;
})();
