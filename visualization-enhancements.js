(function EnhancedVisualization() {
  "use strict";

  const STORAGE_KEY = "sorting-visualizer-tiling";
  const DEFAULT_TILING = {
    controls: true,
    visualization: true,
    codeTrace: true,
    stats: true,
    legend: true,
    explanation: true
  };

  let ui = {};
  let tilingState = { ...DEFAULT_TILING };
  let originalBodyPadding = "";

  function init() {
    detectUI();
    loadTilingPreferences();
    injectFullscreenButton();
    injectTilingManager();
    injectStepIndicator();
    injectExitFullscreenButton();
    bindEvents();
    applyTiling();
  }

  function detectUI() {
    ui = {
      body: document.body,
      page: document.querySelector(".page"),
      layout: document.querySelector(".layout"),
      controls: document.getElementById("leftSidebar"),
      visual: document.querySelector(".visual"),
      sidebarRight: document.getElementById("rightSidebar"),
      bars: document.getElementById("bars"),
      stats: document.querySelector(".stats"),
      legend: document.querySelector(".legend"),
      codePanel: document.getElementById("codePanel"),
      explainText: document.getElementById("explainText")
    };
  }

  function injectFullscreenButton() {
    const heroActions = document.querySelector(".hero-actions");
    if (!heroActions) return;

    const btn = document.createElement("button");
    btn.className = "fullscreen-btn";
    btn.setAttribute("aria-label", "Enter fullscreen mode");
    btn.innerHTML = `
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3"/>
      </svg>
      Fullscreen
    `;
    btn.addEventListener("click", enterFullscreen);
    heroActions.appendChild(btn);
    ui.fullscreenBtn = btn;
  }

  function injectExitFullscreenButton() {
    const btn = document.createElement("button");
    btn.className = "exit-fullscreen-btn";
    btn.setAttribute("aria-label", "Exit fullscreen mode");
    btn.innerHTML = `
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
        <path d="M8 3v3a2 2 0 0 1-2 2H3m18 0h-3a2 2 0 0 1-2-2V3m0 18v-3a2 2 0 0 1 2-2h3M3 16h3a2 2 0 0 1 2 2v3"/>
      </svg>
      Exit Fullscreen
    `;
    btn.addEventListener("click", exitFullscreen);
    document.body.appendChild(btn);
    ui.exitFullscreenBtn = btn;
  }

  function injectTilingManager() {
    const manager = document.createElement("div");
    manager.className = "tiling-manager";
    manager.setAttribute("role", "dialog");
    manager.setAttribute("aria-label", "Panel visibility settings");

    manager.innerHTML = `
      <h3 class="tiling-manager-title">Show Panels</h3>
      <label class="tiling-option ${tilingState.controls ? 'checked' : ''}">
        <input type="checkbox" data-panel="controls" ${tilingState.controls ? 'checked' : ''}>
        <span>Controls</span>
      </label>
      <label class="tiling-option ${tilingState.visualization ? 'checked' : ''}">
        <input type="checkbox" data-panel="visualization" ${tilingState.visualization ? 'checked' : ''}>
        <span>Visualization</span>
      </label>
      <label class="tiling-option ${tilingState.codeTrace ? 'checked' : ''}">
        <input type="checkbox" data-panel="codeTrace" ${tilingState.codeTrace ? 'checked' : ''}>
        <span>Code Trace</span>
      </label>
      <label class="tiling-option ${tilingState.stats ? 'checked' : ''}">
        <input type="checkbox" data-panel="stats" ${tilingState.stats ? 'checked' : ''}>
        <span>Statistics</span>
      </label>
      <label class="tiling-option ${tilingState.legend ? 'checked' : ''}">
        <input type="checkbox" data-panel="legend" ${tilingState.legend ? 'checked' : ''}>
        <span>Legend</span>
      </label>
      <label class="tiling-option ${tilingState.explanation ? 'checked' : ''}">
        <input type="checkbox" data-panel="explanation" ${tilingState.explanation ? 'checked' : ''}>
        <span>Explanation</span>
      </label>
    `;

    document.body.appendChild(manager);
    ui.tilingManager = manager;

    // Bind tiling options
    manager.querySelectorAll('input[type="checkbox"]').forEach(checkbox => {
      checkbox.addEventListener("change", (e) => {
        const panel = e.target.dataset.panel;
        tilingState[panel] = e.target.checked;
        e.target.closest(".tiling-option").classList.toggle("checked", e.target.checked);
        saveTilingPreferences();
        applyTiling();
      });
    });
  }

  function injectStepIndicator() {
    const indicator = document.createElement("div");
    indicator.className = "step-indicator";
    indicator.innerHTML = `
      <span>Step:</span>
      <span class="step-type">compare</span>
      <span class="step-desc">Comparing values</span>
    `;
    document.body.appendChild(indicator);
    ui.stepIndicator = indicator;
  }

  function enterFullscreen() {
    originalBodyPadding = ui.body.style.padding || "";
    ui.body.classList.add("is-fullscreen");
    
    if (ui.page.requestFullscreen) {
      ui.page.requestFullscreen().catch(err => {
        console.warn("Fullscreen API failed:", err);
        // Fallback: just use CSS fullscreen
      });
    }
    
    // Show tiling manager in fullscreen
    if (ui.tilingManager) {
      ui.tilingManager.style.display = "flex";
    }
  }

  function exitFullscreen() {
    ui.body.classList.remove("is-fullscreen");
    ui.body.style.padding = originalBodyPadding;
    
    if (document.fullscreenElement && document.exitFullscreen) {
      document.exitFullscreen().catch(err => {
        console.warn("Exit fullscreen failed:", err);
      });
    }
    
    // Hide tiling manager
    if (ui.tilingManager) {
      ui.tilingManager.style.display = "none";
    }
  }

  function applyTiling() {
    if (!ui.controls) return;
    
    // Apply panel visibility based on tiling state
    if (ui.controls) {
      ui.controls.classList.toggle("panel-hidden", !tilingState.controls);
      ui.controls.classList.toggle("panel-visible", tilingState.controls);
    }
    
    if (ui.visual) {
      ui.visual.style.display = tilingState.visualization ? "grid" : "none";
    }
    
    if (ui.codePanel) {
      ui.codePanel.style.display = tilingState.codeTrace ? "" : "none";
    }
    
    if (ui.stats) {
      ui.stats.style.display = tilingState.stats ? "grid" : "none";
    }
    
    if (ui.legend) {
      ui.legend.style.display = tilingState.legend ? "flex" : "none";
    }
    
    if (ui.explainText) {
      const explainContainer = ui.explainText.closest(".group");
      if (explainContainer) {
        explainContainer.style.display = tilingState.explanation ? "" : "none";
      }
    }
  }

  function loadTilingPreferences() {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        tilingState = { ...DEFAULT_TILING, ...JSON.parse(saved) };
      }
    } catch (e) {
      console.warn("Failed to load tiling preferences:", e);
    }
  }

  function saveTilingPreferences() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(tilingState));
    } catch (e) {
      console.warn("Failed to save tiling preferences:", e);
    }
  }

  function updateStepIndicator(step) {
    if (!ui.stepIndicator || !step) return;
    
    const typeEl = ui.stepIndicator.querySelector(".step-type");
    const descEl = ui.stepIndicator.querySelector(".step-desc");
    
    if (!typeEl || !descEl) return;
    
    const type = step.type || "compare";
    typeEl.className = `step-type ${type}`;
    typeEl.textContent = type.replace("-", " ");
    descEl.textContent = step.action || getDefaultActionDescription(type);
  }

  function getDefaultActionDescription(type) {
    const descriptions = {
      compare: "Comparing neighboring values",
      swap: "Swapping elements",
      "no-swap": "No swap needed",
      sorted: "Element is now sorted",
      done: "Sorting complete"
    };
    return descriptions[type] || "Processing...";
  }

  function bindEvents() {
    // Handle fullscreen change events
    document.addEventListener("fullscreenchange", () => {
      if (!document.fullscreenElement) {
        ui.body.classList.remove("is-fullscreen");
        if (ui.tilingManager) {
          ui.tilingManager.style.display = "none";
        }
      }
    });

    // Keyboard shortcut for fullscreen (F11)
    document.addEventListener("keydown", (e) => {
      if (e.key === "F11") {
        e.preventDefault();
        if (ui.body.classList.contains("is-fullscreen")) {
          exitFullscreen();
        } else {
          enterFullscreen();
        }
      }
    });
  }

  // Enhanced code formatting with indentation preservation
  function formatCodeWithIndentation(codeLines, language) {
    return codeLines.map((line, index) => {
      let formatted = escapeHtml(line);
      
      // Apply syntax highlighting
      if (language === "pseudo") {
        formatted = highlightPseudoCode(formatted);
      } else if (["java", "cpp", "python"].includes(language)) {
        formatted = highlightProgrammingCode(formatted, language);
      }
      
      return {
        lineNumber: index + 1,
        text: formatted,
        rawText: line
      };
    });
  }

  function escapeHtml(text) {
    const div = document.createElement("div");
    div.textContent = text;
    return div.innerHTML;
  }

  function highlightPseudoCode(text) {
    // Keywords
    text = text.replace(/\b(function|for|if|return|while)\b/g, '<span class="keyword">$1</span>');
    
    // Function names
    text = text.replace(/\b([a-zA-Z_]\w*)(?=\()/g, '<span class="function">$1</span>');
    
    // Comments (lines starting with // or after #)
    if (text.includes("//") || text.includes("#")) {
      text = text.replace(/(\/\/.*$|#.*$)/, '<span class="comment">$1</span>');
    }
    
    // Numbers
    text = text.replace(/\b(\d+)\b/g, '<span class="number">$1</span>');
    
    // Operators
    text = text.replace(/(=|>|<|>=|<=|==|!=|\+|-|\*|\/)/g, '<span class="operator">$1</span>');
    
    return text;
  }

  function highlightProgrammingCode(text, language) {
    // Common highlighting for Java, C++, Python
    const keywords = language === "python" 
      ? "def|class|if|elif|else|for|while|return|in|not|and|or|True|False|None"
      : "void|int|boolean|bool|if|else|for|while|return|true|false|null|class|public|private";
    
    const keywordRegex = new RegExp(`\\b(${keywords})\\b`, "g");
    text = text.replace(keywordRegex, '<span class="keyword">$1</span>');
    
    // Function names
    text = text.replace(/\b([a-zA-Z_]\w*)(?=\()/g, '<span class="function">$1</span>');
    
    // Comments
    if (language === "python") {
      text = text.replace(/(#.*$)/, '<span class="comment">$1</span>');
    } else {
      text = text.replace(/(\/\/.*$)/, '<span class="comment">$1</span>');
    }
    
    // Numbers
    text = text.replace(/\b(\d+)\b/g, '<span class="number">$1</span>');
    
    // Variables (simplified)
    text = text.replace(/\b([a-zA-Z_]\w*)\b(?![\(<])/g, '<span class="variable">$1</span>');
    
    return text;
  }

  // Expose API
  window.EnhancedVisualization = {
    init,
    enterFullscreen,
    exitFullscreen,
    updateStepIndicator,
    formatCodeWithIndentation,
    setTilingOption: (panel, visible) => {
      tilingState[panel] = visible;
      saveTilingPreferences();
      applyTiling();
    }
  };

  // Auto-initialize
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
