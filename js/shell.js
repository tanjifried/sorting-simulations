(function () {
  var PAGES = [
    { file: 'index.html', label: 'Home', step: -1 },
    { file: 'bubble.html', label: 'Bubble Sort', step: 0 },
    { file: 'selection.html', label: 'Selection Sort', step: 1 },
    { file: 'insertion.html', label: 'Insertion Sort', step: 2 },
    { file: 'compare.html', label: 'Compare All', step: 3 },
  ];

  function currentFile() {
    var path = window.location.pathname || '';
    var file = path.split('/').pop();
    return file || 'index.html';
  }

  function currentPage() {
    var file = currentFile();
    for (var i = 0; i < PAGES.length; i += 1) {
      if (PAGES[i].file === file) {
        return PAGES[i];
      }
    }
    return PAGES[0];
  }

  function applySavedTheme() {
    var saved = localStorage.getItem('sort-lab-theme');
    if (saved) {
      document.body.setAttribute('data-theme', saved);
    } else if (!document.body.getAttribute('data-theme')) {
      document.body.setAttribute('data-theme', 'dark');
    }
  }

  function createLink(page, activeFile) {
    var link = document.createElement('a');
    link.href = page.file;
    link.className = 'topnav-link' + (page.file === activeFile ? ' active' : '');
    link.textContent = page.label === 'Compare All' ? 'Compare' : page.label.replace(' Sort', '');
    return link;
  }

  function renderStepper(page) {
    if (page.step < 0) {
      return null;
    }

    var stepper = document.createElement('div');
    stepper.className = 'progress-stepper';
    stepper.id = 'progressStepper';

    var track = document.createElement('div');
    track.className = 'stepper-track';

    PAGES.filter(function (item) {
      return item.step >= 0;
    }).forEach(function (item, index) {
      var stepItem = document.createElement('a');
      stepItem.href = item.file;
      stepItem.className = 'step-item';
      if (item.step === page.step) {
        stepItem.className += ' current';
      } else if (item.step < page.step) {
        stepItem.className += ' complete';
      }

      var dot = document.createElement('span');
      dot.className = 'step-dot';
      stepItem.appendChild(dot);

      var meta = document.createElement('span');
      meta.className = 'step-meta';

      var idx = document.createElement('span');
      idx.className = 'step-index';
      idx.textContent = 'Step ' + (index + 1);

      var label = document.createElement('strong');
      label.textContent = item.label;

      meta.appendChild(idx);
      meta.appendChild(label);
      stepItem.appendChild(meta);
      track.appendChild(stepItem);
    });

    stepper.appendChild(track);
    return stepper;
  }

  function buildShell() {
    applySavedTheme();

    var page = currentPage();
    var file = currentFile();

    var nav = document.createElement('nav');
    nav.className = 'topnav';

    var brand = document.createElement('span');
    brand.className = 'topnav-brand';
    brand.textContent = 'Sort Lab';
    nav.appendChild(brand);

    var center = document.createElement('div');
    center.className = 'topnav-center';

    var current = document.createElement('span');
    current.className = 'topnav-current';
    current.textContent = page.label;
    center.appendChild(current);

    var links = document.createElement('div');
    links.className = 'topnav-links';
    links.appendChild(createLink(PAGES[1], file));
    links.appendChild(createLink(PAGES[2], file));
    links.appendChild(createLink(PAGES[3], file));
    links.appendChild(createLink(PAGES[4], file));
    center.appendChild(links);
    nav.appendChild(center);

    var right = document.createElement('div');
    right.className = 'topnav-right';

    var theme = document.createElement('select');
    theme.className = 'theme-select';
    theme.setAttribute('aria-label', 'Theme');
    ['dark', 'light', 'ocean', 'forest'].forEach(function (name) {
      var option = document.createElement('option');
      option.value = name;
      option.textContent = name.charAt(0).toUpperCase() + name.slice(1);
      if (document.body.getAttribute('data-theme') === name) {
        option.selected = true;
      }
      theme.appendChild(option);
    });
    theme.addEventListener('change', function () {
      document.body.setAttribute('data-theme', theme.value);
      localStorage.setItem('sort-lab-theme', theme.value);
    });

    var presentBtn = document.createElement('button');
    presentBtn.className = 'present-btn';
    presentBtn.type = 'button';
    presentBtn.textContent = 'Present';
    presentBtn.addEventListener('click', function () {
      window.togglePresent();
    });

    right.appendChild(theme);
    right.appendChild(presentBtn);
    nav.appendChild(right);

    var stepper = renderStepper(page);
    if (stepper) {
      document.body.insertBefore(stepper, document.body.firstChild);
    }
    document.body.insertBefore(nav, document.body.firstChild);

    if (new URLSearchParams(window.location.search).get('present') === '1') {
      window.togglePresent(true);
    }
  }

  function wireCollapse(buttonId, panelId, className, collapsedText, expandedText) {
    var button = document.getElementById(buttonId);
    var panel = document.getElementById(panelId);
    var layout = document.querySelector('.sim-layout');

    if (!button || !panel || !layout) {
      return;
    }

    button.addEventListener('click', function () {
      var collapsed = panel.classList.toggle('collapsed');
      layout.classList.toggle(className, collapsed);
      button.textContent = collapsed ? collapsedText : expandedText;
      setTimeout(function () {
        window.dispatchEvent(new Event('resize'));
      }, 220);
    });
  }

  function togglePresent(forceOn) {
    var shouldEnable = typeof forceOn === 'boolean'
      ? forceOn
      : !document.body.hasAttribute('data-present');

    if (shouldEnable) {
      document.body.setAttribute('data-present', '');
    } else {
      document.body.removeAttribute('data-present');
    }

    var btn = document.querySelector('.present-btn');
    if (btn) {
      btn.textContent = document.body.hasAttribute('data-present') ? 'Exit Present' : 'Present';
    }
  }

  window.togglePresent = togglePresent;

  buildShell();

  wireCollapse('collapseLeftBtn', 'leftPanel', 'left-collapsed', '>', '<');
  wireCollapse('collapseRightBtn', 'rightPanel', 'right-collapsed', '<', '>');
})();
