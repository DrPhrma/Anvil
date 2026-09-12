/* ==========================================================================
   Anvil — site chrome
   ========================================================================== */

(function () {
  "use strict";

  /* ---------- theme ---------- */
  const THEME_KEY = "anvil_theme";
  const body = document.body;
  const stored = localStorage.getItem(THEME_KEY);
  const initial = stored === "light" ? "light" : "dark";
  body.setAttribute("data-theme", initial);

  document.getElementById("themeToggle").addEventListener("click", () => {
    const next = body.getAttribute("data-theme") === "dark" ? "light" : "dark";
    body.setAttribute("data-theme", next);
    localStorage.setItem(THEME_KEY, next);
  });

  /* ---------- nav scroll state ---------- */
  const nav = document.getElementById("siteNav");
  function onScroll() { nav.classList.toggle("is-scrolled", window.scrollY > 8); }
  document.addEventListener("scroll", onScroll, { passive: true });
  onScroll();

  /* ---------- toast ---------- */
  const toastEl = document.getElementById("toast");
  let toastTimer = null;
  function toast(msg) {
    toastEl.textContent = msg;
    toastEl.classList.add("show");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toastEl.classList.remove("show"), 1800);
  }
  window.Anvil = window.Anvil || {};
  window.Anvil.toast = toast;

  /* ---------- build tool cards ---------- */
  const TOOLS = window.ANVIL_TOOLS || [];
  const grids = document.querySelectorAll(".card-grid[data-category]");

  grids.forEach((grid) => {
    const cat = grid.dataset.category;
    const items = TOOLS.filter((t) => t.category === cat);
    grid.innerHTML = items.map((t) => `
      <button class="tool-card" data-tool="${t.id}">
        <span class="tool-icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round">${t.icon}</svg></span>
        <h3>${t.name}</h3>
        <p>${t.desc}</p>
      </button>
    `).join("");
  });

  /* ---------- modal ---------- */
  const overlay = document.getElementById("modalOverlay");
  const modalTitle = document.getElementById("modalTitle");
  const modalIcon = document.getElementById("modalIcon");
  const modalBody = document.getElementById("modalBody");
  const modalClose = document.getElementById("modalClose");
  let lastFocused = null;

  function openTool(id) {
    const tool = TOOLS.find((t) => t.id === id);
    if (!tool) return;
    lastFocused = document.activeElement;
    modalTitle.textContent = tool.name;
    modalIcon.innerHTML = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round">${tool.icon}</svg>`;
    modalBody.innerHTML = tool.render();
    tool.init(modalBody);
    overlay.classList.add("open");
    document.documentElement.style.overflow = "hidden";
    modalClose.focus();
  }

  function closeModal() {
    overlay.classList.remove("open");
    document.documentElement.style.overflow = "";
    modalBody.innerHTML = "";
    if (lastFocused) lastFocused.focus();
  }

  document.addEventListener("click", (e) => {
    const card = e.target.closest(".tool-card");
    if (card) openTool(card.dataset.tool);
  });
  modalClose.addEventListener("click", closeModal);
  overlay.addEventListener("click", (e) => { if (e.target === overlay) closeModal(); });
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && overlay.classList.contains("open")) closeModal();
  });

  /* ---------- scroll reveal (sections only — one orchestrated pass) ---------- */
  const revealTargets = document.querySelectorAll(".reveal");
  const cardTargets = document.querySelectorAll(".tool-card");

  const io = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add("in-view");
        io.unobserve(entry.target);
      }
    });
  }, { threshold: 0.08, rootMargin: "0px 0px -60px 0px" });

  revealTargets.forEach((el) => io.observe(el));

  const cardIo = new IntersectionObserver((entries) => {
    entries.forEach((entry, i) => {
      if (entry.isIntersecting) {
        setTimeout(() => entry.target.classList.add("in-view"), i * 25);
        cardIo.unobserve(entry.target);
      }
    });
  }, { threshold: 0.08, rootMargin: "0px 0px -40px 0px" });

  document.querySelectorAll(".tool-card").forEach((el) => cardIo.observe(el));

  /* ---------- hero live demo (case-conversion cycle) ---------- */
  const demoOutput = document.getElementById("heroDemoOutput");
  const demoModes = document.querySelectorAll("#heroDemoModes span");
  const demoText = "the quick brown fox jumps";
  const demoFns = {
    upper: (s) => s.toUpperCase(),
    title: (s) => s.split(" ").map(w => w[0].toUpperCase() + w.slice(1)).join(" "),
    camel: (s) => s.split(" ").map((w, i) => i === 0 ? w : w[0].toUpperCase() + w.slice(1)).join(""),
    snake: (s) => s.split(" ").join("_"),
    kebab: (s) => s.split(" ").join("-"),
  };
  const order = ["upper", "title", "camel", "snake", "kebab"];
  let modeIndex = 0;

  function typeOut(text) {
    demoOutput.innerHTML = "";
    let i = 0;
    const speed = 22;
    function step() {
      if (i <= text.length) {
        demoOutput.innerHTML = text.slice(0, i) + '<span class="cursor"></span>';
        i++;
        setTimeout(step, speed);
      }
    }
    step();
  }

  function cycleDemo() {
    const mode = order[modeIndex % order.length];
    demoModes.forEach((el) => el.classList.toggle("active", el.dataset.mode === mode));
    typeOut(demoFns[mode](demoText));
    modeIndex++;
  }

  if (demoOutput) {
    cycleDemo();
    setInterval(cycleDemo, 2600);
  }
})();
