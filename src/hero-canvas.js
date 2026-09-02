/**
 * Lightweight, deterministic canvas backdrop for the homepage hero.
 * The animation stays deliberately quiet so the content remains primary.
 */
export function initHeroBackground(canvas) {
  const ctx = canvas.getContext('2d');
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const points = [];
  let width = 0;
  let height = 0;
  let frameId = null;
  let isVisible = true;
  let isDisposed = false;
  let pointerX = 0;
  let pointerY = 0;
  let driftX = 0;
  let driftY = 0;

  function buildPoints() {
    points.length = 0;
    for (let i = 0; i < 28; i += 1) {
      const column = i % 7;
      const row = Math.floor(i / 7);
      points.push({
        x: width * (0.43 + column * 0.085) + Math.sin(i * 2.7) * 28,
        y: height * (0.18 + row * 0.2) + Math.cos(i * 1.9) * 24,
        radius: 1 + (i % 3) * 0.45,
        phase: i * 0.61,
      });
    }
  }

  function resize() {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    width = canvas.clientWidth;
    height = canvas.clientHeight;
    canvas.width = Math.round(width * dpr);
    canvas.height = Math.round(height * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    buildPoints();
    if (reduceMotion) draw(0);
  }

  function draw(time) {
    ctx.clearRect(0, 0, width, height);
    driftX += (pointerX - driftX) * 0.025;
    driftY += (pointerY - driftY) * 0.025;

    const seconds = time * 0.001;
    const rendered = points.map((point) => ({
      x: point.x + driftX * 10 + Math.sin(seconds * 0.24 + point.phase) * 5,
      y: point.y + driftY * 7 + Math.cos(seconds * 0.2 + point.phase) * 4,
      radius: point.radius,
    }));

    for (let i = 0; i < rendered.length; i += 1) {
      for (let j = i + 1; j < rendered.length; j += 1) {
        const a = rendered[i];
        const b = rendered[j];
        const distance = Math.hypot(a.x - b.x, a.y - b.y);
        if (distance > 118) continue;
        ctx.beginPath();
        ctx.moveTo(a.x, a.y);
        ctx.lineTo(b.x, b.y);
        ctx.strokeStyle = `rgba(10,22,40,${(1 - distance / 118) * 0.055})`;
        ctx.lineWidth = 1;
        ctx.stroke();
      }
    }

    rendered.forEach((point, index) => {
      const orange = index % 6 === 0;
      ctx.beginPath();
      ctx.arc(point.x, point.y, point.radius, 0, Math.PI * 2);
      ctx.fillStyle = orange ? 'rgba(246,114,25,0.32)' : 'rgba(10,22,40,0.14)';
      ctx.fill();
    });
  }

  function loop(time) {
    if (isDisposed) return;
    if (isVisible) draw(time);
    frameId = requestAnimationFrame(loop);
  }

  function onPointerMove(event) {
    pointerX = event.clientX / window.innerWidth - 0.5;
    pointerY = event.clientY / window.innerHeight - 0.5;
  }

  const observer = new IntersectionObserver(([entry]) => {
    isVisible = entry.isIntersecting;
  });

  observer.observe(canvas);
  window.addEventListener('resize', resize);
  window.addEventListener('pointermove', onPointerMove, { passive: true });
  resize();
  if (!reduceMotion) frameId = requestAnimationFrame(loop);

  return () => {
    isDisposed = true;
    if (frameId) cancelAnimationFrame(frameId);
    observer.disconnect();
    window.removeEventListener('resize', resize);
    window.removeEventListener('pointermove', onPointerMove);
  };
}
