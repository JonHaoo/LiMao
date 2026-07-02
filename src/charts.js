/**
 * Lightweight Canvas 2D chart renderer
 * Each chart type has its own draw() — no prototype sharing.
 */
export function initCharts() {
  const charts = [];

  document.querySelectorAll('.chart-wrap[data-chart]').forEach((wrap) => {
    const id = wrap.dataset.chart;
    const box = wrap.querySelector('.chart-box');
    if (!box) return;

    let canvasEl = box.querySelector('canvas');
    if (!canvasEl) {
      canvasEl = document.createElement('canvas');
      canvasEl.style.display = 'block';
      canvasEl.style.width = '100%';
      canvasEl.style.height = '100%';
      box.appendChild(canvasEl);
    }

    let inited = false;
    const obs = new IntersectionObserver(([e]) => {
      if (!e.isIntersecting || inited) return;
      inited = true;
      const chart = createChart(canvasEl, id);
      if (chart) charts.push(chart);
      obs.disconnect();
    }, { rootMargin: '50px' });
    obs.observe(box);
  });

  let timer;
  window.addEventListener('resize', () => {
    clearTimeout(timer);
    timer = setTimeout(() => charts.forEach(c => c.resize?.()), 250);
  });
}

function createChart(canvas, id) {
  const ctx = canvas.getContext('2d');
  if (!ctx) return null;

  let W, H, dpr, animFrame = null, animProgress = 1;

  function resize() {
    dpr = Math.min(window.devicePixelRatio, 2);
    const rect = canvas.getBoundingClientRect();
    W = rect.width;
    H = rect.height;
    if (W < 10 || H < 10) return;
    canvas.width = W * dpr;
    canvas.height = H * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  function animate(dur) {
    if (animFrame) cancelAnimationFrame(animFrame);
    animProgress = 0;
    const start = performance.now();
    function tick(now) {
      const t = Math.min(1, (now - start) / dur);
      animProgress = t < 0.5 ? 4*t*t*t : 1 - Math.pow(-2*t+2, 3)/2;
      draw();
      if (t < 1) animFrame = requestAnimationFrame(tick);
      else { animProgress = 1; draw(); animFrame = null; }
    }
    animFrame = requestAnimationFrame(tick);
  }

  function draw() { render(); }

  // ── Renderers ──
  function renderRadar() {
    const labels = ['内容生产','平台覆盖','账号管理','内容质量','分发精准'];
    const values = [94, 85, 78, 88, 82];
    const cx = W/2, cy = H*0.52, r = Math.min(W, H) * 0.38, n = labels.length, p = animProgress;

    for (let ring = 1; ring <= 5; ring++) {
      ctx.beginPath();
      for (let i = 0; i <= n; i++) {
        const a = Math.PI*2*i/n - Math.PI/2;
        const x = cx + Math.cos(a)*r*ring/5, y = cy + Math.sin(a)*r*ring/5;
        i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
      }
      ctx.closePath(); ctx.strokeStyle = 'rgba(0,0,0,0.06)'; ctx.lineWidth = 1; ctx.stroke();
    }

    for (let i = 0; i < n; i++) {
      const a = Math.PI*2*i/n - Math.PI/2;
      ctx.beginPath(); ctx.moveTo(cx, cy); ctx.lineTo(cx+Math.cos(a)*r, cy+Math.sin(a)*r);
      ctx.strokeStyle = 'rgba(0,0,0,0.08)'; ctx.stroke();
    }

    ctx.beginPath();
    for (let i = 0; i <= n; i++) {
      const idx = i % n, a = Math.PI*2*idx/n - Math.PI/2, v = values[idx]/100*r*p;
      const x = cx+Math.cos(a)*v, y = cy+Math.sin(a)*v;
      i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
    }
    ctx.closePath();
    ctx.fillStyle = 'rgba(245,166,35,0.12)'; ctx.fill();
    ctx.strokeStyle = '#F5A623'; ctx.lineWidth = 2; ctx.stroke();

    for (let i = 0; i < n; i++) {
      const a = Math.PI*2*i/n - Math.PI/2, v = values[i]/100*r*p;
      ctx.beginPath(); ctx.arc(cx+Math.cos(a)*v, cy+Math.sin(a)*v, 4, 0, Math.PI*2);
      ctx.fillStyle = '#F5A623'; ctx.fill();
    }

    ctx.font = '9px Inter,Noto Sans SC,sans-serif';
    ctx.fillStyle = '#8a8a9a'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    for (let i = 0; i < n; i++) {
      const a = Math.PI*2*i/n - Math.PI/2;
      const dist = Math.cos(a) > 0.5 ? r + 22 : r + 14;
      ctx.fillText(labels[i], cx+Math.cos(a)*dist, cy+Math.sin(a)*dist);
    }
  }

  function renderStackedBar() {
    const data = [
      { label: '短视频引流', v: 35, color: '#F5A623' },
      { label: '私信互动',    v: 25, color: '#4A90D9' },
      { label: '评论区',      v: 18, color: '#AF52DE' },
      { label: 'AI客服',     v: 12, color: '#4CD964' },
      { label: '自然搜索',   v: 10, color: '#FF6B6B' },
    ];
    const total = data.reduce((s, d) => s + d.v, 0);
    const p = animProgress;
    const pad = { t: 4, b: 20, l: 8, r: 8 };
    const barH = 10;
    const gap = 6;
    const cw = W - pad.l - pad.r;
    const ly = pad.t;

    data.forEach((d, i) => {
      const y = ly + i * (barH + gap);
      const w = (d.v / total) * cw * p;

      // Bar
      ctx.fillStyle = d.color;
      ctx.beginPath();
      ctx.roundRect(pad.l, y, Math.max(w, 2), barH, [2, 2, 2, 2]);
      ctx.fill();

      // Label + value
      ctx.font = '9px Inter,Noto Sans SC,sans-serif';
      ctx.textBaseline = 'middle';
      ctx.fillStyle = '#5c5c6e';
      ctx.textAlign = 'left';
      ctx.fillText(d.label, pad.l + 2, y + barH / 2);

      ctx.fillStyle = '#8a8a9a';
      ctx.textAlign = 'right';
      ctx.fillText(Math.round(d.v / total * 100) + '%', pad.l + cw - 2, y + barH / 2);
    });
  }

  function renderLine(data, labels, max, lineColor, areaColor) {
    const p = animProgress;
    const pad = { t: 4, b: 22, l: 8, r: 8 };
    const cw = W - pad.l - pad.r;
    const ch = H - pad.t - pad.b;
    const step = cw / (data.length - 1);

    const pts = data.map((v, i) => ({
      x: pad.l + i * step,
      y: pad.t + ch - (v / max) * ch * p,
    }));

    // Area
    ctx.beginPath();
    ctx.moveTo(pts[0].x, pad.t + ch);
    for (let i = 0; i < pts.length; i++) {
      if (i === 0) { ctx.lineTo(pts[i].x, pts[i].y); }
      else {
        const prev = pts[i - 1];
        const cp1x = prev.x + (pts[i].x - prev.x) * 0.4;
        const cp2x = pts[i].x - (pts[i].x - prev.x) * 0.4;
        ctx.bezierCurveTo(cp1x, prev.y, cp2x, pts[i].y, pts[i].x, pts[i].y);
      }
    }
    ctx.lineTo(pts[pts.length - 1].x, pad.t + ch);
    ctx.closePath();
    ctx.fillStyle = areaColor;
    ctx.fill();

    // Line
    ctx.beginPath();
    for (let i = 0; i < pts.length; i++) {
      i === 0 ? ctx.moveTo(pts[i].x, pts[i].y) : ctx.lineTo(pts[i].x, pts[i].y);
    }
    ctx.strokeStyle = lineColor;
    ctx.lineWidth = 2.5;
    ctx.lineJoin = 'round';
    ctx.stroke();

    // Points
    pts.forEach((pt, i) => {
      const r = i === pts.length - 1 ? 5 : 3.5;
      ctx.beginPath();
      ctx.arc(pt.x, pt.y, r, 0, Math.PI * 2);
      ctx.fillStyle = i === pts.length - 1 ? '#4CD964' : lineColor;
      ctx.fill();
      if (i === pts.length - 1) {
        ctx.strokeStyle = '#fff';
        ctx.lineWidth = 1.5;
        ctx.stroke();
      }
    });

    // X labels
    ctx.font = '9px Inter,Noto Sans SC,sans-serif';
    ctx.fillStyle = '#8a8a9a';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    labels.forEach((l, i) => ctx.fillText(l, pts[i].x, pad.t + ch + 4));
  }

  function renderProgressBar(value, detailColor, gradColors) {
    const p = animProgress;
    const pad = { t: 4, b: 24, l: 20, r: 20 };
    const cw = W - pad.l - pad.r;
    const barH = 10;
    const cy = H * 0.45;
    const prog = (value / 100) * cw * p;

    // Track
    ctx.fillStyle = 'rgba(0,0,0,0.04)';
    ctx.beginPath();
    ctx.roundRect(pad.l, cy - barH / 2, cw, barH, [barH / 2, barH / 2, barH / 2, barH / 2]);
    ctx.fill();

    // Progress
    if (prog > 0) {
      const grad = ctx.createLinearGradient(pad.l, cy, pad.l + cw, cy);
      gradColors.forEach((c, i) => grad.addColorStop(i / (gradColors.length - 1), c));
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.roundRect(pad.l, cy - barH / 2, Math.max(prog, barH / 2), barH, [barH / 2, barH / 2, barH / 2, barH / 2]);
      ctx.fill();
    }

    // Value
    ctx.font = '700 20px Inter,Noto Sans SC,sans-serif';
    ctx.fillStyle = detailColor;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    const suffix = value > 50 ? '%' : '分';
    ctx.fillText(Math.round(value * p) + suffix, W / 2, H * 0.72);
  }


  function renderDimRadar() {
    const p = animProgress;
    const data = [
      { label: 'AI工具实操', v: 92, color: '#AF52DE' },
      { label: '内容策划',    v: 85, color: '#F5A623' },
      { label: '数据分析',    v: 78, color: '#4A90D9' },
      { label: '投放优化',    v: 70, color: '#4CD964' },
      { label: '团队管理',    v: 65, color: '#FF6B6B' },
    ];
    const cx = W / 2, cy = H * 0.46;
    const r = Math.min(W, H) * 0.38;
    const n = data.length;

    // Grid rings
    for (let ring = 1; ring <= 5; ring++) {
      ctx.beginPath();
      for (let i = 0; i <= n; i++) {
        const a = Math.PI * 2 * i / n - Math.PI / 2;
        const x = cx + Math.cos(a) * r * ring / 5;
        const y = cy + Math.sin(a) * r * ring / 5;
        i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
      }
      ctx.closePath();
      ctx.strokeStyle = 'rgba(0,0,0,0.05)';
      ctx.lineWidth = 1;
      ctx.stroke();
    }

    // Axes
    for (let i = 0; i < n; i++) {
      const a = Math.PI * 2 * i / n - Math.PI / 2;
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.lineTo(cx + Math.cos(a) * r, cy + Math.sin(a) * r);
      ctx.strokeStyle = 'rgba(0,0,0,0.06)';
      ctx.stroke();
    }

    // Data polygon with per-vertex gradient segments
    for (let i = 0; i < n; i++) {
      const idx = i;
      const next = (i + 1) % n;
      const a1 = Math.PI * 2 * idx / n - Math.PI / 2;
      const a2 = Math.PI * 2 * next / n - Math.PI / 2;
      const v1 = data[idx].v / 100 * r * p;
      const v2 = data[next].v / 100 * r * p;
      const x1 = cx + Math.cos(a1) * v1, y1 = cy + Math.sin(a1) * v1;
      const x2 = cx + Math.cos(a2) * v2, y2 = cy + Math.sin(a2) * v2;

      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.lineTo(x1, y1);
      ctx.lineTo(x2, y2);
      ctx.closePath();
      ctx.fillStyle = data[idx].color + '15';
      ctx.fill();
    }

    // Polygon outline
    ctx.beginPath();
    for (let i = 0; i <= n; i++) {
      const idx = i % n;
      const a = Math.PI * 2 * idx / n - Math.PI / 2;
      const v = data[idx].v / 100 * r * p;
      const x = cx + Math.cos(a) * v, y = cy + Math.sin(a) * v;
      i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
    }
    ctx.closePath();
    ctx.strokeStyle = '#AF52DE';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    // Vertex dots + labels
    data.forEach((d, i) => {
      const a = Math.PI * 2 * i / n - Math.PI / 2;
      const v = d.v / 100 * r * p;
      const x = cx + Math.cos(a) * v, y = cy + Math.sin(a) * v;

      ctx.beginPath();
      ctx.arc(x, y, 3, 0, Math.PI * 2);
      ctx.fillStyle = d.color;
      ctx.fill();

      // Label outside
      const lx = cx + Math.cos(a) * (r + 16);
      const ly = cy + Math.sin(a) * (r + 16);
      ctx.font = '9px Inter,Noto Sans SC,sans-serif';
      ctx.fillStyle = '#6B6B6B';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(d.label, lx, ly);

    });


  }

  function renderCapsBars() {
    const p = animProgress;
    const data = [
      { label: '数据安全', v: 98, color: '#4CD964' },
      { label: '部署速度', v: 95, color: '#F5A623' },
      { label: '系统稳定性', v: 92, color: '#4A90D9' },
      { label: '售后响应',  v: 88, color: '#AF52DE' },
    ];
    const pad = { t: 4, b: 18, l: 50, r: 6 };
    const cw = W - pad.l - pad.r;
    const ch = H - pad.t - pad.b;
    const barH = Math.min(16, (ch - (data.length - 1) * 5) / data.length);

    // Grid lines
    for (let g = 0; g <= 5; g++) {
      const gx = pad.l + (cw / 5) * g;
      ctx.beginPath();
      ctx.moveTo(gx, pad.t);
      ctx.lineTo(gx, pad.t + ch);
      ctx.strokeStyle = 'rgba(0,0,0,0.04)';
      ctx.lineWidth = 1;
      ctx.stroke();
    }

    data.forEach((d, i) => {
      const y = pad.t + i * (barH + 5);
      const bw = (d.v / 100) * cw * p;

      // Label
      ctx.font = '9px Inter,Noto Sans SC,sans-serif';
      ctx.fillStyle = '#6B6B6B';
      ctx.textAlign = 'right';
      ctx.textBaseline = 'middle';
      ctx.fillText(d.label, pad.l - 4, y + barH / 2);

      // Bar track
      ctx.fillStyle = 'rgba(0,0,0,0.03)';
      ctx.beginPath();
      ctx.roundRect(pad.l, y, cw, barH, 2);
      ctx.fill();

      // Bar
      const grad = ctx.createLinearGradient(pad.l, y, pad.l + cw, y);
      grad.addColorStop(0, d.color);
      grad.addColorStop(1, d.color + 'cc');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.roundRect(pad.l, y, Math.max(bw, 2), barH, 2);
      ctx.fill();


    });
  }

  function renderBars(data, max) {
    const p = animProgress;
    const pad = { t: 4, b: 22, l: 8, r: 8 };
    const cw = W - pad.l - pad.r;
    const ch = H - pad.t - pad.b;
    const barW = Math.min(14, (cw / data.length) * 0.5);
    const gap = cw / data.length;

    data.forEach((d, i) => {
      const x = pad.l + gap * (i + 0.5) - barW / 2;
      const bh = (d.v / max) * ch * p;
      const y = pad.t + ch - bh;

      const g = ctx.createLinearGradient(x, y, x, pad.t + ch);
      g.addColorStop(0, d.c[0]);
      g.addColorStop(1, d.c[1]);
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.roundRect(x, y, barW, bh, [4, 4, 0, 0]);
      ctx.fill();

      ctx.font = '9px Inter,Noto Sans SC,sans-serif';
      ctx.fillStyle = '#8a8a9a';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'top';
      ctx.fillText(d.label, x + barW / 2, pad.t + ch + 4);
    });
  }

  function renderGroupedBars(bars, name1, name2) {
    const p = animProgress;
    const pad = { t: 4, b: 18, l: 8, r: 8 };
    const cw = W - pad.l - pad.r;
    const ch = H - pad.t - pad.b;
    const max = Math.max(...bars.map(b => b.v));
    const barW = Math.min(20, cw * 0.3);
    const totalW = bars.length * barW + (bars.length - 1) * 4;
    const startX = pad.l + (cw - totalW) / 2;

    bars.forEach((bar, i) => {
      const x = startX + i * (barW + 4);
      const bh = (bar.v / max) * ch * p;
      const y = pad.t + ch - bh;

      const g = ctx.createLinearGradient(x, y, x, pad.t + ch);
      g.addColorStop(0, bar.c);
      g.addColorStop(1, bar.c + (bar.c.startsWith('rgba') ? '' : '60'));
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.roundRect(x, y, barW, bh, [4, 4, 0, 0]);
      ctx.fill();

      if (i === 1) {
        ctx.shadowColor = bar.c + '40';
        ctx.shadowBlur = 6;
        ctx.fill();
        ctx.shadowBlur = 0;
      }
    });

    // Legend
    ctx.font = '9px Inter,Noto Sans SC,sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    const legY = H - 14;
    const items = [[name1, bars[0].c], [name2, bars[1].c]];
    const legW = cw / items.length;
    items.forEach(([name, color], i) => {
      const lx = pad.l + legW * (i + 0.5);
      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.roundRect(lx - 10, legY + 2, 7, 7, 1);
      ctx.fill();
      ctx.fillStyle = '#8a8a9a';
      ctx.fillText(name, lx + 4, legY);
    });
  }


  // ── Chart routing ──
  const renderers = {
    'serv-kehu':     () => renderRadar(),
    'serv-yinliu':   () => renderStackedBar(),
    'serv-xiaoshou': () => renderLine([12,24,33,40], ['第1周','第2周','第3周','第4周'], 50, '#4A90D9', 'rgba(74,144,217,0.2)'),
    'serv-jiaopei':  () => renderDimRadar(),
    'serv-dongman':  () => renderBars([
      {v:470, label:'AI漫剧', c:['#F5A623','#C9953D']},
      {v:120, label:'真人短剧', c:['#4A90D9','#007AFF']},
      {v:80,  label:'动画短片', c:['#AF52DE','#5856D6']},
      {v:50,  label:'品牌定制', c:['#FF6B6B','#FF3B30']},
    ], 500),
    'serv-bushu':    () => renderCapsBars(),
    'case-zhizao':   () => renderGroupedBars([{v:50,c:'rgba(0,0,0,0.08)'},{v:150,c:'#F5A623'}], 'B', 'A'),
    'case-meiye':    () => renderLine([12,15,20,28,34,38], ['1月','2月','3月','4月','5月','6月'], 50, '#4CD964', 'rgba(76,217,100,0.18)'),
    'case-dianshang':() => renderGroupedBars([{v:15,c:'rgba(0,0,0,0.08)'},{v:68,c:'#4CD964'}], 'B', 'A'),
  };

  const render = renderers[id];
  if (!render) return null;

  resize();
  animate(1200);

  return {
    resize: () => { resize(); draw(); },
  };
}
