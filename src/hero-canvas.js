/**
 * Lightweight Canvas 2D hero background — replaces Three.js.
 * ~2KB gzipped vs ~600KB for three.js.
 * No rAF loop: uses requestAnimationFrame only when hero is in viewport.
 */
export function initHeroBackground(canvas) {
  const ctx = canvas.getContext('2d');
  let W, H, mouseX = 0, mouseY = 0, targetX = 0, targetY = 0, time = 0;
  let frameId = null, lastTime = 0;
  const fps = 24, interval = 1000 / fps;
  let isVisible = true, cleanup = false;

  function resize() {
    const dpr = Math.min(window.devicePixelRatio, 2);
    W = canvas.clientWidth * dpr;
    H = canvas.clientHeight * dpr;
    canvas.width = W;
    canvas.height = H;
    ctx.scale(dpr, dpr);
    W /= dpr;
    H /= dpr;
  }

  // 12 floating shapes
  const shapes = [];
  const colors = ['#C9953D', '#DCAA5C', '#E8C06A'];
  for (let i = 0; i < 12; i++) {
    const s = 8 + Math.random() * 18;
    shapes.push({
      x: (Math.random() - 0.5) * W * 0.8,
      y: (Math.random() - 0.5) * H * 0.8,
      size: s, type: ['torus','octa','ico'][i % 3],
      color: colors[i % 3], opacity: 0.15 + Math.random() * 0.25,
      rot: Math.random() * Math.PI * 2,
      rotSpeed: (Math.random() - 0.5) * 0.02,
      floatSpeed: 0.3 + Math.random() * 0.8,
      floatOffset: Math.random() * Math.PI * 2,
    });
  }

  // 120 particles
  const particles = [];
  for (let i = 0; i < 120; i++) {
    particles.push({
      x: (Math.random() - 0.5) * W * 1.2,
      y: (Math.random() - 0.5) * H * 1.2,
      vx: (Math.random() - 0.5) * 0.3,
      vy: (Math.random() - 0.5) * 0.3,
      r: 0.5 + Math.random() * 1.5,
    });
  }

  function draw() {
    ctx.clearRect(0, 0, W, H);

    targetX += (mouseX - targetX) * 0.02;
    targetY += (mouseY - targetY) * 0.02;
    const t = time * 0.001;
    const ox = targetX * 0.1, oy = targetY * 0.1;

    // Particles
    const pAlpha = 0.12;
    particles.forEach((p) => {
      p.x += p.vx + ox * 0.02;
      p.y += p.vy + oy * 0.02;
      const hw = W * 0.6, hh = H * 0.6;
      if (p.x < -hw) p.x = hw; if (p.x > hw) p.x = -hw;
      if (p.y < -hh) p.y = hh; if (p.y > hh) p.y = -hh;
      ctx.beginPath();
      ctx.arc(W/2 + p.x, H/2 + p.y, p.r, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(201,149,61,${pAlpha})`;
      ctx.fill();
    });

    // Shapes
    shapes.forEach((s) => {
      const fy = Math.sin(t * s.floatSpeed + s.floatOffset) * 5;
      const cx = W/2 + s.x + ox, cy = H/2 + s.y + oy + fy;
      const rot = s.rot + t * s.rotSpeed;

      ctx.save();
      ctx.translate(cx, cy);
      ctx.rotate(rot);
      ctx.globalAlpha = s.opacity;
      const r = s.size / 2;

      if (s.type === 'torus') {
        ctx.strokeStyle = s.color; ctx.lineWidth = 2;
        ctx.beginPath(); ctx.ellipse(0, 0, r, r*0.35, 0, 0, Math.PI*2); ctx.stroke();
        ctx.beginPath(); ctx.ellipse(0, 0, r*0.4, r*0.15, 0, Math.PI*0.5, Math.PI*1.5); ctx.stroke();
      } else {
        ctx.fillStyle = s.color;
        ctx.beginPath();
        const n = s.type === 'octa' ? 4 : 6;
        const ao = s.type === 'octa' ? 0 : -Math.PI/6;
        for (let i = 0; i < n; i++) {
          const a = (Math.PI*2/n)*i + ao;
          i === 0 ? ctx.moveTo(Math.cos(a)*r, Math.sin(a)*r) : ctx.lineTo(Math.cos(a)*r, Math.sin(a)*r);
        }
        ctx.closePath(); ctx.fill();
      }
      ctx.restore();
    });
  }

  function loop(now) {
    if (cleanup) return;
    if (!isVisible) { frameId = requestAnimationFrame(loop); return; }
    time = now;
    if (now - lastTime >= interval) {
      lastTime = now - (now - lastTime) % interval;
      draw();
    }
    frameId = requestAnimationFrame(loop);
  }

  const obs = new IntersectionObserver(([e]) => {
    isVisible = e.isIntersecting;
    if (isVisible) lastTime = 0;
  }, { threshold: 0 });
  obs.observe(canvas);

  document.addEventListener('mousemove', (e) => {
    mouseX = (e.clientX / window.innerWidth - 0.5) * 2;
    mouseY = (e.clientY / window.innerHeight - 0.5) * 2;
  });

  window.addEventListener('resize', resize);
  resize();
  loop(0);

  return () => {
    cleanup = true;
    cancelAnimationFrame(frameId);
    obs.disconnect();
  };
}
