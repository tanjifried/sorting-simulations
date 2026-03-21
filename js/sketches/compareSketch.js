(function () {
  var DEFAULT_COLOR = '#475569';
  var COMPARE_COLOR = '#f59e0b';
  var SWAP_COLOR = '#f43f5e';
  var SORTED_COLOR = '#10b981';
  var NOSWAP_COLOR = '#8b5cf6';
  var MIN_COLOR = '#f97316';
  var KEY_COLOR = '#38bdf8';
  var SHIFT_COLOR = '#a855f7';

  function stateColor(state) {
    if (state === 'compare') return COMPARE_COLOR;
    if (state === 'swap') return SWAP_COLOR;
    if (state === 'sorted') return SORTED_COLOR;
    if (state === 'noswap') return NOSWAP_COLOR;
    if (state === 'min') return MIN_COLOR;
    if (state === 'key') return KEY_COLOR;
    if (state === 'shift') return SHIFT_COLOR;
    return DEFAULT_COLOR;
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

    if (step.type === 'in_place' && step.keyIdx === index) return 'noswap';
    if (step.type === 'pick_key' && step.keyIdx === index) return 'key';
    if (step.type === 'insert' && step.insertIdx === index) return 'key';
    if (step.shiftedIdx === index) return 'shift';
    if (step.comparing === index) return 'compare';
    if (index < (step.sortedLen || 0)) return 'sorted';
    return 'default';
  }

  function mountSketch(containerId, algorithm) {
    var sketch = function (p) {
      var bars = [];
      var maxVal = 100;
      var lerpSpeed = 0.12;
      var paddingTop = 18;
      var paddingBottom = 34;
      var paddingSides = 14;
      var barGap = 4;
      var canvasHeight = 220;

      p.setup = function () {
        var container = document.getElementById(containerId);
        canvasHeight = Number(container.dataset.height) || 220;
        var cnv = p.createCanvas(container.offsetWidth, canvasHeight);
        cnv.parent(containerId);
        p.textFont('DM Mono');
      };

      p.draw = function () {
        p.background(15, 17, 23);
        if (!bars.length) return;

        var usableW = p.width - paddingSides * 2;
        var barW = (usableW - barGap * (bars.length - 1)) / bars.length;

        for (var i = 0; i < bars.length; i += 1) {
          var targetH = (bars[i].value / maxVal) * (p.height - paddingTop - paddingBottom);
          bars[i].displayH = p.lerp(bars[i].displayH, targetH, lerpSpeed);

          var x = paddingSides + i * (barW + barGap);
          var y = p.height - paddingBottom - bars[i].displayH;

          p.noStroke();
          p.fill(stateColor(bars[i].state));
          p.rect(x, y, barW, bars[i].displayH, 4, 4, 0, 0);

          p.fill(100, 116, 139);
          p.textSize(10);
          p.textAlign(p.CENTER, p.TOP);
          p.text(bars[i].label, x + barW / 2, p.height - paddingBottom + 8);
        }
      };

      p.windowResized = function () {
        var container = document.getElementById(containerId);
        p.resizeCanvas(container.offsetWidth, canvasHeight);
      };

      p.applyStep = function (step) {
        maxVal = Math.max(1, Math.max.apply(null, step.array));
        step.array.forEach(function (val, i) {
          if (!bars[i]) bars[i] = { value: val, displayH: 0, state: 'default', label: String(val) };
          bars[i].value = val;
          bars[i].state = stateForAlgorithm(i, step, algorithm);
          bars[i].label = String(val);
        });
        bars.length = step.array.length;
      };

      p.resetBars = function (array) {
        maxVal = Math.max(1, Math.max.apply(null, array));
        bars = array.map(function (v) {
          return { value: v, displayH: 0, state: 'default', label: String(v) };
        });
      };

      p.setLerpSpeed = function (value) {
        lerpSpeed = value;
      };
    };

    return new p5(sketch);
  }

  window.mountSketch = mountSketch;
})();
