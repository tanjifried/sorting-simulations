(function initThemeManager() {
  const STORAGE_KEY = "sorting-theme";
  const DEFAULT_THEME = "sky";
  const THEMES = [
    { value: "sky", label: "Sky Blue" },
    { value: "sunset", label: "Sunset" },
    { value: "forest", label: "Forest" },
    { value: "midnight", label: "Midnight" }
  ];

  const body = document.body;
  if (!body) return;

  const validThemes = new Set(THEMES.map((theme) => theme.value));
  const prefersReducedMotion = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  function normalizeTheme(themeValue) {
    return validThemes.has(themeValue) ? themeValue : DEFAULT_THEME;
  }

  function getStoredTheme() {
    try {
      return normalizeTheme(localStorage.getItem(STORAGE_KEY));
    } catch (_) {
      return DEFAULT_THEME;
    }
  }

  function persistTheme(themeValue) {
    try {
      localStorage.setItem(STORAGE_KEY, themeValue);
    } catch (_) {
      // Ignore storage errors (private mode, restricted policies).
    }
  }

  function syncThemeSelects(themeValue) {
    document.querySelectorAll(".theme-select").forEach((selectEl) => {
      if (selectEl.value !== themeValue) {
        selectEl.value = themeValue;
      }
    });
  }

  function withClassPulse(elements, className, duration = 320) {
    elements.forEach((el) => {
      if (!el) return;
      el.classList.remove(className);
      void el.offsetWidth;
      el.classList.add(className);
      window.setTimeout(() => el.classList.remove(className), duration);
    });
  }

  function applyTheme(themeValue, animate = false) {
    const resolvedTheme = normalizeTheme(themeValue);
    body.dataset.theme = resolvedTheme;
    persistTheme(resolvedTheme);
    syncThemeSelects(resolvedTheme);

    if (animate && !prefersReducedMotion) {
      body.classList.remove("theme-switching");
      void body.offsetWidth;
      body.classList.add("theme-switching");
      window.setTimeout(() => body.classList.remove("theme-switching"), 360);
    }
  }

  function resolveThemeMount() {
    const navTheme = document.querySelector(".nav-theme");
    if (navTheme) return navTheme;

    const heroActions = document.querySelector(".hero-actions");
    if (heroActions) return heroActions;

    const heroTop = document.querySelector(".hero-top");
    if (heroTop) return heroTop;

    const hero = document.querySelector(".hero");
    if (!hero) return null;

    const fallbackRow = document.createElement("div");
    fallbackRow.className = "hero-actions theme-only";
    hero.appendChild(fallbackRow);
    return fallbackRow;
  }

  function injectThemeSwitcher(initialTheme) {
    if (document.querySelector(".theme-switcher")) {
      syncThemeSelects(initialTheme);
      return;
    }

    const mount = resolveThemeMount();
    if (!mount) return;

    const wrap = document.createElement("div");
    wrap.className = "theme-switcher";

    const label = document.createElement("label");
    label.className = "theme-label";
    label.setAttribute("for", "globalThemeSelect");
    label.textContent = "Theme";

    const select = document.createElement("select");
    select.id = "globalThemeSelect";
    select.className = "theme-select";
    select.setAttribute("aria-label", "Choose color theme");

    THEMES.forEach((theme) => {
      const option = document.createElement("option");
      option.value = theme.value;
      option.textContent = theme.label;
      select.appendChild(option);
    });

    select.value = initialTheme;
    select.addEventListener("change", () => {
      applyTheme(select.value, true);
    });

    wrap.append(label, select);
    mount.appendChild(wrap);
  }

  function wireSwitchAnimations() {
    const layout = document.querySelector(".layout");
    const codePanels = Array.from(document.querySelectorAll(".code-panel, .code-mini"));

    const leftToggle = document.getElementById("toggleLeftBtn");
    if (leftToggle && layout) {
      leftToggle.addEventListener("click", () => withClassPulse([layout], "switch-layout"));
    }

    const rightToggle = document.getElementById("toggleRightBtn");
    if (rightToggle && layout) {
      rightToggle.addEventListener("click", () => withClassPulse([layout], "switch-layout"));
    }

    const codeToggle = document.getElementById("toggleCodeBtn");
    if (codeToggle && codePanels.length) {
      codeToggle.addEventListener(
        "click",
        () => {
          withClassPulse(codePanels, "switching", 280);
        },
        true
      );
    }

    const codeLanguage = document.getElementById("codeLanguage");
    if (codeLanguage && codePanels.length) {
      codeLanguage.addEventListener("change", () => withClassPulse(codePanels, "switching", 280));
    }
  }

  const initialTheme = getStoredTheme();
  applyTheme(initialTheme, false);
  injectThemeSwitcher(initialTheme);
  wireSwitchAnimations();
})();
