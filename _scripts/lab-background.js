/* Taheri Lab: decorative, pointer-responsive cell/network illustration.
   No library or server is required. Greene loads this file automatically.
   All forms are illustrative, not representations of experimental results. */
(() => {
  "use strict";

  function initialize() {
    if (document.getElementById("lab-ambient-canvas")) return;

    const canvas = document.createElement("canvas");
    canvas.id = "lab-ambient-canvas";
    canvas.setAttribute("aria-hidden", "true");
    const context = canvas.getContext("2d");
    if (!context) return;
    document.body.prepend(canvas);

    const preference = window.matchMedia("(prefers-reduced-motion: reduce)");
    const finePointer = window.matchMedia("(pointer: fine)");
    const storageKey = "taheri-lab-background-motion";
    let explicitPreference = null;
    try { explicitPreference = window.localStorage.getItem(storageKey); } catch (_) { /* storage is optional */ }
    let motion = explicitPreference === null ? !preference.matches : explicitPreference === "on";

    const control = document.createElement("button");
    control.type = "button";
    control.className = "lab-motion-toggle";
    control.setAttribute("role", "switch");
    control.setAttribute("aria-label", "Background motion");
    document.body.append(control);

    let width = 0;
    let height = 0;
    let cells = [];
    let ink = "127, 91, 105";
    let animation = 0;
    let resizeFrame = 0;
    let elapsed = 0;
    let previousTime = null;
    let paintedAt = -Infinity;
    const pointer = { x: 0, y: 0, active: false };
    const offset = { x: 0, y: 0 };

    // Fixed seeds keep the composition calm and stable between page loads.
    const seeds = [
      [0.04, 0.16, 112, 0.4], [0.94, 0.31, 100, 1.8],
      [0.1, 0.83, 130, 3.2], [0.91, 0.88, 116, 4.5],
      [0.39, 0.11, 70, 2.3], [0.67, 0.58, 90, 5.8],
      [0.43, 0.75, 75, 3.9], [0.77, 0.08, 96, 0.9]
    ];

    const rgba = (alpha) => `rgba(${ink}, ${alpha})`;

    function readPalette() {
      ink = window.getComputedStyle(document.body).getPropertyValue("--lab-ink").trim() || "127, 91, 105";
    }

    function resize() {
      width = window.innerWidth;
      height = window.innerHeight;
      const scale = Math.min(window.devicePixelRatio || 1, 1.5);
      canvas.width = Math.round(width * scale);
      canvas.height = Math.round(height * scale);
      context.setTransform(scale, 0, 0, scale, 0, 0);
      const compact = width < 700;
      cells = seeds.slice(0, compact ? 4 : 8).map(([x, y, radius, phase]) => ({
        x: width * x,
        y: height * y,
        radius: radius * (compact ? 0.64 : 1),
        phase
      }));
      readPalette();
      draw();
    }

    function membrane(x, y, radius, phase, time) {
      const points = [];
      const count = 30;
      for (let i = 0; i < count; i += 1) {
        const angle = (i / count) * Math.PI * 2;
        const ripple = 1 + 0.065 * Math.sin(angle * 4 + phase + time * 0.14)
          + 0.025 * Math.cos(angle * 7 - phase + time * 0.1);
        points.push({
          x: x + Math.cos(angle) * radius * ripple,
          y: y + Math.sin(angle) * radius * ripple * 0.86
        });
      }
      const first = points[0];
      const last = points[points.length - 1];
      context.beginPath();
      context.moveTo((last.x + first.x) / 2, (last.y + first.y) / 2);
      points.forEach((point, i) => {
        const next = points[(i + 1) % points.length];
        context.quadraticCurveTo(point.x, point.y, (point.x + next.x) / 2, (point.y + next.y) / 2);
      });
      context.closePath();
    }

    function draw() {
      if (!width || !height) return;
      context.clearRect(0, 0, width, height);
      const time = elapsed / 1000;
      const targetX = pointer.active && motion ? ((pointer.x / width) - 0.5) * 28 : 0;
      const targetY = pointer.active && motion ? ((pointer.y / height) - 0.5) * 22 : 0;
      offset.x += (targetX - offset.x) * 0.045;
      offset.y += (targetY - offset.y) * 0.045;

      const positions = cells.map((cell, i) => ({
        ...cell,
        x: cell.x + Math.sin(time * 0.095 + cell.phase) * 16 + offset.x * (0.5 + i * 0.06),
        y: cell.y + Math.cos(time * 0.075 + cell.phase) * 14 + offset.y * (0.5 + i * 0.06)
      }));

      // Sparse curved links, not a dense geometric mesh.
      positions.forEach((a, i) => {
        const b = positions[i + 1];
        if (!b || Math.hypot(a.x - b.x, a.y - b.y) > 440) return;
        context.beginPath();
        context.moveTo(a.x, a.y);
        context.quadraticCurveTo((a.x + b.x) / 2 + 38, (a.y + b.y) / 2 - 34, b.x, b.y);
        context.strokeStyle = rgba(0.11);
        context.lineWidth = 1;
        context.stroke();
      });

      positions.forEach((cell) => {
        const { x, y, radius, phase } = cell;
        const glow = context.createRadialGradient(x - radius * 0.2, y - radius * 0.15, 0, x, y, radius);
        glow.addColorStop(0, rgba(0.035));
        glow.addColorStop(0.72, rgba(0.045));
        glow.addColorStop(1, rgba(0.012));
        membrane(x, y, radius, phase, time);
        context.fillStyle = glow;
        context.fill();
        context.strokeStyle = rgba(0.16);
        context.lineWidth = 1.2;
        context.stroke();
        membrane(x + radius * 0.06, y - radius * 0.04, radius * 0.31, phase + 1.7, time);
        context.fillStyle = rgba(0.055);
        context.fill();
        context.strokeStyle = rgba(0.12);
        context.lineWidth = 0.8;
        context.stroke();
        context.beginPath();
        context.arc(x + radius * 0.38, y + radius * 0.18, 2.1, 0, Math.PI * 2);
        context.fillStyle = rgba(0.29);
        context.fill();
      });
    }

    function frame(timestamp) {
      animation = 0;
      if (!motion || document.hidden) return;
      if (previousTime !== null) elapsed += Math.min(timestamp - previousTime, 80);
      previousTime = timestamp;
      if (timestamp - paintedAt >= 1000 / 30) {
        draw();
        paintedAt = timestamp;
      }
      animation = window.requestAnimationFrame(frame);
    }

    function synchronize() {
      if (animation) window.cancelAnimationFrame(animation);
      animation = 0;
      previousTime = null;
      paintedAt = -Infinity;
      control.setAttribute("aria-checked", String(motion));
      control.textContent = `Background motion: ${motion ? "On" : "Off"}`;
      if (motion && !document.hidden) animation = window.requestAnimationFrame(frame);
      else {
        pointer.active = false;
        offset.x = 0;
        offset.y = 0;
        draw();
      }
    }

    control.addEventListener("click", () => {
      motion = !motion;
      explicitPreference = motion ? "on" : "off";
      try { window.localStorage.setItem(storageKey, explicitPreference); } catch (_) { /* storage is optional */ }
      synchronize();
    });

    window.addEventListener("pointermove", (event) => {
      if (!motion || !finePointer.matches || event.pointerType === "touch") return;
      pointer.x = event.clientX;
      pointer.y = event.clientY;
      pointer.active = true;
    }, { passive: true });

    window.addEventListener("pointerout", (event) => {
      if (!event.relatedTarget) pointer.active = false;
    }, { passive: true });

    window.addEventListener("blur", () => { pointer.active = false; });
    window.addEventListener("resize", () => {
      if (resizeFrame) window.cancelAnimationFrame(resizeFrame);
      resizeFrame = window.requestAnimationFrame(() => { resizeFrame = 0; resize(); });
    }, { passive: true });
    document.addEventListener("visibilitychange", synchronize);

    const preferenceChanged = () => {
      if (explicitPreference === null) {
        motion = !preference.matches;
        synchronize();
      }
    };
    if (preference.addEventListener) preference.addEventListener("change", preferenceChanged);
    else if (preference.addListener) preference.addListener(preferenceChanged);

    if (window.MutationObserver) {
      new window.MutationObserver(() => { readPalette(); draw(); }).observe(document.documentElement, {
        attributes: true, attributeFilter: ["data-dark"]
      });
    }

    resize();
    synchronize();
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", initialize, { once: true });
  else initialize();
})();
