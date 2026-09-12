/* ==========================================================================
   Anvil — tool registry
   Each tool defines: id, category, name, desc, icon (svg inner markup),
   render() -> HTML string for the modal body, init(root) -> wires events.
   Everything runs client-side only. No network calls, no backend.
   ========================================================================== */

(function () {
  "use strict";

  /* ---------- small shared helpers ---------- */

  function esc(str) {
    return String(str)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function download(filename, content, type) {
    const blob = new Blob([content], { type: type || "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  }

  function copy(text) {
    navigator.clipboard.writeText(text).then(() => {
      window.Anvil && window.Anvil.toast("Copied to clipboard");
    }).catch(() => {
      window.Anvil && window.Anvil.toast("Couldn't copy — select manually");
    });
  }

  function loadJSON(key, fallback) {
    try {
      const raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : fallback;
    } catch (e) { return fallback; }
  }
  function saveJSON(key, value) {
    try { localStorage.setItem(key, JSON.stringify(value)); } catch (e) {}
  }

  /* ================================================================
     TOOL DEFINITIONS
     ================================================================ */

  const TOOLS = [];

  /* ---------------- TEXT: Case Converter ---------------- */
  TOOLS.push({
    id: "case-converter",
    category: "text",
    name: "Case converter",
    desc: "Switch text between upper, title, camel, snake, and more.",
    icon: '<path d="M4 7V4h16v3M9 20h6M12 4v16"/>',
    render: () => `
      <div class="field">
        <label for="cc-input">Your text</label>
        <textarea id="cc-input" placeholder="Type or paste text here...">The quick brown fox jumps over the lazy dog</textarea>
      </div>
      <div class="field">
        <label>Convert to</label>
        <div class="row-wrap" id="cc-modes">
          <button class="chip-btn" data-mode="upper">UPPERCASE</button>
          <button class="chip-btn" data-mode="lower">lowercase</button>
          <button class="chip-btn" data-mode="title">Title Case</button>
          <button class="chip-btn" data-mode="sentence">Sentence case</button>
          <button class="chip-btn" data-mode="snake">snake_case</button>
          <button class="chip-btn" data-mode="camel">camelCase</button>
          <button class="chip-btn" data-mode="kebab">kebab-case</button>
        </div>
      </div>
      <div class="field">
        <label>Result</label>
        <div class="output-box mono-out" id="cc-output">The quick brown fox jumps over the lazy dog</div>
        <div class="copy-row"><button class="btn btn-ghost btn-sm" id="cc-copy">Copy result</button></div>
      </div>`,
    init: (root) => {
      const input = root.querySelector("#cc-input");
      const output = root.querySelector("#cc-output");
      const words = (s) => s.trim().split(/\s+/).filter(Boolean);

      function convert(mode, s) {
        switch (mode) {
          case "upper": return s.toUpperCase();
          case "lower": return s.toLowerCase();
          case "title": return words(s).map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(" ") || s;
          case "sentence": {
            const lower = s.toLowerCase();
            return lower.replace(/(^\s*\w|[.!?]\s*\w)/g, c => c.toUpperCase());
          }
          case "snake": return words(s.toLowerCase()).join("_");
          case "camel": {
            const w = words(s.toLowerCase());
            return w.map((word, i) => i === 0 ? word : word.charAt(0).toUpperCase() + word.slice(1)).join("");
          }
          case "kebab": return words(s.toLowerCase()).join("-");
          default: return s;
        }
      }

      root.querySelector("#cc-modes").addEventListener("click", (e) => {
        const btn = e.target.closest("[data-mode]");
        if (!btn) return;
        root.querySelectorAll("#cc-modes .chip-btn").forEach(b => b.classList.remove("active"));
        btn.classList.add("active");
        output.textContent = convert(btn.dataset.mode, input.value || "");
      });
      input.addEventListener("input", () => {
        const active = root.querySelector("#cc-modes .active");
        if (active) output.textContent = convert(active.dataset.mode, input.value || "");
      });
      root.querySelector("#cc-copy").addEventListener("click", () => copy(output.textContent));
    }
  });

  /* ---------------- TEXT: Word / Character / Sentence Counter ---------------- */
  TOOLS.push({
    id: "word-counter",
    category: "text",
    name: "Text counter",
    desc: "Live word, character, sentence, and paragraph counts.",
    icon: '<path d="M5 9h14M5 15h14M9 4L7 20M17 4l-2 16"/>',
    render: () => `
      <div class="field">
        <label for="wc-input">Your text</label>
        <textarea id="wc-input" placeholder="Start typing to see live stats..." style="min-height:150px"></textarea>
      </div>
      <div class="stat-grid">
        <div class="stat-box"><strong id="wc-words">0</strong><span>Words</span></div>
        <div class="stat-box"><strong id="wc-chars">0</strong><span>Characters</span></div>
        <div class="stat-box"><strong id="wc-sentences">0</strong><span>Sentences</span></div>
        <div class="stat-box"><strong id="wc-paragraphs">0</strong><span>Paragraphs</span></div>
      </div>
      <p class="hint" id="wc-extra">Characters without spaces: 0 · Reading time: 0 min</p>`,
    init: (root) => {
      const input = root.querySelector("#wc-input");
      const words = root.querySelector("#wc-words");
      const chars = root.querySelector("#wc-chars");
      const sentences = root.querySelector("#wc-sentences");
      const paragraphs = root.querySelector("#wc-paragraphs");
      const extra = root.querySelector("#wc-extra");

      function update() {
        const text = input.value;
        const wordCount = (text.trim().match(/\S+/g) || []).length;
        const charCount = text.length;
        const charNoSpace = text.replace(/\s/g, "").length;
        const sentenceCount = (text.match(/[^.!?]*[.!?]+/g) || (text.trim() ? [text] : [])).length;
        const paraCount = text.trim() ? text.split(/\n\s*\n/).filter(p => p.trim()).length : 0;
        words.textContent = wordCount;
        chars.textContent = charCount;
        sentences.textContent = sentenceCount;
        paragraphs.textContent = paraCount;
        extra.textContent = `Characters without spaces: ${charNoSpace} · Reading time: ${Math.max(1, Math.ceil(wordCount / 200))} min`;
      }
      input.addEventListener("input", update);
      update();
    }
  });

  /* ---------------- TEXT: Diff Checker ---------------- */
  TOOLS.push({
    id: "text-diff",
    category: "text",
    name: "Text diff checker",
    desc: "Compare two blocks of text line by line.",
    icon: '<circle cx="6" cy="6" r="2"/><circle cx="18" cy="18" r="2"/><path d="M6 8v3a3 3 0 0 0 3 3h6M18 16v-3a3 3 0 0 0-3-3H9"/>',
    render: () => `
      <div class="row">
        <div class="field"><label for="td-a">Original</label><textarea id="td-a" style="min-height:110px">Roses are red
Violets are blue</textarea></div>
        <div class="field"><label for="td-b">Changed</label><textarea id="td-b" style="min-height:110px">Roses are red
Violets are purple
Sugar is sweet</textarea></div>
      </div>
      <button class="btn btn-primary btn-block" id="td-run" style="margin-top:4px">Compare text</button>
      <div class="field" style="margin-top:16px">
        <label>Differences</label>
        <div class="output-box mono-out" id="td-output"></div>
      </div>`,
    init: (root) => {
      const a = root.querySelector("#td-a");
      const b = root.querySelector("#td-b");
      const out = root.querySelector("#td-output");

      function diffLines(x, y) {
        const A = x.split("\n"), B = y.split("\n");
        const n = A.length, m = B.length;
        const dp = Array.from({ length: n + 1 }, () => new Array(m + 1).fill(0));
        for (let i = n - 1; i >= 0; i--) {
          for (let j = m - 1; j >= 0; j--) {
            dp[i][j] = A[i] === B[j] ? dp[i + 1][j + 1] + 1 : Math.max(dp[i + 1][j], dp[i][j + 1]);
          }
        }
        const result = [];
        let i = 0, j = 0;
        while (i < n && j < m) {
          if (A[i] === B[j]) { result.push({ t: "same", v: A[i] }); i++; j++; }
          else if (dp[i + 1][j] >= dp[i][j + 1]) { result.push({ t: "del", v: A[i] }); i++; }
          else { result.push({ t: "add", v: B[j] }); j++; }
        }
        while (i < n) { result.push({ t: "del", v: A[i] }); i++; }
        while (j < m) { result.push({ t: "add", v: B[j] }); j++; }
        return result;
      }

      function run() {
        const lines = diffLines(a.value, b.value);
        if (!a.value && !b.value) { out.innerHTML = "<span class='hint'>Nothing to compare yet.</span>"; return; }
        out.innerHTML = lines.map(l => {
          const cls = l.t === "same" ? "diff-same" : l.t === "add" ? "diff-add" : "diff-del";
          const prefix = l.t === "add" ? "+ " : l.t === "del" ? "− " : "  ";
          return `<div class="diff-line ${cls}">${esc(prefix + l.v || " ")}</div>`;
        }).join("");
      }
      root.querySelector("#td-run").addEventListener("click", run);
      run();
    }
  });

  /* ---------------- STUDY: Flashcard Maker ---------------- */
  TOOLS.push({
    id: "flashcards",
    category: "study",
    name: "Flashcard maker",
    desc: "Create flip cards that are saved to this browser.",
    icon: '<path d="M12 2 2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/>',
    render: () => `
      <div class="row">
        <div class="field"><label for="fc-front">Front</label><input type="text" id="fc-front" placeholder="Question or term"></div>
        <div class="field"><label for="fc-back">Back</label><input type="text" id="fc-back" placeholder="Answer or definition"></div>
      </div>
      <button class="btn btn-primary btn-block" id="fc-add">Add card</button>
      <hr class="divider">
      <label style="font-size:13px;color:var(--text-secondary);font-weight:500;display:block;margin-bottom:10px">Your cards (click to flip)</label>
      <div id="fc-grid" style="display:grid;grid-template-columns:1fr 1fr;gap:10px"></div>
      <p class="hint" id="fc-empty">No cards yet — add your first one above.</p>`,
    init: (root) => {
      const KEY = "anvil_flashcards";
      const grid = root.querySelector("#fc-grid");
      const empty = root.querySelector("#fc-empty");
      let cards = loadJSON(KEY, []);

      function render() {
        empty.style.display = cards.length ? "none" : "block";
        grid.innerHTML = cards.map((c, i) => `
          <div class="flip-card" data-i="${i}">
            <div class="flip-card-inner">
              <div class="flip-face front">${esc(c.front)}</div>
              <div class="flip-face back">${esc(c.back)}</div>
            </div>
          </div>
        `).join("");
      }

      grid.addEventListener("click", (e) => {
        const card = e.target.closest(".flip-card");
        if (!card) return;
        card.classList.toggle("flipped");
      });

      root.querySelector("#fc-add").addEventListener("click", () => {
        const front = root.querySelector("#fc-front");
        const back = root.querySelector("#fc-back");
        if (!front.value.trim() || !back.value.trim()) return;
        cards.push({ front: front.value.trim(), back: back.value.trim() });
        saveJSON(KEY, cards);
        front.value = ""; back.value = "";
        front.focus();
        render();
      });

      render();
    }
  });

  /* ---------------- STUDY: Quick Quiz Generator ---------------- */
  TOOLS.push({
    id: "quiz-generator",
    category: "study",
    name: "Quick quiz generator",
    desc: "Write questions and answers, then take your own quiz.",
    icon: '<circle cx="12" cy="12" r="9"/><path d="M9.5 9a2.5 2.5 0 0 1 4.6 1.4c0 1.6-2.1 2-2.1 3.6"/><path d="M12 17.5h.01"/>',
    render: () => `
      <div id="qz-build">
        <div class="row">
          <div class="field"><label for="qz-q">Question</label><input type="text" id="qz-q" placeholder="What is the capital of France?"></div>
          <div class="field"><label for="qz-a">Answer</label><input type="text" id="qz-a" placeholder="Paris"></div>
        </div>
        <button class="btn btn-ghost btn-block" id="qz-add">Add question</button>
        <hr class="divider">
        <div id="qz-list"></div>
        <button class="btn btn-primary btn-block" id="qz-start" style="margin-top:12px" disabled>Start quiz</button>
      </div>
      <div id="qz-play" style="display:none"></div>`,
    init: (root) => {
      let items = [];
      const list = root.querySelector("#qz-list");
      const startBtn = root.querySelector("#qz-start");

      function renderList() {
        list.innerHTML = items.map((it, i) => `
          <div class="list-item"><span>${i + 1}. ${esc(it.q)}</span>
            <button class="icon-btn" data-del="${i}" aria-label="Remove"><svg viewBox="0 0 24 24" fill="none" stroke-width="2" stroke-linecap="round"><path d="M18 6L6 18M6 6l12 12"/></svg></button>
          </div>`).join("");
        startBtn.disabled = items.length === 0;
      }
      list.addEventListener("click", (e) => {
        const btn = e.target.closest("[data-del]");
        if (!btn) return;
        items.splice(+btn.dataset.del, 1);
        renderList();
      });
      root.querySelector("#qz-add").addEventListener("click", () => {
        const q = root.querySelector("#qz-q"), a = root.querySelector("#qz-a");
        if (!q.value.trim() || !a.value.trim()) return;
        items.push({ q: q.value.trim(), a: a.value.trim() });
        q.value = ""; a.value = ""; q.focus();
        renderList();
      });

      startBtn.addEventListener("click", () => {
        const build = root.querySelector("#qz-build");
        const play = root.querySelector("#qz-play");
        build.style.display = "none";
        play.style.display = "block";
        let index = 0, score = 0;

        function showQuestion() {
          if (index >= items.length) {
            play.innerHTML = `
              <div class="oracle-display"><div class="badge">Quiz complete</div>
              <p class="result" style="margin-top:10px">${score} / ${items.length}</p></div>
              <button class="btn btn-ghost btn-block" id="qz-restart" style="margin-top:14px">Build a new quiz</button>`;
            play.querySelector("#qz-restart").addEventListener("click", () => {
              items = []; index = 0; score = 0;
              build.style.display = "block"; play.style.display = "none";
              renderList();
            });
            return;
          }
          const it = items[index];
          play.innerHTML = `
            <p class="hint">Question ${index + 1} of ${items.length}</p>
            <div class="field"><label>${esc(it.q)}</label><input type="text" id="qz-input" placeholder="Your answer" autocomplete="off"></div>
            <button class="btn btn-primary btn-block" id="qz-check">Check answer</button>
            <p id="qz-feedback" style="margin-top:10px"></p>`;
          const input = play.querySelector("#qz-input");
          input.focus();
          function check() {
            const correct = input.value.trim().toLowerCase() === it.a.toLowerCase();
            if (correct) score++;
            play.querySelector("#qz-feedback").innerHTML = correct
              ? `<span class="success-text">Correct.</span>`
              : `<span class="error-text">Not quite — the answer is "${esc(it.a)}".</span>`;
            play.querySelector("#qz-check").textContent = index === items.length - 1 ? "See results" : "Next question";
            play.querySelector("#qz-check").onclick = () => { index++; showQuestion(); };
          }
          play.querySelector("#qz-check").addEventListener("click", check, { once: true });
          input.addEventListener("keydown", (e) => { if (e.key === "Enter") check(); }, { once: true });
        }
        showQuestion();
      });

      renderList();
    }
  });

  /* ---------------- STUDY: Reading Time Estimator ---------------- */
  TOOLS.push({
    id: "reading-time",
    category: "study",
    name: "Reading time estimator",
    desc: "Estimate how long a passage takes to read aloud or silently.",
    icon: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3.5 2"/>',
    render: () => `
      <div class="field">
        <label for="rt-input">Paste your text</label>
        <textarea id="rt-input" style="min-height:150px" placeholder="Paste an article, essay, or script..."></textarea>
      </div>
      <div class="field">
        <label for="rt-wpm">Reading speed (words per minute)</label>
        <input type="number" id="rt-wpm" value="200" min="80" max="600">
      </div>
      <div class="stat-grid" style="grid-template-columns:repeat(3,1fr)">
        <div class="stat-box"><strong id="rt-words">0</strong><span>Words</span></div>
        <div class="stat-box"><strong id="rt-time">0 min</strong><span>Silent reading</span></div>
        <div class="stat-box"><strong id="rt-speak">0 min</strong><span>Reading aloud</span></div>
      </div>`,
    init: (root) => {
      const input = root.querySelector("#rt-input");
      const wpm = root.querySelector("#rt-wpm");
      const words = root.querySelector("#rt-words");
      const time = root.querySelector("#rt-time");
      const speak = root.querySelector("#rt-speak");
      function fmt(mins) {
        if (mins < 1) return "< 1 min";
        const m = Math.round(mins);
        return m + " min";
      }
      function update() {
        const count = (input.value.trim().match(/\S+/g) || []).length;
        const speed = Math.max(1, +wpm.value || 200);
        words.textContent = count;
        time.textContent = fmt(count / speed);
        speak.textContent = fmt(count / 130);
      }
      input.addEventListener("input", update);
      wpm.addEventListener("input", update);
      update();
    }
  });

  /* ---------------- CONVERTERS: Unit Converter ---------------- */
  TOOLS.push({
    id: "unit-converter",
    category: "converters",
    name: "Unit converter",
    desc: "Length, weight, temperature, and data units.",
    icon: '<path d="M17 3l4 4-4 4"/><path d="M21 7H9a4 4 0 0 0-4 4v1"/><path d="M7 21l-4-4 4-4"/><path d="M3 17h12a4 4 0 0 0 4-4v-1"/>',
    render: () => `
      <div class="field">
        <label for="uc-cat">Category</label>
        <select id="uc-cat">
          <option value="length">Length</option>
          <option value="weight">Weight</option>
          <option value="temperature">Temperature</option>
          <option value="data">Data</option>
        </select>
      </div>
      <div class="row">
        <div class="field"><label for="uc-from">From</label><select id="uc-from"></select></div>
        <div class="field"><label for="uc-to">To</label><select id="uc-to"></select></div>
      </div>
      <div class="field"><label for="uc-val">Value</label><input type="number" id="uc-val" value="1"></div>
      <div class="field">
        <label>Result</label>
        <div class="output-box mono-out" id="uc-result">—</div>
      </div>`,
    init: (root) => {
      const UNITS = {
        length: { m: 1, km: 1000, cm: 0.01, mm: 0.001, mi: 1609.344, yd: 0.9144, ft: 0.3048, in: 0.0254 },
        weight: { kg: 1, g: 0.001, mg: 0.000001, lb: 0.45359237, oz: 0.0283495231, ton: 1000 },
        data: { B: 1, KB: 1024, MB: 1024 ** 2, GB: 1024 ** 3, TB: 1024 ** 4, bit: 0.125 },
      };
      const cat = root.querySelector("#uc-cat");
      const from = root.querySelector("#uc-from");
      const to = root.querySelector("#uc-to");
      const val = root.querySelector("#uc-val");
      const result = root.querySelector("#uc-result");

      function populate() {
        const c = cat.value;
        if (c === "temperature") {
          from.innerHTML = to.innerHTML = ["Celsius", "Fahrenheit", "Kelvin"].map(u => `<option value="${u}">${u}</option>`).join("");
          to.selectedIndex = 1;
        } else {
          const keys = Object.keys(UNITS[c]);
          from.innerHTML = to.innerHTML = keys.map(u => `<option value="${u}">${u}</option>`).join("");
          to.selectedIndex = 1;
        }
        compute();
      }

      function toCelsius(v, u) { return u === "Celsius" ? v : u === "Fahrenheit" ? (v - 32) * 5 / 9 : v - 273.15; }
      function fromCelsius(v, u) { return u === "Celsius" ? v : u === "Fahrenheit" ? v * 9 / 5 + 32 : v + 273.15; }

      function compute() {
        const c = cat.value;
        const v = parseFloat(val.value);
        if (isNaN(v)) { result.textContent = "—"; return; }
        let out;
        if (c === "temperature") {
          out = fromCelsius(toCelsius(v, from.value), to.value);
        } else {
          const base = v * UNITS[c][from.value];
          out = base / UNITS[c][to.value];
        }
        result.textContent = `${trim(out)} ${to.value}`;
      }
      function trim(n) {
        return Math.abs(n) < 0.0001 && n !== 0 ? n.toExponential(4) : (Math.round(n * 1e6) / 1e6).toLocaleString(undefined, { maximumFractionDigits: 6 });
      }

      cat.addEventListener("change", populate);
      [from, to, val].forEach(el => el.addEventListener("input", compute));
      populate();
    }
  });

  /* ---------------- CONVERTERS: Number Base Converter ---------------- */
  TOOLS.push({
    id: "base-converter",
    category: "converters",
    name: "Number base converter",
    desc: "Convert instantly between binary, octal, decimal, hex.",
    icon: '<rect x="3" y="7" width="7" height="10" rx="1"/><rect x="14" y="7" width="7" height="10" rx="1"/><path d="M6 11h1M6 14h1M17 11h1M17 14h1"/>',
    render: () => `
      <div class="row">
        <div class="field"><label for="bc-val">Value</label><input type="text" id="bc-val" value="42"></div>
        <div class="field"><label for="bc-base">Input base</label>
          <select id="bc-base">
            <option value="10">Decimal (10)</option>
            <option value="2">Binary (2)</option>
            <option value="8">Octal (8)</option>
            <option value="16">Hexadecimal (16)</option>
          </select>
        </div>
      </div>
      <div class="field" id="bc-error"></div>
      <div class="stat-grid" style="grid-template-columns:1fr">
        <div class="list-item"><span>Binary</span><strong id="bc-2" class="mono-out"></strong></div>
        <div class="list-item"><span>Octal</span><strong id="bc-8" class="mono-out"></strong></div>
        <div class="list-item"><span>Decimal</span><strong id="bc-10" class="mono-out"></strong></div>
        <div class="list-item"><span>Hexadecimal</span><strong id="bc-16" class="mono-out"></strong></div>
      </div>`,
    init: (root) => {
      const val = root.querySelector("#bc-val");
      const base = root.querySelector("#bc-base");
      const err = root.querySelector("#bc-error");
      const outs = { 2: root.querySelector("#bc-2"), 8: root.querySelector("#bc-8"), 10: root.querySelector("#bc-10"), 16: root.querySelector("#bc-16") };

      function compute() {
        const b = +base.value;
        const raw = val.value.trim();
        const valid = new RegExp(`^[0-9a-fA-F]+$`);
        if (!raw || !valid.test(raw)) { err.innerHTML = raw ? `<p class="error-text">Enter a valid number for this base.</p>` : ""; Object.values(outs).forEach(o => o.textContent = "—"); return; }
        const n = parseInt(raw, b);
        if (isNaN(n)) { err.innerHTML = `<p class="error-text">That value isn't valid in base ${b}.</p>`; return; }
        err.innerHTML = "";
        outs[2].textContent = n.toString(2);
        outs[8].textContent = n.toString(8);
        outs[10].textContent = n.toString(10);
        outs[16].textContent = n.toString(16).toUpperCase();
      }
      val.addEventListener("input", compute);
      base.addEventListener("change", compute);
      compute();
    }
  });

  /* ---------------- GENERATORS: Lorem Ipsum ---------------- */
  TOOLS.push({
    id: "lorem-ipsum",
    category: "generators",
    name: "Lorem ipsum generator",
    desc: "Generate placeholder paragraphs, sentences, or words.",
    icon: '<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6"/><path d="M8 13h8M8 17h5"/>',
    render: () => `
      <div class="row">
        <div class="field"><label for="li-count">Amount</label><input type="number" id="li-count" value="3" min="1" max="30"></div>
        <div class="field"><label for="li-unit">Unit</label>
          <select id="li-unit"><option value="paragraphs">Paragraphs</option><option value="sentences">Sentences</option><option value="words">Words</option></select>
        </div>
      </div>
      <button class="btn btn-primary btn-block" id="li-gen">Generate</button>
      <div class="field" style="margin-top:16px">
        <label>Result</label>
        <div class="output-box" id="li-output"></div>
        <div class="copy-row"><button class="btn btn-ghost btn-sm" id="li-copy">Copy result</button></div>
      </div>`,
    init: (root) => {
      const WORDS = "lorem ipsum dolor sit amet consectetur adipiscing elit sed do eiusmod tempor incididunt ut labore et dolore magna aliqua ut enim ad minim veniam quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat duis aute irure dolor in reprehenderit voluptate velit esse cillum dolore eu fugiat nulla pariatur excepteur sint occaecat cupidatat non proident sunt in culpa qui officia deserunt mollit anim id est laborum".split(" ");
      const output = root.querySelector("#li-output");
      function rand(arr) { return arr[Math.floor(Math.random() * arr.length)]; }
      function sentence(len) {
        const words = Array.from({ length: len || (6 + Math.floor(Math.random() * 8)) }, () => rand(WORDS));
        let s = words.join(" ");
        return s.charAt(0).toUpperCase() + s.slice(1) + ".";
      }
      function paragraph() {
        return Array.from({ length: 3 + Math.floor(Math.random() * 3) }, () => sentence()).join(" ");
      }
      function generate() {
        const count = Math.max(1, Math.min(30, +root.querySelector("#li-count").value || 1));
        const unit = root.querySelector("#li-unit").value;
        let result;
        if (unit === "words") result = Array.from({ length: count }, () => rand(WORDS)).join(" ");
        else if (unit === "sentences") result = Array.from({ length: count }, () => sentence()).join(" ");
        else result = Array.from({ length: count }, () => paragraph()).join("\n\n");
        output.textContent = result;
      }
      root.querySelector("#li-gen").addEventListener("click", generate);
      root.querySelector("#li-copy").addEventListener("click", () => copy(output.textContent));
      generate();
    }
  });

  /* ---------------- GENERATORS: Dummy Data ---------------- */
  TOOLS.push({
    id: "dummy-data",
    category: "generators",
    name: "Dummy data generator",
    desc: "Fake names, emails, and phone numbers as JSON.",
    icon: '<ellipse cx="12" cy="5" rx="8" ry="3"/><path d="M4 5v14c0 1.7 3.6 3 8 3s8-1.3 8-3V5"/><path d="M4 12c0 1.7 3.6 3 8 3s8-1.3 8-3"/>',
    render: () => `
      <div class="field"><label for="dd-count">Number of records</label><input type="number" id="dd-count" value="5" min="1" max="50"></div>
      <button class="btn btn-primary btn-block" id="dd-gen">Generate data</button>
      <div class="field" style="margin-top:16px">
        <label>Result (JSON)</label>
        <div class="output-box mono-out" id="dd-output" style="max-height:220px;overflow-y:auto"></div>
        <div class="copy-row">
          <button class="btn btn-ghost btn-sm" id="dd-download">Download .json</button>
          <button class="btn btn-ghost btn-sm" id="dd-copy">Copy result</button>
        </div>
      </div>`,
    init: (root) => {
      const FIRST = ["Ava", "Liam", "Maya", "Noah", "Zara", "Ethan", "Priya", "Leo", "Isla", "Omar", "Nina", "Kai", "Elena", "Theo", "Sana"];
      const LAST = ["Bennett", "Cole", "Farrow", "Grant", "Hale", "Ibarra", "Jansen", "Keller", "Lin", "Moreau", "Novak", "Osei", "Park", "Reyes", "Singh"];
      const DOMAINS = ["mail.com", "workhub.io", "inbox.dev", "example.net"];
      const output = root.querySelector("#dd-output");
      function rand(arr) { return arr[Math.floor(Math.random() * arr.length)]; }
      function phone() {
        return `(${100 + Math.floor(Math.random() * 900)}) ${100 + Math.floor(Math.random() * 900)}-${1000 + Math.floor(Math.random() * 9000)}`;
      }
      let data = [];
      function generate() {
        const n = Math.max(1, Math.min(50, +root.querySelector("#dd-count").value || 5));
        data = Array.from({ length: n }, (_, i) => {
          const first = rand(FIRST), last = rand(LAST);
          return {
            id: i + 1,
            name: `${first} ${last}`,
            email: `${first.toLowerCase()}.${last.toLowerCase()}@${rand(DOMAINS)}`,
            phone: phone(),
          };
        });
        output.textContent = JSON.stringify(data, null, 2);
      }
      root.querySelector("#dd-gen").addEventListener("click", generate);
      root.querySelector("#dd-copy").addEventListener("click", () => copy(output.textContent));
      root.querySelector("#dd-download").addEventListener("click", () => download("dummy-data.json", output.textContent, "application/json"));
      generate();
    }
  });

  /* ---------------- GENERATORS: Random Name Generator ---------------- */
  TOOLS.push({
    id: "random-name",
    category: "generators",
    name: "Random name generator",
    desc: "Quickly generate a list of realistic full names.",
    icon: '<path d="M17 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.9"/><path d="M16 3.1a4 4 0 0 1 0 7.8"/>',
    render: () => `
      <div class="field"><label for="rn-count">How many names</label><input type="number" id="rn-count" value="8" min="1" max="40"></div>
      <button class="btn btn-primary btn-block" id="rn-gen">Generate names</button>
      <div class="field" style="margin-top:16px">
        <label>Result</label>
        <div class="output-box" id="rn-output"></div>
        <div class="copy-row"><button class="btn btn-ghost btn-sm" id="rn-copy">Copy result</button></div>
      </div>`,
    init: (root) => {
      const FIRST = ["Alexa", "Marcus", "Jade", "Felix", "Ines", "Rowan", "Simone", "Dario", "Wren", "Cassius", "Talia", "Emrys", "Nadia", "Silas", "June"];
      const LAST = ["Ashford", "Beaumont", "Castellan", "Drummond", "Eastwood", "Fitzgerald", "Granger", "Holloway", "Iversen", "Jorae", "Kensington", "Lachlan", "Marlowe"];
      const output = root.querySelector("#rn-output");
      function rand(arr) { return arr[Math.floor(Math.random() * arr.length)]; }
      function generate() {
        const n = Math.max(1, Math.min(40, +root.querySelector("#rn-count").value || 8));
        const seen = new Set();
        const names = [];
        while (names.length < n) {
          const name = `${rand(FIRST)} ${rand(LAST)}`;
          if (!seen.has(name) || seen.size >= FIRST.length * LAST.length) { names.push(name); seen.add(name); }
        }
        output.innerHTML = names.map(n => `<div>${esc(n)}</div>`).join("");
      }
      root.querySelector("#rn-gen").addEventListener("click", generate);
      root.querySelector("#rn-copy").addEventListener("click", () => copy(output.innerText));
      generate();
    }
  });

  /* ---------------- IMAGE: Image to Base64 ---------------- */
  TOOLS.push({
    id: "image-base64",
    category: "image",
    name: "Image to Base64",
    desc: "Convert an image into an embeddable Base64 string.",
    icon: '<rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="9" cy="9" r="2"/><path d="M21 15l-5-5L5 21"/>',
    render: () => `
      <label class="dropzone" for="ib-file" id="ib-drop">
        Click to choose an image, or drag one here
        <input type="file" id="ib-file" accept="image/*">
      </label>
      <img id="ib-preview" class="img-preview" style="display:none">
      <div class="field" style="margin-top:16px" id="ib-result-wrap" style="display:none">
        <label>Base64 string</label>
        <div class="output-box mono-out" id="ib-output" style="max-height:160px;overflow-y:auto">Choose an image to convert it.</div>
        <div class="copy-row"><button class="btn btn-ghost btn-sm" id="ib-copy">Copy string</button></div>
      </div>`,
    init: (root) => {
      const file = root.querySelector("#ib-file");
      const drop = root.querySelector("#ib-drop");
      const preview = root.querySelector("#ib-preview");
      const output = root.querySelector("#ib-output");

      function handle(f) {
        if (!f) return;
        const reader = new FileReader();
        reader.onload = (e) => {
          output.textContent = e.target.result;
          preview.src = e.target.result;
          preview.style.display = "block";
        };
        reader.readAsDataURL(f);
      }
      file.addEventListener("change", () => handle(file.files[0]));
      ["dragover", "dragenter"].forEach(evt => drop.addEventListener(evt, (e) => { e.preventDefault(); drop.classList.add("drag"); }));
      ["dragleave", "drop"].forEach(evt => drop.addEventListener(evt, (e) => { e.preventDefault(); drop.classList.remove("drag"); }));
      drop.addEventListener("drop", (e) => handle(e.dataTransfer.files[0]));
      root.querySelector("#ib-copy").addEventListener("click", () => copy(output.textContent));
    }
  });

  /* ---------------- IMAGE: Image Resizer ---------------- */
  TOOLS.push({
    id: "image-resizer",
    category: "image",
    name: "Image resizer",
    desc: "Resize an image in your browser and download it.",
    icon: '<path d="M6 2v14a2 2 0 0 0 2 2h14"/><path d="M18 22V8a2 2 0 0 0-2-2H2"/>',
    render: () => `
      <label class="dropzone" for="ir-file" id="ir-drop">
        Click to choose an image, or drag one here
        <input type="file" id="ir-file" accept="image/*">
      </label>
      <div class="row" style="margin-top:14px">
        <div class="field"><label for="ir-w">Width (px)</label><input type="number" id="ir-w" placeholder="—"></div>
        <div class="field"><label for="ir-h">Height (px)</label><input type="number" id="ir-h" placeholder="—"></div>
      </div>
      <label style="display:flex;align-items:center;gap:8px;font-size:13px;color:var(--text-secondary);margin-bottom:14px">
        <input type="checkbox" id="ir-lock" checked style="width:auto"> Lock aspect ratio
      </label>
      <canvas id="ir-canvas" style="display:none"></canvas>
      <img id="ir-preview" class="img-preview" style="display:none">
      <button class="btn btn-primary btn-block" id="ir-download" style="margin-top:14px" disabled>Download resized image</button>`,
    init: (root) => {
      const file = root.querySelector("#ir-file");
      const drop = root.querySelector("#ir-drop");
      const w = root.querySelector("#ir-w"), h = root.querySelector("#ir-h");
      const lock = root.querySelector("#ir-lock");
      const canvas = root.querySelector("#ir-canvas");
      const preview = root.querySelector("#ir-preview");
      const downloadBtn = root.querySelector("#ir-download");
      let img = null, ratio = 1;

      function handle(f) {
        if (!f) return;
        const reader = new FileReader();
        reader.onload = (e) => {
          img = new Image();
          img.onload = () => {
            ratio = img.width / img.height;
            w.value = img.width; h.value = img.height;
            draw();
          };
          img.src = e.target.result;
        };
        reader.readAsDataURL(f);
      }
      function draw() {
        if (!img) return;
        const ww = Math.max(1, +w.value || img.width);
        const hh = Math.max(1, +h.value || img.height);
        canvas.width = ww; canvas.height = hh;
        const ctx = canvas.getContext("2d");
        ctx.drawImage(img, 0, 0, ww, hh);
        preview.src = canvas.toDataURL("image/png");
        preview.style.display = "block";
        downloadBtn.disabled = false;
      }
      w.addEventListener("input", () => { if (lock.checked && img) h.value = Math.round(w.value / ratio); draw(); });
      h.addEventListener("input", () => { if (lock.checked && img) w.value = Math.round(h.value * ratio); draw(); });
      file.addEventListener("change", () => handle(file.files[0]));
      ["dragover", "dragenter"].forEach(evt => drop.addEventListener(evt, (e) => { e.preventDefault(); drop.classList.add("drag"); }));
      ["dragleave", "drop"].forEach(evt => drop.addEventListener(evt, (e) => { e.preventDefault(); drop.classList.remove("drag"); }));
      drop.addEventListener("drop", (e) => handle(e.dataTransfer.files[0]));
      downloadBtn.addEventListener("click", () => {
        const a = document.createElement("a");
        a.download = "resized-image.png";
        a.href = canvas.toDataURL("image/png");
        a.click();
      });
    }
  });

  /* ---------------- FUN: Yes/No Oracle ---------------- */
  TOOLS.push({
    id: "yes-no",
    category: "fun",
    name: "Yes / No oracle",
    desc: "Ask a question, get an instant decisive answer.",
    icon: '<path d="M12 3v4M12 17v4M3 12h4M17 12h4M6 6l2.5 2.5M15.5 15.5 18 18M18 6l-2.5 2.5M8.5 15.5 6 18"/>',
    render: () => `
      <div class="oracle-display">
        <p class="hint" style="margin-bottom:12px">Ask your question, then tap the button</p>
        <p class="result" id="yn-result">?</p>
      </div>
      <button class="btn btn-primary btn-block" id="yn-ask" style="margin-top:16px">Ask the oracle</button>`,
    init: (root) => {
      const ANSWERS = ["Yes", "No", "Ask again later", "Definitely", "Unlikely", "Without a doubt", "Not right now", "Signs point to yes"];
      const result = root.querySelector("#yn-result");
      root.querySelector("#yn-ask").addEventListener("click", () => {
        result.style.opacity = 0;
        setTimeout(() => {
          result.textContent = ANSWERS[Math.floor(Math.random() * ANSWERS.length)];
          result.style.opacity = 1;
        }, 120);
      });
    }
  });

  /* ---------------- FUN: Random Picker ---------------- */
  TOOLS.push({
    id: "random-picker",
    category: "fun",
    name: "Random picker",
    desc: "Paste a list and let Anvil choose for you.",
    icon: '<path d="M3 6h4l7 12h4"/><path d="M17 6h4v4"/><path d="M3 18h4l3.5-6"/><path d="M17 18h4v-4"/>',
    render: () => `
      <div class="field">
        <label for="rp-list">One item per line</label>
        <textarea id="rp-list" style="min-height:120px">Pizza
Tacos
Sushi
Salad
Burgers</textarea>
      </div>
      <button class="btn btn-primary btn-block" id="rp-pick">Pick one</button>
      <div class="oracle-display" style="margin-top:16px">
        <p class="result" id="rp-result">—</p>
      </div>`,
    init: (root) => {
      const list = root.querySelector("#rp-list");
      const result = root.querySelector("#rp-result");
      root.querySelector("#rp-pick").addEventListener("click", () => {
        const items = list.value.split("\n").map(s => s.trim()).filter(Boolean);
        if (!items.length) { result.textContent = "Add items first"; return; }
        result.style.opacity = 0;
        setTimeout(() => {
          result.textContent = items[Math.floor(Math.random() * items.length)];
          result.style.opacity = 1;
        }, 120);
      });
    }
  });

  /* ---------------- FUN: Coin Flip + Dice Roller ---------------- */
  TOOLS.push({
    id: "coin-dice",
    category: "fun",
    name: "Coin flip & dice roller",
    desc: "Flip a coin or roll a die from d4 to d20.",
    icon: '<rect x="3" y="3" width="18" height="18" rx="3"/><circle cx="8" cy="8" r="1.2"/><circle cx="16" cy="16" r="1.2"/><circle cx="12" cy="12" r="1.2"/>',
    render: () => `
      <div class="tab-row" id="cd-tabs">
        <button class="tab-btn active" data-tab="coin">Coin</button>
        <button class="tab-btn" data-tab="dice">Dice</button>
      </div>
      <div id="cd-coin">
        <div class="oracle-display"><p class="result" id="cd-coin-result">—</p></div>
        <button class="btn btn-primary btn-block" id="cd-flip" style="margin-top:14px">Flip coin</button>
      </div>
      <div id="cd-dice" style="display:none">
        <div class="field"><label for="cd-sides">Die type</label>
          <select id="cd-sides"><option value="4">d4</option><option value="6" selected>d6</option><option value="8">d8</option><option value="10">d10</option><option value="12">d12</option><option value="20">d20</option></select>
        </div>
        <div class="dice-face" id="cd-dice-result">6</div>
        <button class="btn btn-primary btn-block" id="cd-roll" style="margin-top:14px">Roll die</button>
      </div>`,
    init: (root) => {
      root.querySelector("#cd-tabs").addEventListener("click", (e) => {
        const btn = e.target.closest(".tab-btn");
        if (!btn) return;
        root.querySelectorAll("#cd-tabs .tab-btn").forEach(b => b.classList.remove("active"));
        btn.classList.add("active");
        root.querySelector("#cd-coin").style.display = btn.dataset.tab === "coin" ? "block" : "none";
        root.querySelector("#cd-dice").style.display = btn.dataset.tab === "dice" ? "block" : "none";
      });
      root.querySelector("#cd-flip").addEventListener("click", () => {
        const r = root.querySelector("#cd-coin-result");
        r.style.opacity = 0;
        setTimeout(() => { r.textContent = Math.random() < 0.5 ? "Heads" : "Tails"; r.style.opacity = 1; }, 120);
      });
      root.querySelector("#cd-roll").addEventListener("click", () => {
        const sides = +root.querySelector("#cd-sides").value;
        const r = root.querySelector("#cd-dice-result");
        r.style.transform = "scale(0.85)";
        setTimeout(() => { r.textContent = 1 + Math.floor(Math.random() * sides); r.style.transform = "scale(1)"; }, 120);
      });
    }
  });

  /* ---------------- DEVELOPER: JSON Formatter + Validator ---------------- */
  TOOLS.push({
    id: "json-formatter",
    category: "developer",
    name: "JSON formatter",
    desc: "Pretty-print, minify, and validate JSON.",
    icon: '<path d="M8 4L2 12l6 8"/><path d="M16 4l6 8-6 8"/>',
    render: () => `
      <div class="field">
        <label for="jf-input">JSON input</label>
        <textarea id="jf-input" class="mono" style="min-height:150px">{"name":"Anvil","tools":19,"active":true}</textarea>
      </div>
      <div class="row-wrap">
        <button class="btn btn-ghost btn-sm" id="jf-format">Format</button>
        <button class="btn btn-ghost btn-sm" id="jf-minify">Minify</button>
        <button class="btn btn-ghost btn-sm" id="jf-validate">Validate</button>
      </div>
      <div id="jf-status" style="margin-top:8px"></div>
      <div class="field" style="margin-top:12px">
        <label>Output</label>
        <div class="output-box mono-out" id="jf-output" style="max-height:200px;overflow-y:auto"></div>
        <div class="copy-row"><button class="btn btn-ghost btn-sm" id="jf-copy">Copy output</button></div>
      </div>`,
    init: (root) => {
      const input = root.querySelector("#jf-input");
      const output = root.querySelector("#jf-output");
      const status = root.querySelector("#jf-status");
      function parse() {
        try { return { ok: true, value: JSON.parse(input.value) }; }
        catch (e) { return { ok: false, error: e.message }; }
      }
      root.querySelector("#jf-format").addEventListener("click", () => {
        const r = parse();
        if (!r.ok) { status.innerHTML = `<p class="error-text">${esc(r.error)}</p>`; return; }
        status.innerHTML = `<p class="success-text">Valid JSON</p>`;
        output.textContent = JSON.stringify(r.value, null, 2);
      });
      root.querySelector("#jf-minify").addEventListener("click", () => {
        const r = parse();
        if (!r.ok) { status.innerHTML = `<p class="error-text">${esc(r.error)}</p>`; return; }
        status.innerHTML = `<p class="success-text">Valid JSON</p>`;
        output.textContent = JSON.stringify(r.value);
      });
      root.querySelector("#jf-validate").addEventListener("click", () => {
        const r = parse();
        status.innerHTML = r.ok ? `<p class="success-text">Valid JSON</p>` : `<p class="error-text">Invalid: ${esc(r.error)}</p>`;
      });
      root.querySelector("#jf-copy").addEventListener("click", () => copy(output.textContent));
    }
  });

  /* ---------------- DEVELOPER: CSS Minifier ---------------- */
  TOOLS.push({
    id: "css-minifier",
    category: "developer",
    name: "CSS minifier",
    desc: "Strip comments and whitespace from stylesheets.",
    icon: '<path d="M9 4H4v5"/><path d="M4 4l7 7"/><path d="M15 20h5v-5"/><path d="M20 20l-7-7"/>',
    render: () => `
      <div class="field">
        <label for="cm-input">CSS input</label>
        <textarea id="cm-input" class="mono" style="min-height:150px">.card {
  padding: 20px; /* comment */
  border-radius: 12px;
}
</textarea>
      </div>
      <button class="btn btn-primary btn-block" id="cm-run">Minify</button>
      <p class="hint" id="cm-stats"></p>
      <div class="field" style="margin-top:8px">
        <label>Output</label>
        <div class="output-box mono-out" id="cm-output" style="max-height:180px;overflow-y:auto"></div>
        <div class="copy-row"><button class="btn btn-ghost btn-sm" id="cm-copy">Copy output</button></div>
      </div>`,
    init: (root) => {
      const input = root.querySelector("#cm-input");
      const output = root.querySelector("#cm-output");
      const stats = root.querySelector("#cm-stats");
      function minify(css) {
        return css
          .replace(/\/\*[\s\S]*?\*\//g, "")
          .replace(/\s*([{}:;,])\s*/g, "$1")
          .replace(/;}/g, "}")
          .replace(/\s+/g, " ")
          .trim();
      }
      root.querySelector("#cm-run").addEventListener("click", () => {
        const before = input.value.length;
        const min = minify(input.value);
        output.textContent = min;
        const pct = before ? Math.round((1 - min.length / before) * 100) : 0;
        stats.textContent = `${before} → ${min.length} characters (${pct}% smaller)`;
      });
      root.querySelector("#cm-copy").addEventListener("click", () => copy(output.textContent));
    }
  });

  /* ---------------- DEVELOPER: Markdown Live Preview ---------------- */
  TOOLS.push({
    id: "markdown-preview",
    category: "developer",
    name: "Markdown preview",
    desc: "Write Markdown and see it rendered live.",
    icon: '<path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7z"/><circle cx="12" cy="12" r="3"/>',
    render: () => `
      <div class="field">
        <label for="md-input">Markdown</label>
        <textarea id="md-input" class="mono" style="min-height:160px"># Hello

This is **bold**, this is *italic*, and this is \`code\`.

- First item
- Second item

> A short quote

[Anvil](#)</textarea>
      </div>
      <div class="field">
        <label>Preview</label>
        <div class="md-preview" id="md-output"></div>
      </div>`,
    init: (root) => {
      const input = root.querySelector("#md-input");
      const output = root.querySelector("#md-output");

      function renderMarkdown(src) {
        let html = esc(src);
        html = html.replace(/```([\s\S]*?)```/g, (m, code) => `<pre><code>${code.trim()}</code></pre>`);
        html = html.replace(/^### (.*)$/gm, "<h3>$1</h3>")
                   .replace(/^## (.*)$/gm, "<h2>$1</h2>")
                   .replace(/^# (.*)$/gm, "<h1>$1</h1>");
        html = html.replace(/^&gt; (.*)$/gm, "<blockquote>$1</blockquote>");
        html = html.replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>");
        html = html.replace(/\*(.+?)\*/g, "<em>$1</em>");
        html = html.replace(/`([^`]+)`/g, "<code>$1</code>");
        html = html.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener">$1</a>');
        html = html.replace(/^(?:- .*(?:\n|$))+/gm, (block) => {
          const items = block.trim().split("\n").map(l => `<li>${l.replace(/^- /, "")}</li>`).join("");
          return `<ul>${items}</ul>`;
        });
        html = html.split(/\n{2,}/).map(block => {
          if (/^<(h1|h2|h3|ul|blockquote|pre)/.test(block.trim())) return block;
          return block.trim() ? `<p>${block.trim().replace(/\n/g, "<br>")}</p>` : "";
        }).join("");
        return html;
      }
      function update() { output.innerHTML = renderMarkdown(input.value); }
      input.addEventListener("input", update);
      update();
    }
  });

  /* expose */
  window.ANVIL_TOOLS = TOOLS;
  window.Anvil = window.Anvil || {};
  window.Anvil.copy = copy;
  window.Anvil.download = download;
  window.Anvil.esc = esc;
})();
