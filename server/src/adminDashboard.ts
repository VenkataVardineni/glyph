/** Single-file admin UI for report triage (Guideline 1.2 developer action plan). */
export function adminDashboardHtml(): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8"/>
  <meta name="viewport" content="width=device-width, initial-scale=1"/>
  <title>Glyph — Safety admin</title>
  <style>
    :root { font-family: system-ui, sans-serif; background: #0a0a0f; color: #eee; }
    body { max-width: 960px; margin: 24px auto; padding: 0 16px; }
    h1 { font-size: 1.25rem; }
    p { color: #9ca3af; font-size: 0.9rem; }
    label { display: block; margin-top: 16px; font-size: 0.75rem; text-transform: uppercase; letter-spacing: .05em; color: #9ca3af; }
    input { width: 100%; max-width: 420px; padding: 10px 12px; margin-top: 6px; border-radius: 8px; border: 1px solid #333; background: #111; color: #fff; }
    button { margin-top: 12px; padding: 10px 16px; border-radius: 8px; border: none; background: #7c3aed; color: #fff; font-weight: 600; cursor: pointer; }
    button.danger { background: #be123c; }
    table { width: 100%; border-collapse: collapse; margin-top: 24px; font-size: 0.85rem; }
    th, td { text-align: left; padding: 10px 8px; border-bottom: 1px solid #222; vertical-align: top; }
    th { color: #9ca3af; font-weight: 600; }
    pre { white-space: pre-wrap; word-break: break-all; margin: 0; font-size: 0.8rem; }
    .ok { color: #4ade80; }
    .err { color: #f87171; }
  </style>
</head>
<body>
  <h1>Glyph safety console</h1>
  <p>SLA (App Store): triage reports and ban accounts within <strong>24 hours</strong>. Use your server <code>ADMIN_TOKEN</code> as Bearer token.</p>
  <label>Admin token</label>
  <input type="password" id="token" placeholder="Paste ADMIN_TOKEN" autocomplete="off"/>
  <button type="button" id="load">Load reports</button>
  <p id="status"></p>
  <table id="tbl" style="display:none">
    <thead><tr><th>Time</th><th>Reporter</th><th>Reported</th><th>Reason</th><th>Action</th></tr></thead>
    <tbody id="body"></tbody>
  </table>
  <script>
    const tokenEl = document.getElementById('token');
    const statusEl = document.getElementById('status');
    const tbl = document.getElementById('tbl');
    const body = document.getElementById('body');
    async function api(path, opts) {
      const t = tokenEl.value.trim();
      const r = await fetch(path, {
        ...opts,
        headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + t, ...(opts && opts.headers) },
      });
      const j = await r.json().catch(() => ({}));
      if (!r.ok) throw new Error(j.message || r.statusText);
      return j;
    }
    document.getElementById('load').onclick = async () => {
      statusEl.textContent = 'Loading…';
      body.innerHTML = '';
      try {
        const data = await api('/admin/api/reports');
        const rows = data.reports || [];
        if (rows.length === 0) {
          statusEl.innerHTML = '<span class="ok">No open reports in queue.</span>';
          tbl.style.display = 'none';
          return;
        }
        statusEl.innerHTML = '<span class="ok">Loaded ' + rows.length + ' report(s).</span>';
        tbl.style.display = 'table';
        for (const rep of rows) {
          const tr = document.createElement('tr');
          const reported = rep.reportedUserId || '—';
          tr.innerHTML = '<td>' + new Date(rep.at).toISOString() + '</td><td><pre>' + (rep.reporterUserId||'—') + '</pre></td><td><pre>' + reported + '</pre></td><td>' + (rep.reason||'') + '</td><td></td>';
          const td = tr.lastElementChild;
          const b = document.createElement('button');
          b.className = 'danger';
          b.textContent = 'Ban user';
          b.onclick = async () => {
            if (!reported || reported === '—') return;
            if (!confirm('Ban ' + reported + '?')) return;
            try {
              await api('/admin/api/ban', { method: 'POST', body: JSON.stringify({ userId: reported }) });
              b.textContent = 'Banned';
              b.disabled = true;
            } catch (e) {
              alert(e.message);
            }
          };
          td.appendChild(b);
          body.appendChild(tr);
        }
      } catch (e) {
        statusEl.innerHTML = '<span class="err">' + e.message + '</span>';
        tbl.style.display = 'none';
      }
    };
  </script>
</body>
</html>`;
}
