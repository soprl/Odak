(function () {
  "use strict";

  const CIRC = 2 * Math.PI * 88;
  const MONO = ["#ffffff", "#f0f0f0", "#d4d4d4", "#a3a3a3"];

  const els = {
    ring: document.getElementById("ring"),
    ringProgress: document.getElementById("ringProgress"),
    timeDisplay: document.getElementById("timeDisplay"),
    phaseLabel: document.getElementById("phaseLabel"),
    btnStart: document.getElementById("btnStart"),
    btnPause: document.getElementById("btnPause"),
    btnReset: document.getElementById("btnReset"),
    btnCustom: document.getElementById("btnCustom"),
    customMin: document.getElementById("customMin"),
    presets: document.querySelectorAll(".preset"),
    overlay: document.getElementById("celebrationOverlay"),
    btnDismiss: document.getElementById("btnDismiss"),
    confettiCanvas: document.getElementById("confettiCanvas"),
    focusToolbar: document.getElementById("focusToolbar"),
    focusToggle: document.getElementById("focusToggle"),
    focusResetMini: document.getElementById("focusResetMini"),
  };

  let totalSec = 25 * 60;
  let remainingSec = totalSec;
  let tickId = null;
  let running = false;
  let focusSession = false;

  /** @type {((opts: object) => void) | null} */
  let confettiApi = null;

  function formatTime(sec) {
    const s = Math.max(0, Math.floor(sec));
    const m = Math.floor(s / 60);
    const r = s % 60;
    return String(m).padStart(2, "0") + ":" + String(r).padStart(2, "0");
  }

  function setRing(remaining, total) {
    if (!els.ringProgress) return;
    if (total <= 0) {
      els.ringProgress.style.strokeDashoffset = String(CIRC);
      return;
    }
    const ratio = remaining / total;
    els.ringProgress.style.strokeDashoffset = String(CIRC * (1 - ratio));
  }

  function syncPresetActive() {
    const minutes = Math.round(totalSec / 60);
    els.presets.forEach((btn) => {
      const m = Number(btn.getAttribute("data-minutes"));
      btn.classList.toggle("is-active", m === minutes);
    });
  }

  function setPhase(text) {
    if (els.phaseLabel) els.phaseLabel.textContent = text;
  }

  function updateUi() {
    if (els.timeDisplay) els.timeDisplay.textContent = formatTime(remainingSec);
    setRing(remainingSec, totalSec);
    syncPresetActive();

    const done = remainingSec <= 0 && totalSec > 0;
    if (els.btnStart) {
      els.btnStart.disabled = done || running;
      if (done) els.btnStart.textContent = "Başlat";
      else if (remainingSec < totalSec && remainingSec > 0) els.btnStart.textContent = "Devam";
      else els.btnStart.textContent = "Başlat";
    }
    if (els.btnPause) els.btnPause.disabled = !running;
    if (els.btnReset) els.btnReset.disabled = totalSec <= 0 || (remainingSec === totalSec && !running);

    if (!running && remainingSec === totalSec && totalSec > 0) {
      setPhase("Hazır");
    } else if (running) {
      setPhase("Odakta");
    } else if (remainingSec > 0 && remainingSec < totalSec) {
      setPhase("Duraklatıldı");
    } else if (remainingSec <= 0) {
      setPhase("Bitti");
    }

    updateFocusChrome();
  }

  function updateFocusChrome() {
    document.body.classList.toggle("focus-session", focusSession);

    document.querySelectorAll(".app-chrome").forEach((el) => {
      if (focusSession) el.setAttribute("inert", "");
      else el.removeAttribute("inert");
    });

    const ring = els.ring;
    if (ring) {
      const canInteract = focusSession && remainingSec > 0;
      ring.tabIndex = canInteract ? 0 : -1;
      if (canInteract) {
        ring.setAttribute("role", "button");
        ring.setAttribute("aria-label", running ? "Duraklat" : "Devam");
      } else {
        ring.removeAttribute("role");
        ring.removeAttribute("aria-label");
      }
    }

    const tb = els.focusToolbar;
    const focusToggle = els.focusToggle;
    if (tb) {
      const showBar = focusSession && remainingSec > 0 && !running;
      if (!showBar && tb.contains(document.activeElement)) {
        /** @type {HTMLElement | null} */ (document.activeElement)?.blur();
      }
      tb.hidden = !showBar;
      if (tb.hidden) tb.setAttribute("inert", "");
      else tb.removeAttribute("inert");
      if (focusToggle && showBar) focusToggle.textContent = "Devam";
    }
  }

  function clearTick() {
    if (tickId !== null) {
      clearInterval(tickId);
      tickId = null;
    }
  }

  function ensureConfetti() {
    if (typeof confetti !== "function" || !els.confettiCanvas) return null;
    if (!confettiApi) {
      confettiApi = confetti.create(els.confettiCanvas, {
        resize: true,
        useWorker: false,
      });
    }
    return confettiApi;
  }

  function fireCelebration() {
    const api = ensureConfetti();
    if (!api) return;

    const end = Date.now() + 2400;
    (function frame() {
      api({
        particleCount: 2,
        angle: 60,
        spread: 50,
        origin: { x: 0, y: 0.65 },
        colors: MONO,
        ticks: 120,
        gravity: 0.9,
        scalar: 0.9,
      });
      api({
        particleCount: 2,
        angle: 120,
        spread: 50,
        origin: { x: 1, y: 0.65 },
        colors: MONO,
        ticks: 120,
        gravity: 0.9,
        scalar: 0.9,
      });
      if (Date.now() < end) requestAnimationFrame(frame);
    })();

    setTimeout(() => {
      api({
        particleCount: 90,
        spread: 76,
        startVelocity: 38,
        origin: { x: 0.5, y: 0.45 },
        colors: MONO,
        ticks: 200,
        scalar: 1.05,
      });
    }, 120);

    setTimeout(() => {
      api({
        particleCount: 40,
        spread: 100,
        origin: { x: 0.2, y: 0.35 },
        colors: MONO,
        scalar: 0.85,
      });
      api({
        particleCount: 40,
        spread: 100,
        origin: { x: 0.8, y: 0.35 },
        colors: MONO,
        scalar: 0.85,
      });
    }, 400);
  }

  function restartCssAnimation(el) {
    if (!el) return;
    el.style.animation = "none";
    void el.offsetHeight;
    el.style.animation = "";
  }

  function restartCelebrationMotion() {
    const mascot = document.getElementById("mascot");
    const bounce = mascot?.querySelector(".mascot-bounce");
    const smile = mascot?.querySelector(".smile");
    [mascot, bounce, smile].forEach(restartCssAnimation);
  }

  function openCelebration() {
    document.body.classList.add("celebrating");
    if (els.overlay) els.overlay.hidden = false;
    restartCelebrationMotion();
    fireCelebration();
  }

  function closeCelebration() {
    document.body.classList.remove("celebrating");
    if (els.overlay) els.overlay.hidden = true;
    if (els.confettiCanvas) {
      const ctx = els.confettiCanvas.getContext("2d");
      if (ctx) ctx.clearRect(0, 0, els.confettiCanvas.width, els.confettiCanvas.height);
    }
  }

  function onComplete() {
    clearTick();
    running = false;
    focusSession = false;
    remainingSec = 0;
    updateUi();
    openCelebration();
  }

  function tick() {
    if (!running) return;
    remainingSec -= 1;
    if (remainingSec <= 0) {
      remainingSec = 0;
      onComplete();
      return;
    }
    updateUi();
  }

  function applyDuration(minutes, markCustomInactive) {
    const m = Math.min(180, Math.max(1, Math.floor(minutes)));
    clearTick();
    running = false;
    focusSession = false;
    totalSec = m * 60;
    remainingSec = totalSec;
    if (markCustomInactive) syncPresetActive();
    updateUi();
  }

  function start() {
    if (totalSec <= 0 || remainingSec <= 0) return;
    /** @type {HTMLElement | null} */ (document.activeElement)?.blur();
    running = true;
    focusSession = true;
    clearTick();
    tickId = window.setInterval(tick, 1000);
    updateUi();
  }

  function pause() {
    /** @type {HTMLElement | null} */ (document.activeElement)?.blur();
    running = false;
    clearTick();
    updateUi();
  }

  function reset() {
    running = false;
    clearTick();
    remainingSec = totalSec;
    focusSession = false;
    updateUi();
  }

  els.btnStart?.addEventListener("click", () => {
    if (remainingSec <= 0) return;
    if (running) return;
    start();
  });

  els.btnPause?.addEventListener("click", () => {
    if (!running) return;
    pause();
  });

  els.btnReset?.addEventListener("click", () => {
    reset();
  });

  els.btnDismiss?.addEventListener("click", () => {
    closeCelebration();
    reset();
  });

  els.presets.forEach((btn) => {
    btn.addEventListener("click", () => {
      const m = Number(btn.getAttribute("data-minutes"));
      if (!Number.isFinite(m)) return;
      applyDuration(m, true);
    });
  });

  els.btnCustom?.addEventListener("click", () => {
    const raw = els.customMin?.value;
    const n = raw === "" ? NaN : Number(raw);
    if (!Number.isFinite(n)) return;
    els.presets.forEach((b) => b.classList.remove("is-active"));
    applyDuration(n, false);
  });

  els.focusToggle?.addEventListener("click", () => {
    if (remainingSec <= 0) return;
    start();
  });

  els.focusResetMini?.addEventListener("click", () => {
    reset();
  });

  els.ring?.addEventListener("click", () => {
    if (!focusSession || remainingSec <= 0) return;
    if (running) pause();
    else start();
  });

  document.addEventListener("keydown", (e) => {
    if (e.code === "Escape" && els.overlay && !els.overlay.hidden) {
      e.preventDefault();
      closeCelebration();
      reset();
      return;
    }
    if (e.code !== "Space") return;
    const t = e.target;
    if (!els.overlay?.hidden) return;

    if (t instanceof HTMLElement && els.ring?.contains(t) && document.body.classList.contains("focus-session")) {
      e.preventDefault();
      if (remainingSec <= 0) return;
      if (running) pause();
      else start();
      return;
    }

    if (t instanceof HTMLInputElement || t instanceof HTMLTextAreaElement || t instanceof HTMLButtonElement) return;
    e.preventDefault();
    if (remainingSec <= 0) return;
    if (running) pause();
    else start();
  });

  els.ringProgress?.style.setProperty("stroke-dasharray", String(CIRC));
  updateUi();
})();
