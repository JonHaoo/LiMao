/**
 * LiMao Web — Performance-optimized main entry.
 * Key optimizations:
 * - Three.js replaced with ~2KB Canvas 2D hero background
 * - ECharts replaced with ~3KB Canvas 2D chart renderer
 * - Progress bar uses transform: scaleX (no forced layout)
 * - Parallax uses will-change: transform (GPU compositing)
 * - Canvas pauses when out of viewport (IntersectionObserver)
 * - Nav scroll handler throttled
 * - Chunk-friendly module structure (tree-shakable)
 */
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import Lenis from 'lenis';
import { initHeroBackground } from './hero-canvas.js';
import { initCharts } from './charts.js';

gsap.registerPlugin(ScrollTrigger);

document.addEventListener('DOMContentLoaded', () => {

  // ─── 1. LENIS SMOOTH SCROLL ───
  const lenis = new Lenis({
    duration: 1.0,        // slightly shorter = less frames to composite
    easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
    orientation: 'vertical',
    smoothWheel: true,
    wheelMultiplier: 1,
    touchMultiplier: 1.5,
  });

  lenis.on('scroll', ScrollTrigger.update);
  gsap.ticker.add((time) => lenis.raf(time * 1000));
  gsap.ticker.lagSmoothing(0);

  // ─── 2. SCROLL PROGRESS BAR (NO LAYOUT THRASHING) ───
  // Using transform: scaleX — this is a GPU composited property,
  // it never triggers layout or paint. Only composite.
  const progressBar = document.getElementById('progressBar');
  if (progressBar) {
    let lastProgress = -1;
    lenis.on('scroll', ({ progress }) => {
      // Avoid redundant updates
      const p = Math.round(progress * 1000) / 1000;
      if (Math.abs(p - lastProgress) < 0.005) return;
      lastProgress = p;
      progressBar.style.transform = `scaleX(${p})`;
    });
  }

  // ─── 3. NAV SCROLL EFFECTS (THROTTLED) ───
  const nav = document.getElementById('nav');
  if (nav) {
    let lastScrollY = -1;
    lenis.on('scroll', ({ scroll }) => {
      if (Math.abs(scroll - lastScrollY) < 10) return;
      lastScrollY = scroll;
      nav.classList.toggle('is-scrolled', scroll > 60);
    });
  }

  // ─── 4. MOBILE NAV TOGGLE ───
  const navToggle = document.getElementById('navToggle');
  const navLinks = document.getElementById('navLinks');
  if (navToggle && navLinks) {
    navToggle.addEventListener('click', () => navLinks.classList.toggle('is-open'));
    navLinks.querySelectorAll('a').forEach((link) => {
      link.addEventListener('click', () => navLinks.classList.remove('is-open'));
    });
  }

  // ─── 5. LIGHTWEIGHT CANVAS 2D HERO BACKGROUND ───
  // Replaces ~600KB three.js with ~2KB Canvas 2D.
  // Automatically pauses when hero is out of viewport.
  const canvas = document.getElementById('threeCanvas');
  const cleanupHero = canvas ? initHeroBackground(canvas) : null;

  // ─── 6. HERO TEXT REVEAL (GSAP, runs once) ───
  gsap.fromTo(
    '[data-reveal-hero]',
    { y: 40, opacity: 0 },
    { y: 0, opacity: 1, duration: 1, stagger: 0.15, ease: 'power3.out', delay: 0.2 }
  );

  const heroLines = document.querySelectorAll('.hero-line');
  heroLines.forEach((line, i) => {
    const chars = line.querySelectorAll('span');
    if (chars.length) {
      gsap.fromTo(chars,
        { y: '100%', opacity: 0 },
        { y: '0%', opacity: 1, duration: 0.8, stagger: 0.03, ease: 'power3.out', delay: 0.4 + i * 0.15 }
      );
    }
  });

 // Hero card static — no floating animation

// ─── 6b. LIVE TERMINAL NUMBERS ───
  (function initTerminalLive() {
    const body = document.querySelector('.hero-card-body');
    if (!body) return;

    // Log line templates for the LM.CLAW terminal
    const lineDefs = [
      `<span class="hl">$</span> AI内容矩阵 · 今日已生成 <span class="acc" data-min="12" data-max="48">42</span> 条`,
      `<span class="hl">$</span> 短视频分发 · 覆盖 <span class="acc" data-min="5" data-max="18">11</span> 个账号`,
      `<span class="cm">[INFO]</span> 私域流量池 · 当前总人数 <span class="acc" data-min="38200" data-max="42800" data-fmt="fmt">40,128</span>`,
      `<span class="cm">[DATA]</span> 线索采集 · 新增 <span class="acc" data-min="200" data-max="1800" data-fmt="fmt">1,284</span> 条`,
      `<span class="cm">[FLOW]</span> 私域加粉 · 通过率 <span class="acc" data-min="85" data-max="96" data-fmt="pct" data-mode="range">92%</span>`,
      `<span class="cm">[FLOW]</span> 公域→私域 · 今日沉淀 <span class="acc" data-min="120" data-max="650" data-fmt="fmt">450</span> 人`,
      `<span class="cm">[SALES]</span> 智能跟单 · 今日成交 <span class="acc" data-min="3" data-max="18">8</span> 单`,
      `<span class="cm">[SALES]</span> 高意向客户 · 识别 <span class="acc" data-min="15" data-max="60">32</span> 人`,
      `<span class="cm">[CONTENT]</span> 爆款视频 · 播放量 <span class="acc" data-min="5000" data-max="85000" data-fmt="fmt">45,230</span>`,
      `<span class="hl">$</span> 数据同步 · 完成 <span class="acc" data-min="6" data-max="12">9</span> 个平台`,
      `<span class="hl">$</span> 数字人直播 · 时长 <span class="acc" data-min="3" data-max="12" data-fmt="suffix">7h</span>`,
      `<span class="hl">$</span> 矩阵巡检 · 账号健康率 <span class="acc" data-min="92" data-max="100" data-fmt="pct" data-mode="range">96%</span>`,
      `<span class="cm">[SYSTEM]</span> 内存占用 · <span class="acc" data-min="32" data-max="68" data-fmt="pct" data-mode="range">45%</span> · 运行正常`,
      `<span class="cm">[INFO]</span> 智能客服 · 今日咨询量 <span class="acc" data-min="340" data-max="890">560</span>`,
      `<span class="cm">[FLOW]</span> 会话窗口 · 活跃 <span class="acc" data-min="20" data-max="85" data-mode="range">52</span> 个`,
      `<span class="hl">$</span> GEO智能体 · 曝光提升 <span class="acc" data-min="12" data-max="40" data-fmt="pct">28%</span>`,
      `<span class="hl">$</span> AI话术优化 · 本日更新 <span class="acc" data-min="2" data-max="8">5</span> 套`,
      `<span class="cm">[INFO]</span> 飞书指令 · 已处理 <span class="acc" data-min="15" data-max="55">30</span> 条`,
      `<span class="cm">[SYSTEM]</span> 执行队列 · 任务数 <span class="acc" data-min="12" data-max="47" data-mode="range">28</span>`,
      `<span class="cm">[DATA]</span> 客户触达 · 成功率 <span class="acc" data-min="78" data-max="95" data-fmt="pct" data-mode="range">87%</span>`,
    ];

    function randInt(min, max) { return Math.floor(Math.random() * (max - min + 1)) + min; }
    function fmt(n) { return n.toLocaleString(); }

    const MAX_VISIBLE = 6;

    // Shuffle and pick 6 lines to display
    const shuffled = [...lineDefs].sort(() => Math.random() - 0.5);
    const picked = shuffled.slice(0, 6);
    const cursor = body.querySelector('.blink-line');
    const divs = [];

    picked.forEach(html => {
      const div = document.createElement('div');
      div.className = 'hero-card-line';
      div.innerHTML = html;
      body.insertBefore(div, cursor);
      divs.push(div);
    });

    function refreshNumbers() {
      divs.forEach(div => {
        div.querySelectorAll('.acc').forEach(el => {
          const min = parseInt(el.dataset.min);
          const max = parseInt(el.dataset.max);
          if (isNaN(min) || isNaN(max)) return;

          // Initialize or read persistent current value
          if (!el.dataset.value) el.dataset.value = String(min);
          let val = parseInt(el.dataset.value);
          const mode = el.dataset.mode || 'grow';

          if (mode === 'range') {
            // Random walk within [min, max]
            const delta = randInt(-3, 3);
            val = Math.max(min, Math.min(max, val + delta));
          } else {
            // Gradual increment — step size scales with magnitude
            let step;
            if (min < 50)       step = randInt(1, 3);
            else if (min < 2000) step = randInt(10, 50);
            else if (min < 50000) step = randInt(200, 1000);
            else                 step = randInt(500, 3000);
            val += step;
          }
          el.dataset.value = String(val);

          const fmtType = el.dataset.fmt || '';
          if (fmtType === 'fmt') {
            el.textContent = val.toLocaleString();
          } else if (fmtType === 'pct') {
            el.textContent = val + '%';
          } else if (fmtType === 'suffix') {
            // Extract existing suffix character(s) from current text
            const m = el.textContent.match(/[^\d,.\s]+$/);
            const suffix = m ? m[0] : '';
            el.textContent = val + suffix;
          } else {
            el.textContent = String(val);
          }
        });
      });
    }

    function refreshFooter() {
      const stats = document.querySelectorAll('.hero-card-stat');
      if (stats.length >= 2) {
        // AI员工在线 — persist and drift near 100
        let online = parseInt(stats[0].dataset.value) || 99;
        online = Math.max(95, Math.min(100, online + randInt(-1, 1)));
        stats[0].dataset.value = String(online);
        stats[0].textContent = `${online} 个 AI 员工在线`;

        // 运行时长 — persist and keep incrementing
        let uptime = parseInt(stats[1].dataset.value) || 128;
        uptime += randInt(1, 3);
        stats[1].dataset.value = String(uptime);
        stats[1].textContent = `7×24h 已运行 ${uptime}h`;
      }
    }

    // First refresh after a short boot-like delay, then keep going
    function scheduleTick() {
      setTimeout(() => {
        refreshNumbers();
        refreshFooter();
        scheduleTick();
      }, randInt(1500, 2800));
    }
    setTimeout(() => { refreshNumbers(); scheduleTick(); }, 600);
  })();

  // ─── 7. PRODUCT / SERVICE CARD 3D TILT ───
  // Using CSS custom properties with will-change on hover only
  function setupCardTilt(selector, intensity) {
    document.querySelectorAll(selector).forEach((card) => {
      card.addEventListener('mousemove', (e) => {
        const rect = card.getBoundingClientRect();
        const x = e.clientX - rect.left, y = e.clientY - rect.top;
        const cx = rect.width / 2, cy = rect.height / 2;
        const rx = ((y - cy) / cy) * -intensity;
        const ry = ((x - cx) / cx) * intensity;
        card.style.transform = `perspective(800px) rotateX(${rx}deg) rotateY(${ry}deg) translateY(-4px)`;
      });
      card.addEventListener('mouseleave', () => {
        card.style.transform = 'perspective(800px) rotateX(0deg) rotateY(0deg) translateY(0px)';
      });
    });
  }
  setupCardTilt('[data-card]', 6);
  setupCardTilt('[data-tilt]', 5);

  // ─── 8. SCROLL REVEAL + STAGGER ───
  // Reveal with staggered threshold for images
  document.querySelectorAll('[data-reveal]').forEach((el) => {
    const isImg = el.querySelector('img');
    ScrollTrigger.create({
      trigger: el,
      start: isImg ? 'top 88%' : 'top 85%',
      onEnter: () => el.classList.add('is-inview'),
      once: true,
    });
  });

  // Image blur-up on load
  document.querySelectorAll('.case-bg-photo, .academy-card-photo, .cta-bg-photo, .stats-img').forEach((img) => {
    if (img.complete) { img.style.opacity = '1'; return; }
    img.addEventListener('load', () => { img.style.opacity = '1'; });
  });

  // ─── 9. LIGHTWEIGHT CHARTS (replaces ~900KB echarts) ───
  initCharts();

  // ─── 10. FLYWHEEL STEP ───





  const flywheelSteps = document.querySelectorAll('.flywheel-step');
  gsap.set(flywheelSteps, { y: 30, opacity: 0 });
  flywheelSteps.forEach((step, i) => {
    ScrollTrigger.create({
      trigger: '.flywheel-steps', start: 'top 80%',
      onEnter: () => gsap.to(step, { y: 0, opacity: 1, duration: 0.6, delay: i * 0.15, ease: 'power3.out' }),
      once: true,
    });
  });

  const arrowLine = document.querySelector('.flywheel-arrow-line');
  if (arrowLine) {
    ScrollTrigger.create({
      trigger: '.flywheel-steps', start: 'top 75%',
      onEnter: () => gsap.to(arrowLine, { strokeDashoffset: 0, duration: 1.2, ease: 'power3.out' }),
      once: true,
    });
  }

  // ─── 11. COUNTER ANIMATIONS ───
  document.querySelectorAll('[data-count-target]').forEach((el) => {
    const target = parseFloat(el.dataset.countTarget);
    const unitSpan = el.querySelector('.stat-unit');
    const isDecimal = target % 1 !== 0;
    ScrollTrigger.create({
      trigger: el.closest('.stats-section') || el,
      start: 'top 80%',
      onEnter: () => {
        gsap.fromTo(el, { textContent: 0 }, {
          textContent: target,
          duration: 2.5,
          ease: 'power2.out',
          snap: isDecimal ? (v) => parseFloat(v.toFixed(1)) : 1,
          onUpdate: function () {
            if (unitSpan) {
              const num = isDecimal
                ? parseFloat(this.targets()[0].textContent).toFixed(1)
                : Math.round(parseFloat(this.targets()[0].textContent));
              el.textContent = num;
              el.appendChild(unitSpan);
            }
          },
        });
      },
      once: true,
    });
  });

  document.querySelectorAll('.hero-ind-num[data-count]').forEach((el) => {
    const target = parseInt(el.dataset.count);
    ScrollTrigger.create({
      trigger: '.hero', start: 'top 60%',
      onEnter: () => gsap.fromTo(el, { textContent: 0 }, { textContent: target, duration: 2, ease: 'power2.out', snap: 1 }),
      once: true,
    });
  });

  // ─── 12. CASE CARD PARALLAX (GPU COMPOSITED) ───
  // Uses will-change: transform (set in CSS) so every transform write
  // only triggers composite, never paint or layout.
  document.querySelectorAll('[data-parallax]').forEach((card) => {
    const bg = card.querySelector('.case-bg');
    if (!bg) return;
    ScrollTrigger.create({
      trigger: card, start: 'top bottom', end: 'bottom top',
      onUpdate: (self) => {
        bg.style.transform = `translateY(${(self.progress * 20 - 10).toFixed(1)}px)`;
      },
    });
  });

  // ─── 13. FAQ ACCORDION ───
  document.querySelectorAll('[data-faq]').forEach((question) => {
    const item = question.closest('.faq-item');
    const answer = item.querySelector('.faq-answer');
    const inner = item.querySelector('.faq-answer-inner');
    let isOpen = false;
    question.addEventListener('click', () => {
      document.querySelectorAll('.faq-item.is-open').forEach((other) => {
        if (other !== item) {
          other.classList.remove('is-open');
          other.querySelector('.faq-answer').style.maxHeight = '0';
        }
      });
      isOpen = !isOpen;
      item.classList.toggle('is-open', isOpen);
      answer.style.maxHeight = isOpen ? (inner.scrollHeight + 22) + 'px' : '0';
    });
  });

  // ─── 14. ACTIVE NAV LINK (IntersectionObserver, cheap) ───
  const navLinkEls = document.querySelectorAll('[data-nav]');
  const sections = document.querySelectorAll('[data-section]');
  if (navLinkEls.length && sections.length) {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          const id = entry.target.getAttribute('id');
          navLinkEls.forEach((link) => {
            link.classList.toggle('is-active', link.getAttribute('href') === '#' + id);
          });
        });
      },
      { rootMargin: '-40% 0px -55% 0px', threshold: 0 }
    );
    sections.forEach((s) => observer.observe(s));
  }

  // ─── 15. DEMO MODAL ───
  const modalOverlay = document.getElementById('demoModal');
  const modalClose = document.getElementById('modalClose');
  const demoForm = document.getElementById('demoForm');
  const modalSuccess = document.getElementById('modalSuccess');
  const successBtn = document.getElementById('modalSuccessBtn');

  if (modalOverlay) {
    document.querySelectorAll('[data-modal="demo"]').forEach((btn) => {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        modalOverlay.classList.add('is-open');
        document.body.style.overflow = 'hidden';
        if (demoForm) { demoForm.reset(); demoForm.style.display = ''; }
        if (modalSuccess) modalSuccess.classList.remove('is-show');
      });
    });

    function closeModal() {
      modalOverlay.classList.remove('is-open');
      document.body.style.overflow = '';
    }
    if (modalClose) modalClose.addEventListener('click', closeModal);
    modalOverlay.addEventListener('click', (e) => {
      if (e.target === modalOverlay) closeModal();
    });
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && modalOverlay.classList.contains('is-open')) closeModal();
    });

    if (demoForm) {
      demoForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const submitBtn = demoForm.querySelector('.modal-submit');
        submitBtn.textContent = '提交中...';
        submitBtn.disabled = true;
        const data = {
          name: document.getElementById('field-name').value,
          email: document.getElementById('field-email').value,
          phone: document.getElementById('field-phone').value,
          industry: document.getElementById('field-industry').value,
        };
        fetch('/api/demo', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data),
        })
        .then(r => r.json())
        .then(res => {
          if (res.success) {
            if (modalSuccess) modalSuccess.classList.add('is-show');
            if (demoForm) demoForm.style.display = 'none';
          } else {
            alert('提交失败：' + (res.error || '未知错误'));
            submitBtn.textContent = '提交预约';
            submitBtn.disabled = false;
          }
        })
        .catch(() => {
          alert('网络错误，请检查服务器是否运行');
          submitBtn.textContent = '提交预约';
          submitBtn.disabled = false;
        });
      });
    }
    if (successBtn) successBtn.addEventListener('click', closeModal);
  }
});
