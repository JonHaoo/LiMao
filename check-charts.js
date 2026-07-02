// Simple script to check the charts
const canvasEls = document.querySelectorAll('canvas');
console.log('Found', canvasEls.length, 'canvas elements');
canvasEls.forEach((c, i) => {
  const rect = c.getBoundingClientRect();
  const wrap = c.closest('.chart-wrap');
  console.log('Canvas', i, ':', wrap?.dataset?.chart, 'size:', rect.width.toFixed(0), 'x', rect.height.toFixed(0));
});
console.log('All chart-wrap elements:', document.querySelectorAll('.chart-wrap').length);
document.querySelectorAll('.chart-wrap').forEach(w => {
  const id = w.dataset.chart;
  const box = w.querySelector('.chart-box');
  const canvas = w.querySelector('canvas');
  console.log(id, '→ box:', box?.getBoundingClientRect().width.toFixed(0), 'x', box?.getBoundingClientRect().height.toFixed(0), 'canvas:', canvas?.getBoundingClientRect().width.toFixed(0), 'x', canvas?.getBoundingClientRect().height.toFixed(0));
});
