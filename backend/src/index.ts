import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import { PrismaClient } from '@prisma/client';

const app = express();
const prisma = new PrismaClient();
const PORT = process.env.PORT || 3001;
const ADMIN_KEY = process.env.ADMIN_KEY || 'changeme';

// Middleware
app.use(cors());
app.use(express.json({ limit: '5mb' }));

// Admin auth middleware
function requireAdmin(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  const key = authHeader?.replace('Bearer ', '') || req.query.key as string;
  
  if (key !== ADMIN_KEY) {
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }
  next();
}

// Health check
app.get('/health', (req: Request, res: Response) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// =====================================================
// Admin Page
// =====================================================

const ADMIN_HTML = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Logic Checker Admin</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap" rel="stylesheet">
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    
    body {
      font-family: 'Inter', -apple-system, sans-serif;
      background: linear-gradient(135deg, #0f0f0f 0%, #1a1a2e 50%, #16213e 100%);
      min-height: 100vh;
      color: #e4e4e7;
    }
    
    .login-container {
      display: flex;
      align-items: center;
      justify-content: center;
      min-height: 100vh;
      padding: 20px;
    }
    
    .login-box {
      background: rgba(30, 30, 40, 0.8);
      backdrop-filter: blur(20px);
      border: 1px solid rgba(255, 255, 255, 0.1);
      border-radius: 16px;
      padding: 40px;
      width: 100%;
      max-width: 400px;
      box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);
    }
    
    .login-title {
      font-size: 24px;
      font-weight: 700;
      text-align: center;
      margin-bottom: 8px;
      background: linear-gradient(135deg, #f97316, #fb923c);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
    }
    
    .login-subtitle {
      text-align: center;
      color: #71717a;
      margin-bottom: 32px;
      font-size: 14px;
    }
    
    .form-group {
      margin-bottom: 20px;
    }
    
    .form-label {
      display: block;
      font-size: 12px;
      font-weight: 600;
      color: #a1a1aa;
      margin-bottom: 8px;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    
    .form-input {
      width: 100%;
      padding: 12px 16px;
      background: rgba(0, 0, 0, 0.3);
      border: 1px solid rgba(255, 255, 255, 0.1);
      border-radius: 8px;
      color: #fff;
      font-size: 14px;
      font-family: 'JetBrains Mono', monospace;
      transition: border-color 0.2s, box-shadow 0.2s;
    }
    
    .form-input:focus {
      outline: none;
      border-color: #f97316;
      box-shadow: 0 0 0 3px rgba(249, 115, 22, 0.2);
    }
    
    .btn {
      width: 100%;
      padding: 14px 20px;
      background: linear-gradient(135deg, #f97316, #ea580c);
      border: none;
      border-radius: 8px;
      color: white;
      font-size: 14px;
      font-weight: 600;
      cursor: pointer;
      transition: transform 0.2s, box-shadow 0.2s;
    }
    
    .btn:hover {
      transform: translateY(-2px);
      box-shadow: 0 10px 20px rgba(249, 115, 22, 0.3);
    }
    
    .error-msg {
      color: #ef4444;
      font-size: 13px;
      text-align: center;
      margin-top: 16px;
      display: none;
    }
    
    /* Dashboard styles */
    .dashboard { display: none; }
    .dashboard.active { display: block; }
    .login-container.hidden { display: none; }
    
    .header {
      background: rgba(30, 30, 40, 0.9);
      backdrop-filter: blur(20px);
      border-bottom: 1px solid rgba(255, 255, 255, 0.1);
      padding: 16px 24px;
      position: sticky;
      top: 0;
      z-index: 100;
    }
    
    .header-inner {
      max-width: 1200px;
      margin: 0 auto;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    
    .header-title {
      font-size: 20px;
      font-weight: 700;
      background: linear-gradient(135deg, #f97316, #fb923c);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
    }
    
    .logout-btn {
      background: rgba(255, 255, 255, 0.1);
      border: 1px solid rgba(255, 255, 255, 0.2);
      color: #e4e4e7;
      padding: 8px 16px;
      border-radius: 6px;
      font-size: 13px;
      cursor: pointer;
      transition: background 0.2s;
    }
    
    .logout-btn:hover {
      background: rgba(255, 255, 255, 0.15);
    }
    
    .container {
      max-width: 1200px;
      margin: 0 auto;
      padding: 24px;
    }
    
    .stats-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 16px;
      margin-bottom: 32px;
    }
    
    .stat-card {
      background: rgba(30, 30, 40, 0.6);
      border: 1px solid rgba(255, 255, 255, 0.1);
      border-radius: 12px;
      padding: 20px;
    }
    
    .stat-value {
      font-size: 36px;
      font-weight: 700;
      color: #f97316;
      font-family: 'JetBrains Mono', monospace;
    }
    
    .stat-label {
      font-size: 13px;
      color: #71717a;
      margin-top: 4px;
    }
    
    .section-title {
      font-size: 18px;
      font-weight: 600;
      margin-bottom: 16px;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    
    .export-btn {
      background: rgba(34, 197, 94, 0.2);
      border: 1px solid rgba(34, 197, 94, 0.3);
      color: #22c55e;
      padding: 8px 16px;
      border-radius: 6px;
      font-size: 13px;
      cursor: pointer;
      text-decoration: none;
      transition: background 0.2s;
    }
    
    .export-btn:hover {
      background: rgba(34, 197, 94, 0.3);
    }
    
    .annotations-list {
      display: flex;
      flex-direction: column;
      gap: 12px;
    }
    
    .annotation-card {
      background: rgba(30, 30, 40, 0.6);
      border: 1px solid rgba(255, 255, 255, 0.1);
      border-radius: 12px;
      padding: 20px;
      transition: border-color 0.2s;
    }
    
    .annotation-card:hover {
      border-color: rgba(249, 115, 22, 0.3);
    }
    
    .annotation-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 12px;
    }
    
    .annotation-type {
      background: rgba(249, 115, 22, 0.2);
      color: #fb923c;
      padding: 4px 10px;
      border-radius: 20px;
      font-size: 12px;
      font-weight: 500;
    }
    
    .annotation-date {
      color: #71717a;
      font-size: 12px;
      font-family: 'JetBrains Mono', monospace;
    }
    
    .annotation-quote {
      background: rgba(0, 0, 0, 0.3);
      border-left: 3px solid #f97316;
      padding: 12px 16px;
      margin-bottom: 12px;
      border-radius: 4px;
      font-style: italic;
      color: #a1a1aa;
      font-size: 14px;
      line-height: 1.6;
    }
    
    .annotation-text {
      font-size: 14px;
      line-height: 1.6;
      color: #e4e4e7;
      margin-bottom: 12px;
    }
    
    .annotation-url {
      font-size: 12px;
      color: #71717a;
      font-family: 'JetBrains Mono', monospace;
      word-break: break-all;
    }
    
    .annotation-url a {
      color: #60a5fa;
      text-decoration: none;
    }
    
    .annotation-url a:hover {
      text-decoration: underline;
    }
    
    .delete-btn {
      background: rgba(239, 68, 68, 0.2);
      border: 1px solid rgba(239, 68, 68, 0.3);
      color: #ef4444;
      padding: 6px 12px;
      border-radius: 4px;
      font-size: 12px;
      cursor: pointer;
      transition: background 0.2s;
    }
    
    .delete-btn:hover {
      background: rgba(239, 68, 68, 0.3);
    }
    
    .empty-state {
      text-align: center;
      padding: 60px 20px;
      color: #71717a;
    }
    
    .empty-state-icon {
      font-size: 48px;
      margin-bottom: 16px;
    }
    
    .pagination {
      display: flex;
      justify-content: center;
      gap: 8px;
      margin-top: 24px;
    }
    
    .page-btn {
      background: rgba(255, 255, 255, 0.1);
      border: 1px solid rgba(255, 255, 255, 0.2);
      color: #e4e4e7;
      padding: 8px 16px;
      border-radius: 6px;
      cursor: pointer;
      transition: background 0.2s;
    }
    
    .page-btn:hover:not(:disabled) {
      background: rgba(255, 255, 255, 0.15);
    }
    
    .page-btn:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }
    
    .loading {
      text-align: center;
      padding: 40px;
      color: #71717a;
    }
  </style>
</head>
<body>
  <div class="login-container" id="loginContainer">
    <div class="login-box">
      <h1 class="login-title">⚖️ Logic Checker</h1>
      <p class="login-subtitle">Admin Dashboard</p>
      
      <form id="loginForm">
        <div class="form-group">
          <label class="form-label">Admin Key</label>
          <input type="password" class="form-input" id="adminKey" placeholder="Enter admin key..." required>
        </div>
        <button type="submit" class="btn">Sign In</button>
        <p class="error-msg" id="errorMsg">Invalid admin key</p>
      </form>
    </div>
  </div>
  
  <div class="dashboard" id="dashboard">
    <header class="header">
      <div class="header-inner">
        <h1 class="header-title">⚖️ Logic Checker Admin</h1>
        <button class="logout-btn" onclick="logout()">Logout</button>
      </div>
    </header>
    
    <div class="container">
      <div class="stats-grid" id="statsGrid">
        <div class="stat-card">
          <div class="stat-value" id="totalCount">-</div>
          <div class="stat-label">Total Annotations</div>
        </div>
        <div class="stat-card">
          <div class="stat-value" id="todayCount">-</div>
          <div class="stat-label">Last 24 Hours</div>
        </div>
        <div class="stat-card">
          <div class="stat-value" id="typesCount">-</div>
          <div class="stat-label">Fallacy Types</div>
        </div>
      </div>
      
      <div class="section-title">
        <span>Recent Annotations</span>
        <a href="#" class="export-btn" id="exportBtn">📥 Export JSONL</a>
      </div>
      
      <div class="annotations-list" id="annotationsList">
        <div class="loading">Loading annotations...</div>
      </div>
      
      <div class="pagination" id="pagination"></div>
    </div>
  </div>

  <script>
    let adminKey = '';
    let currentPage = 0;
    const limit = 20;
    
    document.getElementById('loginForm').addEventListener('submit', async (e) => {
      e.preventDefault();
      adminKey = document.getElementById('adminKey').value;
      
      try {
        const res = await fetch('/admin/verify', {
          headers: { 'Authorization': 'Bearer ' + adminKey }
        });
        
        if (res.ok) {
          document.getElementById('loginContainer').classList.add('hidden');
          document.getElementById('dashboard').classList.add('active');
          loadDashboard();
        } else {
          document.getElementById('errorMsg').style.display = 'block';
        }
      } catch (err) {
        document.getElementById('errorMsg').style.display = 'block';
      }
    });
    
    function logout() {
      adminKey = '';
      document.getElementById('loginContainer').classList.remove('hidden');
      document.getElementById('dashboard').classList.remove('active');
      document.getElementById('adminKey').value = '';
    }
    
    async function loadDashboard() {
      await loadStats();
      await loadAnnotations();
    }
    
    async function loadStats() {
      try {
        const res = await fetch('/stats');
        const data = await res.json();
        
        document.getElementById('totalCount').textContent = data.total || 0;
        document.getElementById('todayCount').textContent = data.last24h || 0;
        document.getElementById('typesCount').textContent = data.byFallacyType?.length || 0;
      } catch (err) {
        console.error('Failed to load stats:', err);
      }
    }
    
    async function loadAnnotations() {
      const list = document.getElementById('annotationsList');
      list.innerHTML = '<div class="loading">Loading...</div>';
      
      try {
        const res = await fetch('/annotations?limit=' + limit + '&offset=' + (currentPage * limit));
        const data = await res.json();
        
        if (!data.annotations || data.annotations.length === 0) {
          list.innerHTML = '<div class="empty-state"><div class="empty-state-icon">📭</div><p>No annotations yet</p></div>';
          return;
        }
        
        list.innerHTML = data.annotations.map(ann => \`
          <div class="annotation-card" data-id="\${ann.id}">
            <div class="annotation-header">
              <span class="annotation-type">\${ann.fallacyType || 'unspecified'}</span>
              <span class="annotation-date">\${new Date(ann.createdAt).toLocaleString()}</span>
            </div>
            <div class="annotation-quote">\${escapeHtml(ann.quote)}</div>
            <div class="annotation-text">\${escapeHtml(ann.annotation)}</div>
            <div class="annotation-url">
              <a href="\${ann.url}" target="_blank">\${ann.url}</a>
            </div>
            <div style="margin-top: 12px; text-align: right;">
              <button class="delete-btn" onclick="deleteAnnotation('\${ann.id}')">Delete</button>
            </div>
          </div>
        \`).join('');
        
        renderPagination(data.total);
      } catch (err) {
        list.innerHTML = '<div class="empty-state"><div class="empty-state-icon">⚠️</div><p>Failed to load annotations</p></div>';
      }
    }
    
    function renderPagination(total) {
      const totalPages = Math.ceil(total / limit);
      const pagination = document.getElementById('pagination');
      
      if (totalPages <= 1) {
        pagination.innerHTML = '';
        return;
      }
      
      pagination.innerHTML = \`
        <button class="page-btn" onclick="changePage(-1)" \${currentPage === 0 ? 'disabled' : ''}>← Prev</button>
        <span style="padding: 8px 16px; color: #71717a;">Page \${currentPage + 1} of \${totalPages}</span>
        <button class="page-btn" onclick="changePage(1)" \${currentPage >= totalPages - 1 ? 'disabled' : ''}>Next →</button>
      \`;
    }
    
    function changePage(delta) {
      currentPage += delta;
      loadAnnotations();
    }
    
    async function deleteAnnotation(id) {
      if (!confirm('Delete this annotation?')) return;
      
      try {
        const res = await fetch('/admin/annotations/' + id, {
          method: 'DELETE',
          headers: { 'Authorization': 'Bearer ' + adminKey }
        });
        
        if (res.ok) {
          loadStats();
          loadAnnotations();
        } else {
          alert('Failed to delete');
        }
      } catch (err) {
        alert('Failed to delete: ' + err.message);
      }
    }
    
    document.getElementById('exportBtn').addEventListener('click', (e) => {
      e.preventDefault();
      window.open('/export?key=' + adminKey, '_blank');
    });
    
    function escapeHtml(text) {
      const div = document.createElement('div');
      div.textContent = text || '';
      return div.innerHTML;
    }
  </script>
</body>
</html>
`;

// Serve admin page
app.get('/admin', (req: Request, res: Response) => {
  res.setHeader('Content-Type', 'text/html');
  res.send(ADMIN_HTML);
});

// Verify admin key
app.get('/admin/verify', requireAdmin, (req: Request, res: Response) => {
  res.json({ success: true });
});

// Delete annotation (admin only)
app.delete('/admin/annotations/:id', requireAdmin, async (req: Request, res: Response, next: NextFunction) => {
  try {
    await prisma.annotation.delete({
      where: { id: req.params.id }
    });
    res.json({ success: true });
  } catch (error) {
    next(error);
  }
});

// =====================================================
// Public API
// =====================================================

// Submit an annotation
app.post('/annotations', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { url, title, quote, annotation, fallacyType, userId } = req.body;
    
    // Validation
    if (!url || !quote || !annotation) {
      res.status(400).json({ 
        error: 'Missing required fields: url, quote, annotation' 
      });
      return;
    }
    
    const userAgent = req.headers['user-agent'] || null;
    
    const created = await prisma.annotation.create({
      data: {
        url,
        title: title || null,
        quote,
        annotation,
        fallacyType: fallacyType || null,
        userId: userId || null,
        userAgent,
      }
    });
    
    console.log(`New annotation: ${created.id} for ${url}`);
    
    res.status(201).json({ 
      success: true, 
      id: created.id,
      createdAt: created.createdAt
    });
  } catch (error) {
    next(error);
  }
});

// Get all annotations (for later use in prompt engineering)
app.get('/annotations', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const limit = Math.min(parseInt(req.query.limit as string) || 100, 1000);
    const offset = parseInt(req.query.offset as string) || 0;
    const fallacyType = req.query.fallacyType as string | undefined;
    
    const where = fallacyType ? { fallacyType } : {};
    
    const [annotations, total] = await Promise.all([
      prisma.annotation.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip: offset,
      }),
      prisma.annotation.count({ where })
    ]);
    
    res.json({
      annotations,
      total,
      limit,
      offset
    });
  } catch (error) {
    next(error);
  }
});

// Get annotations for a specific URL
app.get('/annotations/by-url', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const url = req.query.url as string;
    
    if (!url) {
      res.status(400).json({ error: 'Missing url parameter' });
      return;
    }
    
    const annotations = await prisma.annotation.findMany({
      where: { url },
      orderBy: { createdAt: 'desc' }
    });
    
    res.json({ annotations });
  } catch (error) {
    next(error);
  }
});

// Get stats
app.get('/stats', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const [total, byType, recentCount] = await Promise.all([
      prisma.annotation.count(),
      prisma.annotation.groupBy({
        by: ['fallacyType'],
        _count: true,
        orderBy: { _count: { fallacyType: 'desc' } }
      }),
      prisma.annotation.count({
        where: {
          createdAt: {
            gte: new Date(Date.now() - 24 * 60 * 60 * 1000) // last 24h
          }
        }
      })
    ]);
    
    res.json({
      total,
      last24h: recentCount,
      byFallacyType: byType.map(b => ({
        type: b.fallacyType || 'unspecified',
        count: b._count
      }))
    });
  } catch (error) {
    next(error);
  }
});

// Export annotations as JSONL (for prompt engineering) - requires admin key
app.get('/export', requireAdmin, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const annotations = await prisma.annotation.findMany({
      orderBy: { createdAt: 'asc' },
      select: {
        url: true,
        quote: true,
        annotation: true,
        fallacyType: true,
        createdAt: true
      }
    });
    
    res.setHeader('Content-Type', 'application/jsonl');
    res.setHeader('Content-Disposition', 'attachment; filename=annotations.jsonl');
    
    for (const ann of annotations) {
      res.write(JSON.stringify(ann) + '\n');
    }
    res.end();
  } catch (error) {
    next(error);
  }
});

// Error handler
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  console.error('Error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('SIGTERM received, shutting down...');
  await prisma.$disconnect();
  process.exit(0);
});

// Start server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Health check: http://localhost:${PORT}/health`);
  console.log(`Admin panel: http://localhost:${PORT}/admin`);
});
