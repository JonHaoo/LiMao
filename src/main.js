import * as THREE from 'three';
import * as echarts from 'echarts';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import Lenis from 'lenis';

gsap.registerPlugin(ScrollTrigger);

// ──────────────────────────
// Wait for DOM
// ──────────────────────────
document.addEventListener('DOMContentLoaded', () => {

  // ─── 1. LENIS SMOOTH SCROLL ───
  const lenis = new Lenis({
    duration: 1.2,
    easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
    orientation: 'vertical',
    smoothWheel: true,
    wheelMultiplier: 1,
    touchMultiplier: 1.5,
  });

  lenis.on('scroll', ScrollTrigger.update);
  gsap.ticker.add((time) => lenis.raf(time * 1000));
  gsap.ticker.lagSmoothing(0);

  // ─── 2. SCROLL PROGRESS BAR ───
  const progressBar = document.getElementById('progressBar');
  if (progressBar) {
    lenis.on('scroll', ({ progress }) => {
      progressBar.style.width = `${progress * 100}%`;
    });
  }

  // ─── 3. NAV SCROLL EFFECTS ───
  const nav = document.getElementById('nav');
  if (nav) {
    lenis.on('scroll', ({ scroll }) => {
      nav.classList.toggle('is-scrolled', scroll > 60);
    });
  }

  // ─── 4. MOBILE NAV TOGGLE ───
  const navToggle = document.getElementById('navToggle');
  const navLinks = document.getElementById('navLinks');
  if (navToggle && navLinks) {
    navToggle.addEventListener('click', () => {
      navLinks.classList.toggle('is-open');
    });
    navLinks.querySelectorAll('a').forEach((link) => {
      link.addEventListener('click', () => navLinks.classList.remove('is-open'));
    });
  }

  // ─── 5. THREE.JS HERO BACKGROUND ───
  const canvas = document.getElementById('threeCanvas');
  if (canvas) {
    initThreeBackground(canvas);
  }

  // ─── 6. HERO TEXT REVEAL (GSAP) ───
  gsap.fromTo(
    '[data-reveal-hero]',
    { y: 40, opacity: 0 },
    {
      y: 0,
      opacity: 1,
      duration: 1,
      stagger: 0.15,
      ease: 'power3.out',
      delay: 0.2,
    }
  );

  // Hero title line-by-line
  const heroLines = document.querySelectorAll('.hero-line');
  heroLines.forEach((line, i) => {
    const chars = line.querySelectorAll('span');
    if (chars.length) {
      gsap.fromTo(
        chars,
        { y: '100%', opacity: 0 },
        {
          y: '0%',
          opacity: 1,
          duration: 0.8,
          stagger: 0.03,
          ease: 'power3.out',
          delay: 0.4 + i * 0.15,
        }
      );
    }
  });

  // Hero card float
  const heroCard = document.getElementById('heroCard');
  if (heroCard) {
    gsap.to(heroCard, {
      y: -10,
      duration: 3,
      ease: 'sine.inOut',
      yoyo: true,
      repeat: -1,
    });
  }

  // ─── 7. PRODUCT CARD 3D TILT ───
  document.querySelectorAll('[data-card]').forEach((card) => {
    card.addEventListener('mousemove', (e) => {
      const rect = card.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      const centerX = rect.width / 2;
      const centerY = rect.height / 2;
      const rotateX = ((y - centerY) / centerY) * -6;
      const rotateY = ((x - centerX) / centerX) * 6;
      card.style.setProperty('--rx', `${rotateX}deg`);
      card.style.setProperty('--ry', `${rotateY}deg`);
      card.style.transform = `perspective(800px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) translateY(-4px)`;
    });
    card.addEventListener('mouseleave', () => {
      card.style.transform = 'perspective(800px) rotateX(0) rotateY(0) translateY(0)';
    });
  });

  // ─── 8. SERVICE CARD TILT ───
  document.querySelectorAll('[data-tilt]').forEach((card) => {
    card.addEventListener('mousemove', (e) => {
      const rect = card.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      const centerX = rect.width / 2;
      const centerY = rect.height / 2;
      const rotateX = ((y - centerY) / centerY) * -5;
      const rotateY = ((x - centerX) / centerX) * 5;
      card.style.transform = `perspective(800px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) translateY(-4px)`;
    });
    card.addEventListener('mouseleave', () => {
      card.style.transform = 'perspective(800px) rotateX(0) rotateY(0) translateY(0)';
    });
  });

  // ─── 9. SCROLL REVEAL (IntersectionObserver backup + ScrollTrigger) ───
  // Use ScrollTrigger for proper reveals tied to lenis
  document.querySelectorAll('[data-reveal]').forEach((el) => {
    ScrollTrigger.create({
      trigger: el,
      start: 'top 85%',
      onEnter: () => el.classList.add('is-inview'),
      once: true,
    });
  });


  // ─── 9b. ECHARTS INITIALIZATION ───
  // ─── 9b. ECHARTS INITIALIZATION ───
  const CHART_GRID = { top: 8, bottom: 22, left: 8, right: 8, containLabel: true };
  const CHART_GRID_TIGHT = { top: 4, bottom: 4, left: 4, right: 4, containLabel: true };

  // Vibrant color palettes per chart type
  const PALETTES = {
    warm:   ['#F5A623','#FF6B6B','#FF9500','#FF3B30','#FFD60A'],
    cool:   ['#4A90D9','#5AC8FA','#007AFF','#00C7BE','#34C759'],
    mixed:  ['#C9953D','#F5A623','#AF52DE','#4A90D9','#4CD964','#FF6B6B'],
    gold:   ['#C9953D','#DCAA5C','#E8C06A'],
    beforeAfter: [['rgba(255,255,255,0.08)','rgba(255,255,255,0.04)'],
                  ['#F5A623','#C9953D']],
  };

  function makeBaseOpt() {
    return {
      backgroundColor: 'transparent',
      textStyle: { color: '#b0b0b5', fontFamily: "'Inter','Noto Sans SC',sans-serif", fontSize: 10 },
      animationDuration: 1800,
      animationEasing: 'elasticOut',
      animationDelay: 200,
    };
  }

  function makeAxisStyle() {
    return {
      axisLine: { lineStyle: { color: 'rgba(255,255,255,0.06)' } },
      axisTick: { show: false },
      splitLine: { lineStyle: { color: 'rgba(255,255,255,0.04)' } },
      axisLabel: { color: '#6b6b7e', fontSize: 10 },
    };
  }

  const chartOptions = {
    // ── Services ──
    // 1. AI获客 → Radar (五维能力)
    'serv-kehu': Object.assign(makeBaseOpt(), {
      animationDuration: 2000,
      animationEasing: 'cubicOut',
      radar: {
        indicator: [
          { name: '内容生产', max: 100, color: '#F5A623' },
          { name: '平台覆盖', max: 100, color: '#4A90D9' },
          { name: '账号管理', max: 100, color: '#4CD964' },
          { name: '内容质量', max: 100, color: '#AF52DE' },
          { name: '分发精准', max: 100, color: '#FF6B6B' },
        ],
        shape: 'circle',
        radius: '62%',
        center: ['50%','50%'],
        name: { textStyle: { color: '#b0b0b5', fontSize: 9, fontWeight: 500, rich: {} } },
        splitArea: { areaStyle: { color: ['rgba(245,166,35,0.03)','rgba(74,144,217,0.03)','rgba(76,217,100,0.03)','rgba(175,82,222,0.03)','rgba(255,107,107,0.03)'] } },
        axisLine: { lineStyle: { color: 'rgba(255,255,255,0.08)' } },
        splitLine: { lineStyle: { color: 'rgba(255,255,255,0.06)' } },
      },
      series: [{
        type: 'radar',
        data: [{
          value: [94, 85, 78, 88, 82],
          areaStyle: { color: { type: 'radial', x: 0.5, y: 0.5, r: 0.8,
            colorStops: [{ offset: 0, color: 'rgba(245,166,35,0.25)' }, { offset: 1, color: 'rgba(201,149,61,0.04)' }] } },
          lineStyle: { color: '#F5A623', width: 2 },
          itemStyle: { color: '#F5A623' },
        }],
        symbol: 'circle',
        symbolSize: 5,
        animationDuration: 2000,
        animationEasing: 'cubicOut',
      }],
    }),

    // 2. AI引流 → Donut (渠道分析)
    'serv-yinliu': Object.assign(makeBaseOpt(), {
      animationDuration: 1500,
      animationEasing: 'cubicOut',
      tooltip: { show: false },
      series: [{
        type: 'pie',
        radius: ['36%', '66%'],
        center: ['50%','50%'],
        avoidLabelOverlap: true,
        silent: true,
        roseType: 'area',
        data: [
          { name: '短视频引流', value: 35, itemStyle: { color: '#F5A623' } },
          { name: '私信互动',    value: 25, itemStyle: { color: '#4A90D9' } },
          { name: '评论区',      value: 18, itemStyle: { color: '#AF52DE' } },
          { name: 'AI客服',     value: 12, itemStyle: { color: '#4CD964' } },
          { name: '自然搜索',   value: 10, itemStyle: { color: '#FF6B6B' } },
        ],
        label: {
          show: true,
          position: 'outside',
          formatter: '{b}\n{d}%',
          color: '#b0b0b5',
          fontSize: 9,
          lineHeight: 13,
        },
        labelLine: { length: 6, length2: 4, smooth: true, lineStyle: { color: 'rgba(255,255,255,0.1)' } },
        emphasis: { scale: false, label: { show: true } },
        itemStyle: { borderColor: 'rgba(0,0,0,0.3)', borderWidth: 1.5 },
        animationType: 'expansion',
        animationDuration: 2000,
        animationEasing: 'cubicOut',
      }],
    }),

    // 3. AI销售 → Line (转化趋势)
    'serv-xiaoshou': Object.assign(makeBaseOpt(), {
      animationDuration: 2000,
      animationEasing: 'cubicOut',
      grid: CHART_GRID,
      xAxis: Object.assign(makeAxisStyle(), {
        type: 'category',
        data: ['第1周','第2周','第3周','第4周'],
        boundaryGap: false,
      }),
      yAxis: Object.assign(makeAxisStyle(), { type: 'value', max: 50, splitNumber: 2 }),
      series: [{
        type: 'line',
        data: [
          { value: 12, itemStyle: { color: '#4A90D9' } },
          { value: 24, itemStyle: { color: '#5AC8FA' } },
          { value: 33, itemStyle: { color: '#F5A623' } },
          { value: 40, itemStyle: { color: '#4CD964' } },
        ],
        smooth: true,
        showSymbol: true,
        symbol: 'circle',
        symbolSize: 7,
        connectNulls: true,
        areaStyle: {
          color: { type: 'linear', x: 0, y: 0, x2: 0, y2: 1,
            colorStops: [
              { offset: 0, color: 'rgba(74,144,217,0.3)' },
              { offset: 0.5, color: 'rgba(90,200,250,0.1)' },
              { offset: 1, color: 'rgba(76,217,100,0.02)' },
            ] },
        },
        lineStyle: { color: '#4A90D9', width: 2.5, shadowBlur: 8, shadowColor: 'rgba(74,144,217,0.3)' },
        animationDuration: 2500,
        animationEasing: 'cubicOut',
        animationDelay: 300,
      }],
    }),

    // 4. AI+教培 → Gauge (就业率)
    'serv-jiaopei': Object.assign(makeBaseOpt(), {
      animationDuration: 2000,
      animationEasing: 'bounceOut',
      series: [{
        type: 'gauge',
        center: ['50%','55%'],
        radius: '75%',
        startAngle: 220,
        endAngle: -40,
        min: 0, max: 100,
        splitNumber: 5,
        progress: {
          show: true,
          width: 8,
          roundCap: true,
          itemStyle: {
            color: { type: 'linear', x: 0, y: 0, x2: 1, y2: 0,
              colorStops: [
                { offset: 0, color: '#AF52DE' },
                { offset: 0.5, color: '#F5A623' },
                { offset: 1, color: '#4CD964' },
              ] },
          },
        },
        axisLine: { lineStyle: { width: 8, color: [[1, 'rgba(255,255,255,0.06)']] } },
        axisTick: { show: false },
        splitLine: { show: false },
        axisLabel: { show: false },
        detail: {
          offsetCenter: [0, '40%'],
          fontSize: 20,
          fontWeight: 800,
          color: '#AF52DE',
          fontFamily: "'Inter','Noto Sans SC',sans-serif",
          formatter: '{value}%',
        },
        data: [{ value: 87 }],
        pointer: { show: false },
        animationDuration: 3000,
        animationEasing: 'elasticOut',
      }],
    }),

    // 5. AI+动漫/短剧 → Bar (产能)
    'serv-dongman': Object.assign(makeBaseOpt(), {
      animationDuration: 1500,
      animationEasing: 'cubicOut',
      grid: Object.assign({}, CHART_GRID, { top: 4, bottom: 22 }),
      xAxis: Object.assign(makeAxisStyle(), {
        type: 'category',
        data: ['AI漫剧','真人短剧','动画短片','品牌定制'],
        axisLabel: { color: '#6b6b7e', fontSize: 9 },
      }),
      yAxis: Object.assign(makeAxisStyle(), { type: 'value', splitNumber: 2 }),
      series: [{
        type: 'bar',
        data: [
          { value: 470, itemStyle: { color: { type: 'linear', x: 0, y: 0, x2: 0, y2: 1,
            colorStops: [{ offset: 0, color: '#F5A623' }, { offset: 1, color: '#C9953D' }] },
            borderRadius: [6,6,0,0] } },
          { value: 120, itemStyle: { color: { type: 'linear', x: 0, y: 0, x2: 0, y2: 1,
            colorStops: [{ offset: 0, color: '#4A90D9' }, { offset: 1, color: '#007AFF' }] },
            borderRadius: [6,6,0,0] } },
          { value: 80, itemStyle: { color: { type: 'linear', x: 0, y: 0, x2: 0, y2: 1,
            colorStops: [{ offset: 0, color: '#AF52DE' }, { offset: 1, color: '#5856D6' }] },
            borderRadius: [6,6,0,0] } },
          { value: 50, itemStyle: { color: { type: 'linear', x: 0, y: 0, x2: 0, y2: 1,
            colorStops: [{ offset: 0, color: '#FF6B6B' }, { offset: 1, color: '#FF3B30' }] },
            borderRadius: [6,6,0,0] } },
        ],
        barWidth: 14,
        barGap: '30%',
        animationDelay: function(idx) { return idx * 200; },
      }],
    }),

    // 6. 私有化部署 → Gauge (评分)
    'serv-bushu': Object.assign(makeBaseOpt(), {
      animationDuration: 2000,
      animationEasing: 'bounceOut',
      series: [{
        type: 'gauge',
        center: ['50%','55%'],
        radius: '75%',
        startAngle: 220,
        endAngle: -40,
        min: 0, max: 100,
        splitNumber: 5,
        progress: {
          show: true,
          width: 8,
          roundCap: true,
          itemStyle: {
            color: { type: 'linear', x: 0, y: 0, x2: 1, y2: 0,
              colorStops: [
                { offset: 0, color: '#F5A623' },
                { offset: 0.5, color: '#5AC8FA' },
                { offset: 1, color: '#4CD964' },
              ] },
          },
        },
        axisLine: { lineStyle: { width: 8, color: [[1, 'rgba(255,255,255,0.06)']] } },
        axisTick: { show: false },
        splitLine: { show: false },
        axisLabel: { show: false },
        detail: {
          offsetCenter: [0, '40%'],
          fontSize: 20,
          fontWeight: 800,
          color: '#5AC8FA',
          fontFamily: "'Inter','Noto Sans SC',sans-serif",
          formatter: '{value}分',
        },
        data: [{ value: 96 }],
        pointer: { show: false },
        animationDuration: 3000,
        animationEasing: 'elasticOut',
      }],
    }),

    // ── Cases ──
    // 1. 智能制造 → Grouped Bar (线索对比)
    'case-zhizao': Object.assign(makeBaseOpt(), {
      animationDuration: 1500,
      animationEasing: 'cubicOut',
      tooltip: { show: false },
      grid: CHART_GRID_TIGHT,
      xAxis: Object.assign(makeAxisStyle(), {
        type: 'category',
        data: ['线索量/月'],
        axisLabel: { color: '#6b6b7e', fontSize: 10 },
      }),
      yAxis: Object.assign(makeAxisStyle(), { type: 'value', splitNumber: 2, show: false }),
      series: [
        {
          name: 'Before',
          type: 'bar',
          data: [50],
          barWidth: 20,
          barGap: '40%',
          itemStyle: { color: 'rgba(255,255,255,0.08)', borderRadius: [4,4,0,0] },
          animationDuration: 1000,
        },
        {
          name: 'After',
          type: 'bar',
          data: [150],
          barWidth: 20,
          itemStyle: {
            color: { type: 'linear', x: 0, y: 0, x2: 0, y2: 1,
              colorStops: [{ offset: 0, color: '#F5A623' }, { offset: 1, color: '#C9953D' }] },
            borderRadius: [4,4,0,0],
            shadowBlur: 8,
            shadowColor: 'rgba(245,166,35,0.3)',
          },
          animationDuration: 2000,
          animationDelay: 300,
        },
      ],
      legend: {
        show: true, bottom: -6, left: 'center',
        itemWidth: 8, itemHeight: 8,
        textStyle: { color: '#6b6b7e', fontSize: 10 },
      },
    }),

    // 2. 美业 → Line (复购趋势)
    'case-meiye': Object.assign(makeBaseOpt(), {
      animationDuration: 2000,
      animationEasing: 'cubicOut',
      grid: CHART_GRID_TIGHT,
      xAxis: Object.assign(makeAxisStyle(), {
        type: 'category',
        data: ['1月','2月','3月','4月','5月','6月'],
        axisLabel: { color: '#6b6b7e', fontSize: 9 },
      }),
      yAxis: Object.assign(makeAxisStyle(), { type: 'value', splitNumber: 2, show: false }),
      series: [{
        type: 'line',
        data: [
          { value: 12, symbolSize: 6 },
          { value: 15, symbolSize: 6 },
          { value: 20, symbolSize: 6 },
          { value: 28, symbolSize: 6 },
          { value: 34, symbolSize: 6 },
          { value: 38, symbolSize: 8, itemStyle: { color: '#4CD964' } },
        ],
        smooth: true,
        showSymbol: true,
        symbol: 'circle',
        connectNulls: true,
        areaStyle: {
          color: { type: 'linear', x: 0, y: 0, x2: 0, y2: 1,
            colorStops: [
              { offset: 0, color: 'rgba(76,217,100,0.25)' },
              { offset: 0.5, color: 'rgba(90,200,250,0.08)' },
              { offset: 1, color: 'rgba(74,144,217,0.02)' },
            ] },
        },
        lineStyle: { color: '#4CD964', width: 2.5, shadowBlur: 8, shadowColor: 'rgba(76,217,100,0.3)' },
        itemStyle: { color: '#5AC8FA' },
        animationDuration: 2500,
        animationEasing: 'cubicOut',
      }],
    }),

    // 3. 电商 → Grouped Bar (GMV对比)
    'case-dianshang': Object.assign(makeBaseOpt(), {
      animationDuration: 1500,
      animationEasing: 'cubicOut',
      tooltip: { show: false },
      grid: CHART_GRID_TIGHT,
      xAxis: Object.assign(makeAxisStyle(), {
        type: 'category',
        data: ['月GMV/万'],
        axisLabel: { color: '#6b6b7e', fontSize: 10 },
      }),
      yAxis: Object.assign(makeAxisStyle(), { type: 'value', splitNumber: 2, show: false }),
      series: [
        {
          name: 'Before',
          type: 'bar',
          data: [15],
          barWidth: 20,
          barGap: '40%',
          itemStyle: { color: 'rgba(255,255,255,0.08)', borderRadius: [4,4,0,0] },
          animationDuration: 1000,
        },
        {
          name: 'After',
          type: 'bar',
          data: [68],
          barWidth: 20,
          itemStyle: {
            color: { type: 'linear', x: 0, y: 0, x2: 0, y2: 1,
              colorStops: [{ offset: 0, color: '#4CD964' }, { offset: 1, color: '#34C759' }] },
            borderRadius: [4,4,0,0],
            shadowBlur: 8,
            shadowColor: 'rgba(76,217,100,0.3)',
          },
          animationDuration: 2000,
          animationDelay: 300,
        },
      ],
      legend: {
        show: true, bottom: -6, left: 'center',
        itemWidth: 8, itemHeight: 8,
        textStyle: { color: '#6b6b7e', fontSize: 10 },
      },
    }),
  };

  // Initialize charts lazily on scroll, then animate continuously
  const chartInstances = [];
  document.querySelectorAll('.chart-wrap[data-chart]').forEach((wrap) => {
    const id = wrap.dataset.chart;
    const opts = chartOptions[id];
    if (!opts) return;
    const box = wrap.querySelector('.chart-box');
    if (!box) return;

    ScrollTrigger.create({
      trigger: wrap.closest('[data-section]') || wrap,
      start: 'top 88%',
      onEnter: () => {
        if (wrap._chartInited) return;
        wrap._chartInited = true;
        const chart = echarts.init(box, null, { renderer: 'canvas' });
        chart.setOption(opts);
        chartInstances.push(chart);

      },
      once: true,
    });
  });

  // Global resize (throttled)
  let resizeTimer;
  window.addEventListener('resize', () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(() => {
      chartInstances.forEach(c => c.resize());
    }, 200);
  });
  // ─── 10. FLYWHEEL STEP ANIMATIONS ───
  const flywheelSteps = document.querySelectorAll('.flywheel-step');
  flywheelSteps.forEach((step, i) => {
    ScrollTrigger.create({
      trigger: '.flywheel-steps',
      start: 'top 80%',
      onEnter: () => {
        gsap.to(step, { y: 0, opacity: 1, duration: 0.6, delay: i * 0.15, ease: 'power3.out' });
      },
      once: true,
    });
    gsap.set(step, { y: 30, opacity: 0 });
  });

  const arrowLine = document.querySelector('.flywheel-arrow-line');
  if (arrowLine) {
    ScrollTrigger.create({
      trigger: '.flywheel-steps',
      start: 'top 75%',
      onEnter: () => {
        gsap.to(arrowLine, { strokeDashoffset: 0, duration: 1.2, ease: 'power3.out' });
      },
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
          textContent: target, duration: 2.5, ease: 'power2.out',
          snap: isDecimal ? (v) => parseFloat(v.toFixed(1)) : 1,
          onUpdate: function () {
            if (unitSpan) {
              const num = isDecimal ? parseFloat(this.targets()[0].textContent).toFixed(1) : Math.round(parseFloat(this.targets()[0].textContent));
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
      onEnter: () => { gsap.fromTo(el, { textContent: 0 }, { textContent: target, duration: 2, ease: 'power2.out', snap: 1 }); },
      once: true,
    });
  });

  // ─── 12. CASE CARD PARALLAX ───
  document.querySelectorAll('[data-parallax]').forEach((card) => {
    const bg = card.querySelector('.case-bg');
    if (!bg) return;
    ScrollTrigger.create({
      trigger: card, start: 'top bottom', end: 'bottom top',
      onUpdate: (self) => { bg.style.transform = 'translateY(' + (self.progress * 20 - 10) + 'px)'; },
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
        if (other !== item) { other.classList.remove('is-open'); other.querySelector('.faq-answer').style.maxHeight = '0'; }
      });
      isOpen = !isOpen;
      item.classList.toggle('is-open', isOpen);
      answer.style.maxHeight = isOpen ? inner.scrollHeight + 22 + 'px' : '0';
    });
  });

  // ─── 14. ACTIVE NAV LINK ───
  const navLinkEls = document.querySelectorAll('[data-nav]');
  const sections = document.querySelectorAll('[data-section]');
  if (navLinkEls.length && sections.length) {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          const id = entry.target.getAttribute('id');
          navLinkEls.forEach((link) => { link.classList.toggle('is-active', link.getAttribute('href') === '#' + id); });
        });
      },
      { rootMargin: '-40% 0px -55% 0px' }
    );
    sections.forEach((s) => observer.observe(s));

  // ─── 15. DEMO MODAL ───
  const modalOverlay = document.getElementById('demoModal');
  const modalClose = document.getElementById('modalClose');
  const demoForm = document.getElementById('demoForm');
  const modalSuccess = document.getElementById('modalSuccess');
  const successBtn = document.getElementById('modalSuccessBtn');

  if (modalOverlay) {
    // Open on any trigger button
    document.querySelectorAll('[data-modal="demo"]').forEach((btn) => {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        modalOverlay.classList.add('is-open');
        document.body.style.overflow = 'hidden';
        // Reset form
        if (demoForm) { demoForm.reset(); demoForm.style.display = ''; }
        if (modalSuccess) modalSuccess.classList.remove('is-show');
      });
    });

    // Close handlers
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

    // Submit
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
    if (successBtn) {
      successBtn.addEventListener('click', closeModal);
    }
  }

  }
});

// ──────────────────────────
// THREE.JS BACKGROUND
// ──────────────────────────
function initThreeBackground(canvas) {
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(75, canvas.clientWidth / canvas.clientHeight, 0.1, 1000);
  const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true });
  renderer.setSize(canvas.clientWidth, canvas.clientHeight);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

  const geometries = [];
  const colors = [new THREE.Color(0xC9953D), new THREE.Color(0xDCAA5C), new THREE.Color(0xE8C06A)];
  const count = 12;
  const group = new THREE.Group();

  for (let i = 0; i < count; i++) {
    const size = 0.08 + Math.random() * 0.18;
    const type = Math.random();
    let geometry;
    if (type < 0.33) geometry = new THREE.TorusGeometry(size, size * 0.4, 6, 10);
    else if (type < 0.66) geometry = new THREE.OctahedronGeometry(size);
    else geometry = new THREE.IcosahedronGeometry(size);
    const material = new THREE.MeshStandardMaterial({
      color: colors[i % 3], metalness: 0.2, roughness: 0.6, transparent: true,
      opacity: 0.3 + Math.random() * 0.3,
    });
    const mesh = new THREE.Mesh(geometry, material);
    mesh.position.set((Math.random() - 0.5) * 6, (Math.random() - 0.5) * 4, (Math.random() - 0.5) * 3 - 1);
    mesh.rotation.set(Math.random() * Math.PI, Math.random() * Math.PI, 0);
    mesh.userData = {
      rotSpeed: { x: (Math.random() - 0.5) * 0.01, y: (Math.random() - 0.5) * 0.01 },
      floatSpeed: 0.5 + Math.random() * 1,
      floatOffset: Math.random() * Math.PI * 2,
    };
    group.add(mesh);
    geometries.push(mesh);
  }

  const particleCount = 300;
  const positions = new Float32Array(particleCount * 3);
  for (let i = 0; i < particleCount * 3; i++) positions[i] = (Math.random() - 0.5) * 12;
  const particleGeo = new THREE.BufferGeometry();
  particleGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  const particleMat = new THREE.PointsMaterial({
    size: 0.02, color: 0xC9953D, transparent: true, opacity: 0.15,
    blending: THREE.AdditiveBlending,
  });
  group.add(new THREE.Points(particleGeo, particleMat));
  scene.add(group);

  const ambientLight = new THREE.AmbientLight(0x404060, 0.5);
  scene.add(ambientLight);
  const dirLight = new THREE.DirectionalLight(0xC9953D, 0.6);
  dirLight.position.set(1, 1, 1);
  scene.add(dirLight);

  let mouseX = 0, mouseY = 0, targetX = 0, targetY = 0;
  document.addEventListener('mousemove', (e) => {
    mouseX = (e.clientX / window.innerWidth - 0.5) * 2;
    mouseY = (e.clientY / window.innerHeight - 0.5) * 2;
  });
  camera.position.z = 4;

  let frameId;
  let lastTime = 0;
  const FPS = 30;
  const frameInterval = 1000 / FPS;

  function animate(time) {
    frameId = requestAnimationFrame(animate);
    if (time - lastTime < frameInterval) return;
    lastTime = time - (time - lastTime) % frameInterval;

    targetX += (mouseX - targetX) * 0.02;
    targetY += (mouseY - targetY) * 0.02;
    group.rotation.x += (targetY * 0.1 - group.rotation.x) * 0.02;
    group.rotation.y += (targetX * 0.1 - group.rotation.y) * 0.02;
    const t = Date.now() * 0.001;
    geometries.forEach((mesh) => {
      mesh.rotation.x += mesh.userData.rotSpeed.x;
      mesh.rotation.y += mesh.userData.rotSpeed.y;
      mesh.position.y += Math.sin(t * mesh.userData.floatSpeed + mesh.userData.floatOffset) * 0.001;
    });
    renderer.render(scene, camera);
  }
  animate(0);

  window.addEventListener('resize', () => {
    const w = canvas.clientWidth, h = canvas.clientHeight;
    renderer.setSize(w, h);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
  });
}
