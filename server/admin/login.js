const API_AUTH = '/api/auth';
const toast = document.getElementById('loginError') || { textContent: '' };

function getEl(id) { return document.getElementById(id); }

// ── Tab Switching ──
document.querySelectorAll('.auth-tab').forEach(tab => {
  tab.addEventListener('click', () => {
    document.querySelectorAll('.auth-tab').forEach(t => t.classList.remove('is-active'));
    tab.classList.add('is-active');
    const isLogin = tab.dataset.tab === 'login';
    getEl('loginForm').classList.toggle('is-hidden', !isLogin);
    getEl('registerForm').classList.toggle('is-hidden', isLogin);
    getEl('loginError').textContent = '';
    getEl('regError').textContent = '';
  });
});

// ── Login ──
getEl('loginForm').addEventListener('submit', (e) => {
  e.preventDefault();
  const btn = getEl('loginForm').querySelector('.auth-btn');
  const errEl = getEl('loginError');
  btn.textContent = '登录中...';
  btn.disabled = true;
  errEl.textContent = '';
  fetch(API_AUTH + '/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username: getEl('loginUsername').value, password: getEl('loginPassword').value }),
  })
  .then(r => r.json())
  .then(d => {
    if (d.success) {
      localStorage.setItem('admin_token', d.token);
      localStorage.setItem('admin_username', d.username);
      window.location.href = '/admin?token=' + d.token;
    } else {
      errEl.textContent = d.error || '登录失败';
      btn.textContent = '登 录';
      btn.disabled = false;
    }
  })
  .catch(() => {
    errEl.textContent = '网络错误，请检查服务器是否运行';
    btn.textContent = '登 录';
    btn.disabled = false;
  });
});

// ── Register ──
getEl('registerForm').addEventListener('submit', (e) => {
  e.preventDefault();
  const btn = getEl('registerForm').querySelector('.auth-btn');
  const errEl = getEl('regError');
  const pw = getEl('regPassword').value;
  const confirm = getEl('regConfirm').value;
  if (pw !== confirm) {
    errEl.textContent = '两次密码输入不一致';
    return;
  }
  btn.textContent = '注册中...';
  btn.disabled = true;
  errEl.textContent = '';
  fetch(API_AUTH + '/register', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username: getEl('regUsername').value, email: getEl('regEmail').value, password: pw }),
  })
  .then(r => r.json())
  .then(d => {
    if (d.success) {
      getEl('loginUsername').value = getEl('regUsername').value;
      getEl('loginPassword').value = '';
      document.querySelector('[data-tab="login"]').click();
      getEl('loginError').textContent = '注册成功，请登录';
      getEl('loginError').style.color = '#4cd964';
      // Clear register form
      getEl('regUsername').value = '';
      getEl('regEmail').value = '';
      getEl('regPassword').value = '';
      getEl('regConfirm').value = '';
    } else {
      errEl.textContent = d.error || '注册失败';
    }
    btn.textContent = '注 册';
    btn.disabled = false;
  })
  .catch(() => {
    errEl.textContent = '网络错误，请检查服务器是否运行';
    btn.textContent = '注 册';
    btn.disabled = false;
  });
});

// ── If already logged in, redirect ──
const token = localStorage.getItem('admin_token');
if (token) {
  fetch(API_AUTH + '/verify', { headers: { 'Authorization': 'Bearer ' + token } })
    .then(r => r.json())
    .then(d => { if (d.valid) window.location.href = '/admin?token=' + token; })
    .catch(() => {});
}
