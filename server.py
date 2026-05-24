import http.server
import socketserver
import json
import os

PORT = 5000
HOST = "0.0.0.0"

MESSAGES_FILE = "discord.com/api/v9/channels/1357423067080556758/messages?limit=10"
CHANNEL_ID = "1357423067080556758"

PLUGIN_FILES = [
    ("FakeMessages/index.tsx", "Main Plugin Entry"),
    ("FakeMessages/FakeMessageStore.ts", "Data Store & Types"),
    ("FakeMessages/FakeMessagesModal.tsx", "Modal UI"),
    ("README.md", "Installation Guide"),
]

def read_file(path):
    try:
        with open(path, "r", encoding="utf-8") as f:
            return f.read()
    except Exception:
        return ""

def build_landing():
    files_html = ""
    for path, label in PLUGIN_FILES:
        content = read_file(path)
        line_count = content.count("\n") + 1 if content else 0
        ext = path.split(".")[-1]
        lang_map = {"tsx": "typescript", "ts": "typescript", "md": "markdown", "json": "json"}
        lang = lang_map.get(ext, "text")
        escaped = content.replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;")
        files_html += f"""
<div class="file-card" id="{path.replace('/','_')}">
  <div class="file-header" onclick="toggleFile(this)">
    <div class="file-info">
      <span class="file-icon">{get_icon(ext)}</span>
      <div>
        <div class="file-path">{path}</div>
        <div class="file-label">{label} &middot; {line_count} lines</div>
      </div>
    </div>
    <span class="chevron">▼</span>
  </div>
  <pre class="file-content"><code class="lang-{lang}">{escaped}</code></pre>
</div>
"""

    return """<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>FakeMessages — Vencord/Equicord Plugin</title>
<style>
  * { box-sizing: border-box; margin: 0; padding: 0; }
  :root {
    --bg: #0d1117;
    --bg2: #161b22;
    --bg3: #21262d;
    --border: #30363d;
    --text: #e6edf3;
    --muted: #8b949e;
    --accent: #58a6ff;
    --green: #3fb950;
    --yellow: #d29922;
    --red: #f85149;
    --purple: #bc8cff;
    --orange: #ffa657;
  }
  body { background: var(--bg); color: var(--text); font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Helvetica, Arial, sans-serif; }

  .hero {
    background: linear-gradient(135deg, #0d1117 0%, #161b22 100%);
    border-bottom: 1px solid var(--border);
    padding: 48px 24px 40px;
    text-align: center;
  }
  .hero-badge {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    background: rgba(88,166,255,0.1);
    border: 1px solid rgba(88,166,255,0.3);
    border-radius: 20px;
    padding: 4px 14px;
    font-size: 12px;
    color: var(--accent);
    margin-bottom: 20px;
    font-weight: 600;
    letter-spacing: 0.04em;
    text-transform: uppercase;
  }
  .hero h1 {
    font-size: 42px;
    font-weight: 800;
    letter-spacing: -0.03em;
    margin-bottom: 12px;
    background: linear-gradient(135deg, #e6edf3 0%, #8b949e 100%);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
  }
  .hero p {
    font-size: 16px;
    color: var(--muted);
    max-width: 580px;
    margin: 0 auto 28px;
    line-height: 1.6;
  }

  .badges { display: flex; gap: 8px; justify-content: center; flex-wrap: wrap; margin-bottom: 32px; }
  .badge {
    background: var(--bg3);
    border: 1px solid var(--border);
    border-radius: 6px;
    padding: 4px 10px;
    font-size: 12px;
    color: var(--muted);
    font-weight: 500;
  }
  .badge.green { border-color: rgba(63,185,80,0.4); color: var(--green); background: rgba(63,185,80,0.08); }
  .badge.blue { border-color: rgba(88,166,255,0.4); color: var(--accent); background: rgba(88,166,255,0.08); }
  .badge.purple { border-color: rgba(188,140,255,0.4); color: var(--purple); background: rgba(188,140,255,0.08); }
  .badge.orange { border-color: rgba(255,166,87,0.4); color: var(--orange); background: rgba(255,166,87,0.08); }

  .features {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
    gap: 12px;
    max-width: 900px;
    margin: 0 auto;
  }
  .feature-card {
    background: var(--bg2);
    border: 1px solid var(--border);
    border-radius: 10px;
    padding: 16px 18px;
    display: flex;
    align-items: flex-start;
    gap: 10px;
  }
  .feature-icon { font-size: 20px; flex-shrink: 0; margin-top: 1px; }
  .feature-title { font-size: 13px; font-weight: 600; color: var(--text); margin-bottom: 3px; }
  .feature-desc { font-size: 12px; color: var(--muted); line-height: 1.5; }

  .content { max-width: 900px; margin: 0 auto; padding: 32px 24px; }

  .section-title {
    font-size: 13px;
    font-weight: 700;
    color: var(--muted);
    text-transform: uppercase;
    letter-spacing: 0.08em;
    margin-bottom: 16px;
    display: flex;
    align-items: center;
    gap: 8px;
  }
  .section-title::after {
    content: '';
    flex: 1;
    height: 1px;
    background: var(--border);
  }

  .file-card {
    background: var(--bg2);
    border: 1px solid var(--border);
    border-radius: 10px;
    margin-bottom: 12px;
    overflow: hidden;
  }
  .file-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 12px 16px;
    cursor: pointer;
    user-select: none;
    transition: background 0.1s;
  }
  .file-header:hover { background: var(--bg3); }
  .file-info { display: flex; align-items: center; gap: 12px; }
  .file-icon { font-size: 18px; }
  .file-path { font-size: 13px; font-weight: 600; color: var(--text); font-family: "SF Mono", Consolas, monospace; }
  .file-label { font-size: 11px; color: var(--muted); margin-top: 2px; }
  .chevron { color: var(--muted); font-size: 12px; transition: transform 0.2s; }
  .file-card.collapsed .chevron { transform: rotate(-90deg); }
  .file-content {
    border-top: 1px solid var(--border);
    background: var(--bg);
    padding: 16px 20px;
    overflow-x: auto;
    font-size: 12.5px;
    line-height: 1.6;
    font-family: "SF Mono", Consolas, "Liberation Mono", Menlo, monospace;
    color: var(--text);
    max-height: 520px;
    overflow-y: auto;
  }
  .file-card.collapsed .file-content { display: none; }

  .install-steps {
    background: var(--bg2);
    border: 1px solid var(--border);
    border-radius: 10px;
    padding: 20px 24px;
    margin-bottom: 24px;
  }
  .step {
    display: flex;
    align-items: flex-start;
    gap: 14px;
    margin-bottom: 14px;
    padding-bottom: 14px;
    border-bottom: 1px solid var(--border);
  }
  .step:last-child { margin-bottom: 0; padding-bottom: 0; border-bottom: none; }
  .step-num {
    width: 26px;
    height: 26px;
    border-radius: 50%;
    background: rgba(88,166,255,0.15);
    border: 1px solid rgba(88,166,255,0.4);
    color: var(--accent);
    font-size: 12px;
    font-weight: 700;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
    margin-top: 1px;
  }
  .step-title { font-size: 13px; font-weight: 600; color: var(--text); margin-bottom: 4px; }
  .step-desc { font-size: 12px; color: var(--muted); line-height: 1.6; }
  code.inline {
    background: var(--bg3);
    border: 1px solid var(--border);
    border-radius: 4px;
    padding: 1px 6px;
    font-family: "SF Mono", Consolas, monospace;
    font-size: 11px;
    color: var(--orange);
  }
  .warning-box {
    background: rgba(210,153,34,0.08);
    border: 1px solid rgba(210,153,34,0.3);
    border-radius: 8px;
    padding: 12px 16px;
    font-size: 13px;
    color: #d29922;
    margin-bottom: 24px;
    line-height: 1.5;
  }
</style>
</head>
<body>

<div class="hero">
  <div class="hero-badge">🎭 Vencord / Equicord Plugin</div>
  <h1>FakeMessages</h1>
  <p>Visually add, edit, or hide Discord messages — per channel, per DM, anywhere. Saves across refreshes. 100% client-side.</p>

  <div class="badges">
    <span class="badge green">✅ Client-Side Only</span>
    <span class="badge blue">💾 Persistent Storage</span>
    <span class="badge purple">🔘 Per-Channel Toggles</span>
    <span class="badge orange">⚡ Vencord + Equicord</span>
  </div>

  <div class="features">
    <div class="feature-card">
      <span class="feature-icon">➕</span>
      <div><div class="feature-title">Add Messages</div><div class="feature-desc">Inject fake messages from any user, anywhere in a channel.</div></div>
    </div>
    <div class="feature-card">
      <span class="feature-icon">✏️</span>
      <div><div class="feature-title">Edit Messages</div><div class="feature-desc">Change any message's content or displayed author name.</div></div>
    </div>
    <div class="feature-card">
      <span class="feature-icon">🙈</span>
      <div><div class="feature-title">Hide Messages</div><div class="feature-desc">Remove messages from your view entirely.</div></div>
    </div>
    <div class="feature-card">
      <span class="feature-icon">💾</span>
      <div><div class="feature-title">Persists Forever</div><div class="feature-desc">Changes survive refreshes and restarts via DataStore.</div></div>
    </div>
    <div class="feature-card">
      <span class="feature-icon">🔘</span>
      <div><div class="feature-title">Granular Toggles</div><div class="feature-desc">Global on/off + individual toggle per channel or DM.</div></div>
    </div>
    <div class="feature-card">
      <span class="feature-icon">🖱️</span>
      <div><div class="feature-title">Right-Click Menu</div><div class="feature-desc">Edit/hide any message directly from its context menu.</div></div>
    </div>
  </div>
</div>

<div class="content">

  <div class="warning-box">
    ⚠️ <strong>Visual / Local Only</strong> — Other users always see the real messages. This plugin only changes what <em>you</em> see in your own Discord client.
  </div>

  <div class="section-title">Quick Install</div>
  <div class="install-steps">
    <div class="step">
      <div class="step-num">1</div>
      <div>
        <div class="step-title">Copy the FakeMessages folder</div>
        <div class="step-desc">Place the <code class="inline">FakeMessages/</code> folder into your Vencord or Equicord <code class="inline">src/userplugins/</code> directory.</div>
      </div>
    </div>
    <div class="step">
      <div class="step-num">2</div>
      <div>
        <div class="step-title">Rebuild</div>
        <div class="step-desc">Run <code class="inline">pnpm build</code> in your Vencord/Equicord directory.</div>
      </div>
    </div>
    <div class="step">
      <div class="step-num">3</div>
      <div>
        <div class="step-title">Enable the plugin</div>
        <div class="step-desc">Open Discord → Settings → Plugins → search <code class="inline">FakeMessages</code> → toggle ON → reload Discord.</div>
      </div>
    </div>
    <div class="step">
      <div class="step-num">4</div>
      <div>
        <div class="step-title">Use it</div>
        <div class="step-desc">Click the 🎭 icon in the chat bar, or right-click any message for quick options.</div>
      </div>
    </div>
  </div>

  <div class="section-title">Plugin Source Files</div>
""" + files_html + """
</div>

<script>
function toggleFile(header) {
  header.closest('.file-card').classList.toggle('collapsed');
}
document.querySelectorAll('.file-card').forEach((card, i) => {
  if (i > 0) card.classList.add('collapsed');
});
</script>
</body>
</html>"""

def get_icon(ext):
    return {"tsx": "⚛️", "ts": "🔷", "md": "📄", "json": "📋"}.get(ext, "📁")

socketserver.TCPServer.allow_reuse_address = True

class Handler(http.server.BaseHTTPRequestHandler):
    def log_message(self, format, *args):
        pass

    def do_GET(self):
        path = self.path.split("?")[0]

        if path == f"/api/v9/channels/{CHANNEL_ID}/messages":
            try:
                with open(MESSAGES_FILE, "r") as f:
                    data = f.read()
                self.send_response(200)
                self.send_header("Content-Type", "application/json")
                self.end_headers()
                self.wfile.write(data.encode())
            except Exception as e:
                self.send_response(500)
                self.end_headers()
                self.wfile.write(str(e).encode())
            return

        if path in ("/", ""):
            try:
                html = build_landing()
                self.send_response(200)
                self.send_header("Content-Type", "text/html; charset=utf-8")
                self.end_headers()
                self.wfile.write(html.encode())
            except Exception as e:
                self.send_response(500)
                self.end_headers()
                self.wfile.write(("Error: " + str(e)).encode())
            return

        self.send_response(404)
        self.end_headers()
        self.wfile.write(b"Not found")


if __name__ == "__main__":
    with socketserver.TCPServer((HOST, PORT), Handler) as httpd:
        print(f"Serving on {HOST}:{PORT}")
        httpd.serve_forever()
