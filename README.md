# 🎭 FakeMessages — Vencord / Equicord Plugin

A fully client-side plugin that lets you **visually add, edit, or hide Discord messages** in any channel — DMs, server channels, group DMs. Changes are saved locally and survive refreshes. Nothing is ever sent to Discord's servers.

> ⚠️ **This is purely visual/local.** Other users see the real messages. This only affects what *you* see in your own client.

---

## ✨ Features

| Feature | Details |
|---|---|
| ➕ Add fake messages | Inject messages from any user (or yourself) anywhere in a channel |
| ✏️ Edit messages | Change the displayed content or author name of any message |
| 🙈 Hide messages | Remove any message from your view |
| 💾 Persistent storage | All changes survive page refreshes and Discord restarts |
| 🔘 Global toggle | One master switch to enable/disable everything |
| 🔘 Per-channel toggle | Independently enable/disable per DM or channel |
| 🖱️ Right-click menu | Quick edit/hide directly from the message context menu |
| 💬 Chat bar button | Icon in the chat bar opens the full manager for that channel |
| 🎨 Clean UI | Dark-theme modal with tabs, entry cards, and inline editing |

---

## 📦 Installation

### Prerequisites

You need **Vencord** or **Equicord** installed on Discord Desktop or Web.

- Vencord: https://vencord.dev/
- Equicord: https://github.com/Equicord/Equicord

---

### Method 1 — UserPlugin (Recommended)

UserPlugins let you add custom plugins without modifying Vencord/Equicord's core files.

**Step 1 — Enable UserPlugins in Vencord/Equicord**

Open Discord → Settings → Vencord (or Equicord) → scroll down and enable **"Enable UserPlugins"** if it isn't already.

**Step 2 — Find your UserPlugins folder**

| Platform | Path |
|---|---|
| Windows | `%APPDATA%\Vencord\src\userplugins\` |
| macOS | `~/.config/Vencord/src/userplugins/` |
| Linux | `~/.config/Vencord/src/userplugins/` |
| Equicord Windows | `%APPDATA%\Equicord\src\userplugins\` |
| Equicord macOS/Linux | `~/.config/Equicord/src/userplugins/` |

If the `userplugins` folder doesn't exist, create it.

**Step 3 — Copy the plugin**

Copy the entire `FakeMessages` folder into your `userplugins` directory:

```
userplugins/
└── FakeMessages/
    ├── index.tsx
    ├── FakeMessageStore.ts
    └── FakeMessagesModal.tsx
```

**Step 4 — Rebuild Vencord/Equicord**

Open a terminal in your Vencord/Equicord directory and run:

```bash
pnpm build
```

If the build succeeds with no errors, then run:

```bash
pnpm inject
```

**Step 5 — Enable the plugin**

1. Open Discord
2. Go to **Settings → Plugins** (Vencord) or **Settings → Equicord → Plugins**
3. Search for **"FakeMessages"**
4. Toggle it **ON**
5. Reload Discord (`Ctrl+R` / `Cmd+R`)

---

### Method 2 — Dev Mode (for development/testing)

```bash
# Clone Vencord
git clone https://github.com/Vendicated/Vencord
cd Vencord
pnpm install

# Copy plugin
cp -r /path/to/FakeMessages src/plugins/FakeMessages

# Build in watch mode
pnpm watch
```

Then inject with `pnpm inject`.

---

## 🚀 How to Use

### Opening the Manager

**Option A — Chat Bar Button**

A small 💬 icon appears in the message input bar of every channel. Click it to open the Fake Messages Manager for that channel.

**Option B — Right-click a message**

Right-click any message → scroll down to the **"Fake Messages"** section:

- **✏️ Edit This Message (Fake)** — opens the editor pre-filled with that message
- **🙈 Hide This Message (Fake)** — instantly hides it from your view
- **➕ Add Fake Message After This** — adds a new fake message right after it
- **🗂️ Open Fake Message Manager** — opens the full manager

**Option C — Right-click a channel**

Right-click any channel in the sidebar → **"🎭 Fake Messages Manager"**

---

### Adding a Fake Message

1. Open the manager → click **"➕ New Entry"**
2. Select type: **Add Message**
3. Fill in:
   - **Author Name** — whose name shows (blank = yours)
   - **Author User ID** — paste their Discord user ID for their avatar (optional)
   - **Timestamp** — when it appears (blank = now)
   - **Insert After** — paste a message ID to place it after a specific message
   - **Content** — the message text
4. Click **Save**

### Editing a Message

1. Right-click a message → **"✏️ Edit This Message (Fake)"**
2. Change the content and/or author display name
3. Click **Save**

The original message ID is auto-filled. Only *your view* changes.

### Hiding a Message

Right-click a message → **🙈 Hide This Message (Fake)**

It disappears from your view instantly. The entry appears in the manager where you can remove it to restore the message.

---

## 🔘 Toggles

### Global Toggle

- In the plugin settings page (Settings → Plugins → FakeMessages → Settings)
- Or in the footer of the Fake Messages Manager modal

When **OFF**, all fakes are disabled everywhere.

### Per-Channel Toggle

In the Fake Messages Manager modal for any channel, there's a **channel-level toggle** in the header. When **OFF** for that channel, fakes are disabled only for that channel even if the global toggle is ON.

---

## 💾 How Data is Saved

All fake message data is saved using Vencord/Equicord's built-in **DataStore** (IndexedDB under the hood). The key is `FakeMessages_v1`.

Data persists through:
- ✅ Page refreshes
- ✅ Discord restarts
- ✅ Switching channels and back
- ❌ Reinstalling Discord (clears IndexedDB)
- ❌ Uninstalling Vencord (clears plugin data)

---

## 🔍 Finding Message IDs & User IDs

To get a **Message ID** or **User ID**, you need Discord's Developer Mode:

1. Settings → Advanced → **Developer Mode** → ON
2. Right-click a message → **Copy Message ID**
3. Right-click a username → **Copy User ID**

---

## ⚙️ Data Structure

The plugin stores data in this format:

```json
{
  "globalEnabled": true,
  "channelEnabled": {
    "CHANNEL_ID": true
  },
  "entries": {
    "CHANNEL_ID": [
      {
        "id": "fake_add_1234567890_abc",
        "type": "add",
        "authorId": "123456789",
        "authorUsername": "someuser",
        "content": "This is a fake message",
        "timestamp": "2026-01-01T12:00:00.000Z",
        "insertAfter": "MESSAGE_ID"
      },
      {
        "id": "fake_modify_9876543210_xyz",
        "type": "modify",
        "originalId": "ORIGINAL_MESSAGE_ID",
        "content": "Edited content"
      },
      {
        "id": "fake_hide_1111111111_def",
        "type": "hide",
        "originalId": "MESSAGE_ID_TO_HIDE"
      }
    ]
  }
}
```

---

## 🛠️ Troubleshooting

**Plugin doesn't appear in the plugins list**
- Make sure the folder is named exactly `FakeMessages`
- Rebuild Vencord: `pnpm build` in the Vencord directory
- Check the DevTools console (Ctrl+Shift+I) for build errors

**Fake messages disappear after switching channels**
- This is expected — messages reload from Discord when you switch channels
- The plugin re-applies your fakes on every `LOAD_MESSAGES_SUCCESS` dispatch
- Make sure the plugin is enabled and the channel toggle is ON

**Context menu items don't appear**
- Make sure `ContextMenuAPI` is enabled in Vencord settings
- Try reloading Discord

**Chat bar button missing**
- The chat bar button is loaded at runtime via webpack. If your version of Equicord/Vencord has `ChatBarAPI`, it will appear automatically. If not, all features are still available via right-click menus.

---

## 📁 File Structure

```
FakeMessages/
├── index.tsx              # Main plugin — Flux patching, context menus, chat bar button
├── FakeMessageStore.ts    # TypeScript types and DataStore helpers
├── FakeMessagesModal.tsx  # Full React UI modal for managing fake messages
└── (this README.md goes in the repo root or alongside the folder)
```

---

## 📜 License

MIT — do whatever you want with this.

---

## 💡 Suggested Future Additions

- **Import/Export** — export your fake message data as JSON for backup or sharing
- **Fake reactions** — add emoji reactions that only you see
- **Fake embeds** — inject rich embeds below messages
- **Fake pins** — mark messages as pinned in your view
- **Scheduled fakes** — have fake messages appear at a specific time
- **Templates** — save common fake message templates for reuse
