(function () {
  var bar = document.getElementById('siteBar');
  var updateBar = function () {
    if (bar) bar.classList.toggle('is-scrolled', window.scrollY > 10);
  };
  window.addEventListener('scroll', updateBar, { passive: true });
  updateBar();

  document.querySelectorAll('[data-tab]').forEach(function (tab, index) {
    if (index === 0) tab.classList.add('is-active');
    tab.addEventListener('click', function () {
      var name = tab.dataset.tab;
      var tabGroup = tab.closest('.platform-tabs');
      var consoleEl = tab.closest('.console');
      if (!tabGroup || !consoleEl) return;
      tabGroup.querySelectorAll('.platform-tab').forEach(function (item) {
        item.classList.toggle('is-active', item === tab);
      });
      consoleEl.querySelectorAll('.platform-panel').forEach(function (panel) {
        panel.classList.toggle('is-active', panel.dataset.panel === name);
      });
    });
  });

  document.documentElement.classList.add('has-js');
  var items = Array.prototype.slice.call(
    document.querySelectorAll('[data-reveal], [data-reveal-group] > *')
  );

  if (!('IntersectionObserver' in window) || !items.length) {
    items.forEach(function (item) {
      item.classList.add('is-in');
    });
    return;
  }

  var observer = new IntersectionObserver(
    function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        var item = entry.target;
        var index = Number(item.dataset.revealIndex || 0);
        item.style.transitionDelay = Math.min(index % 6, 5) * 55 + 'ms';
        item.classList.add('is-in');
        observer.unobserve(item);
      });
    },
    { threshold: 0.12, rootMargin: '0px 0px -40px 0px' }
  );

  items.forEach(function (item, index) {
    item.dataset.revealIndex = String(index);
    observer.observe(item);
  });
})();
