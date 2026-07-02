const API = '/api/demo';
const tableBody = document.getElementById('tableBody');
const toast = document.getElementById('toast');
let currentFilter = 'all';
let allData = [];

// ── Auth helpers ──
function getToken() { return localStorage.getItem('admin_token'); }

function authFetch(url, options) {
  if (!options) options = {};
  if (!options.headers) options.headers = {};
  options.headers['Authorization'] = 'Bearer ' + getToken();
  return fetch(url, options);
}

// ── User info & logout ──
const username = localStorage.getItem('admin_username');
if (username) {
  document.getElementById('userName').textContent = username;
  document.getElementById('userInfo').style.display = '';
}
document.getElementById('logoutBtn').addEventListener('click', () => {
  authFetch('/api/auth/logout', { method: 'POST' }).catch(() => {});
  localStorage.removeItem('admin_token');
  localStorage.removeItem('admin_username');
  window.location.href = '/admin/login';
});

function showToast(msg) {
  toast.textContent = msg;
  toast.classList.add('is-show');
  setTimeout(() => toast.classList.remove('is-show'), 2500);
}

function getStatusBadge(status) {
  const map = { pending: '\u5F85\u8054\u7CFB', contacted: '\u5DF2\u8054\u7CFB', converted: '\u5DF2\u8F6C\u5316' };
  return '<span class="status-badge status-' + status + '">' + (map[status] || status) + '</span>';
}

function fetchData(filter) {
  const url = filter && filter !== 'all' ? API + '?status=' + filter : API;
  tableBody.innerHTML = '<tr><td colspan="8" class="admin-empty">\u52A0\u8F7D\u4E2D...</td></tr>';
  authFetch(url)
    .then(function(r) { return r.json(); })
    .then(function(data) {
      allData = data;
      renderTable(data);
      fetchStats();
    })
    .catch(function() {
      tableBody.innerHTML = '<tr><td colspan="8" class="admin-empty">\u52A0\u8F7D\u5931\u8D25\uFF0C\u8BF7\u786E\u8BA4\u670D\u52A1\u5668\u5DF2\u542F\u52A8</td></tr>';
    });
}

function renderTable(data) {
  if (!data.length) {
    tableBody.innerHTML = '<tr><td colspan="8" class="admin-empty">\u6682\u65E0\u6570\u636E</td></tr>';
    return;
  }
  tableBody.innerHTML = data.map(function(row) {
    return '<tr>' +
      '<td style="color:#48485a;font-family:monospace;font-size:12px">' + row.id + '</td>' +
      '<td style="color:#f1f1f5;font-weight:600">' + esc(row.name) + '</td>' +
      '<td><a href="mailto:' + esc(row.email) + '" style="color:#5AC8FA;text-decoration:none">' + esc(row.email) + '</a></td>' +
      '<td>' + esc(row.phone) + '</td>' +
      '<td style="color:#6b6b7e;max-width:160px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">' + (esc(row.industry) || '-') + '</td>' +
      '<td style="font-size:12px;color:#48485a;font-family:monospace">' + row.created_at + '</td>' +
      '<td>' + getStatusBadge(row.status) + '</td>' +
      '<td><div class="admin-actions">' +
        (row.status === 'pending'
          ? '<button class="admin-btn admin-btn-primary admin-btn-sm" data-action="contact" data-id="' + row.id + '">\u6807\u8BB0\u5DF2\u8054\u7CFB</button>'
          : row.status === 'contacted'
          ? '<button class="admin-btn admin-btn-primary admin-btn-sm" data-action="convert" data-id="' + row.id + '">\u6807\u8BB0\u5DF2\u8F6C\u5316</button>'
          : '<button class="admin-btn admin-btn-sm admin-btn-disabled">\u5DF2\u5B8C\u6210</button>'
        ) +
        '<button class="admin-btn admin-btn-danger admin-btn-sm" data-action="delete" data-id="' + row.id + '">\u5220\u9664</button>' +
      '</div></td></tr>';
  }).join('');
}

function esc(s) { return String(s).replace(/[&<>"']/g, function(c) { return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]; }); }

function fetchStats() {
  authFetch(API + '/stats')
    .then(function(r) { return r.json(); })
    .then(function(s) {
      document.getElementById('statTotal').textContent = s.total;
      document.getElementById('statPending').textContent = s.pending;
      document.getElementById('statContacted').textContent = s.contacted;
      document.getElementById('statToday').textContent = s.today;
    })
    .catch(function() {});
}

// Event delegation for actions
tableBody.addEventListener('click', function(e) {
  var btn = e.target.closest('[data-action]');
  if (!btn) return;
  var id = btn.dataset.id;
  var action = btn.dataset.action;

  if (action === 'delete') {
    if (!confirm('\u786E\u5B9A\u5220\u9664\u8FD9\u6761\u8BB0\u5F55\uFF1F')) return;
    authFetch(API + '/' + id, { method: 'DELETE' })
      .then(function(r) { return r.json(); })
      .then(function(d) { if (d.success) { showToast('\u5DF2\u5220\u9664'); fetchData(currentFilter); } else showToast(d.error); })
      .catch(function() { showToast('\u5220\u9664\u5931\u8D25'); });
  } else if (action === 'contact') {
    authFetch(API + '/' + id, { method: 'PATCH', headers: {'Content-Type':'application/json'}, body: JSON.stringify({status:'contacted'}) })
      .then(function(r) { return r.json(); })
      .then(function(d) { if (d.success) { showToast('\u5DF2\u6807\u8BB0\u4E3A\u5DF2\u8054\u7CFB'); fetchData(currentFilter); } else showToast(d.error); })
      .catch(function() { showToast('\u64CD\u4F5C\u5931\u8D25'); });
  } else if (action === 'convert') {
    authFetch(API + '/' + id, { method: 'PATCH', headers: {'Content-Type':'application/json'}, body: JSON.stringify({status:'converted'}) })
      .then(function(r) { return r.json(); })
      .then(function(d) { if (d.success) { showToast('\u5DF2\u6807\u8BB0\u4E3A\u5DF2\u8F6C\u5316'); fetchData(currentFilter); } else showToast(d.error); })
      .catch(function() { showToast('\u64CD\u4F5C\u5931\u8D25'); });
  }
});

// Tabs
document.querySelectorAll('.admin-tab').forEach(function(tab) {
  tab.addEventListener('click', function() {
    document.querySelectorAll('.admin-tab').forEach(function(t) { t.classList.remove('is-active'); });
    tab.classList.add('is-active');
    currentFilter = tab.dataset.filter;
    fetchData(currentFilter);
  });
});

// Refresh
document.getElementById('refreshBtn').addEventListener('click', function() { fetchData(currentFilter); });

// Initial load
fetchData('all');


// ── Password Change Modal ──
const pwModal = document.getElementById('pwModal');
const pwForm = document.getElementById('pwForm');
const pwError = document.getElementById('pwError');
const pwClose = document.getElementById('pwModalClose');

function openPwModal() {
  pwModal.classList.add('is-open');
  pwForm.reset();
  pwError.textContent = '';
  document.body.style.overflow = 'hidden';
}
function closePwModal() {
  pwModal.classList.remove('is-open');
  document.body.style.overflow = '';
}

document.getElementById('changePwBtn').addEventListener('click', openPwModal);
if (pwClose) pwClose.addEventListener('click', closePwModal);
pwModal.addEventListener('click', function(e) {
  if (e.target === pwModal) closePwModal();
});

pwForm.addEventListener('submit', function(e) {
  e.preventDefault();
  var currentPw = document.getElementById('pwCurrent').value;
  var newPw = document.getElementById('pwNew').value;
  var confirmPw = document.getElementById('pwConfirm').value;
  if (newPw !== confirmPw) {
    pwError.textContent = '两次密码输入不一致';
    return;
  }
  var btn = pwForm.querySelector('.auth-btn');
  btn.textContent = '保存中...';
  btn.disabled = true;
  pwError.textContent = '';
  authFetch('/api/auth/change-password', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ currentPassword: currentPw, newPassword: newPw }),
  })
  .then(function(r) { return r.json(); })
  .then(function(d) {
    if (d.success) {
      showToast('密码修改成功');
      closePwModal();
    } else {
      pwError.textContent = d.error || '修改失败';
    }
    btn.textContent = '保存修改';
    btn.disabled = false;
  })
  .catch(function() {
    pwError.textContent = '网络错误';
    btn.textContent = '保存修改';
    btn.disabled = false;
  });
});
