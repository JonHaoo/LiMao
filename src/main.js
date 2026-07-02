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
