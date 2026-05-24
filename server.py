import http.server
import socketserver
import json
import os

PORT = 5000
HOST = "0.0.0.0"

MESSAGES_FILE = "discord.com/api/v9/channels/1357423067080556758/messages?limit=10"
CHANNEL_ID = "1357423067080556758"


def build_html(messages):
    messages_json = json.dumps(messages)
    count = len(messages)
    return """<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Discord Message Archive</title>
<style>
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body {
    background: #313338;
    color: #dcddde;
    font-family: 'gg sans', 'Noto Sans', Whitney, 'Helvetica Neue', Helvetica, Roboto, Arial, sans-serif;
    font-size: 16px;
  }
  .header {
    background: #2b2d31;
    padding: 12px 20px;
    border-bottom: 1px solid #1e1f22;
    display: flex;
    align-items: center;
    gap: 10px;
    position: sticky;
    top: 0;
    z-index: 10;
  }
  .header .channel-icon { color: #80848e; font-size: 22px; }
  .header h1 { font-size: 16px; font-weight: 600; color: #f2f3f5; }
  .header .channel-id { color: #80848e; font-size: 12px; margin-left: 8px; }
  .messages {
    max-width: 900px;
    margin: 0 auto;
    padding: 20px 16px;
  }
  .message {
    display: flex;
    gap: 16px;
    padding: 4px 0;
    margin-bottom: 4px;
    border-radius: 4px;
    transition: background 0.1s;
  }
  .message:hover { background: #2e3035; }
  .avatar {
    width: 40px;
    height: 40px;
    border-radius: 50%;
    flex-shrink: 0;
    background: #5865f2;
    display: flex;
    align-items: center;
    justify-content: center;
    font-weight: 700;
    font-size: 16px;
    color: white;
    overflow: hidden;
  }
  .avatar img { width: 100%; height: 100%; object-fit: cover; }
  .message-body { flex: 1; min-width: 0; }
  .message-header { display: flex; align-items: baseline; gap: 8px; margin-bottom: 2px; }
  .author { font-weight: 600; color: #f2f3f5; }
  .timestamp { font-size: 11px; color: #80848e; }
  .content { color: #dcddde; line-height: 1.5; word-break: break-word; }
  .sticker-tag {
    display: inline-block;
    background: #4e5058;
    color: #b5bac1;
    border-radius: 4px;
    padding: 2px 8px;
    font-size: 13px;
    margin-top: 4px;
  }
  .count-badge {
    background: #5865f2;
    color: white;
    border-radius: 12px;
    padding: 2px 10px;
    font-size: 12px;
    font-weight: 600;
  }
</style>
</head>
<body>
<div class="header">
  <span class="channel-icon">#</span>
  <h1>Discord Message Archive</h1>
  <span class="channel-id">Channel: """ + CHANNEL_ID + """</span>
  <span style="flex:1"></span>
  <span class="count-badge">""" + str(count) + """ messages</span>
</div>
<div class="messages" id="messages"></div>
<script>
const messages = """ + messages_json + """;

function formatTime(ts) {
  const d = new Date(ts);
  return d.toLocaleString();
}

function getInitials(name) {
  return (name || '?')[0].toUpperCase();
}

function avatarUrl(author) {
  if (author.avatar) {
    return 'https://cdn.discordapp.com/avatars/' + author.id + '/' + author.avatar + '.png?size=80';
  }
  return null;
}

const container = document.getElementById('messages');
messages.forEach(function(msg) {
  const div = document.createElement('div');
  div.className = 'message';
  const author = msg.author || {};
  const url = avatarUrl(author);
  const initials = getInitials(author.username);
  const avatarHtml = url
    ? '<img src="' + url + '" onerror="this.style.display=\\'none\\';this.parentElement.textContent=\\''+initials+'\\';"/>'
    : initials;
  let contentHtml = '';
  if (msg.content) {
    const safe = msg.content.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
    contentHtml = '<div class="content">' + safe + '</div>';
  }
  if (msg.sticker_items && msg.sticker_items.length) {
    msg.sticker_items.forEach(function(s) {
      contentHtml += '<div><span class="sticker-tag">Sticker: ' + s.name + '</span></div>';
    });
  }
  const displayName = author.global_name || author.username || 'Unknown';
  div.innerHTML =
    '<div class="avatar">' + avatarHtml + '</div>' +
    '<div class="message-body">' +
      '<div class="message-header">' +
        '<span class="author">' + displayName + '</span>' +
        '<span class="timestamp">' + formatTime(msg.timestamp) + '</span>' +
      '</div>' +
      contentHtml +
    '</div>';
  container.appendChild(div);
});
</script>
</body>
</html>"""


class Handler(http.server.BaseHTTPRequestHandler):
    def log_message(self, format, *args):
        pass

    def do_GET(self):
        path = self.path.split('?')[0]

        if path == "/api/v9/channels/" + CHANNEL_ID + "/messages":
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

        if path == "/" or path == "":
            try:
                with open(MESSAGES_FILE, "r") as f:
                    messages = json.load(f)
                html = build_html(messages)
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
    socketserver.TCPServer.allow_reuse_address = True
    with socketserver.TCPServer((HOST, PORT), Handler) as httpd:
        print(f"Serving on {HOST}:{PORT}")
        httpd.serve_forever()
