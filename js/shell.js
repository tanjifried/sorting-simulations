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
    if (shellState.fullscreenExitButton) {
      shellState.fullscreenExitButton.hidden = !isFullscreen;
    }
    // Hide floating panel in fullscreen, show otherwise
    if (shellState.floatPanel) {
      shellState.floatPanel.hidden = isFullscreen;
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
      var hitBackdrop = target === overlay;
      if (hitBackdrop || hitClose) {
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

  // ── FLOATING SETTINGS / CONTROLS PANEL ─────────────────────────────────────
  // A draggable pill-bar that replaces the fixed left/right sidebars.
  // Persisted position in localStorage. Hidden in fullscreen.
  var PANEL_POS_KEY = 'sort-lab-panel-pos';
  var PANEL_VIS_KEY = 'sort-lab-panel-vis';

  function buildFloatingPanel(page) {
    if (page.step < 0) return; // home page — no panel needed

    // ── Read persisted visibility settings ──
    var defaultVis = { controls: true, speed: true, panels: true, legend: true, hideHeaders: false, snapGap: false };
    var vis = defaultVis;
    try {
      var saved = JSON.parse(localStorage.getItem(PANEL_VIS_KEY) || 'null');
      if (saved) vis = Object.assign({}, defaultVis, saved);
    } catch (e) { vis = defaultVis; }

    function saveVis() {
      localStorage.setItem(PANEL_VIS_KEY, JSON.stringify(vis));
    }

    // ── Read persisted position ──
    var pos = { x: 24, y: 80 };
    try {
      var savedPos = JSON.parse(localStorage.getItem(PANEL_POS_KEY) || 'null');
      if (savedPos && typeof savedPos.x === 'number') pos = savedPos;
    } catch (e) {}

    // Clamp to viewport on load
    pos.x = Math.max(0, Math.min(window.innerWidth - 60, pos.x));
    pos.y = Math.max(0, Math.min(window.innerHeight - 40, pos.y));

    function savePos() { localStorage.setItem(PANEL_POS_KEY, JSON.stringify(pos)); }

    // ── Outer container ──
    var panel = document.createElement('div');
    panel.className = 'float-panel';
    panel.id = 'floatPanel';
    panel.style.left = pos.x + 'px';
    panel.style.top = pos.y + 'px';

    // ── Tab bar (sections the user can toggle) ──
    var tabs = document.createElement('div');
    tabs.className = 'float-tabs';

    // ── Inner sections container ──
    var body = document.createElement('div');
    body.className = 'float-body';

    // ── Collapse toggle ──
    var collapsed = false;
    var collapseBtn = document.createElement('button');
    collapseBtn.type = 'button';
    collapseBtn.className = 'float-collapse-btn';
    collapseBtn.setAttribute('aria-label', 'Collapse panel');
    collapseBtn.innerHTML = '&#x2212;'; // minus
    collapseBtn.addEventListener('click', function () {
      collapsed = !collapsed;
      panel.classList.toggle('float-panel--collapsed', collapsed);
      collapseBtn.innerHTML = collapsed ? '&#x002B;' : '&#x2212;';
    });

    // ── Settings (gear) toggle ──
    var settingsOpen = false;
    var settingsBtn = document.createElement('button');
    settingsBtn.type = 'button';
    settingsBtn.className = 'float-settings-btn';
    settingsBtn.setAttribute('aria-label', 'Settings');
    settingsBtn.innerHTML = '<svg width="14" height="14" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M8 10a2 2 0 100-4 2 2 0 000 4z" stroke="currentColor" stroke-width="1.5"/><path d="M13.3 6.7l-.9-.5a5.1 5.1 0 000-1.4l.9-.5a1 1 0 00.4-1.4l-.8-1.4a1 1 0 00-1.4-.4l-.9.5a5.1 5.1 0 00-1.2-.7V.8A1 1 0 008.4 0H7.6a1 1 0 00-1 .8v1.1a5.1 5.1 0 00-1.2.7l-.9-.5a1 1 0 00-1.4.4L2.3 3.9a1 1 0 00.4 1.4l.9.5a5.1 5.1 0 000 1.4l-.9.5a1 1 0 00-.4 1.4l.8 1.4a1 1 0 001.4.4l.9-.5a5.1 5.1 0 001.2.7v1.1a1 1 0 001 .8h.8a1 1 0 001-.8v-1.1a5.1 5.1 0 001.2-.7l.9.5a1 1 0 001.4-.4l.8-1.4a1 1 0 00-.4-1.4z" stroke="currentColor" stroke-width="1.2"/></svg>';

    var settingsPane = document.createElement('div');
    settingsPane.className = 'float-settings-pane';
    settingsPane.hidden = true;

    var visItems = [
      { key: 'controls', label: 'Playback Controls' },
      { key: 'speed', label: 'Speed Controls' },
      { key: 'panels', label: 'Panel Manager' },
      { key: 'legend', label: 'Legend / How-to' },
    ];
    var settingsTitle = document.createElement('div');
    settingsTitle.className = 'float-settings-title';
    settingsTitle.textContent = 'Visible Sections';
    settingsPane.appendChild(settingsTitle);

    visItems.forEach(function (item) {
      var row = document.createElement('label');
      row.className = 'float-settings-row';
      var cb = document.createElement('input');
      cb.type = 'checkbox';
      cb.checked = vis[item.key];
      cb.addEventListener('change', function () {
        vis[item.key] = cb.checked;
        saveVis();
        applyVisibility();
      });
      var lbl = document.createElement('span');
      lbl.textContent = item.label;
      row.appendChild(cb);
      row.appendChild(lbl);
      settingsPane.appendChild(row);
    });

    // ── Layout options separator ──
    var layoutTitle = document.createElement('div');
    layoutTitle.className = 'float-settings-title';
    layoutTitle.style.marginTop = '0.75rem';
    layoutTitle.textContent = 'Layout Options';
    settingsPane.appendChild(layoutTitle);

    // Hide tile headers toggle
    var hideHeaderRow = document.createElement('label');
    hideHeaderRow.className = 'float-settings-row';
    var hideHeaderCb = document.createElement('input');
    hideHeaderCb.type = 'checkbox';
    hideHeaderCb.checked = vis.hideHeaders;
    hideHeaderCb.addEventListener('change', function () {
      vis.hideHeaders = hideHeaderCb.checked;
      saveVis();
      applyVisibility();
    });
    var hideHeaderLbl = document.createElement('span');
    hideHeaderLbl.textContent = 'Hide tile title bars';
    hideHeaderRow.appendChild(hideHeaderCb);
    hideHeaderRow.appendChild(hideHeaderLbl);
    settingsPane.appendChild(hideHeaderRow);

    // Snap tiles together toggle
    var snapRow = document.createElement('label');
    snapRow.className = 'float-settings-row';
    var snapCb = document.createElement('input');
    snapCb.type = 'checkbox';
    snapCb.checked = vis.snapGap;
    snapCb.addEventListener('change', function () {
      vis.snapGap = snapCb.checked;
      saveVis();
      applyVisibility();
    });
    var snapLbl = document.createElement('span');
    snapLbl.textContent = 'Snap tiles flush together';
    snapRow.appendChild(snapCb);
    snapRow.appendChild(snapLbl);
    settingsPane.appendChild(snapRow);

    settingsBtn.addEventListener('click', function (e) {
      e.stopPropagation();
      settingsOpen = !settingsOpen;
      settingsPane.hidden = !settingsOpen;
      settingsBtn.classList.toggle('active', settingsOpen);
    });

    // ── Drag handle ──
    var handle = document.createElement('div');
    handle.className = 'float-handle';
    handle.setAttribute('aria-label', 'Drag to move panel');
    handle.innerHTML = '<svg width="14" height="8" viewBox="0 0 14 8" fill="none" xmlns="http://www.w3.org/2000/svg"><line x1="1" y1="1" x2="13" y2="1" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/><line x1="1" y1="4" x2="13" y2="4" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/><line x1="1" y1="7" x2="13" y2="7" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>';

    installPanelDrag(panel, handle, pos, savePos);

    // ── Header bar ──
    var header = document.createElement('div');
    header.className = 'float-header';
    header.appendChild(handle);
    header.appendChild(collapseBtn);
    header.appendChild(settingsBtn);
    panel.appendChild(header);
    panel.appendChild(settingsPane);
    panel.appendChild(body);

    // ── Build sections ──
    var sections = {};

    // Controls section (playback + data)
    var controlsSection = document.createElement('div');
    controlsSection.className = 'float-section';
    controlsSection.dataset.sectionKey = 'controls';
    sections.controls = controlsSection;

    // Speed section
    var speedSection = document.createElement('div');
    speedSection.className = 'float-section';
    speedSection.dataset.sectionKey = 'speed';
    sections.speed = speedSection;

    // Panels section (tile manager)
    var panelsSection = document.createElement('div');
    panelsSection.className = 'float-section';
    panelsSection.dataset.sectionKey = 'panels';
    sections.panels = panelsSection;

    // Legend section
    var legendSection = document.createElement('div');
    legendSection.className = 'float-section';
    legendSection.dataset.sectionKey = 'legend';
    sections.legend = legendSection;

    // Move control-group elements from the hidden left-panel into float sections
    var leftPanel = document.getElementById('leftPanel');
    var rightPanel = document.getElementById('rightPanel');

    if (leftPanel) {
      var groups = leftPanel.querySelectorAll('.control-group');
      groups.forEach(function (g, i) {
        if (i === 0 || i === 1) {
          // Data Setup + Playback → controls
          controlsSection.appendChild(g);
        } else {
          // Speed
          speedSection.appendChild(g);
        }
      });
    }

    // Build panels manager section
    var panelsMgrTitle = document.createElement('div');
    panelsMgrTitle.className = 'float-section-title';
    panelsMgrTitle.textContent = 'Panels';
    panelsSection.appendChild(panelsMgrTitle);

    var panelsMgrBody = document.createElement('div');
    panelsMgrBody.className = 'float-panels-mgr';
    panelsMgrBody.id = 'floatPanelsMgr';
    panelsSection.appendChild(panelsMgrBody);

    // Legend section — built inline so we don't conflict with buildWorkspace
    // which also grabs .how-section for the tile stash.
    var legendTitle = document.createElement('div');
    legendTitle.className = 'float-section-title';
    legendTitle.textContent = 'Legend';
    legendSection.appendChild(legendTitle);

    var legendRow = document.createElement('div');
    legendRow.className = 'legend-row';

    var legendItems = [
      { cls: 'default',  label: 'Default' },
      { cls: 'compare',  label: 'Compare' },
      { cls: 'swap',     label: 'Swap' },
      { cls: 'sorted',   label: 'Sorted' },
      { cls: 'noswap',   label: 'No Swap' },
      { cls: 'min',      label: 'Min' },
      { cls: 'key',      label: 'Key' },
      { cls: 'shift',    label: 'Shift' },
    ];
    legendItems.forEach(function (item) {
      var pill = document.createElement('span');
      pill.className = 'legend-pill';
      var swatch = document.createElement('i');
      swatch.className = 'swatch ' + item.cls;
      pill.appendChild(swatch);
      pill.appendChild(document.createTextNode(item.label));
      legendRow.appendChild(pill);
    });
    legendSection.appendChild(legendRow);

    body.appendChild(controlsSection);
    body.appendChild(speedSection);
    body.appendChild(panelsSection);
    body.appendChild(legendSection);

    document.body.appendChild(panel);

    // Hide the original sidebar panels (their content has been moved)
    if (leftPanel) leftPanel.style.display = 'none';
    if (rightPanel) rightPanel.style.display = 'none';

    // Remove gap that was for sidebars — collapse layout to single column
    var simLayout = document.querySelector('.sim-layout');
    if (simLayout) {
      simLayout.classList.add('panels-floating');
    }

    function applyVisibility() {
      Object.keys(sections).forEach(function (key) {
        sections[key].hidden = !vis[key];
      });
      document.body.classList.toggle('tiles-no-headers', !!vis.hideHeaders);
      document.body.classList.toggle('tiles-snap-gap', !!vis.snapGap);
    }
    applyVisibility();

    shellState.floatPanel = panel;
    shellState.floatPanelsMgr = panelsMgrBody;
    shellState.floatSections = sections;
    shellState.floatVis = vis;
    shellState.applyFloatVisibility = applyVisibility;

    // Keep panel in viewport when window is resized
    window.addEventListener('resize', function () {
      pos.x = Math.max(0, Math.min(window.innerWidth - 60, pos.x));
      pos.y = Math.max(0, Math.min(window.innerHeight - 40, pos.y));
      panel.style.left = pos.x + 'px';
      panel.style.top = pos.y + 'px';
    });
  }

  function installPanelDrag(panel, handle, pos, onSave) {
    handle.addEventListener('pointerdown', function (e) {
      if (e.button !== 0) return;
      e.preventDefault();
      handle.setPointerCapture(e.pointerId);
      var startX = e.clientX - pos.x;
      var startY = e.clientY - pos.y;
      panel.classList.add('float-panel--dragging');

      function onMove(me) {
        pos.x = Math.max(0, Math.min(window.innerWidth - 60, me.clientX - startX));
        pos.y = Math.max(0, Math.min(window.innerHeight - 40, me.clientY - startY));
        panel.style.left = pos.x + 'px';
        panel.style.top = pos.y + 'px';
      }
      function onUp() {
        panel.classList.remove('float-panel--dragging');
        handle.removeEventListener('pointermove', onMove);
        handle.removeEventListener('pointerup', onUp);
        onSave();
      }
      handle.addEventListener('pointermove', onMove);
      handle.addEventListener('pointerup', onUp);
    });
  }
  // ────────────────────────────────────────────────────────────────────────────

  function buildShell() {
    applySavedTheme();

    var page = currentPage();
    var file = currentFile();
    shellState.currentPage = page;

    var nav = document.createElement('nav');
    nav.className = 'topnav';
    shellState.nav = nav;

    var brand = document.createElement('div');
    brand.className = 'topnav-brand-wrap';

    var brandName = document.createElement('span');
    brandName.className = 'topnav-brand';
    brandName.textContent = 'Sort Lab';

    var brandVersion = document.createElement('span');
    brandVersion.className = 'topnav-version';
    brandVersion.textContent = 'v1.4.0';

    brand.appendChild(brandName);
    brand.appendChild(brandVersion);
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

    var helpBtn = document.createElement('button');
    helpBtn.className = 'pill-btn help-btn';
    helpBtn.type = 'button';
    helpBtn.setAttribute('aria-label', 'Keyboard shortcuts');
    helpBtn.textContent = '?';
    helpBtn.addEventListener('click', function () {
      toggleShortcutOverlay();
    });

    right.appendChild(theme);
    right.appendChild(helpBtn);
    nav.appendChild(right);

    document.body.insertBefore(nav, document.body.firstChild);
    syncFullscreenControls();
    buildShortcutOverlay();
    buildFloatingPanel(page);
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
      tiles: [{ id: 't0', col: 1, row: 1, content: defaultContent, height: null }],
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
      var rawHeight = Number(tile.height);
      normalized.tiles.push({
        id: tile.id || ('t' + nextId),
        col: Math.max(1, Math.min(normalized.cols, Number(tile.col) || 1)),
        row: Math.max(1, Math.min(normalized.rows, Number(tile.row) || 1)),
        content: allowed.indexOf(tile.content) !== -1 ? tile.content : 'empty',
        height: isNaN(rawHeight) || rawHeight < 160 ? null : Math.round(rawHeight),
      });
    });

    if (!normalized.tiles.length) {
      normalized.tiles.push({ id: 't0', col: 1, row: 1, content: availableContents.visualizer ? 'visualizer' : 'empty', height: null });
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
    var codeTraceContainer = document.getElementById('codeTraceContainer');
    if (codeTrace || codeTraceContainer) {
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
      var codeTraceWrapper = document.createElement('div');
      codeTraceWrapper.className = 'code-trace-container';
      codeTraceWrapper.id = 'codeTraceContainer';
      codeBundle.appendChild(codeTraceWrapper);
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
      } else if (workspace.contents[content] && workspace.contents[content].node) {
        body.appendChild(workspace.contents[content].node);
      }

      // Fire onTileContentMounted after a microtask so the new DOM is painted
      // and any content (code trace, stats) renders into visible dimensions.
      if (workspace.runtime && typeof workspace.runtime.onTileContentMounted === 'function') {
        var runtime = workspace.runtime;
        window.setTimeout(function () {
          runtime.onTileContentMounted(content, body);
        }, 0);
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
      
      var pickerHeader = document.createElement('div');
      pickerHeader.className = 'tile-picker-header';
      var pickerTitle = document.createElement('span');
      pickerTitle.textContent = 'Add Panel';
      var pickerClose = document.createElement('button');
      pickerClose.type = 'button';
      pickerClose.className = 'tile-picker-close';
      pickerClose.textContent = '×';
      pickerClose.setAttribute('aria-label', 'Close picker');
      pickerClose.addEventListener('click', function () {
        picker.remove();
        document.removeEventListener('click', closePicker);
      });
      pickerHeader.appendChild(pickerTitle);
      pickerHeader.appendChild(pickerClose);
      picker.appendChild(pickerHeader);
      
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

      function closePicker(e) {
        if (!picker.contains(e.target)) {
          picker.remove();
          document.removeEventListener('click', closePicker);
        }
      }
      setTimeout(function() {
        document.addEventListener('click', closePicker);
      }, 0);
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

    function pruneEmptyTracks() {
      while (workspace.layout.rows > 1) {
        var hasLastRow = workspace.layout.tiles.some(function (tile) {
          return tile.row === workspace.layout.rows;
        });
        if (hasLastRow) {
          break;
        }
        workspace.layout.rows -= 1;
        workspace.layout.rowSizes.pop();
      }

      while (workspace.layout.cols > 1) {
        var hasLastCol = workspace.layout.tiles.some(function (tile) {
          return tile.col === workspace.layout.cols;
        });
        if (hasLastCol) {
          break;
        }
        workspace.layout.cols -= 1;
        workspace.layout.colSizes.pop();
      }

      while (workspace.layout.colSizes.length < workspace.layout.cols) {
        workspace.layout.colSizes.push('1fr');
      }
      while (workspace.layout.rowSizes.length < workspace.layout.rows) {
        workspace.layout.rowSizes.push('1fr');
      }
    }

    function removeTile(tileId) {
      var index = -1;
      for (var i = 0; i < workspace.layout.tiles.length; i += 1) {
        if (workspace.layout.tiles[i].id === tileId) {
          index = i;
          break;
        }
      }

      if (index === -1) {
        return;
      }

      if (workspace.layout.tiles.length <= 1) {
        clearTile(tileId);
        return;
      }

      var tile = workspace.layout.tiles[index];
      if (tile.content && tile.content !== 'empty') {
        returnContentToStash(tile.content);
      }

      workspace.layout.tiles.splice(index, 1);
      pruneEmptyTracks();
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

      workspace.layout.tiles.push({ id: nextTileId(), col: target.col, row: target.row, content: 'empty', height: null });
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

    function installEdgeDrag(handle, trackType, index, ws, buildTemplate, save, rerender, syncResize) {
      handle.addEventListener('pointerdown', function (e) {
        if (e.button !== 0) return;
        e.preventDefault();
        e.stopPropagation();
        handle.setPointerCapture(e.pointerId);

        var computed = getComputedStyle(ws.root);
        var pixels = trackType === 'col'
          ? parseTrackPixels(computed.gridTemplateColumns)
          : parseTrackPixels(computed.gridTemplateRows);
        var firstStart = pixels[index];
        var secondStart = pixels[index + 1];
        var total = firstStart + secondStart;
        var pointerStart = trackType === 'col' ? e.clientX : e.clientY;

        document.body.style.cursor = trackType === 'col' ? 'col-resize' : 'row-resize';
        document.body.style.userSelect = 'none';

        function onMove(me) {
          var delta = (trackType === 'col' ? me.clientX : me.clientY) - pointerStart;
          var minSize = trackType === 'col' ? 200 : 160;
          var first = clamp(firstStart + delta, minSize, total - minSize);
          var second = total - first;
          var sizes = trackType === 'col' ? ws.layout.colSizes : ws.layout.rowSizes;
          sizes[index] = ((first / total) * 100).toFixed(3) + '%';
          sizes[index + 1] = ((second / total) * 100).toFixed(3) + '%';
          ws.root.style.setProperty(
            trackType === 'col' ? '--tile-cols' : '--tile-rows',
            buildTemplate(sizes, trackType === 'col' ? 200 : 160)
          );
          syncResize(0);
        }

        function onUp() {
          document.body.style.cursor = '';
          document.body.style.userSelect = '';
          handle.removeEventListener('pointermove', onMove);
          handle.removeEventListener('pointerup', onUp);
          handle.removeEventListener('pointercancel', onUp);
          save();
          rerender();
        }

        handle.addEventListener('pointermove', onMove);
        handle.addEventListener('pointerup', onUp);
        handle.addEventListener('pointercancel', onUp);
      });
    }

    function installTileHeightDrag(handle, tileId) {
      handle.addEventListener('pointerdown', function (event) {
        if (event.button !== 0) {
          return;
        }
        event.preventDefault();
        event.stopPropagation();

        var tile = findTile(tileId);
        var tileEl = workspace.root.querySelector('[data-tile-id="' + tileId + '"]');
        if (!tile || !tileEl) {
          return;
        }

        handle.setPointerCapture(event.pointerId);
        var startHeight = tileEl.getBoundingClientRect().height;
        var pointerStart = event.clientY;
        var nextHeight = startHeight;
        var maxHeight = Math.max(320, window.innerHeight - 140);

        document.body.style.cursor = 'row-resize';
        document.body.style.userSelect = 'none';

        function onMove(moveEvent) {
          var delta = moveEvent.clientY - pointerStart;
          nextHeight = clamp(startHeight + delta, 160, maxHeight);
          tileEl.style.height = Math.round(nextHeight) + 'px';
          dispatchSyntheticResize(0);
        }

        function onUp() {
          document.body.style.cursor = '';
          document.body.style.userSelect = '';
          handle.removeEventListener('pointermove', onMove);
          handle.removeEventListener('pointerup', onUp);
          handle.removeEventListener('pointercancel', onUp);
          tile.height = Math.round(nextHeight);
          saveLayout();
          renderWorkspace();
        }

        handle.addEventListener('pointermove', onMove);
        handle.addEventListener('pointerup', onUp);
        handle.addEventListener('pointercancel', onUp);
      });
    }

    function renderGutters() {
      var computed = getComputedStyle(workspace.root);
      var colPixels = parseTrackPixels(computed.gridTemplateColumns);
      var x = 0;

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

    }

    function renderWorkspace() {
      var used = usedContents();
      Object.keys(used).forEach(function (key) {
        returnContentToStash(key);
      });

      workspace.root.innerHTML = '';
      workspace.root.style.setProperty('--tile-cols', buildTrackTemplate(workspace.layout.colSizes, 200));
      workspace.root.style.setProperty('--tile-rows', buildTrackTemplate(workspace.layout.rowSizes, 160));

      // Collect deferred content-attach tasks — run after all tiles are in the
      // DOM so p5.js can measure offsetWidth for canvas sizing.
      var deferredAttach = [];

      workspace.layout.tiles.forEach(function (tile) {
        var tileEl = document.createElement('section');
        tileEl.className = 'tile-card';
        tileEl.dataset.tileId = tile.id;
        tileEl.dataset.tileContent = tile.content;
        tileEl.style.gridColumn = String(tile.col);
        tileEl.style.gridRow = String(tile.row);
        if (tile.height && tile.height >= 160) {
          tileEl.style.height = Math.round(tile.height) + 'px';
        }

        if (tile.content === 'empty') {
          tileEl.classList.add('empty');

          // Hover-reveal remove button for empty tiles
          var emptyRemoveBtn = document.createElement('button');
          emptyRemoveBtn.type = 'button';
          emptyRemoveBtn.className = 'tile-empty-remove';
          emptyRemoveBtn.innerHTML = '&times;';
          emptyRemoveBtn.title = 'Remove empty panel';
          emptyRemoveBtn.setAttribute('aria-label', 'Remove empty panel');
          (function (tileId) {
            emptyRemoveBtn.addEventListener('click', function (e) {
              e.stopPropagation();
              removeTile(tileId);
            });
          }(tile.id));
          tileEl.appendChild(emptyRemoveBtn);

          var emptyBtn = document.createElement('button');
          emptyBtn.className = 'tile-empty-trigger';
          emptyBtn.type = 'button';
          emptyBtn.innerHTML = '<span>+</span><b>Add panel</b>';
          (function (t, el) {
            emptyBtn.addEventListener('click', function () {
              openPicker(t, el);
            });
          }(tile, tileEl));
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
          splitBtn.className = 'tile-action-btn split-btn';
          splitBtn.title = 'Add panel alongside';
          splitBtn.setAttribute('aria-label', 'Split: add panel alongside');
          splitBtn.innerHTML = '<svg width="11" height="11" viewBox="0 0 11 11" fill="none" xmlns="http://www.w3.org/2000/svg"><rect x="0.75" y="0.75" width="3.5" height="9.5" rx="0.75" stroke="currentColor" stroke-width="1.25"/><rect x="6.75" y="0.75" width="3.5" height="9.5" rx="0.75" stroke="currentColor" stroke-width="1.25"/></svg>';
          splitBtn.disabled = workspace.layout.tiles.length >= 6;
          (function (id) {
            splitBtn.addEventListener('click', function () { splitTile(id); });
          }(tile.id));

          var clearBtn = document.createElement('button');
          clearBtn.type = 'button';
          clearBtn.className = 'tile-action-btn';
          clearBtn.innerHTML = '&times;';
          clearBtn.title = 'Remove panel';
          clearBtn.setAttribute('aria-label', 'Remove this panel');
          (function (id) {
            clearBtn.addEventListener('click', function () { clearTile(id); });
          }(tile.id));

          actions.appendChild(splitBtn);
          actions.appendChild(clearBtn);
          header.appendChild(label);
          header.appendChild(actions);
          tileEl.appendChild(header);

          var body = document.createElement('div');
          body.className = 'tile-body';
          tileEl.appendChild(body);

          // Defer until after all tiles are appended to the live DOM
          deferredAttach.push({ tile: tile, body: body });
        }

        // ── Edge resize handles ──
        // Right edge: resize column — show if there's a tile to the right
        if (tile.col < workspace.layout.cols) {
          var rHandle = document.createElement('div');
          rHandle.className = 'tile-edge-handle tile-edge-right';
          rHandle.setAttribute('aria-label', 'Resize column');
          (function (colIndex) {
            installEdgeDrag(rHandle, 'col', colIndex, workspace, buildTrackTemplate, saveLayout, renderWorkspace, dispatchSyntheticResize);
          }(tile.col - 1));
          tileEl.appendChild(rHandle);
        }
        // Top edge: resize the row above — show if this tile is not in the first row
        if (tile.row > 1) {
          var tHandle = document.createElement('div');
          tHandle.className = 'tile-edge-handle tile-edge-top';
          tHandle.setAttribute('aria-label', 'Resize row');
          (function (rowIndex) {
            installEdgeDrag(tHandle, 'row', rowIndex, workspace, buildTrackTemplate, saveLayout, renderWorkspace, dispatchSyntheticResize);
          }(tile.row - 2));
          tileEl.appendChild(tHandle);
        }
        // Bottom edge: resize this tile height
        {
          var bHandle = document.createElement('div');
          bHandle.className = 'tile-edge-handle tile-edge-bottom';
          bHandle.setAttribute('aria-label', 'Resize panel height');
          (function (id) {
            installTileHeightDrag(bHandle, id);
          }(tile.id));
          tileEl.appendChild(bHandle);
        }

        workspace.root.appendChild(tileEl);
      });

      renderGutters();

      // All tiles are now in the DOM — mount p5 canvases and other content.
      deferredAttach.forEach(function (item) {
        attachContent(item.tile, item.body);
      });

      // Two-pass resize: immediate for grid layout, then short delay so p5
      // setup() can re-measure the container after paint.
      dispatchSyntheticResize(0);
      dispatchSyntheticResize(80);

      // Keep floating panel manager in sync
      window.setTimeout(updateFloatPanelsMgr, 60);
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

  function updateFloatPanelsMgr() {
    var mgr = shellState.floatPanelsMgr;
    var workspace = shellState.workspace;
    if (!mgr || !workspace) return;
    mgr.innerHTML = '';

    var contents = workspace.contents;
    var tiles = workspace.layout.tiles;

    // ── Active tiles (with remove button) ──
    var hasTiles = false;
    tiles.forEach(function (tile) {
      if (tile.content === 'empty') return;
      hasTiles = true;
      var row = document.createElement('div');
      row.className = 'float-panel-row';

      var lbl = document.createElement('span');
      lbl.textContent = contents[tile.content] ? contents[tile.content].label : tile.content;

      var rmBtn = document.createElement('button');
      rmBtn.type = 'button';
      rmBtn.className = 'float-panel-remove';
      rmBtn.innerHTML = '&times;';
      rmBtn.title = 'Remove panel';
      (function (tileId) {
        rmBtn.addEventListener('click', function () {
          workspace.placeTileContent(tileId, 'empty');
          window.setTimeout(updateFloatPanelsMgr, 80);
        });
      }(tile.id));

      row.appendChild(lbl);
      row.appendChild(rmBtn);
      mgr.appendChild(row);
    });

    // ── Available panels not yet shown ──
    var usedKeys = {};
    tiles.forEach(function (t) { if (t.content !== 'empty') usedKeys[t.content] = true; });
    var available = Object.keys(contents).filter(function (k) { return !usedKeys[k]; });

    if (!available.length) return;

    var addTitle = document.createElement('div');
    addTitle.className = 'float-panels-add-title';
    addTitle.textContent = hasTiles ? 'Add' : 'Choose a panel';
    mgr.appendChild(addTitle);

    var maxTiles = 6;
    available.forEach(function (key) {
      var btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'float-panel-add-btn';
      btn.textContent = '+ ' + contents[key].label;

      // Find an empty slot first; if none, we'll split the last tile
      var emptyTile = null;
      for (var i = 0; i < tiles.length; i++) {
        if (tiles[i].content === 'empty') { emptyTile = tiles[i]; break; }
      }

      if (!emptyTile && tiles.length >= maxTiles) {
        btn.disabled = true;
      }

      (function (contentKey, empty) {
        btn.addEventListener('click', function () {
          if (empty) {
            // Place directly into existing empty slot
            workspace.placeTileContent(empty.id, contentKey);
          } else {
            // No empty slot — add a new row and place content there
            var newRow = workspace.layout.rows + 1;
            workspace.layout.rows = newRow;
            workspace.layout.rowSizes.push('1fr');
            var newId = 't' + workspace.layout.nextId;
            workspace.layout.nextId += 1;
            workspace.layout.tiles.push({ id: newId, col: 1, row: newRow, content: contentKey, height: null });
            workspace.saveLayout();
            workspace.render();
          }
          window.setTimeout(updateFloatPanelsMgr, 80);
        });
      }(key, emptyTile));

      mgr.appendChild(btn);
    });
  }

  function registerPageRuntime(runtime) {
    shellState.runtime = runtime;
    if (shellState.workspace) {
      shellState.workspace.runtime = runtime;
      runtime.codeLanguageEl = runtime.codeLanguageEl || (shellState.workspace && shellState.workspace.codeLanguageEl) || null;
      shellState.workspace.remountVisualizer();
      dispatchSyntheticResize(0);
      dispatchSyntheticResize(80);
      window.setTimeout(updateFloatPanelsMgr, 100);
    }
  }

  function bumpStatEl(el) {
    if (!el) return;
    el.classList.remove('bumped');
    void el.offsetWidth;
    el.classList.add('bumped');
    window.setTimeout(function () { el.classList.remove('bumped'); }, 240);
  }

  window.SortLabShell = {
    registerPageRuntime: registerPageRuntime,
    toggleShortcutOverlay: toggleShortcutOverlay,
    toggleFullscreen: toggleFullscreen,
    dispatchResize: dispatchSyntheticResize,
    togglePanel: togglePanel,
    bumpStat: bumpStatEl,
    updatePanelsMgr: updateFloatPanelsMgr,
  };

  buildShell();
  installFullscreenBehavior();
  installKeyboardShortcuts();
  shellState.workspace = buildWorkspace();
})();
