(function initNavigation() {
  const PAGES = [
    { file: "index.html", label: "Home", step: -1 },
    { file: "bubble_sort_simulation.html", label: "Bubble Sort", step: 0 },
    { file: "selection_sort_simulation.html", label: "Selection Sort", step: 1 },
    { file: "insertion_sort_simulation.html", label: "Insertion Sort", step: 2 },
    { file: "compare_all_simulation.html", label: "Compare All", step: 3 }
  ];

  const SIM_PAGES = PAGES.filter((page) => page.step >= 0);

  function getCurrentFile() {
    const path = window.location.pathname || "";
    const last = path.split("/").pop();
    return last && last.trim() ? last : "index.html";
  }

  function getCurrentPage() {
    const currentFile = getCurrentFile();
    return PAGES.find((page) => page.file === currentFile) || PAGES[0];
  }

  function togglePresent() {
    document.body.toggleAttribute("data-present");
    const btn = document.querySelector(".topnav-present-btn");
    if (btn) {
      btn.textContent = document.body.hasAttribute("data-present") ? "Exit Present" : "Present";
    }
  }

  function syncPresentFromQuery() {
    const enabled = new URLSearchParams(window.location.search).get("present") === "1";
    if (enabled) {
      document.body.setAttribute("data-present", "");
    }
  }

  function buildTopNav(currentPage) {
    const nav = document.createElement("nav");
    nav.className = "topnav";

    const links = SIM_PAGES.map((page) => {
      const active = currentPage.file === page.file ? " active" : "";
      return `<a href="${page.file}" class="topnav-link${active}">${page.label}</a>`;
    }).join("");

    nav.innerHTML = `
      <span class="topnav-brand">Sorting Algorithms</span>
      <div class="topnav-links">${links}</div>
      <div class="topnav-right">
        <div class="nav-theme"></div>
        <button class="topnav-present-btn" type="button">Present</button>
      </div>
    `;

    return nav;
  }

  function getPrevPage(currentStep) {
    if (currentStep <= 0) {
      return { file: "index.html", label: "Home" };
    }
    return SIM_PAGES[currentStep - 1];
  }

  function getNextPage(currentStep) {
    if (currentStep >= SIM_PAGES.length - 1) {
      return { file: "index.html", label: "Home" };
    }
    return SIM_PAGES[currentStep + 1];
  }

  function buildStepper(currentStep) {
    const prev = getPrevPage(currentStep);
    const next = getNextPage(currentStep);

    const dots = SIM_PAGES.map((page, index) => {
      let state = "empty";
      if (index < currentStep) state = "done";
      if (index === currentStep) state = "active";

      const connector = index < SIM_PAGES.length - 1 ? '<div class="step-connector"></div>' : "";
      return `
        <div class="stepper-step">
          <div class="step-dot ${state}"></div>
          <span class="step-label">${page.label}</span>
        </div>
        ${connector}
      `;
    }).join("");

    const wrap = document.createElement("div");
    wrap.className = "progress-stepper";
    wrap.innerHTML = `
      <a href="${prev.file}" class="stepper-prev home-link">← ${prev.label}</a>
      <div class="stepper-dots">${dots}</div>
      <a href="${next.file}" class="stepper-next home-link">${next.label} →</a>
    `;
    return wrap;
  }

  function moveThemeSwitcherToNav() {
    const themeSwitcher = document.querySelector(".theme-switcher");
    const navTheme = document.querySelector(".nav-theme");
    if (!themeSwitcher || !navTheme) return;
    const oldParent = themeSwitcher.parentElement;
    navTheme.appendChild(themeSwitcher);

    if (oldParent && oldParent.classList.contains("theme-only") && oldParent.childElementCount === 0) {
      oldParent.remove();
    }
  }

  function init() {
    if (document.querySelector(".topnav")) return;

    syncPresentFromQuery();

    const currentPage = getCurrentPage();
    const topNav = buildTopNav(currentPage);
    document.body.insertBefore(topNav, document.body.firstChild);

    if (currentPage.step >= 0) {
      const stepper = buildStepper(currentPage.step);
      document.body.insertBefore(stepper, topNav.nextSibling);
    }

    const btn = topNav.querySelector(".topnav-present-btn");
    if (btn) {
      btn.textContent = document.body.hasAttribute("data-present") ? "Exit Present" : "Present";
      btn.addEventListener("click", togglePresent);
    }

    moveThemeSwitcherToNav();
  }

  window.togglePresent = togglePresent;

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
