import express from 'express';
import cors from 'cors';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT_DIR = join(__dirname, '..');
const DIST_DIR = join(ROOT_DIR, 'dist');
const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

// ── API Routes ──
app.post('/api/demo', (req, res) => {
  const { name, email, phone, industry } = req.body;
  if (!name || !email || !phone) return res.status(400).json({ error: '姓名、邮箱和手机号为必填项' });
  try {
    const result = doRun('INSERT INTO demo_requests (name, email, phone, industry) VALUES (?, ?, ?, ?)', [name, email, phone, industry || '']);
    res.json({ success: true, id: result.lastInsertRowid });
  } catch (err) { console.error(err); res.status(500).json({ error: '提交失败' }); }
});

  try {
    const { status } = req.query;
    res.json(status ? queryAll('SELECT * FROM demo_requests WHERE status = ? ORDER BY created_at DESC', [status])
                     : queryAll('SELECT * FROM demo_requests ORDER BY created_at DESC'));
  } catch (err) { res.status(500).json({ error: '查询失败' }); }
});

  const { status } = req.body;
  if (!['pending', 'contacted', 'converted'].includes(status)) return res.status(400).json({ error: '无效状态' });
  try {
    const result = doRun('UPDATE demo_requests SET status = ? WHERE id = ?', [status, req.params.id]);
    if (result.changes === 0) return res.status(404).json({ error: '记录不存在' });
    res.json({ success: true });
  } catch (err) { res.status(500).json({ error: '更新失败' }); }
});

  try {
    const result = doRun('DELETE FROM demo_requests WHERE id = ?', [req.params.id]);
    if (result.changes === 0) return res.status(404).json({ error: '记录不存在' });
    res.json({ success: true });
  } catch (err) { res.status(500).json({ error: '删除失败' }); }
});

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
    console.log('Admin: http://localhost:' + PORT + '/admin');
  });
}).catch(err => { console.error('Failed to init DB:', err); process.exit(1); });
