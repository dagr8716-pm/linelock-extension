let controller = null;

// Listen for controller cleanup triggered by toolbar close or other internal cleanup
window.addEventListener("linelock:cleanup", () => {
  controller = null;
});

// ----------
// Pre-hint on text selection (every highlight, before Enter)
// ----------
let hintTimer = null;
let lastHintTs = 0;

function clearPreHintTimer() {
  if (hintTimer) {
    clearTimeout(hintTimer);
    hintTimer = null;
  }
}

function removeHintNow() {
  clearPreHintTimer();
  if (window.LineLockUI && window.LineLockUI.removeHint) {
    window.LineLockUI.removeHint();
  }
}

function getSelectionRect() {
  const sel = window.getSelection();
  if (!sel || sel.isCollapsed || sel.rangeCount === 0) return null;
  try {
    const range = sel.getRangeAt(0);
    const rect = range.getBoundingClientRect();
    if (!rect || (rect.width === 0 && rect.height === 0)) return null;
    return rect;
  } catch (e) {
    return null;
  }
}

function showPreHint() {
  const now = Date.now();
  // Throttle a bit so dragging to select doesn't spam
  if (now - lastHintTs < 300) return;
  lastHintTs = now;

  const rect = getSelectionRect();
  if (!rect) return;

  if (window.LineLockUI && typeof window.LineLockUI.showPreHint === "function") {
    window.LineLockUI.showPreHint(rect, 15000); // 15 seconds
  }

  clearPreHintTimer();
  hintTimer = setTimeout(() => {
    if (window.LineLockUI && window.LineLockUI.removeHint) {
      window.LineLockUI.removeHint();
    }
  }, 15000);
}

// Show hint after mouse selection completes
document.addEventListener("mouseup", () => {
  if (!controller) showPreHint();
});

// Also support keyboard-based selection (shift+arrows)
document.addEventListener("keyup", (e) => {
  if (!controller && (e.key === "Shift" || e.key.startsWith("Arrow"))) {
    showPreHint();
  }
});

// NEW: Click anywhere else to dismiss hint (when no selection)
document.addEventListener(
  "mousedown",
  () => {
    // If LineLock is active, don't interfere
    if (controller) return;

    const sel = window.getSelection();
    const hasSelection = sel && !sel.isCollapsed && sel.rangeCount > 0;

    // If user clicked and there's no selection, hide hint immediately
    if (!hasSelection) {
      removeHintNow();
    }
  },
  true
);

// ----------
// Key controls
// ----------
document.addEventListener(
  "keydown",
  (e) => {
    const selection = window.getSelection();

    // START LineLock on Enter
    if (e.code === "Enter" && selection && !selection.isCollapsed) {
      e.preventDefault();

      // Hide any hint immediately when starting
      removeHintNow();

      if (!window.ReaderController) {
        console.error("LineLock: ReaderController not found on window");
        return;
      }

      if (controller) {
        controller.cleanup();
        controller = null;
      }

      const range = selection.getRangeAt(0);
      controller = new window.ReaderController(range);

      // Clear native selection highlight so it looks cleaner
      try {
        selection.removeAllRanges();
      } catch (err) {}

      controller.init();
      return;
    }

    if (!controller) return;

    // Exit / restore
    if (e.code === "Escape") {
      e.preventDefault();
      controller.cleanup();
      controller = null;
      return;
    }

    // Pause / Resume
    if (e.code === "Space") {
      e.preventDefault();
      controller.togglePause();
    }

    // Speed control
    if (e.code === "ArrowUp") {
      e.preventDefault();
      controller.adjustSpeed(10);
    }
    if (e.code === "ArrowDown") {
      e.preventDefault();
      controller.adjustSpeed(-10);
    }
  },
  true
);




