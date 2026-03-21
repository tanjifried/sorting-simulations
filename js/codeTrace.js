(function () {
  function escapeHtml(text) {
    return String(text)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');
  }

  function wrapToken(type, value) {
    return '<span class="tok-' + type + '">' + escapeHtml(value) + '</span>';
  }

  function tokenizeLine(line, lang) {
    var text = String(line || '');
    var index = 0;
    var html = '';
    var keywordTypes = { int: true, boolean: true, void: true, String: true };
    var keywords = {
      'function': true,
      'for': true,
      'if': true,
      'return': true,
      'void': true,
      'int': true,
      'boolean': true,
      'while': true,
      'true': true,
      'false': true,
      'new': true,
      'else': true,
      'break': true,
      'def': true,
      'pass': true,
      'in': true,
      'not': true,
      'len': true,
      'range': true,
    };
    var operators = ['==', '!=', '<=', '>=', '++', '--', '+=', '-=', '*=', '/=', '&&', '||'];
    var punct = { '(': true, ')': true, '{': true, '}': true, '[': true, ']': true, ';': true, ',': true, ':': true };

    function isWordChar(char) {
      return /[A-Za-z0-9_]/.test(char);
    }

    while (index < text.length) {
      var rest = text.slice(index);
      var char = text.charAt(index);
      var match;
      var operator = null;
      var prev;
      var next;

      if ((lang === 'pseudo' && rest.slice(0, 2) === '--') || rest.slice(0, 2) === '//') {
        html += wrapToken('comment', rest);
        break;
      }

      if (char === '#' && lang === 'python') {
        html += wrapToken('comment', rest);
        break;
      }

      if (char === '"' || char === "'") {
        var quote = char;
        var end = index + 1;
        while (end < text.length) {
          if (text.charAt(end) === '\\') {
            end += 2;
            continue;
          }
          if (text.charAt(end) === quote) {
            end += 1;
            break;
          }
          end += 1;
        }
        html += wrapToken('str', text.slice(index, end));
        index = end;
        continue;
      }

      match = rest.match(/^\d+(?:\.\d+)?/);
      if (match) {
        html += wrapToken('num', match[0]);
        index += match[0].length;
        continue;
      }

      match = rest.match(/^[A-Za-z_][A-Za-z0-9_]*/);
      if (match) {
        var word = match[0];
        prev = index > 0 ? text.charAt(index - 1) : '';
        next = text.charAt(index + word.length);
        if (keywordTypes[word]) {
          html += wrapToken('type', word);
        } else if (keywords[word]) {
          html += wrapToken('kw', word);
        } else if (next === '(' && prev !== '.') {
          html += wrapToken('fn', word);
        } else {
          html += wrapToken('var', word);
        }
        index += word.length;
        continue;
      }

      for (var i = 0; i < operators.length; i += 1) {
        if (rest.slice(0, operators[i].length) === operators[i]) {
          operator = operators[i];
          break;
        }
      }

      if (!operator && /[=<>+\-*/!]/.test(char)) {
        operator = char;
      }

      if (operator) {
        html += wrapToken('op', operator);
        index += operator.length;
        continue;
      }

      if (punct[char]) {
        html += wrapToken('punct', char);
        index += 1;
        continue;
      }

      if (char === '.' && isWordChar(text.charAt(index + 1))) {
        html += wrapToken('punct', char);
        index += 1;
        continue;
      }

      html += escapeHtml(char);
      index += 1;
    }

    return html;
  }

  function initCodeTrace(options) {
    var container = options.container;
    var codeStrings = options.codeStrings;
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
        content.innerHTML = tokenizeLine(line, lang);

        lineEl.appendChild(num);
        lineEl.appendChild(content);
        block.appendChild(lineEl);
        block.lines.push(lineEl);
      });

      blocks[lang] = block;
      container.appendChild(block);
    });

    function render(lang, step) {
      if (!blocks[lang]) {
        return;
      }

      var lineNum = 1;
      if (step && step.codeLine && step.codeLine[lang]) {
        lineNum = step.codeLine[lang];
      }

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
