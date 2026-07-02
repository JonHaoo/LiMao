import express from 'express';
import cors from 'cors';
import crypto from 'crypto';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { initDbWithAuth, queryAll, queryOne, doRun, count } from './db.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT_DIR = join(__dirname, '..');
const DIST_DIR = join(ROOT_DIR, 'dist');
const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

// ── Auth Helpers ──
function hashPassword(password) {
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto.scryptSync(password, salt, 64).toString('hex');
  return `${salt}:${hash}`;
}

function verifyPassword(password, stored) {
  const [salt, key] = stored.split(':');
  const hash = crypto.scryptSync(password, salt, 64).toString('hex');
  return crypto.timingSafeEqual(Buffer.from(hash), Buffer.from(key));
}

const sessions = new Map();

function createSession(user) {
  const token = crypto.randomBytes(32).toString('hex');
  sessions.set(token, { userId: user.id, username: user.username, role: user.role, createdAt: Date.now() });
  return token;
}

function getSession(token) {
  return sessions.get(token) || null;
}

// ── Auth Middleware ──
function requireAuth(req, res, next) {
  const token = req.query.token || (req.headers.authorization && req.headers.authorization.startsWith('Bearer ') && req.headers.authorization.slice(7));
  if (!token) return res.status(401).json({ error: '未登录，请先登录' });
  const session = getSession(token);
  if (!session) return res.status(401).json({ error: '登录已过期，请重新登录' });
  req.user = session;
  next();
}

// ── Admin Page Middleware (checks token query param) ──
function requireAdminPage(req, res, next) {
  const token = req.query.token;
  if (!token) return res.redirect('/admin/login');
  const session = getSession(token);
  if (!session) return res.redirect('/admin/login');
  req.user = session;
  next();
}

// ── Auth Routes ──
app.post('/api/auth/register', (req, res) => {
  const { username, email, password } = req.body;
  if (!username || !email || !password) {
    return res.status(400).json({ error: '用户名、邮箱和密码为必填项' });
  }
  if (password.length < 6) {
    return res.status(400).json({ error: '密码至少6位' });
  }
  // Check if any user exists; first user registers, subsequent need admin
  const existingCount = count('SELECT COUNT(*) FROM users');
  if (existingCount > 0) {
    // Require auth for additional registrations
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(403).json({ error: '请联系管理员注册' });
    }
    const token = authHeader.slice(7);
    const session = getSession(token);
    if (!session || session.role !== 'admin') {
      return res.status(403).json({ error: '仅管理员可创建新账号' });
    }
  }
  try {
    const hash = hashPassword(password);
    doRun('INSERT INTO users (username, email, password_hash) VALUES (?, ?, ?)', [username, email, hash]);
    res.json({ success: true });
  } catch (err) {
    if (err.message && err.message.includes('UNIQUE')) {
      return res.status(409).json({ error: '用户名或邮箱已存在' });
    }
    console.error(err);
    res.status(500).json({ error: '注册失败' });
  }
});

app.post('/api/auth/login', (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) {
    return res.status(400).json({ error: '用户名和密码为必填项' });
  }
  try {
    const user = queryOne('SELECT * FROM users WHERE username = ?', [username]);
    if (!user) {
      return res.status(401).json({ error: '用户名或密码错误' });
    }
    if (!verifyPassword(password, user.password_hash)) {
      return res.status(401).json({ error: '用户名或密码错误' });
    }
    const token = createSession(user);
    res.json({ success: true, token, username: user.username, role: user.role });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: '登录失败' });
  }
});

app.get('/api/auth/verify', (req, res) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: '未登录' });
  }
  const token = authHeader.slice(7);
  const session = getSession(token);
  if (!session) {
    return res.status(401).json({ error: '登录已过期' });
  }
  res.json({ valid: true, username: session.username, role: session.role });
});

app.post('/api/auth/logout', (req, res) => {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.slice(7);
    sessions.delete(token);
  }
  res.json({ success: true });
});

// ── Change Password ──
app.post('/api/auth/change-password', requireAuth, (req, res) => {
  const { currentPassword, newPassword } = req.body;
  if (!currentPassword || !newPassword) {
    return res.status(400).json({ error: '当前密码和新密码为必填项' });
  }
  if (newPassword.length < 6) {
    return res.status(400).json({ error: '新密码至少6位' });
  }
  try {
    const user = queryOne('SELECT * FROM users WHERE id = ?', [req.user.userId]);
    if (!user) return res.status(404).json({ error: '用户不存在' });
    if (!verifyPassword(currentPassword, user.password_hash)) {
      return res.status(403).json({ error: '当前密码错误' });
    }
    const hash = hashPassword(newPassword);
    doRun('UPDATE users SET password_hash = ? WHERE id = ?', [hash, req.user.userId]);
    res.json({ success: true, message: '密码修改成功' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: '修改失败' });
  }
});

// ── API Routes ──
app.post('/api/demo', (req, res) => {
  const { name, email, phone, industry } = req.body;
  if (!name || !email || !phone) return res.status(400).json({ error: '姓名、邮箱和手机号为必填项' });
  try {
    const result = doRun('INSERT INTO demo_requests (name, email, phone, industry) VALUES (?, ?, ?, ?)', [name, email, phone, industry || '']);
    res.json({ success: true, id: result.lastInsertRowid });
  } catch (err) { console.error(err); res.status(500).json({ error: '提交失败' }); }
});

app.get('/api/demo', requireAuth, (req, res) => {
  try {
    const { status } = req.query;
    res.json(status ? queryAll('SELECT * FROM demo_requests WHERE status = ? ORDER BY created_at DESC', [status])
                     : queryAll('SELECT * FROM demo_requests ORDER BY created_at DESC'));
  } catch (err) { res.status(500).json({ error: '查询失败' }); }
});

app.patch('/api/demo/:id', requireAuth, (req, res) => {
  const { status } = req.body;
  if (!['pending', 'contacted', 'converted'].includes(status)) return res.status(400).json({ error: '无效状态' });
  try {
    const result = doRun('UPDATE demo_requests SET status = ? WHERE id = ?', [status, req.params.id]);
    if (result.changes === 0) return res.status(404).json({ error: '记录不存在' });
    res.json({ success: true });
  } catch (err) { res.status(500).json({ error: '更新失败' }); }
});

app.delete('/api/demo/:id', requireAuth, (req, res) => {
  try {
    const result = doRun('DELETE FROM demo_requests WHERE id = ?', [req.params.id]);
    if (result.changes === 0) return res.status(404).json({ error: '记录不存在' });
    res.json({ success: true });
  } catch (err) { res.status(500).json({ error: '删除失败' }); }
});

app.get('/api/demo/stats', requireAuth, (req, res) => {
  try {
    res.json({
      total: count('SELECT COUNT(*) FROM demo_requests'),
      pending: count("SELECT COUNT(*) FROM demo_requests WHERE status = 'pending'"),
      contacted: count("SELECT COUNT(*) FROM demo_requests WHERE status = 'contacted'"),
      today: count("SELECT COUNT(*) FROM demo_requests WHERE date(created_at) = date('now', '+8 hours')"),
    });
  } catch (err) { res.status(500).json({ error: '查询失败' }); }
});

// ── Admin Routes ──
app.get('/admin/login', (req, res) => res.sendFile(join(__dirname, 'admin', 'login.html')));
app.get('/admin/login.css', (req, res) => res.sendFile(join(__dirname, 'admin', 'login.css')));
app.get('/admin/login.js', (req, res) => res.sendFile(join(__dirname, 'admin', 'login.js')));
app.get('/admin', requireAdminPage, (req, res) => res.sendFile(join(__dirname, 'admin', 'index.html')));
app.get('/admin/index.html', requireAdminPage, (req, res) => res.sendFile(join(__dirname, 'admin', 'index.html')));
app.get('/admin/style.css', (req, res) => res.sendFile(join(__dirname, 'admin', 'style.css')));
app.get('/admin/app.js', (req, res) => res.sendFile(join(__dirname, 'admin', 'app.js')));

// ── Built Frontend ──
app.use(express.static(DIST_DIR));

// SPA fallback: serve index.html for all non-API/non-admin routes
app.get('*', (req, res) => {
  if (req.path.startsWith('/api/') || req.path.startsWith('/admin')) return;
  res.sendFile(join(DIST_DIR, 'index.html'), err => {
    if (err) res.status(404).send('Frontend not built yet. Run: cd .. && npx vite build');
  });
});

// ── Start ──
initDbWithAuth().then(() => {
  app.listen(PORT, () => {
    console.log('LiMao production server running on port', PORT);
    console.log('First start: register an admin at http://localhost:' + PORT + '/admin/login');
    console.log('Admin: http://localhost:' + PORT + '/admin');
  });
}).catch(err => { console.error('Failed to init DB:', err); process.exit(1); });
