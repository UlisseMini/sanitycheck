// ABOUTME: Admin dashboard HTML generator.
// ABOUTME: Renders the admin login and dashboard UI.

export function generateAdminPage(): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>SanityCheck Admin</title>
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

    /* Tabs */
    .tabs {
      display: flex;
      gap: 4px;
      margin-bottom: 24px;
      background: rgba(30, 30, 40, 0.6);
      padding: 4px;
      border-radius: 10px;
      width: fit-content;
    }

    .tab-btn {
      background: transparent;
      border: none;
      color: #71717a;
      padding: 10px 20px;
      border-radius: 6px;
      cursor: pointer;
      font-size: 14px;
      font-weight: 500;
      transition: all 0.2s;
    }

    .tab-btn:hover {
      color: #e4e4e7;
    }

    .tab-btn.active {
      background: rgba(249, 115, 22, 0.2);
      color: #fb923c;
    }

    .tab-content {
      display: none;
    }

    .tab-content.active {
      display: block;
    }

    /* Debug Logs */
    .filters {
      display: flex;
      gap: 12px;
      margin-bottom: 20px;
      flex-wrap: wrap;
      align-items: center;
    }

    .filter-group {
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .filter-label {
      font-size: 12px;
      color: #71717a;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }

    .filter-select, .filter-input {
      background: rgba(0, 0, 0, 0.3);
      border: 1px solid rgba(255, 255, 255, 0.1);
      border-radius: 6px;
      padding: 8px 12px;
      color: #e4e4e7;
      font-size: 13px;
      min-width: 120px;
    }

    .filter-select:focus, .filter-input:focus {
      outline: none;
      border-color: #f97316;
    }

    .time-shortcuts {
      display: flex;
      gap: 6px;
    }

    .time-btn {
      background: rgba(255, 255, 255, 0.1);
      border: 1px solid rgba(255, 255, 255, 0.1);
      color: #a1a1aa;
      padding: 6px 12px;
      border-radius: 4px;
      font-size: 12px;
      cursor: pointer;
      transition: all 0.2s;
    }

    .time-btn:hover, .time-btn.active {
      background: rgba(249, 115, 22, 0.2);
      border-color: rgba(249, 115, 22, 0.3);
      color: #fb923c;
    }

    .log-entry {
      background: rgba(30, 30, 40, 0.6);
      border: 1px solid rgba(255, 255, 255, 0.1);
      border-radius: 8px;
      padding: 14px 18px;
      margin-bottom: 8px;
      font-family: 'JetBrains Mono', monospace;
      font-size: 12px;
    }

    .log-entry.level-error {
      border-left: 3px solid #ef4444;
    }

    .log-entry.level-warn {
      border-left: 3px solid #eab308;
    }

    .log-entry.level-log {
      border-left: 3px solid #22c55e;
    }

    .log-entry.level-debug {
      border-left: 3px solid #6b7280;
    }

    .log-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 8px;
    }

    .log-meta {
      display: flex;
      gap: 12px;
      color: #71717a;
      font-size: 11px;
    }

    .log-level {
      padding: 2px 8px;
      border-radius: 4px;
      font-size: 10px;
      font-weight: 600;
      text-transform: uppercase;
    }

    .log-level.error { background: rgba(239, 68, 68, 0.2); color: #ef4444; }
    .log-level.warn { background: rgba(234, 179, 8, 0.2); color: #eab308; }
    .log-level.log { background: rgba(34, 197, 94, 0.2); color: #22c55e; }
    .log-level.debug { background: rgba(107, 114, 128, 0.2); color: #9ca3af; }

    .log-message {
      color: #e4e4e7;
      margin-bottom: 6px;
      word-break: break-word;
    }

    .log-data {
      background: rgba(0, 0, 0, 0.3);
      padding: 10px;
      border-radius: 4px;
      overflow-x: auto;
      color: #a1a1aa;
      white-space: pre-wrap;
      max-height: 200px;
      overflow-y: auto;
    }

    .log-source {
      color: #60a5fa;
    }

    .log-ip {
      color: #c084fc;
    }

    .log-version {
      color: #22c55e;
    }

    .clear-logs-btn {
      background: rgba(239, 68, 68, 0.2);
      border: 1px solid rgba(239, 68, 68, 0.3);
      color: #ef4444;
      padding: 8px 16px;
      border-radius: 6px;
      font-size: 13px;
      cursor: pointer;
      margin-left: auto;
    }

    .clear-logs-btn:hover {
      background: rgba(239, 68, 68, 0.3);
    }

    .refresh-btn {
      background: rgba(59, 130, 246, 0.2);
      border: 1px solid rgba(59, 130, 246, 0.3);
      color: #60a5fa;
      padding: 8px 16px;
      border-radius: 6px;
      font-size: 13px;
      cursor: pointer;
    }

    .refresh-btn:hover {
      background: rgba(59, 130, 246, 0.3);
    }

    /* Article Modal */
    .article-modal {
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(0, 0, 0, 0.8);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 1000;
      padding: 20px;
    }

    .article-modal-content {
      background: #1a1a2e;
      border: 1px solid rgba(255, 255, 255, 0.1);
      border-radius: 16px;
      max-width: 900px;
      width: 100%;
      max-height: 90vh;
      overflow: hidden;
      display: flex;
      flex-direction: column;
    }

    .article-modal-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 20px 24px;
      border-bottom: 1px solid rgba(255, 255, 255, 0.1);
    }

    .article-modal-header h2 {
      font-size: 18px;
      color: #f97316;
      margin: 0;
    }

    .article-modal-body {
      padding: 24px;
      overflow-y: auto;
      flex: 1;
    }

    .articles-list, .comments-list, .signups-list {
      display: flex;
      flex-direction: column;
      gap: 12px;
    }
  </style>
</head>
<body>
  <div class="login-container" id="loginContainer">
    <div class="login-box">
      <h1 class="login-title">SanityCheck</h1>
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
        <h1 class="header-title">SanityCheck Admin</h1>
        <button class="logout-btn" onclick="logout()">Logout</button>
      </div>
    </header>

    <div class="container">
      <div class="tabs">
        <button class="tab-btn active" onclick="switchTab('articles')">Articles</button>
        <button class="tab-btn" onclick="switchTab('comments')">Comments</button>
        <button class="tab-btn" onclick="switchTab('early-access')">Early Access</button>
        <button class="tab-btn" onclick="switchTab('logs')">Debug Logs</button>
      </div>

      <!-- Articles Tab -->
      <div class="tab-content active" id="tab-articles">
        <div class="stats-grid" id="statsGrid">
          <div class="stat-card">
            <div class="stat-value" id="articleCount">-</div>
            <div class="stat-label">Total Articles</div>
          </div>
          <div class="stat-card">
            <div class="stat-value" id="analysisCount">-</div>
            <div class="stat-label">Analyses</div>
          </div>
          <div class="stat-card">
            <div class="stat-value" id="commentCount">-</div>
            <div class="stat-label">Comments</div>
          </div>
          <div class="stat-card">
            <div class="stat-value" id="highlightCount">-</div>
            <div class="stat-label">Highlights</div>
          </div>
        </div>

        <div class="section-title">
          <span>Recent Articles</span>
        </div>

        <div class="articles-list" id="articlesList">
          <div class="loading">Loading articles...</div>
        </div>

        <div class="pagination" id="articlesPagination"></div>
      </div>

      <!-- Comments Tab -->
      <div class="tab-content" id="tab-comments">
        <div class="section-title">
          <span>User Feedback</span>
        </div>

        <div class="comments-list" id="commentsList">
          <div class="loading">Loading comments...</div>
        </div>

        <div class="pagination" id="commentsPagination"></div>
      </div>

      <!-- Early Access Tab -->
      <div class="tab-content" id="tab-early-access">
        <div class="section-title">
          <span>Early Access Signups</span>
        </div>

        <div class="signups-list" id="signupsList">
          <div class="loading">Loading signups...</div>
        </div>

        <div class="pagination" id="signupsPagination"></div>
      </div>

      <!-- Debug Logs Tab -->
      <div class="tab-content" id="tab-logs">
        <div class="filters">
          <div class="filter-group">
            <span class="filter-label">Time:</span>
            <div class="time-shortcuts">
              <button class="time-btn active" data-since="5m">5m</button>
              <button class="time-btn" data-since="15m">15m</button>
              <button class="time-btn" data-since="1h">1h</button>
              <button class="time-btn" data-since="6h">6h</button>
              <button class="time-btn" data-since="24h">24h</button>
              <button class="time-btn" data-since="">All</button>
            </div>
          </div>

          <div class="filter-group">
            <span class="filter-label">IP:</span>
            <select class="filter-select" id="ipFilter">
              <option value="">All IPs</option>
            </select>
          </div>

          <div class="filter-group">
            <span class="filter-label">Level:</span>
            <select class="filter-select" id="levelFilter">
              <option value="">All Levels</option>
              <option value="error">Error</option>
              <option value="warn">Warn</option>
              <option value="log">Log</option>
              <option value="debug">Debug</option>
            </select>
          </div>

          <button class="refresh-btn" onclick="loadDebugLogs()">Refresh</button>
          <button class="clear-logs-btn" onclick="clearOldLogs()">Clear Old</button>
        </div>

        <div class="section-title">
          <span>Debug Logs</span>
          <span id="logCount" style="color: #71717a; font-size: 13px;">-</span>
        </div>

        <div id="debugLogsList">
          <div class="loading">Loading logs...</div>
        </div>

        <div class="pagination" id="logsPagination"></div>
      </div>
    </div>
  </div>

  <script>
    let adminKey = '';
    let currentPage = 0;
    const limit = 20;
    const STORAGE_KEY = 'logicCheckerAdminKey';

    // Check for stored admin key on page load
    window.addEventListener('DOMContentLoaded', () => {
      const storedKey = localStorage.getItem(STORAGE_KEY);
      if (storedKey) {
        adminKey = storedKey;
        // Try to verify the stored key
        verifyAndLogin(storedKey);
      }
    });

    async function verifyAndLogin(key) {
      try {
        const res = await fetch('/admin/verify', {
          headers: { 'Authorization': 'Bearer ' + key }
        });

        if (res.ok) {
          adminKey = key;
          localStorage.setItem(STORAGE_KEY, key);
          document.getElementById('loginContainer').classList.add('hidden');
          document.getElementById('dashboard').classList.add('active');
          loadDashboard();
        } else {
          // Stored key is invalid, clear it
          localStorage.removeItem(STORAGE_KEY);
          adminKey = '';
        }
      } catch (err) {
        // Network error, clear stored key
        localStorage.removeItem(STORAGE_KEY);
        adminKey = '';
      }
    }

    document.getElementById('loginForm').addEventListener('submit', async (e) => {
      e.preventDefault();
      const key = document.getElementById('adminKey').value;
      await verifyAndLogin(key);

      if (!adminKey) {
        document.getElementById('errorMsg').style.display = 'block';
      }
    });

    function logout() {
      adminKey = '';
      localStorage.removeItem(STORAGE_KEY);
      document.getElementById('loginContainer').classList.remove('hidden');
      document.getElementById('dashboard').classList.remove('active');
      document.getElementById('adminKey').value = '';
      document.getElementById('errorMsg').style.display = 'none';
    }

    async function loadDashboard() {
      await loadFeedbackStats();
      await loadArticles();
    }

    async function loadFeedbackStats() {
      try {
        const res = await fetch('/admin/feedback-stats', {
          headers: { 'Authorization': 'Bearer ' + adminKey }
        });
        const data = await res.json();

        document.getElementById('articleCount').textContent = data.articles || 0;
        document.getElementById('analysisCount').textContent = data.analyses || 0;
        document.getElementById('commentCount').textContent = data.comments || 0;
        document.getElementById('highlightCount').textContent = data.highlights || 0;
      } catch (err) {
        console.error('Failed to load stats:', err);
      }
    }

    // Articles
    let articlesPage = 0;

    async function loadArticles() {
      const list = document.getElementById('articlesList');
      list.innerHTML = '<div class="loading">Loading...</div>';

      try {
        const res = await fetch('/admin/articles?limit=' + limit + '&offset=' + (articlesPage * limit), {
          headers: { 'Authorization': 'Bearer ' + adminKey }
        });
        const data = await res.json();

        if (!data.articles || data.articles.length === 0) {
          list.innerHTML = '<div class="empty-state"><p>No articles yet</p></div>';
          return;
        }

        list.innerHTML = data.articles.map(article => \`
          <div class="annotation-card" data-id="\${article.id}">
            <div class="annotation-header">
              <span class="annotation-type">\${article.analysisCount} analyses · \${article.commentCount} comments</span>
              <span class="annotation-date">\${new Date(article.createdAt).toLocaleString()}</span>
            </div>
            <div style="font-weight: 600; margin-bottom: 8px;">\${escapeHtml(article.title || 'Untitled')}</div>
            <div class="annotation-quote">\${escapeHtml(article.textPreview)}</div>
            \${article.latestAnalysis ? \`
              <div style="margin-top: 8px; font-size: 12px; color: #71717a;">
                Latest: <span style="color: \${article.latestAnalysis.severity === 'significant' ? '#ef4444' : article.latestAnalysis.severity === 'moderate' ? '#eab308' : '#22c55e'}">\${article.latestAnalysis.severity || 'none'}</span>
                · \${article.latestAnalysis.highlightCount} highlights
              </div>
            \` : ''}
            <div class="annotation-url">
              <a href="\${article.url}" target="_blank">\${article.url}</a>
            </div>
            <div style="margin-top: 12px; text-align: right;">
              <button class="page-btn" onclick="viewArticle('\${article.id}')" style="margin-right: 8px;">View Details</button>
              <button class="delete-btn" onclick="deleteArticle('\${article.id}')">Delete</button>
            </div>
          </div>
        \`).join('');

        renderArticlesPagination(data.total);
      } catch (err) {
        list.innerHTML = '<div class="empty-state"><p>Failed to load articles</p></div>';
      }
    }

    function renderArticlesPagination(total) {
      const totalPages = Math.ceil(total / limit);
      const pagination = document.getElementById('articlesPagination');

      if (totalPages <= 1) {
        pagination.innerHTML = '';
        return;
      }

      pagination.innerHTML = \`
        <button class="page-btn" onclick="changeArticlesPage(-1)" \${articlesPage === 0 ? 'disabled' : ''}>← Prev</button>
        <span style="padding: 8px 16px; color: #71717a;">Page \${articlesPage + 1} of \${totalPages}</span>
        <button class="page-btn" onclick="changeArticlesPage(1)" \${articlesPage >= totalPages - 1 ? 'disabled' : ''}>Next →</button>
      \`;
    }

    function changeArticlesPage(delta) {
      articlesPage += delta;
      loadArticles();
    }

    async function deleteArticle(id) {
      if (!confirm('Delete this article and all its analyses/comments?')) return;

      try {
        const res = await fetch('/admin/articles/' + id, {
          method: 'DELETE',
          headers: { 'Authorization': 'Bearer ' + adminKey }
        });

        if (res.ok) {
          loadFeedbackStats();
          loadArticles();
        } else {
          alert('Failed to delete');
        }
      } catch (err) {
        alert('Failed to delete: ' + err.message);
      }
    }

    async function viewArticle(id) {
      try {
        const res = await fetch('/admin/articles/' + id, {
          headers: { 'Authorization': 'Bearer ' + adminKey }
        });
        const data = await res.json();
        const article = data.article;

        // Show in modal or new view
        const modal = document.createElement('div');
        modal.className = 'article-modal';
        modal.innerHTML = \`
          <div class="article-modal-content">
            <div class="article-modal-header">
              <h2>\${escapeHtml(article.title || 'Article Details')}</h2>
              <button onclick="this.closest('.article-modal').remove()" style="background: none; border: none; color: #fff; font-size: 24px; cursor: pointer;">×</button>
            </div>
            <div class="article-modal-body">
              <div style="margin-bottom: 16px;">
                <a href="\${article.url}" target="_blank" style="color: #60a5fa;">\${article.url}</a>
                <span style="color: #71717a; margin-left: 12px;">\${new Date(article.createdAt).toLocaleString()}</span>
              </div>

              <h3 style="margin: 20px 0 12px; color: #f97316;">Article Text</h3>
              <div style="background: rgba(0,0,0,0.3); padding: 16px; border-radius: 8px; max-height: 300px; overflow-y: auto; white-space: pre-wrap; font-size: 13px; line-height: 1.6;">\${escapeHtml(article.textContent)}</div>

              <h3 style="margin: 20px 0 12px; color: #f97316;">Analyses (\${article.analyses.length})</h3>
              \${article.analyses.map(a => \`
                <div style="background: rgba(0,0,0,0.2); padding: 12px; border-radius: 8px; margin-bottom: 12px;">
                  <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
                    <span style="color: #a1a1aa;">\${a.modelVersion || 'unknown model'}</span>
                    <span style="color: \${a.severity === 'significant' ? '#ef4444' : a.severity === 'moderate' ? '#eab308' : '#22c55e'}">\${a.severity || 'none'}</span>
                  </div>
                  <div style="font-size: 12px; color: #71717a; margin-bottom: 8px;">\${a.highlights.length} highlights</div>
                  \${a.highlights.map(h => \`
                    <div style="background: rgba(249,115,22,0.1); border-left: 3px solid \${h.importance === 'critical' ? '#ef4444' : h.importance === 'significant' ? '#eab308' : '#6b7280'}; padding: 8px 12px; margin: 8px 0; border-radius: 4px;">
                      <div style="font-style: italic; color: #a1a1aa; margin-bottom: 4px;">"\${escapeHtml(h.quote.substring(0, 100))}\${h.quote.length > 100 ? '...' : ''}"</div>
                      <div style="color: #e4e4e7;">\${escapeHtml(h.gap)}</div>
                    </div>
                  \`).join('')}
                </div>
              \`).join('') || '<div style="color: #71717a;">No analyses yet</div>'}

              <h3 style="margin: 20px 0 12px; color: #f97316;">Comments (\${article.comments.length})</h3>
              \${article.comments.map(c => \`
                <div style="background: rgba(0,0,0,0.2); padding: 12px; border-radius: 8px; margin-bottom: 12px;">
                  <div style="font-style: italic; color: #a1a1aa; margin-bottom: 8px;">"\${escapeHtml(c.selectedText.substring(0, 100))}\${c.selectedText.length > 100 ? '...' : ''}"</div>
                  <div style="color: #e4e4e7;">\${escapeHtml(c.commentText)}</div>
                  <div style="font-size: 11px; color: #71717a; margin-top: 8px;">\${new Date(c.createdAt).toLocaleString()} · \${c.ip || 'unknown IP'}</div>
                </div>
              \`).join('') || '<div style="color: #71717a;">No comments yet</div>'}
            </div>
          </div>
        \`;
        document.body.appendChild(modal);
      } catch (err) {
        alert('Failed to load article: ' + err.message);
      }
    }

    // Comments
    let commentsPage = 0;

    async function loadComments() {
      const list = document.getElementById('commentsList');
      list.innerHTML = '<div class="loading">Loading...</div>';

      try {
        const res = await fetch('/admin/comments?limit=' + limit + '&offset=' + (commentsPage * limit), {
          headers: { 'Authorization': 'Bearer ' + adminKey }
        });
        const data = await res.json();

        if (!data.comments || data.comments.length === 0) {
          list.innerHTML = '<div class="empty-state"><p>No comments yet</p></div>';
          return;
        }

        list.innerHTML = data.comments.map(comment => \`
          <div class="annotation-card" data-id="\${comment.id}">
            <div class="annotation-header">
              <span class="annotation-type">Feedback</span>
              <span class="annotation-date">\${new Date(comment.createdAt).toLocaleString()}</span>
            </div>
            <div class="annotation-quote">"\${escapeHtml(comment.selectedText)}"</div>
            <div class="annotation-text">\${escapeHtml(comment.commentText)}</div>
            <div class="annotation-url">
              <a href="\${comment.article.url}" target="_blank">\${comment.article.title || comment.article.url}</a>
            </div>
            <div style="margin-top: 12px; text-align: right;">
              <button class="delete-btn" onclick="deleteComment('\${comment.id}')">Delete</button>
            </div>
          </div>
        \`).join('');

        renderCommentsPagination(data.total);
      } catch (err) {
        list.innerHTML = '<div class="empty-state"><p>Failed to load comments</p></div>';
      }
    }

    function renderCommentsPagination(total) {
      const totalPages = Math.ceil(total / limit);
      const pagination = document.getElementById('commentsPagination');

      if (totalPages <= 1) {
        pagination.innerHTML = '';
        return;
      }

      pagination.innerHTML = \`
        <button class="page-btn" onclick="changeCommentsPage(-1)" \${commentsPage === 0 ? 'disabled' : ''}>← Prev</button>
        <span style="padding: 8px 16px; color: #71717a;">Page \${commentsPage + 1} of \${totalPages}</span>
        <button class="page-btn" onclick="changeCommentsPage(1)" \${commentsPage >= totalPages - 1 ? 'disabled' : ''}>Next →</button>
      \`;
    }

    function changeCommentsPage(delta) {
      commentsPage += delta;
      loadComments();
    }

    async function deleteComment(id) {
      if (!confirm('Delete this comment?')) return;

      try {
        const res = await fetch('/admin/comments/' + id, {
          method: 'DELETE',
          headers: { 'Authorization': 'Bearer ' + adminKey }
        });

        if (res.ok) {
          loadFeedbackStats();
          loadComments();
        } else {
          alert('Failed to delete');
        }
      } catch (err) {
        alert('Failed to delete: ' + err.message);
      }
    }

    function escapeHtml(text) {
      const div = document.createElement('div');
      div.textContent = text || '';
      return div.innerHTML;
    }

    // Early Access Signups
    let signupsPage = 0;

    async function loadEarlyAccess() {
      const list = document.getElementById('signupsList');
      list.innerHTML = '<div class="loading">Loading...</div>';

      try {
        const res = await fetch('/admin/early-access?limit=' + limit + '&offset=' + (signupsPage * limit), {
          headers: { 'Authorization': 'Bearer ' + adminKey }
        });
        const data = await res.json();

        if (!data.signups || data.signups.length === 0) {
          list.innerHTML = '<div class="empty-state"><p>No signups yet</p></div>';
          return;
        }

        list.innerHTML = data.signups.map(signup => \`
          <div class="annotation-card" data-id="\${signup.id}">
            <div class="annotation-header">
              <span class="annotation-type">Signup</span>
              <span class="annotation-date">\${new Date(signup.createdAt).toLocaleString()}</span>
            </div>
            <div style="margin-bottom: 12px;">
              <div style="font-weight: 600; color: #e4e4e7; margin-bottom: 4px;">\${escapeHtml(signup.firstName)}</div>
              <div style="color: #a1a1aa; font-size: 14px;">\${escapeHtml(signup.email)}</div>
            </div>
            \${signup.discord ? \`
              <div style="margin-bottom: 8px; color: #a1a1aa; font-size: 13px;">
                <strong>Discord:</strong> \${escapeHtml(signup.discord)}
              </div>
            \` : ''}
            \${signup.reason ? \`
              <div class="annotation-text" style="margin-top: 12px; margin-bottom: 0;">
                <strong>Reason:</strong> \${escapeHtml(signup.reason)}
              </div>
            \` : ''}
            <div style="margin-top: 12px; font-size: 11px; color: #71717a;">
              IP: \${signup.ip || 'unknown'}
            </div>
          </div>
        \`).join('');

        renderSignupsPagination(data.total);
      } catch (err) {
        list.innerHTML = '<div class="empty-state"><p>Failed to load signups</p></div>';
      }
    }

    function renderSignupsPagination(total) {
      const totalPages = Math.ceil(total / limit);
      const pagination = document.getElementById('signupsPagination');

      if (totalPages <= 1) {
        pagination.innerHTML = '';
        return;
      }

      pagination.innerHTML = \`
        <button class="page-btn" onclick="changeSignupsPage(-1)" \${signupsPage === 0 ? 'disabled' : ''}>← Prev</button>
        <span style="padding: 8px 16px; color: #71717a;">Page \${signupsPage + 1} of \${totalPages}</span>
        <button class="page-btn" onclick="changeSignupsPage(1)" \${signupsPage >= totalPages - 1 ? 'disabled' : ''}>Next →</button>
      \`;
    }

    function changeSignupsPage(delta) {
      signupsPage += delta;
      loadEarlyAccess();
    }

    // Tab switching
    function switchTab(tab) {
      document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
      document.querySelectorAll('.tab-content').forEach(content => content.classList.remove('active'));

      document.querySelector(\`[onclick="switchTab('\${tab}')"]\`).classList.add('active');
      document.getElementById('tab-' + tab).classList.add('active');

      if (tab === 'articles') {
        loadArticles();
      } else if (tab === 'comments') {
        loadComments();
      } else if (tab === 'early-access') {
        loadEarlyAccess();
      } else if (tab === 'logs') {
        loadDebugLogs();
      }
    }

    // Debug Logs
    let logsPage = 0;
    const logsLimit = 50;
    let currentSince = '5m';

    // Time shortcuts
    document.querySelectorAll('.time-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('.time-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        currentSince = btn.dataset.since;
        logsPage = 0;
        loadDebugLogs();
      });
    });

    // Filters
    document.getElementById('ipFilter').addEventListener('change', () => { logsPage = 0; loadDebugLogs(); });
    document.getElementById('levelFilter').addEventListener('change', () => { logsPage = 0; loadDebugLogs(); });

    async function loadDebugLogs() {
      const list = document.getElementById('debugLogsList');
      list.innerHTML = '<div class="loading">Loading...</div>';

      const ip = document.getElementById('ipFilter').value;
      const level = document.getElementById('levelFilter').value;

      let url = '/debug/logs?limit=' + logsLimit + '&offset=' + (logsPage * logsLimit);
      if (currentSince) url += '&since=' + currentSince;
      if (ip) url += '&ip=' + encodeURIComponent(ip);
      if (level) url += '&level=' + level;

      try {
        const res = await fetch(url, {
          headers: { 'Authorization': 'Bearer ' + adminKey }
        });

        if (!res.ok) throw new Error('Failed to load logs');

        const data = await res.json();

        // Update IP filter options
        const ipSelect = document.getElementById('ipFilter');
        const currentIp = ipSelect.value;
        ipSelect.innerHTML = '<option value="">All IPs</option>' +
          data.availableIps.map(i => \`<option value="\${i.ip}" \${i.ip === currentIp ? 'selected' : ''}>\${i.ip} (\${i.count})</option>\`).join('');

        document.getElementById('logCount').textContent = data.total + ' logs';

        if (!data.logs || data.logs.length === 0) {
          list.innerHTML = '<div class="empty-state"><p>No logs found</p></div>';
          return;
        }

        list.innerHTML = data.logs.map(log => \`
          <div class="log-entry level-\${log.level}">
            <div class="log-header">
              <div>
                <span class="log-level \${log.level}">\${log.level}</span>
                <span class="log-source">\${log.source || '-'}</span>
                \${log.version ? \`<span class="log-version">v\${log.version}</span>\` : ''}
              </div>
              <div class="log-meta">
                <span class="log-ip">\${log.ip || '-'}</span>
                <span>\${new Date(log.createdAt).toLocaleString()}</span>
              </div>
            </div>
            <div class="log-message">\${escapeHtml(log.message)}</div>
            \${log.data ? \`<div class="log-data">\${escapeHtml(JSON.stringify(log.data, null, 2))}</div>\` : ''}
          </div>
        \`).join('');

        renderLogsPagination(data.total);
      } catch (err) {
        list.innerHTML = '<div class="empty-state"><p>Failed to load logs</p></div>';
      }
    }

    function renderLogsPagination(total) {
      const totalPages = Math.ceil(total / logsLimit);
      const pagination = document.getElementById('logsPagination');

      if (totalPages <= 1) {
        pagination.innerHTML = '';
        return;
      }

      pagination.innerHTML = \`
        <button class="page-btn" onclick="changeLogsPage(-1)" \${logsPage === 0 ? 'disabled' : ''}>← Prev</button>
        <span style="padding: 8px 16px; color: #71717a;">Page \${logsPage + 1} of \${totalPages}</span>
        <button class="page-btn" onclick="changeLogsPage(1)" \${logsPage >= totalPages - 1 ? 'disabled' : ''}>Next →</button>
      \`;
    }

    function changeLogsPage(delta) {
      logsPage += delta;
      loadDebugLogs();
    }

    async function clearOldLogs() {
      const days = prompt('Clear logs older than how many days?', '7');
      if (!days || isNaN(parseInt(days))) return;

      if (!confirm(\`Delete all logs older than \${days} days?\`)) return;

      try {
        const res = await fetch('/debug/logs?olderThan=' + days + 'd', {
          method: 'DELETE',
          headers: { 'Authorization': 'Bearer ' + adminKey }
        });

        const data = await res.json();
        alert(\`Deleted \${data.deleted} logs\`);
        loadDebugLogs();
      } catch (err) {
        alert('Failed to clear logs');
      }
    }
  </script>
</body>
</html>
`;
}
