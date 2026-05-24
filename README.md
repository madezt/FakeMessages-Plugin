# 🎭 FakeMessages — Vencord / Equicord Plugin

A fully client-side plugin that lets you **visually add, edit, or hide Discord messages** in any channel — DMs, server channels, and group DMs. All changes are saved locally and survive refreshes. Nothing is ever sent to Discord's servers.

> ⚠️ **Purely visual and local.** Other users always see the real messages. This only affects what *you* see in your own client.

---

## Features

| | Feature | Details |
|---|---|---|
| ➕ | Add fake messages | Inject messages from any user anywhere in a channel |
| ✏️ | Edit messages | Change the displayed content or author name of any message |
| 🙈 | Hide messages | Remove any message from your view |
| 💾 | Persistent storage | All changes survive page refreshes and Discord restarts |
| 🌐 | Global toggle | One master switch to enable/disable everything |
| 🔘 | Per-channel toggle | Independently enable/disable per DM or channel |
| 🖱️ | Right-click menu | Quick edit/hide/add directly from the message context menu |
| 🗂️ | Full manager UI | Tabbed modal with entry cards, inline editing, and clear-all |

---

## Installation

### Prerequisites

You need **Vencord** or **Equicord** installed on Discord Desktop.

- Vencord: https://vencord.dev
- Equicord: https://github.com/Equicord/Equicord

---

### Step 1 — Locate your userplugins folder

| Platform | Path |
|---|---|
| Vencord — Windows | `%APPDATA%\Vencord\src\userplugins\` |
| Vencord — macOS / Linux | `~/.config/Vencord/src/userplugins/` |
| Equicord — Windows | `%APPDATA%\Equicord\src\userplugins\` |
| Equicord — macOS / Linux | `~/.config/Equicord/src/userplugins/` |

If the `userplugins` folder doesn't exist, create it.

### Step 2 — Copy the plugin folder

Copy the entire `FakeMessages` folder into your `userplugins` directory:

```
userplugins/
└── FakeMessages/
    ├── index.tsx
    ├── FakeMessageStore.ts
    └── FakeMessagesModal.tsx
```

### Step 3 — Build and inject

Open a terminal in your Vencord/Equicord directory:

```bash
pnpm build
pnpm inject
```

### Step 4 — Enable the plugin

1. Open Discord
2. Go to **Settings → Plugins**
3. Search for **FakeMessages**
4. Toggle it **ON**
5. Reload Discord (`Ctrl+R` / `Cmd+R`)

---

## How to Use

### Right-click a message

Right-click any message → scroll to the **Fake Messages** group:

| Option | What it does |
|---|---|
| ✏️ Edit Message (Fake) | Opens the editor pre-filled with that message's content |
| 🙈 Hide Message (Fake) | Instantly removes it from your view |
| ➕ Insert Fake Message After This | Opens the editor to add a new fake message right below it |
| 🗂️ Manage Fake Messages | Opens the full manager for that channel |

### Right-click a channel

Right-click any channel or DM in the sidebar → **🎭 Fake Messages** to open the manager.

---

### Adding a fake message

1. Open the manager → click **✚ New Entry**
2. Select type **Add**
3. Fill in:
   - **Author Name** — whose name to show (blank = yours)
   - **Author User ID** — paste their Discord ID for their avatar (optional)
   - **Insert After Message ID** — place it after a specific message (optional, blank = append at bottom)
   - **Content** — the message text (required)
   - **Timestamp** — ISO 8601 format, e.g. `2026-01-01T12:00:00Z` (optional, blank = now)
4. Click **Save Changes**

### Editing a message (fake)

1. Right-click a message → **✏️ Edit Message (Fake)**  
   The message ID is auto-filled.
2. Change the content and/or the displayed author name
3. Click **Save Changes**

### Hiding a message

Right-click a message → **🙈 Hide Message (Fake)**

It disappears instantly. The hide entry appears in the manager — delete it there to restore the message.

---

## Toggles

### Global toggle

Found in the plugin settings page (**Settings → Plugins → FakeMessages**) and in the footer of every manager modal. When **OFF**, all fakes are hidden everywhere regardless of per-channel settings.

### Per-channel toggle

Inside the manager modal for any channel, the toggle in the header controls that channel only. When **OFF** for a channel, fakes are disabled for it even if the global toggle is ON.

---

## Data storage

All data is stored locally using Vencord/Equicord's built-in **DataStore** (IndexedDB). The storage key is `FakeMessages_v1`.

| Survives | ✅ / ❌ |
|---|---|
| Page refreshes | ✅ |
| Discord restarts | ✅ |
| Switching channels and back | ✅ |
| Reinstalling Discord | ❌ (clears IndexedDB) |
| Uninstalling Vencord/Equicord | ❌ (clears plugin data) |

---

## Finding message IDs and user IDs

Enable Discord's **Developer Mode** first:

1. **Settings → Advanced → Developer Mode → ON**
2. Right-click a message → **Copy Message ID**
3. Right-click a username → **Copy User ID**

---

## File structure

```
FakeMessages/
├── index.tsx              # Plugin entry — Flux intercept, context menus, data loading
├── FakeMessageStore.ts    # Types, interfaces, and DataStore helper functions
└── FakeMessagesModal.tsx  # Full React UI modal for managing fake messages
```

---

## Troubleshooting

**Plugin doesn't appear in the plugins list**
- Make sure the folder is named exactly `FakeMessages` (case-sensitive)
- Run `pnpm build` and check for TypeScript errors in the output
- Open DevTools (`Ctrl+Shift+I`) and check the Console for errors

**Fake messages aren't showing up**
- Check that the global toggle is ON (plugin settings or modal footer)
- Check that the per-channel toggle is ON (top of the manager modal)
- Try switching to another channel and back — this triggers a fresh `LOAD_MESSAGES_SUCCESS`

**Context menu items don't appear**
- Make sure the **ContextMenuAPI** plugin is enabled in your Vencord/Equicord settings
- Rebuild (`pnpm build`) and re-inject (`pnpm inject`), then reload Discord

**"Cannot read properties of undefined" error in settings**
- Rebuild the plugin — an older cached build may be running

---

## License

MIT — use, modify, and distribute freely.
