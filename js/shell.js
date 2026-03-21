(function () {
  var PAGES = [
    { file: 'index.html', label: 'Home', step: -1 },
    { file: 'bubble.html', label: 'Bubble Sort', step: 0 },
    { file: 'selection.html', label: 'Selection Sort', step: 1 },
    { file: 'insertion.html', label: 'Insertion Sort', step: 2 },
    { file: 'compare.html', label: 'Compare All', step: 3 },
  ];
  var TILE_LAYOUT_KEY = 'sort-lab-tile-layout';
  var FULLSCREEN_HIDE_DELAY = 2000;
  var shellState = {
    currentPage: null,
    workspace: null,
    runtime: null,
    shortcutOverlay: null,
    nav: null,
    fullscreenButton: null,
    fullscreenExitButton: null,
    fullscreenTimer: null,
    navHidden: false,
  };

  function clamp(value, min, max) {
    return Math.max(min, Math.min(max, value));
  }

  function getFullscreenElement() {
    return document.fullscreenElement || document.webkitFullscreenElement || document.msFullscreenElement || null;
  }

  function requestFullscreenMode(element) {
    if (!element) {
      return null;
    }
    if (element.requestFullscreen) {
      return element.requestFullscreen();
    }
    if (element.webkitRequestFullscreen) {
      return element.webkitRequestFullscreen();
    }
    if (element.msRequestFullscreen) {
      return element.msRequestFullscreen();
    }
    return null;
  }

  function exitFullscreenMode() {
    if (document.exitFullscreen) {
      return document.exitFullscreen();
    }
    if (document.webkitExitFullscreen) {
      return document.webkitExitFullscreen();
    }
    if (document.msExitFullscreen) {
      return document.msExitFullscreen();
    }
    return null;
  }

  function isCoarsePointerDevice() {
    if (!window.matchMedia) {
      return false;
    }

    var coarse = window.matchMedia('(pointer: coarse)').matches;
    var hoverNone = window.matchMedia('(hover: none)').matches;
    var anyFine = window.matchMedia('(any-pointer: fine)').matches;
    return coarse && hoverNone && !anyFine;
  }

  function syncFullscreenControls() {
    var isFullscreen = !!getFullscreenElement();
    if (shellState.fullscreenButton) {
      shellState.fullscreenButton.innerHTML = isFullscreen
        ? '<span aria-hidden="true">×</span> Exit Fullscreen'
        : '<span aria-hidden="true">⛶</span> Fullscreen';
      shellState.fullscreenButton.setAttribute('aria-pressed', isFullscreen ? 'true' : 'false');
    }
    if (shellState.fullscreenExitButton) {
      shellState.fullscreenExitButton.hidden = !isFullscreen;
    }
  }

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

  function dispatchSyntheticResize(delay) {
    window.setTimeout(function () {
      window.dispatchEvent(new Event('resize'));
    }, typeof delay === 'number' ? delay : 220);
  }

  function readLayoutStore() {
    var raw = localStorage.getItem(TILE_LAYOUT_KEY);
    if (!raw) {
      return { pages: {} };
    }
    try {
      var parsed = JSON.parse(raw);
      if (parsed && parsed.pages) {
        return parsed;
      }
      if (parsed && parsed.tiles) {
        return { pages: { legacy: parsed } };
      }
    } catch (error) {
      return { pages: {} };
    }
    return { pages: {} };
  }

  function buildShortcutOverlay() {
    var overlay = document.createElement('div');
    overlay.className = 'shortcut-overlay';
    overlay.hidden = true;
    overlay.innerHTML = [
      '<div class="shortcut-modal" role="dialog" aria-modal="true" aria-label="Keyboard shortcuts">',
      '<div class="shortcut-modal-header">',
      '<strong>Keyboard Shortcuts</strong>',
      '<button class="shortcut-close" type="button" aria-label="Close shortcuts">×</button>',
      '</div>',
      '<div class="shortcut-grid">',
      '<div class="shortcut-item"><kbd>Space</kbd><span>Play / Pause</span></div>',
      '<div class="shortcut-item"><kbd>→</kbd><span>Step forward</span></div>',
      '<div class="shortcut-item"><kbd>←</kbd><span>Step backward</span></div>',
      '<div class="shortcut-item"><kbd>Shift + →</kbd><span>Jump forward 10</span></div>',
      '<div class="shortcut-item"><kbd>Shift + ←</kbd><span>Jump backward 10</span></div>',
      '<div class="shortcut-item"><kbd>R</kbd><span>Reset / regenerate</span></div>',
      '<div class="shortcut-item"><kbd>F</kbd><span>Toggle fullscreen</span></div>',
      '<div class="shortcut-item"><kbd>[</kbd><span>Toggle left panel</span></div>',
      '<div class="shortcut-item"><kbd>]</kbd><span>Toggle right panel</span></div>',
      '<div class="shortcut-item"><kbd>1</kbd><span>Pseudocode</span></div>',
      '<div class="shortcut-item"><kbd>2</kbd><span>Java</span></div>',
      '<div class="shortcut-item"><kbd>3</kbd><span>Python</span></div>',
      '<div class="shortcut-item"><kbd>?</kbd><span>Toggle this overlay</span></div>',
      '</div>',
      '</div>',
    ].join('');

    overlay.addEventListener('click', function (event) {
      var target = event.target;
      var modal = overlay.querySelector('.shortcut-modal');
      var hitModal = !!(modal && (target === modal || modal.contains(target)));
      var hitClose = !!(target && target.closest && target.closest('.shortcut-close'));
      if (hitModal || hitClose) {
        toggleShortcutOverlay(false);
      }
    });

    document.body.appendChild(overlay);
    shellState.shortcutOverlay = overlay;
  }

  function toggleShortcutOverlay(forceOpen) {
    if (!shellState.shortcutOverlay) {
      return;
    }

    var shouldOpen = typeof forceOpen === 'boolean' ? forceOpen : shellState.shortcutOverlay.hidden;
    shellState.shortcutOverlay.hidden = !shouldOpen;
    document.body.classList.toggle('shortcut-open', shouldOpen);
  }

  function updateFullscreenNavVisibility(hidden) {
    shellState.navHidden = hidden;
    document.body.classList.toggle('fullscreen-nav-hidden', hidden);
  }

  function resetFullscreenHideTimer() {
    if (shellState.fullscreenTimer) {
      window.clearTimeout(shellState.fullscreenTimer);
      shellState.fullscreenTimer = null;
    }

    if (!getFullscreenElement()) {
      updateFullscreenNavVisibility(false);
      return;
    }

    updateFullscreenNavVisibility(false);
    if (isCoarsePointerDevice()) {
      return;
    }

    shellState.fullscreenTimer = window.setTimeout(function () {
      updateFullscreenNavVisibility(true);
    }, FULLSCREEN_HIDE_DELAY);
  }

  function toggleFullscreen() {
    if (!getFullscreenElement()) {
      return requestFullscreenMode(document.documentElement);
    }
    return exitFullscreenMode();
  }

  function installFullscreenBehavior() {
    function handleFullscreenChange() {
      var isFullscreen = !!getFullscreenElement();
      document.body.classList.toggle('is-fullscreen', isFullscreen);
      if (!isFullscreen) {
        if (shellState.fullscreenTimer) {
          window.clearTimeout(shellState.fullscreenTimer);
          shellState.fullscreenTimer = null;
        }
        updateFullscreenNavVisibility(false);
      } else {
        resetFullscreenHideTimer();
      }
      syncFullscreenControls();
      dispatchSyntheticResize(0);
    }

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    document.addEventListener('webkitfullscreenchange', handleFullscreenChange);

    function wakeFullscreenNav(event) {
      if (!getFullscreenElement()) {
        return;
      }

      if (!event || typeof event.clientY !== 'number') {
        resetFullscreenHideTimer();
        return;
      }

      if (event.clientY <= 60 || !shellState.navHidden) {
        resetFullscreenHideTimer();
      }
    }

    document.addEventListener('mousemove', wakeFullscreenNav);
    document.addEventListener('pointerdown', wakeFullscreenNav);
    document.addEventListener('touchstart', wakeFullscreenNav);
  }

  function togglePanel(side) {
    var button = document.getElementById(side === 'left' ? 'collapseLeftBtn' : 'collapseRightBtn');
    if (button) {
      button.click();
    }
  }

  function isTextInputFocused() {
    var active = document.activeElement;
    return !!active && /^(INPUT|SELECT|TEXTAREA)$/.test(active.tagName);
  }

  function setCodeLanguage(value) {
    var runtime = shellState.runtime;
    var select = runtime && runtime.codeLanguageEl;
    if (!select) {
      return;
    }

    var option = select.querySelector('option[value="' + value + '"]');
    if (!option) {
      return;
    }

    select.value = value;
    select.dispatchEvent(new Event('change'));
  }

  function installKeyboardShortcuts() {
    document.addEventListener('keydown', function (event) {
      var runtime = shellState.runtime;
      var controls = runtime && runtime.controls;
      var key = event.key;
      var overlay = shellState.shortcutOverlay;
      var overlayOpen = !!(overlay && !overlay.hidden);

      if (event.ctrlKey || event.metaKey || event.altKey || event.repeat) {
        return;
      }

      if ((key === 'Escape' || key === 'Esc') && overlayOpen) {
        toggleShortcutOverlay(false);
        event.preventDefault();
        return;
      }

      if (key === 'Escape' && getFullscreenElement()) {
        exitFullscreenMode();
        event.preventDefault();
        return;
      }

      if (isTextInputFocused()) {
        return;
      }

      if (key === '?' || (key === '/' && event.shiftKey)) {
        toggleShortcutOverlay();
        event.preventDefault();
        return;
      }

      if (overlayOpen) {
        return;
      }

      var handlers = {
        ' ': function () {
          if (controls && controls.togglePlay) controls.togglePlay();
        },
        ArrowRight: function () {
          if (!controls) return;
          if (event.shiftKey && controls.jump) {
            controls.jump(10);
            return;
          }
          if (controls.next) controls.next();
        },
        ArrowLeft: function () {
          if (!controls) return;
          if (event.shiftKey && controls.jump) {
            controls.jump(-10);
            return;
          }
          if (controls.back) controls.back();
        },
        r: function () {
          if (!controls) return;
          if (controls.reset) {
            controls.reset();
            return;
          }
          if (controls.regenerate) controls.regenerate();
        },
        R: function () {
          if (!controls) return;
          if (controls.reset) {
            controls.reset();
            return;
          }
          if (controls.regenerate) controls.regenerate();
        },
        f: function () {
          toggleFullscreen();
        },
        F: function () {
          toggleFullscreen();
        },
        '[': function () {
          togglePanel('left');
        },
        ']': function () {
          togglePanel('right');
        },
        '1': function () {
          setCodeLanguage('pseudo');
        },
        '2': function () {
          setCodeLanguage('java');
        },
        '3': function () {
          setCodeLanguage('python');
        },
      };

      if (handlers[key]) {
        handlers[key]();
        event.preventDefault();
      }
    });
  }

  function buildShell() {
    applySavedTheme();

    var page = currentPage();
    var file = currentFile();
    shellState.currentPage = page;

    var nav = document.createElement('nav');
    nav.className = 'topnav';
    shellState.nav = nav;

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

    var fullscreenBtn = document.createElement('button');
    fullscreenBtn.className = 'present-btn fullscreen-btn';
    fullscreenBtn.type = 'button';
    fullscreenBtn.setAttribute('aria-pressed', 'false');
    fullscreenBtn.addEventListener('click', function () {
      toggleFullscreen();
    });
    shellState.fullscreenButton = fullscreenBtn;

    var fullscreenExitButton = document.createElement('button');
    fullscreenExitButton.className = 'fullscreen-exit-fab';
    fullscreenExitButton.type = 'button';
    fullscreenExitButton.hidden = true;
    fullscreenExitButton.setAttribute('aria-label', 'Exit fullscreen');
    fullscreenExitButton.textContent = 'Exit Fullscreen';
    fullscreenExitButton.addEventListener('click', function () {
      if (getFullscreenElement()) {
        exitFullscreenMode();
      }
    });
    shellState.fullscreenExitButton = fullscreenExitButton;
    document.body.appendChild(fullscreenExitButton);

    var helpBtn = document.createElement('button');
    helpBtn.className = 'pill-btn help-btn';
    helpBtn.type = 'button';
    helpBtn.setAttribute('aria-label', 'Keyboard shortcuts');
    helpBtn.textContent = '?';
    helpBtn.addEventListener('click', function () {
      toggleShortcutOverlay();
    });

    right.appendChild(theme);
    right.appendChild(fullscreenBtn);
    right.appendChild(helpBtn);
    nav.appendChild(right);

    var stepper = renderStepper(page);
    if (stepper) {
      document.body.insertBefore(stepper, document.body.firstChild);
    }
    document.body.insertBefore(nav, document.body.firstChild);
    syncFullscreenControls();
    buildShortcutOverlay();
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
      dispatchSyntheticResize(220);
    });
  }

  function createDefaultLayout(availableContents) {
    var defaultContent = availableContents.visualizer ? 'visualizer' : (availableContents.compare ? 'compare' : 'empty');
    return {
      cols: 1,
      rows: 1,
      colSizes: ['1fr'],
      rowSizes: ['1fr'],
      tiles: [{ id: 't0', col: 1, row: 1, content: defaultContent }],
      nextId: 1,
    };
  }

  function normalizeLayout(layout, availableContents) {
    var allowed = Object.keys(availableContents);
    var nextId = 0;

    if (!layout || !layout.tiles || !layout.tiles.length) {
      return createDefaultLayout(availableContents);
    }

    var normalized = {
      cols: Math.max(1, Math.min(2, Number(layout.cols) || 1)),
      rows: Math.max(1, Math.min(3, Number(layout.rows) || 1)),
      colSizes: (layout.colSizes || []).slice(0, Math.max(1, Math.min(2, Number(layout.cols) || 1))),
      rowSizes: (layout.rowSizes || []).slice(0, Math.max(1, Math.min(3, Number(layout.rows) || 1))),
      tiles: [],
      nextId: Number(layout.nextId) || 0,
    };

    while (normalized.colSizes.length < normalized.cols) normalized.colSizes.push('1fr');
    while (normalized.rowSizes.length < normalized.rows) normalized.rowSizes.push('1fr');

    layout.tiles.slice(0, 6).forEach(function (tile) {
      var idNum = Number(String(tile.id || '').replace(/[^0-9]/g, ''));
      nextId = Math.max(nextId, isNaN(idNum) ? 0 : idNum + 1);
      normalized.tiles.push({
        id: tile.id || ('t' + nextId),
        col: Math.max(1, Math.min(normalized.cols, Number(tile.col) || 1)),
        row: Math.max(1, Math.min(normalized.rows, Number(tile.row) || 1)),
        content: allowed.indexOf(tile.content) !== -1 ? tile.content : 'empty',
      });
    });

    if (!normalized.tiles.length) {
      normalized.tiles.push({ id: 't0', col: 1, row: 1, content: availableContents.visualizer ? 'visualizer' : 'empty' });
    }

    if (!normalized.tiles.some(function (tile) { return tile.content !== 'empty'; })) {
      normalized.tiles[0].content = availableContents.visualizer ? 'visualizer' : (availableContents.compare ? 'compare' : 'empty');
    }

    normalized.nextId = Math.max(normalized.nextId, nextId, normalized.tiles.length);
    return normalized;
  }

  function buildWorkspace() {
    var centerPanel = document.querySelector('.center-panel');
    if (!centerPanel || shellState.currentPage.step < 0) {
      return null;
    }

    var workspaceRoot = document.createElement('div');
    workspaceRoot.className = 'tile-workspace';
    var stash = document.createElement('div');
    stash.className = 'tile-stash';
    stash.hidden = true;

    var codeLanguage = document.getElementById('codeLanguage');
    var codeTrace = document.getElementById('codeTraceContainer');
    var codeNote = document.getElementById('codeNote');
    var narration = document.getElementById('narration');
    var stats = document.getElementById('statsRow');
    var legend = document.querySelector('.how-section');
    var compareStack = document.querySelector('.compare-stack');
    var sketchContainer = document.getElementById('sketchContainer');
    var storageFile = currentFile();

    centerPanel.innerHTML = '';
    centerPanel.appendChild(workspaceRoot);
    centerPanel.appendChild(stash);

    var codeBundle = null;
    if (codeTrace) {
      codeBundle = document.createElement('div');
      codeBundle.className = 'code-tile-panel';
      if (codeLanguage) {
        var codeToolbar = document.createElement('div');
        codeToolbar.className = 'code-tile-toolbar';
        var codeLabel = document.createElement('span');
        codeLabel.className = 'summary-label';
        codeLabel.textContent = 'Language';
        codeToolbar.appendChild(codeLabel);
        codeToolbar.appendChild(codeLanguage);
        codeBundle.appendChild(codeToolbar);
      }
      codeBundle.appendChild(codeTrace);
      if (codeNote) {
        codeBundle.appendChild(codeNote);
      }
    }

    var availableContents = {};
    if (sketchContainer) {
      availableContents.visualizer = { label: 'Bar Visualizer' };
      stash.appendChild(sketchContainer);
    }
    if (codeBundle) {
      availableContents.code = { label: 'Live Code Trace', node: codeBundle };
      stash.appendChild(codeBundle);
    }
    if (narration) {
      availableContents.narration = { label: 'Narration', node: narration };
      stash.appendChild(narration);
    }
    if (stats) {
      availableContents.stats = { label: 'Stats', node: stats };
      stash.appendChild(stats);
    }
    if (legend) {
      availableContents.legend = { label: 'Legend', node: legend };
      stash.appendChild(legend);
    }
    if (compareStack) {
      availableContents.compare = { label: 'Compare View', node: compareStack };
      stash.appendChild(compareStack);
    }

    function loadLayout() {
      var store = readLayoutStore();
      return normalizeLayout(store.pages[storageFile] || store.pages.legacy || null, availableContents);
    }

    var workspace = {
      root: workspaceRoot,
      stash: stash,
      contents: availableContents,
      layout: loadLayout(),
      sketchContainer: sketchContainer,
      codeLanguageEl: codeLanguage,
      runtime: null,
    };

    function saveLayout() {
      var store = readLayoutStore();
      store.pages[storageFile] = workspace.layout;
      delete store.pages.legacy;
      localStorage.setItem(TILE_LAYOUT_KEY, JSON.stringify(store));
    }

    function buildTrackTemplate(sizes, minSize) {
      return sizes.map(function (size) {
        return 'minmax(' + minSize + 'px, ' + size + ')';
      }).join(' ');
    }

    function usedContents() {
      var used = {};
      workspace.layout.tiles.forEach(function (tile) {
        if (tile.content && tile.content !== 'empty') {
          used[tile.content] = tile.id;
        }
      });
      return used;
    }

    function nextTileId() {
      var id = 't' + workspace.layout.nextId;
      workspace.layout.nextId += 1;
      return id;
    }

    function findTile(tileId) {
      for (var i = 0; i < workspace.layout.tiles.length; i += 1) {
        if (workspace.layout.tiles[i].id === tileId) {
          return workspace.layout.tiles[i];
        }
      }
      return null;
    }

    function findTileAt(col, row) {
      return workspace.layout.tiles.find(function (tile) {
        return tile.col === col && tile.row === row;
      }) || null;
    }

    function attachContent(tile, body) {
      var content = tile.content;
      if (!content || content === 'empty' || !workspace.contents[content]) {
        return;
      }

      if (content === 'visualizer' && workspace.runtime && typeof workspace.runtime.mountVisualizer === 'function') {
        workspace.runtime.mountVisualizer(body);
      } else {
        body.appendChild(workspace.contents[content].node);
      }

      if (workspace.runtime && typeof workspace.runtime.onTileContentMounted === 'function') {
        workspace.runtime.onTileContentMounted(content, body);
      }
    }

    function returnContentToStash(content) {
      if (content === 'visualizer') {
        if (workspace.runtime && typeof workspace.runtime.unmountVisualizer === 'function') {
          workspace.runtime.unmountVisualizer();
        }
        if (workspace.sketchContainer && workspace.sketchContainer.parentNode !== workspace.stash) {
          workspace.stash.appendChild(workspace.sketchContainer);
        }
        return;
      }
      if (workspace.contents[content] && workspace.contents[content].node && workspace.contents[content].node.parentNode !== workspace.stash) {
        workspace.stash.appendChild(workspace.contents[content].node);
      }
    }

    function placeTileContent(tileId, content) {
      var tile = findTile(tileId);
      if (!tile) {
        return;
      }
      tile.content = content;
      saveLayout();
      renderWorkspace();
    }

    function openPicker(tile, tileEl) {
      var existing = tileEl.querySelector('.tile-picker');
      if (existing) {
        existing.remove();
        return;
      }

      var picker = document.createElement('div');
      picker.className = 'tile-picker';
      var used = usedContents();

      Object.keys(workspace.contents).forEach(function (key) {
        var btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'pill-btn tile-picker-option';
        btn.textContent = workspace.contents[key].label;
        var disabled = !!used[key] && used[key] !== tile.id;
        btn.disabled = disabled;
        if (disabled) {
          btn.classList.add('disabled');
        }
        btn.addEventListener('click', function () {
          placeTileContent(tile.id, key);
        });
        picker.appendChild(btn);
      });

      tileEl.appendChild(picker);
    }

    function clearTile(tileId) {
      var tile = findTile(tileId);
      if (!tile) {
        return;
      }
      returnContentToStash(tile.content);
      tile.content = 'empty';
      saveLayout();
      renderWorkspace();
    }

    function splitTile(tileId) {
      if (workspace.layout.tiles.length >= 6) {
        return;
      }

      var tile = findTile(tileId);
      if (!tile) {
        return;
      }

      var target = null;
      var candidates = [
        { col: tile.col + 1, row: tile.row },
        { col: tile.col, row: tile.row + 1 },
        { col: tile.col - 1, row: tile.row },
        { col: tile.col, row: tile.row - 1 },
      ];

      candidates.some(function (candidate) {
        if (candidate.col < 1 || candidate.col > workspace.layout.cols) return false;
        if (candidate.row < 1 || candidate.row > workspace.layout.rows) return false;
        if (!findTileAt(candidate.col, candidate.row)) {
          target = candidate;
          return true;
        }
        return false;
      });

      if (!target && workspace.layout.cols < 2) {
        workspace.layout.cols += 1;
        workspace.layout.colSizes.push('1fr');
        target = { col: tile.col + 1, row: tile.row };
      }

      if (!target && workspace.layout.rows < 3) {
        var insertRow = tile.row + 1;
        workspace.layout.rows += 1;
        workspace.layout.rowSizes.splice(insertRow - 1, 0, '1fr');
        workspace.layout.tiles.forEach(function (item) {
          if (item.row >= insertRow) {
            item.row += 1;
          }
        });
        target = { col: tile.col, row: insertRow };
      }

      if (!target) {
        return;
      }

      workspace.layout.tiles.push({ id: nextTileId(), col: target.col, row: target.row, content: 'empty' });
      saveLayout();
      renderWorkspace();
    }

    function parseTrackPixels(value) {
      var matches = String(value || '').match(/[0-9.]+px/g) || [];
      return matches.map(function (part) {
        return parseFloat(part);
      });
    }

    function applyResize(trackType, index, firstPx, secondPx, totalPx) {
      var sizes = trackType === 'col' ? workspace.layout.colSizes : workspace.layout.rowSizes;
      sizes[index] = ((firstPx / totalPx) * 100).toFixed(3) + '%';
      sizes[index + 1] = ((secondPx / totalPx) * 100).toFixed(3) + '%';
      workspace.root.style.setProperty('--tile-cols', buildTrackTemplate(workspace.layout.colSizes, 200));
      workspace.root.style.setProperty('--tile-rows', buildTrackTemplate(workspace.layout.rowSizes, 160));
      dispatchSyntheticResize(0);
    }

    function installGutterDrag(gutter, trackType, index) {
      gutter.addEventListener('pointerdown', function (event) {
        var computed = getComputedStyle(workspace.root);
        var sizes = trackType === 'col' ? parseTrackPixels(computed.gridTemplateColumns) : parseTrackPixels(computed.gridTemplateRows);
        var firstStart = sizes[index];
        var secondStart = sizes[index + 1];
        var total = firstStart + secondStart;
        var pointerStart = trackType === 'col' ? event.clientX : event.clientY;
        gutter.setPointerCapture(event.pointerId);

        function onMove(moveEvent) {
          var current = trackType === 'col' ? moveEvent.clientX : moveEvent.clientY;
          var delta = current - pointerStart;
          var first = clamp(firstStart + delta, trackType === 'col' ? 200 : 160, total - (trackType === 'col' ? 200 : 160));
          var second = total - first;
          applyResize(trackType, index, first, second, total);
          if (trackType === 'col') {
            gutter.style.left = (first - 3) + 'px';
          } else {
            gutter.style.top = (first - 3) + 'px';
          }
        }

        function onUp() {
          gutter.removeEventListener('pointermove', onMove);
          gutter.removeEventListener('pointerup', onUp);
          gutter.removeEventListener('pointercancel', onUp);
          saveLayout();
          renderWorkspace();
        }

        gutter.addEventListener('pointermove', onMove);
        gutter.addEventListener('pointerup', onUp);
        gutter.addEventListener('pointercancel', onUp);
      });
    }

    function renderGutters() {
      var computed = getComputedStyle(workspace.root);
      var colPixels = parseTrackPixels(computed.gridTemplateColumns);
      var rowPixels = parseTrackPixels(computed.gridTemplateRows);
      var x = 0;
      var y = 0;

      for (var i = 0; i < colPixels.length - 1; i += 1) {
        x += colPixels[i];
        var colGutter = document.createElement('div');
        colGutter.className = 'tile-gutter tile-gutter-col';
        colGutter.style.left = (x - 3) + 'px';
        colGutter.style.top = '0';
        colGutter.style.height = '100%';
        installGutterDrag(colGutter, 'col', i);
        workspace.root.appendChild(colGutter);
      }

      for (var j = 0; j < rowPixels.length - 1; j += 1) {
        y += rowPixels[j];
        var rowGutter = document.createElement('div');
        rowGutter.className = 'tile-gutter tile-gutter-row';
        rowGutter.style.top = (y - 3) + 'px';
        rowGutter.style.left = '0';
        rowGutter.style.width = '100%';
        installGutterDrag(rowGutter, 'row', j);
        workspace.root.appendChild(rowGutter);
      }
    }

    function renderWorkspace() {
      var used = usedContents();
      Object.keys(used).forEach(function (key) {
        returnContentToStash(key);
      });

      workspace.root.innerHTML = '';
      workspace.root.style.setProperty('--tile-cols', buildTrackTemplate(workspace.layout.colSizes, 200));
      workspace.root.style.setProperty('--tile-rows', buildTrackTemplate(workspace.layout.rowSizes, 160));

      workspace.layout.tiles.forEach(function (tile) {
        var tileEl = document.createElement('section');
        tileEl.className = 'tile-card';
        tileEl.dataset.tileId = tile.id;
        tileEl.dataset.tileContent = tile.content;
        tileEl.style.gridColumn = String(tile.col);
        tileEl.style.gridRow = String(tile.row);

        if (tile.content === 'empty') {
          tileEl.classList.add('empty');
          var emptyBtn = document.createElement('button');
          emptyBtn.className = 'tile-empty-trigger';
          emptyBtn.type = 'button';
          emptyBtn.innerHTML = '<span>+</span><b>Add panel</b>';
          emptyBtn.addEventListener('click', function () {
            openPicker(tile, tileEl);
          });
          tileEl.appendChild(emptyBtn);
        } else {
          var header = document.createElement('div');
          header.className = 'tile-header';

          var label = document.createElement('span');
          label.className = 'tile-label';
          label.textContent = workspace.contents[tile.content].label;

          var actions = document.createElement('div');
          actions.className = 'tile-actions';

          var splitBtn = document.createElement('button');
          splitBtn.type = 'button';
          splitBtn.className = 'tile-action-btn';
          splitBtn.textContent = '⊞';
          splitBtn.disabled = workspace.layout.tiles.length >= 6;
          splitBtn.addEventListener('click', function () {
            splitTile(tile.id);
          });

          var clearBtn = document.createElement('button');
          clearBtn.type = 'button';
          clearBtn.className = 'tile-action-btn';
          clearBtn.textContent = '×';
          clearBtn.addEventListener('click', function () {
            clearTile(tile.id);
          });

          actions.appendChild(splitBtn);
          actions.appendChild(clearBtn);
          header.appendChild(label);
          header.appendChild(actions);
          tileEl.appendChild(header);

          var body = document.createElement('div');
          body.className = 'tile-body';
          tileEl.appendChild(body);
          attachContent(tile, body);
        }

        workspace.root.appendChild(tileEl);
      });

      renderGutters();
      dispatchSyntheticResize(0);
    }

    workspace.saveLayout = saveLayout;
    workspace.render = renderWorkspace;
    workspace.placeTileContent = placeTileContent;
    workspace.remountVisualizer = function () {
      if (!workspace.runtime || typeof workspace.runtime.mountVisualizer !== 'function') {
        return;
      }
      var visualizerTile = workspace.layout.tiles.find(function (tile) {
        return tile.content === 'visualizer';
      });
      if (!visualizerTile) {
        if (typeof workspace.runtime.unmountVisualizer === 'function') {
          workspace.runtime.unmountVisualizer();
        }
        return;
      }
      var tileBody = workspace.root.querySelector('[data-tile-id="' + visualizerTile.id + '"] .tile-body');
      if (tileBody) {
        workspace.runtime.mountVisualizer(tileBody);
      }
    };

    renderWorkspace();
    return workspace;
  }

  function registerPageRuntime(runtime) {
    shellState.runtime = runtime;
    if (shellState.workspace) {
      shellState.workspace.runtime = runtime;
      runtime.codeLanguageEl = runtime.codeLanguageEl || (shellState.workspace && shellState.workspace.codeLanguageEl) || null;
      shellState.workspace.remountVisualizer();
      dispatchSyntheticResize(0);
    }
  }

  window.SortLabShell = {
    registerPageRuntime: registerPageRuntime,
    toggleShortcutOverlay: toggleShortcutOverlay,
    toggleFullscreen: toggleFullscreen,
    dispatchResize: dispatchSyntheticResize,
    togglePanel: togglePanel,
  };

  buildShell();
  wireCollapse('collapseLeftBtn', 'leftPanel', 'left-collapsed', '>', '<');
  wireCollapse('collapseRightBtn', 'rightPanel', 'right-collapsed', '<', '>');
  installFullscreenBehavior();
  installKeyboardShortcuts();
  shellState.workspace = buildWorkspace();
})();
