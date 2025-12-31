// ===============================
// Inject LineLock styles once
// ===============================
(function injectStylesOnce() {
  if (document.getElementById("linelock-style")) return;

  var style = document.createElement("style");
  style.id = "linelock-style";
  style.textContent = `
    /* FIXED toolbar so it stays visible while page scrolls */
    #linelock-toolbar {
      position: fixed;
      z-index: 999999;
      background: rgba(20, 20, 20, 0.95);
      color: white;
      padding: 6px 8px;
      border-radius: 8px;
      display: flex;
      gap: 6px;
      align-items: center;
      font-family: system-ui, sans-serif;
      font-size: 14px;
      box-shadow: 0 4px 12px rgba(0,0,0,0.3);
      cursor: grab;
      user-select: none;
      top: 16px;
      right: 16px;
      left: auto;
    }

    #linelock-toolbar button {
      background: none;
      border: none;
      color: white;
      cursor: pointer;
      font-size: 14px;
      padding: 2px 6px;
    }

    #linelock-toolbar button:hover { opacity: 0.8; }

    /* Strong masking */
    .linelock-word { opacity: 0.05; }

    .linelock-word.active {
      opacity: 1;
      background: rgba(255, 255, 0, 0.35);
      border-radius: 3px;
      padding: 0 1px;
    }

    .linelock-word.revealed { opacity: 1; }

    /* Hints */
    #linelock-hint {
      position: fixed;
      z-index: 1000000;
      background: rgba(20, 20, 20, 0.95);
      color: white;
      padding: 8px 10px;
      border-radius: 8px;
      font-family: system-ui, sans-serif;
      font-size: 12px;
      box-shadow: 0 4px 12px rgba(0,0,0,0.3);
      max-width: 320px;
      line-height: 1.3;
      pointer-events: none;
    }
  `;
  document.head.appendChild(style);
})();

// ===============================
// Shared UI helpers (hints)
// ===============================
(function initLineLockUI() {
  if (window.LineLockUI) return;

  var activeHintTimer = null;

  function removeHint() {
    if (activeHintTimer) {
      clearTimeout(activeHintTimer);
      activeHintTimer = null;
    }
    var hint = document.getElementById("linelock-hint");
    if (hint && hint.parentNode) hint.parentNode.removeChild(hint);
  }

  function showHintAtRect(rect, text, timeoutMs) {
    removeHint();

    var hint = document.createElement("div");
    hint.id = "linelock-hint";
    hint.textContent = text;
    document.body.appendChild(hint);

    var top = Math.max(8, Math.min(window.innerHeight - 80, rect.bottom + 8));
    var left = Math.max(8, Math.min(window.innerWidth - 340, rect.left));
    hint.style.top = top + "px";
    hint.style.left = left + "px";

    if (timeoutMs) {
      activeHintTimer = setTimeout(removeHint, timeoutMs);
    }
  }

  function showPreHint(rect, timeoutMs) {
    showHintAtRect(rect, "LineLock tip: Press Enter to start reading one word at a time.", timeoutMs);
  }

  function showStartHint(timeoutMs) {
    var bar = document.getElementById("linelock-toolbar");
    var rect = bar ? bar.getBoundingClientRect() : { left: 20, bottom: 20 };
    showHintAtRect(
      rect,
      "Hotkeys: Space = pause/resume · ↑/↓ = speed · Esc = close. Drag the toolbar to move it. Click ? anytime.",
      timeoutMs
    );
  }

  window.LineLockUI = {
    removeHint: removeHint,
    showHintAtRect: showHintAtRect,
    showPreHint: showPreHint,
    showStartHint: showStartHint
  };
})();

// ===============================
// ReaderController
// ===============================
function ReaderController(range) {
  this.range = range;

  this.words = [];
  this.currentIndex = 0;

  this.timerId = null;
  this.isPaused = false;
  this.wpm = 160;

  this.originalContents = null;

  this.toolbar = null;

  this.isDragging = false;
  this.dragOffsetX = 0;
  this.dragOffsetY = 0;
  this._onMouseMove = null;
  this._onMouseUp = null;

  this.toolbarPosKey = "linelockToolbarPositionFixed";
}

ReaderController.prototype.init = function init() {
  var self = this;

  chrome.storage.sync.get(["linelockWPM"], function (res) {
    if (res && typeof res.linelockWPM === "number") self.wpm = res.linelockWPM;

    self.captureOriginalContents();
    self.wrapWords();

    if (!self.words || self.words.length === 0) {
      console.warn("LineLock: No readable words found in selection.");
      return;
    }

    self.toolbar = self.createToolbar();

    if (window.LineLockUI && window.LineLockUI.showStartHint) {
      window.LineLockUI.showStartHint(30000);
    }

    self.start();
  });
};

ReaderController.prototype.captureOriginalContents = function () {
  this.originalContents = this.range.cloneContents();
};

ReaderController.prototype.wrapWords = function () {
  var cloned = this.range.cloneContents();
  var walker = document.createTreeWalker(cloned, NodeFilter.SHOW_TEXT, null);

  var node;
  var textNodes = [];
  while ((node = walker.nextNode())) {
    if (!node.textContent || !node.textContent.trim()) continue;
    textNodes.push(node);
  }

  for (var t = 0; t < textNodes.length; t++) {
    var textNode = textNodes[t];
    var parts = textNode.textContent.split(/(\s+)/);
    var frag = document.createDocumentFragment();

    for (var i = 0; i < parts.length; i++) {
      var part = parts[i];
      if (part && part.trim()) {
        var span = document.createElement("span");
        span.textContent = part;
        span.className = "linelock-word";
        frag.appendChild(span);
        this.words.push(span);
      } else {
        frag.appendChild(document.createTextNode(part));
      }
    }

    textNode.parentNode.replaceChild(frag, textNode);
  }

  this.range.deleteContents();
  this.range.insertNode(cloned);
};

ReaderController.prototype.scrollWordIntoViewIfNeeded = function (el) {
  if (!el || !el.getBoundingClientRect) return;
  var rect = el.getBoundingClientRect();
  var buffer = 120;

  if (rect.top < buffer || rect.bottom > window.innerHeight - buffer) {
    try { el.scrollIntoView({ behavior: "smooth", block: "center" }); }
    catch (e) { el.scrollIntoView(true); }
  }
};

ReaderController.prototype.start = function () {
  this.stop();
  this.isPaused = false;
  this.advance();
  this.scheduleNext();
};

ReaderController.prototype.stop = function () {
  if (this.timerId) {
    clearTimeout(this.timerId);
    this.timerId = null;
  }
};

ReaderController.prototype.scheduleNext = function () {
  var self = this;
  if (self.isPaused) return;

  var delay = 60000 / self.wpm;

  var prevIndex = self.currentIndex - 1;
  if (prevIndex >= 0 && self.words[prevIndex]) {
    var txt = (self.words[prevIndex].textContent || "").trim();
    if (/[.!?]$/.test(txt)) delay = delay * 1.6;
    else if (/[,;:]$/.test(txt)) delay = delay * 1.3;
  }

  self.timerId = setTimeout(function () {
    self.advance();
    if (self.currentIndex < self.words.length) self.scheduleNext();
  }, delay);
};

ReaderController.prototype.advance = function () {
  if (this.currentIndex > 0) {
    var prev = this.words[this.currentIndex - 1];
    if (prev) {
      prev.classList.remove("active");
      prev.classList.add("revealed");
    }
  }

  if (this.currentIndex >= this.words.length) {
    this.stop();
    return;
  }

  var current = this.words[this.currentIndex];
  if (current) {
    current.classList.add("active");
    this.scrollWordIntoViewIfNeeded(current);
  }
  this.currentIndex++;
};

ReaderController.prototype.togglePause = function () {
  this.isPaused = !this.isPaused;

  var btn = document.getElementById("ll-play");
  if (btn) btn.textContent = this.isPaused ? "▶️" : "⏸";

  this.stop();
  if (!this.isPaused) this.scheduleNext();
};

ReaderController.prototype.adjustSpeed = function (delta) {
  this.wpm = Math.max(80, Math.min(400, this.wpm + delta));
  chrome.storage.sync.set({ linelockWPM: this.wpm });

  var speedEl = document.getElementById("ll-speed");
  if (speedEl) speedEl.textContent = this.wpm + " WPM";

  this.stop();
  if (!this.isPaused) this.scheduleNext();
};

ReaderController.prototype.createToolbar = function () {
  var self = this;

  var existing = document.getElementById("linelock-toolbar");
  if (existing && existing.parentNode) existing.parentNode.removeChild(existing);

  var bar = document.createElement("div");
  bar.id = "linelock-toolbar";
  bar.innerHTML = `
    <button id="ll-help" title="Show hotkeys">?</button>
    <button id="ll-play" title="Pause/Resume (Space)">⏸</button>
    <button id="ll-slower" title="Slower (↓)">−</button>
    <span id="ll-speed">${this.wpm} WPM</span>
    <button id="ll-faster" title="Faster (↑)">+</button>
    <button id="ll-close" title="Close (Esc)">✕</button>
  `;
  document.body.appendChild(bar);

  chrome.storage.sync.get([this.toolbarPosKey], function (res) {
    if (res && res[self.toolbarPosKey] && typeof res[self.toolbarPosKey].top === "number") {
      bar.style.top = res[self.toolbarPosKey].top + "px";
      bar.style.left = res[self.toolbarPosKey].left + "px";
      bar.style.right = "auto";
    } else {
      bar.style.top = "16px";
      bar.style.right = "16px";
      bar.style.left = "auto";
    }
  });

  bar.querySelector("#ll-help").onclick = function () {
    if (window.LineLockUI && window.LineLockUI.showStartHint) window.LineLockUI.showStartHint(30000);
  };
  bar.querySelector("#ll-play").onclick = function () { self.togglePause(); };
  bar.querySelector("#ll-faster").onclick = function () { self.adjustSpeed(10); };
  bar.querySelector("#ll-slower").onclick = function () { self.adjustSpeed(-10); };
  bar.querySelector("#ll-close").onclick = function () { self.cleanup(); };

  bar.addEventListener("mousedown", function (e) {
    if (e.target && e.target.tagName === "BUTTON") return;

    self.isDragging = true;

    if (bar.style.left === "" || bar.style.left === "auto") {
      var rect = bar.getBoundingClientRect();
      bar.style.left = rect.left + "px";
      bar.style.top = rect.top + "px";
      bar.style.right = "auto";
    }

    self.dragOffsetX = e.clientX - bar.offsetLeft;
    self.dragOffsetY = e.clientY - bar.offsetTop;
    bar.style.cursor = "grabbing";

    self._onMouseMove = function (evt) {
      if (!self.isDragging) return;

      var newLeft = evt.clientX - self.dragOffsetX;
      var newTop = evt.clientY - self.dragOffsetY;

      newLeft = Math.max(0, Math.min(window.innerWidth - bar.offsetWidth, newLeft));
      newTop = Math.max(0, Math.min(window.innerHeight - bar.offsetHeight, newTop));

      bar.style.left = newLeft + "px";
      bar.style.top = newTop + "px";
      bar.style.right = "auto";
    };

    self._onMouseUp = function () {
      if (!self.isDragging) return;
      self.isDragging = false;
      bar.style.cursor = "grab";

      var topNum = parseInt(bar.style.top, 10);
      var leftNum = parseInt(bar.style.left, 10);

      chrome.storage.sync.set((function () {
        var obj = {};
        obj[self.toolbarPosKey] = { top: topNum, left: leftNum };
        return obj;
      })());

      document.removeEventListener("mousemove", self._onMouseMove);
      document.removeEventListener("mouseup", self._onMouseUp);
      self._onMouseMove = null;
      self._onMouseUp = null;
    };

    document.addEventListener("mousemove", self._onMouseMove);
    document.addEventListener("mouseup", self._onMouseUp);
  });

  return bar;
};

ReaderController.prototype.cleanup = function () {
  this.stop();

  if (this._onMouseMove) document.removeEventListener("mousemove", this._onMouseMove);
  if (this._onMouseUp) document.removeEventListener("mouseup", this._onMouseUp);
  this._onMouseMove = null;
  this._onMouseUp = null;

  if (this.toolbar && this.toolbar.parentNode) {
    this.toolbar.parentNode.removeChild(this.toolbar);
    this.toolbar = null;
  }

  if (window.LineLockUI && window.LineLockUI.removeHint) window.LineLockUI.removeHint();

  if (this.originalContents && this.range) {
    this.range.deleteContents();
    this.range.insertNode(this.originalContents);
  }

  // IMPORTANT: Tell contentScript that LineLock is no longer active
  try {
    window.dispatchEvent(new CustomEvent("linelock:cleanup"));
  } catch (e) {}
};

window.ReaderController = ReaderController;


