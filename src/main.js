document.addEventListener('DOMContentLoaded', () => {

  // ─── 1. LENIS SMOOTH SCROLL ───
  const lenis = new Lenis({
    easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
    orientation: 'vertical',
    smoothWheel: true,
    wheelMultiplier: 1,
    touchMultiplier: 1.5,
  });

  lenis.on('scroll', ScrollTrigger.update);
  gsap.ticker.add((time) => lenis.raf(time * 1000));
  gsap.ticker.lagSmoothing(0);

      nav.classList.toggle('is-scrolled', scroll > 60);
    });
  }

  // ─── 4. MOBILE NAV TOGGLE ───
  const navToggle = document.getElementById('navToggle');
  const navLinks = document.getElementById('navLinks');
  if (navToggle && navLinks) {
    navLinks.querySelectorAll('a').forEach((link) => {
      link.addEventListener('click', () => navLinks.classList.remove('is-open'));
    });
  }

  const heroLines = document.querySelectorAll('.hero-line');
  heroLines.forEach((line, i) => {
    const chars = line.querySelectorAll('span');
    if (chars.length) {
      );
    }
  });

      onEnter: () => el.classList.add('is-inview'),
      once: true,
    });
  });

      once: true,
    });
  });

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
      once: true,
    });
  });

  document.querySelectorAll('[data-parallax]').forEach((card) => {
    const bg = card.querySelector('.case-bg');
    if (!bg) return;
    ScrollTrigger.create({
      trigger: card, start: 'top bottom', end: 'bottom top',
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
  const navLinkEls = document.querySelectorAll('[data-nav]');
  const sections = document.querySelectorAll('[data-section]');
  if (navLinkEls.length && sections.length) {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          const id = entry.target.getAttribute('id');

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
