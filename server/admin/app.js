const API = '/api/demo';
const tableBody = document.getElementById('tableBody');
const toast = document.getElementById('toast');
let currentFilter = 'all';
let allData = [];

function showToast(msg) {
  toast.textContent = msg;
  toast.classList.add('is-show');
  setTimeout(() => toast.classList.remove('is-show'), 2500);
}

function getStatusBadge(status) {
  const map = { pending: '待联系', contacted: '已联系', converted: '已转化' };
  return `<span class="status-badge status-${status}">${map[status] || status}</span>`;
}

function fetchData(filter) {
  const url = filter && filter !== 'all' ? `${API}?status=${filter}` : API;
  tableBody.innerHTML = '<tr><td colspan="8" class="admin-empty">加载中...</td></tr>';
  fetch(url)
    .then(r => r.json())
    .then(data => {
      allData = data;
      renderTable(data);
      fetchStats();
    })
    .catch(() => {
      tableBody.innerHTML = '<tr><td colspan="8" class="admin-empty">加载失败，请确认服务器已启动</td></tr>';
    });
}

function renderTable(data) {
  if (!data.length) {
    tableBody.innerHTML = '<tr><td colspan="8" class="admin-empty">暂无数据</td></tr>';
    return;
  }
  tableBody.innerHTML = data.map(row => `
    <tr>
      <td style="color:#48485a;font-family:monospace;font-size:12px">${row.id}</td>
      <td style="color:#f1f1f5;font-weight:600">${esc(row.name)}</td>
      <td><a href="mailto:${esc(row.email)}" style="color:#5AC8FA;text-decoration:none">${esc(row.email)}</a></td>
      <td>${esc(row.phone)}</td>
      <td style="color:#6b6b7e;max-width:160px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${esc(row.industry) || '-'}</td>
      <td style="font-size:12px;color:#48485a;font-family:monospace">${row.created_at}</td>
      <td>${getStatusBadge(row.status)}</td>
      <td>
        <div class="admin-actions">
          ${row.status === 'pending'
            ? `<button class="admin-btn admin-btn-primary admin-btn-sm" data-action="contact" data-id="${row.id}">标记已联系</button>`
            : row.status === 'contacted'
            ? `<button class="admin-btn admin-btn-primary admin-btn-sm" data-action="convert" data-id="${row.id}">标记已转化</button>`
            : `<button class="admin-btn admin-btn-sm admin-btn-disabled">已完成</button>`
          }
          <button class="admin-btn admin-btn-danger admin-btn-sm" data-action="delete" data-id="${row.id}">删除</button>
        </div>
      </td>
    </tr>
  `).join('');
}

function esc(s) { return String(s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'})[c]); }

function fetchStats() {
  fetch(`${API}/stats`)
    .then(r => r.json())
    .then(s => {
      document.getElementById('statTotal').textContent = s.total;
      document.getElementById('statPending').textContent = s.pending;
      document.getElementById('statContacted').textContent = s.contacted;
      document.getElementById('statToday').textContent = s.today;
    })
    .catch(() => {});
}

// Event delegation for actions
tableBody.addEventListener('click', (e) => {
  const btn = e.target.closest('[data-action]');
  if (!btn) return;
  const id = btn.dataset.id;
  const action = btn.dataset.action;

  if (action === 'delete') {
    if (!confirm('确定删除这条记录？')) return;
    fetch(`${API}/${id}`, { method: 'DELETE' })
      .then(r => r.json())
      .then(d => { if (d.success) { showToast('已删除'); fetchData(currentFilter); } else showToast(d.error); })
      .catch(() => showToast('删除失败'));
  } else if (action === 'contact') {
    fetch(`${API}/${id}`, { method: 'PATCH', headers: {'Content-Type':'application/json'}, body: JSON.stringify({status:'contacted'}) })
      .then(r => r.json())
      .then(d => { if (d.success) { showToast('已标记为已联系'); fetchData(currentFilter); } else showToast(d.error); })
      .catch(() => showToast('操作失败'));
  } else if (action === 'convert') {
    fetch(`${API}/${id}`, { method: 'PATCH', headers: {'Content-Type':'application/json'}, body: JSON.stringify({status:'converted'}) })
      .then(r => r.json())
      .then(d => { if (d.success) { showToast('已标记为已转化'); fetchData(currentFilter); } else showToast(d.error); })
      .catch(() => showToast('操作失败'));
  }
});

// Tabs
document.querySelectorAll('.admin-tab').forEach(tab => {
  tab.addEventListener('click', () => {
    document.querySelectorAll('.admin-tab').forEach(t => t.classList.remove('is-active'));
    tab.classList.add('is-active');
    currentFilter = tab.dataset.filter;
    fetchData(currentFilter);
  });
});

// Refresh
document.getElementById('refreshBtn').addEventListener('click', () => fetchData(currentFilter));

// Initial load
fetchData('all');
