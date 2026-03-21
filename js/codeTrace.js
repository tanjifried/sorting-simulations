(function () {
  function initCodeTrace(options) {
    var container = options.container;
    var codeStrings = options.codeStrings;
    var lineMap = options.lineMap || {};
    var blocks = {};
    var activeLang = null;
    var activeLine = null;

    Object.keys(codeStrings).forEach(function (lang) {
      var block = document.createElement('div');
      block.className = 'code-language-block';
      block.dataset.lang = lang;
      block.lines = [];

      codeStrings[lang].forEach(function (line, index) {
        var lineEl = document.createElement('div');
        lineEl.className = 'code-line';
        lineEl.dataset.line = String(index + 1);

        var num = document.createElement('span');
        num.className = 'code-line-number';
        num.textContent = String(index + 1).padStart(2, '0');

        var content = document.createElement('span');
        content.className = 'code-line-content';
        content.textContent = line;

        lineEl.appendChild(num);
        lineEl.appendChild(content);
        block.appendChild(lineEl);
        block.lines.push(lineEl);
      });

      blocks[lang] = block;
      container.appendChild(block);
    });

    function render(lang, stepType) {
      if (!blocks[lang]) {
        return;
      }

      var lineNum = (lineMap[lang] && lineMap[lang][stepType]) ? lineMap[lang][stepType] : 1;

      if (activeLang && blocks[activeLang]) {
        blocks[activeLang].classList.remove('active');
      }

      var block = blocks[lang];
      block.classList.add('active');
      activeLang = lang;

      if (activeLine && activeLine.parentNode === block) {
        activeLine.classList.remove('active');
      } else {
        Object.keys(blocks).forEach(function (key) {
          blocks[key].lines.forEach(function (lineEl) {
            lineEl.classList.remove('active');
          });
        });
      }

      activeLine = block.lines[Math.max(0, (lineNum || 1) - 1)] || block.lines[0];
      if (activeLine) {
        activeLine.classList.add('active');
        activeLine.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      }
    }

    return {
      render: render,
    };
  }

  window.initCodeTrace = initCodeTrace;
})();
