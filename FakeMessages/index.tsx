import { findByPropsLazy } from "@webpack";
import { React, FluxDispatcher, ChannelStore, UserStore, SelectedChannelStore } from "@webpack/common";
import { addContextMenuPatch, removeContextMenuPatch, NavContextMenuPatchCallback } from "@api/ContextMenu";
import { Menu, Tooltip, Forms, Switch } from "@webpack/common";
import { DataStore } from "@api/index";

import { FakeMessagesData, FakeMessageEntry } from "./FakeMessageStore";
import { openFakeMessagesModal } from "./FakeMessagesModal";

export const PLUGIN_DATA_KEY = "FakeMessages_v1";

export let pluginData: FakeMessagesData = {
    globalEnabled: true,
    channelEnabled: {},
    entries: {},
};

const ChatBarAPI = findByPropsLazy("addChatBarButton", "removeChatBarButton");

export async function loadData() {
    const saved = await DataStore.get<FakeMessagesData>(PLUGIN_DATA_KEY);
    if (saved) pluginData = saved;
}

export async function saveData() {
    await DataStore.set(PLUGIN_DATA_KEY, pluginData);
}

export function isEnabledForChannel(channelId: string): boolean {
    if (!pluginData.globalEnabled) return false;
    const ch = pluginData.channelEnabled[channelId];
    return ch !== false;
}

function applyFakesToMessages(channelId: string, messages: any[]): any[] {
    if (!isEnabledForChannel(channelId)) return messages;

    const entries = pluginData.entries[channelId] ?? [];
    if (!entries.length) return messages;

    let result = [...messages];

    for (const entry of entries) {
        if (entry.type === "hide" && entry.originalId) {
            result = result.filter(m => m.id !== entry.originalId);
        } else if (entry.type === "modify" && entry.originalId) {
            result = result.map(m => {
                if (m.id !== entry.originalId) return m;
                return {
                    ...m,
                    content: entry.content ?? m.content,
                    author: entry.authorUsername
                        ? { ...m.author, username: entry.authorUsername, globalName: entry.authorUsername }
                        : m.author,
                    _fakeModified: true,
                };
            });
        } else if (entry.type === "add") {
            const fakeMsg = buildFakeMessage(entry, channelId);
            if (fakeMsg) {
                if (entry.insertAfter) {
                    const idx = result.findIndex(m => m.id === entry.insertAfter);
                    if (idx !== -1) {
                        result.splice(idx + 1, 0, fakeMsg);
                    } else {
                        result.push(fakeMsg);
                    }
                } else {
                    result.push(fakeMsg);
                }
            }
        }
    }

    return result;
}

function buildFakeMessage(entry: FakeMessageEntry, channelId: string): any | null {
    const me = UserStore.getCurrentUser();
    return {
        id: entry.id,
        channel_id: channelId,
        type: 0,
        content: entry.content ?? "",
        timestamp: entry.timestamp ?? new Date().toISOString(),
        edited_timestamp: null,
        tts: false,
        mention_everyone: false,
        mentions: [],
        mention_roles: [],
        attachments: [],
        embeds: [],
        pinned: false,
        flags: 0,
        components: [],
        author: {
            id: entry.authorId ?? me?.id ?? "0",
            username: entry.authorUsername ?? me?.username ?? "Unknown",
            discriminator: "0",
            avatar: entry.authorAvatar ?? me?.avatar ?? null,
            globalName: entry.authorUsername ?? me?.globalName ?? me?.username ?? "Unknown",
            public_flags: 0,
        },
        _fakeAdded: true,
    };
}

function handleLoadMessagesSuccess(payload: any) {
    if (!payload?.messages || !payload?.channelId) return;
    payload.messages = applyFakesToMessages(payload.channelId, payload.messages);
}

const messageContextMenuPatch: NavContextMenuPatchCallback = (children, props) => {
    if (!props?.message) return;
    const { message } = props;
    const channelId = message.channel_id;

    children.push(
        <Menu.MenuSeparator key="fake-sep" />,
        <Menu.MenuGroup
            key="fake-group"
            label="Fake Messages"
        >
            <Menu.MenuItem
                key="fake-edit"
                id="fake-edit"
                label="✏️ Edit This Message (Fake)"
                action={() => {
                    openFakeMessagesModal(channelId, {
                        prefill: "modify",
                        targetMessage: message,
                    });
                }}
            />
            <Menu.MenuItem
                key="fake-hide"
                id="fake-hide"
                label="🙈 Hide This Message (Fake)"
                action={async () => {
                    if (!pluginData.entries[channelId]) pluginData.entries[channelId] = [];
                    const existing = pluginData.entries[channelId].find(
                        e => e.type === "hide" && e.originalId === message.id
                    );
                    if (!existing) {
                        pluginData.entries[channelId].push({
                            id: `fake_hide_${Date.now()}`,
                            type: "hide",
                            originalId: message.id,
                        });
                        await saveData();
                        reloadChannel(channelId);
                    }
                }}
            />
            <Menu.MenuItem
                key="fake-add-after"
                id="fake-add-after"
                label="➕ Add Fake Message After This"
                action={() => {
                    openFakeMessagesModal(channelId, {
                        prefill: "add",
                        insertAfter: message.id,
                    });
                }}
            />
            <Menu.MenuItem
                key="fake-manager"
                id="fake-manager"
                label="🗂️ Open Fake Message Manager"
                action={() => openFakeMessagesModal(channelId, {})}
            />
        </Menu.MenuGroup>
    );
};

const channelContextMenuPatch: NavContextMenuPatchCallback = (children, props) => {
    const channelId = props?.channel?.id ?? props?.channelId;
    if (!channelId) return;

    children.push(
        <Menu.MenuSeparator key="fake-ch-sep" />,
        <Menu.MenuItem
            key="fake-ch-manager"
            id="fake-ch-manager"
            label="🎭 Fake Messages Manager"
            action={() => openFakeMessagesModal(channelId, {})}
        />
    );
};

function ChatBarIcon({ isMainChat }: { isMainChat?: boolean; }) {
    if (!isMainChat) return null;
    const channelId = SelectedChannelStore.getChannelId();
    if (!channelId) return null;

    const enabled = isEnabledForChannel(channelId);

    return (
        <Tooltip text="Fake Messages Manager">
            {({ onMouseEnter, onMouseLeave }: any) => (
                <div
                    onMouseEnter={onMouseEnter}
                    onMouseLeave={onMouseLeave}
                    style={{ cursor: "pointer", display: "flex", alignItems: "center", padding: "0 4px" }}
                    onClick={() => openFakeMessagesModal(channelId, {})}
                >
                    <svg
                        width="24"
                        height="24"
                        viewBox="0 0 24 24"
                        fill="none"
                        style={{ opacity: enabled ? 1 : 0.4 }}
                    >
                        <path
                            fill="currentColor"
                            d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm0 14H5.17L4 17.17V4h16v12zM7 9h2v2H7zm4 0h2v2h-2zm4 0h2v2h-2z"
                        />
                        <circle cx="18" cy="6" r="5" fill="#f04747" />
                    </svg>
                </div>
            )}
        </Tooltip>
    );
}

export function reloadChannel(channelId: string) {
    const ch = ChannelStore.getChannel(channelId);
    const currentChannelId = SelectedChannelStore.getChannelId();

    if (currentChannelId !== channelId) return;

    FluxDispatcher.dispatch({
        type: "CHANNEL_SELECT",
        channelId: null,
        guildId: null,
    });

    setTimeout(() => {
        FluxDispatcher.dispatch({
            type: "CHANNEL_SELECT",
            channelId,
            guildId: ch?.guild_id ?? null,
        });
    }, 80);
}

export default ({
    name: "FakeMessages",
    description: "Visually fake Discord messages — add, edit, or hide messages per channel. Changes persist across refreshes. For Equicord/Vencord.",
    authors: [{ name: "FakeMessages Plugin", id: 0n }],

    dependencies: ["ContextMenuAPI"],

    async start() {
        await loadData();

        FluxDispatcher.subscribe("LOAD_MESSAGES_SUCCESS", handleLoadMessagesSuccess);

        addContextMenuPatch("message", messageContextMenuPatch);
        addContextMenuPatch("channel-context", channelContextMenuPatch);
        addContextMenuPatch("gdm-context", channelContextMenuPatch);
        addContextMenuPatch("user-context", channelContextMenuPatch);

        try {
            ChatBarAPI?.addChatBarButton?.("FakeMessages", ChatBarIcon);
        } catch (_) {}
    },

    stop() {
        FluxDispatcher.unsubscribe("LOAD_MESSAGES_SUCCESS", handleLoadMessagesSuccess);

        removeContextMenuPatch("message", messageContextMenuPatch);
        removeContextMenuPatch("channel-context", channelContextMenuPatch);
        removeContextMenuPatch("gdm-context", channelContextMenuPatch);
        removeContextMenuPatch("user-context", channelContextMenuPatch);

        try {
            ChatBarAPI?.removeChatBarButton?.("FakeMessages");
        } catch (_) {}
    },

    settingsAboutComponent() {
        const [globalEnabled, setGlobalEnabled] = React.useState(pluginData.globalEnabled);

        return (
            <Forms.FormSection>
                <Forms.FormTitle tag="h3">Global Toggle</Forms.FormTitle>
                <Switch
                    value={globalEnabled}
                    onChange={async (v: boolean) => {
                        pluginData.globalEnabled = v;
                        setGlobalEnabled(v);
                        await saveData();
                    }}
                    note="Master switch — disables all fake messages everywhere when off."
                >
                    Enable Fake Messages Globally
                </Switch>
                <Forms.FormDivider />
                <Forms.FormText type={Forms.FormText.Types.DESCRIPTION}>
                    Right-click any message for quick edit/hide/add options.
                    Right-click any channel in the sidebar to open the full manager.
                </Forms.FormText>
            </Forms.FormSection>
        );
    },
});
