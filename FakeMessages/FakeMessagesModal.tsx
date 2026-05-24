import { findByPropsLazy } from "@webpack";
import { React, UserStore, ChannelStore } from "@webpack/common";
import { Forms, Button, TextInput, Switch, Text, Tooltip, ScrollerThin } from "@webpack/common";
import { pluginData, saveData, reloadChannel, isEnabledForChannel } from "./index";
import { FakeMessageEntry, FakeEntryType, createEmptyEntry, removeEntry, upsertEntry, getEntriesForChannel } from "./FakeMessageStore";

const ModalAPI = findByPropsLazy("openModal", "closeModal");
const ModalComponents = findByPropsLazy("ModalRoot", "ModalContent", "ModalHeader");

function ModalRoot(props: any) { return <ModalComponents.ModalRoot {...props} />; }
function ModalHeader(props: any) { return <ModalComponents.ModalHeader {...props} />; }
function ModalContent(props: any) { return <ModalComponents.ModalContent {...props} />; }
function ModalFooter(props: any) { return <ModalComponents.ModalFooter {...props} />; }
function ModalCloseButton(props: any) { return <ModalComponents.ModalCloseButton {...props} />; }

interface OpenOptions {
    prefill?: "add" | "modify";
    targetMessage?: any;
    insertAfter?: string;
}

const ENTRY_TYPE_LABELS: Record<FakeEntryType, string> = {
    add: "➕ Add Message",
    modify: "✏️ Edit Message",
    hide: "🙈 Hide Message",
};

const ENTRY_TYPE_COLORS: Record<FakeEntryType, string> = {
    add: "#43b581",
    modify: "#faa61a",
    hide: "#f04747",
};

function EntryCard({
    entry,
    onEdit,
    onDelete,
}: {
    entry: FakeMessageEntry;
    onEdit: () => void;
    onDelete: () => void;
}) {
    return (
        <div style={{
            background: "var(--background-secondary)",
            border: `1px solid var(--background-modifier-accent)`,
            borderLeft: `3px solid ${ENTRY_TYPE_COLORS[entry.type]}`,
            borderRadius: "8px",
            padding: "10px 14px",
            marginBottom: "8px",
            display: "flex",
            alignItems: "flex-start",
            gap: "10px",
        }}>
            <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "4px" }}>
                    <span style={{
                        fontSize: "11px",
                        fontWeight: 700,
                        color: ENTRY_TYPE_COLORS[entry.type],
                        textTransform: "uppercase",
                        letterSpacing: "0.05em",
                    }}>
                        {ENTRY_TYPE_LABELS[entry.type]}
                    </span>
                    {entry.originalId && (
                        <span style={{ fontSize: "11px", color: "var(--text-muted)", fontFamily: "monospace" }}>
                            #{entry.originalId.slice(-6)}
                        </span>
                    )}
                </div>
                {entry.type !== "hide" && (
                    <>
                        {entry.authorUsername && (
                            <div style={{ fontSize: "12px", color: "var(--header-secondary)", marginBottom: "2px" }}>
                                👤 {entry.authorUsername}
                            </div>
                        )}
                        {entry.content && (
                            <div style={{
                                fontSize: "13px",
                                color: "var(--text-normal)",
                                overflow: "hidden",
                                textOverflow: "ellipsis",
                                whiteSpace: "nowrap",
                                maxWidth: "360px",
                            }}>
                                {entry.content}
                            </div>
                        )}
                    </>
                )}
                {entry.type === "hide" && (
                    <div style={{ fontSize: "12px", color: "var(--text-muted)" }}>
                        Message hidden from view
                    </div>
                )}
            </div>
            <div style={{ display: "flex", gap: "6px", flexShrink: 0 }}>
                {entry.type !== "hide" && (
                    <Tooltip text="Edit">
                        {({ onMouseEnter, onMouseLeave }) => (
                            <button
                                onMouseEnter={onMouseEnter}
                                onMouseLeave={onMouseLeave}
                                onClick={onEdit}
                                style={{
                                    background: "var(--background-modifier-hover)",
                                    border: "none",
                                    borderRadius: "4px",
                                    color: "var(--interactive-normal)",
                                    cursor: "pointer",
                                    padding: "4px 8px",
                                    fontSize: "13px",
                                }}
                            >
                                ✏️
                            </button>
                        )}
                    </Tooltip>
                )}
                <Tooltip text="Delete">
                    {({ onMouseEnter, onMouseLeave }) => (
                        <button
                            onMouseEnter={onMouseEnter}
                            onMouseLeave={onMouseLeave}
                            onClick={onDelete}
                            style={{
                                background: "var(--background-modifier-hover)",
                                border: "none",
                                borderRadius: "4px",
                                color: "#f04747",
                                cursor: "pointer",
                                padding: "4px 8px",
                                fontSize: "13px",
                            }}
                        >
                            🗑️
                        </button>
                    )}
                </Tooltip>
            </div>
        </div>
    );
}

function EntryEditor({
    initial,
    onSave,
    onCancel,
    targetMessage,
}: {
    initial: FakeMessageEntry;
    onSave: (entry: FakeMessageEntry) => void;
    onCancel: () => void;
    targetMessage?: any;
}) {
    const [entry, setEntry] = React.useState<FakeMessageEntry>({ ...initial });
    const me = UserStore.getCurrentUser();

    const update = (patch: Partial<FakeMessageEntry>) =>
        setEntry(e => ({ ...e, ...patch }));

    const defaultAuthor = targetMessage
        ? targetMessage.author?.username ?? ""
        : me?.username ?? "";

    return (
        <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
            {entry.type === "add" && (
                <>
                    <Forms.FormSection>
                        <Forms.FormTitle>Author Name</Forms.FormTitle>
                        <TextInput
                            placeholder={me?.username ?? "username"}
                            value={entry.authorUsername ?? ""}
                            onChange={v => update({ authorUsername: v })}
                        />
                        <Forms.FormText type={Forms.FormText.Types.DESCRIPTION}>
                            Leave blank to use your own name.
                        </Forms.FormText>
                    </Forms.FormSection>
                    <Forms.FormSection>
                        <Forms.FormTitle>Author User ID</Forms.FormTitle>
                        <TextInput
                            placeholder={me?.id ?? "user ID (optional)"}
                            value={entry.authorId ?? ""}
                            onChange={v => update({ authorId: v })}
                        />
                        <Forms.FormText type={Forms.FormText.Types.DESCRIPTION}>
                            Used to load the correct avatar. Leave blank for yours.
                        </Forms.FormText>
                    </Forms.FormSection>
                    <Forms.FormSection>
                        <Forms.FormTitle>Timestamp</Forms.FormTitle>
                        <TextInput
                            placeholder={new Date().toISOString()}
                            value={entry.timestamp ?? ""}
                            onChange={v => update({ timestamp: v })}
                        />
                        <Forms.FormText type={Forms.FormText.Types.DESCRIPTION}>
                            ISO 8601 format. Leave blank for now.
                        </Forms.FormText>
                    </Forms.FormSection>
                </>
            )}

            {entry.type === "modify" && (
                <Forms.FormSection>
                    <Forms.FormTitle>Display Name Override</Forms.FormTitle>
                    <TextInput
                        placeholder={defaultAuthor}
                        value={entry.authorUsername ?? ""}
                        onChange={v => update({ authorUsername: v || undefined })}
                    />
                    <Forms.FormText type={Forms.FormText.Types.DESCRIPTION}>
                        Optionally change how the author name displays. Leave blank to keep original.
                    </Forms.FormText>
                </Forms.FormSection>
            )}

            {(entry.type === "add" || entry.type === "modify") && (
                <Forms.FormSection>
                    <Forms.FormTitle>Message Content</Forms.FormTitle>
                    <div style={{ position: "relative" }}>
                        <textarea
                            value={entry.content ?? (entry.type === "modify" ? targetMessage?.content ?? "" : "")}
                            onChange={e => update({ content: e.target.value })}
                            placeholder="Enter message content..."
                            rows={4}
                            style={{
                                width: "100%",
                                background: "var(--input-background)",
                                border: "1px solid var(--background-modifier-accent)",
                                borderRadius: "4px",
                                color: "var(--text-normal)",
                                padding: "8px 10px",
                                fontSize: "14px",
                                resize: "vertical",
                                fontFamily: "inherit",
                                outline: "none",
                                boxSizing: "border-box",
                            }}
                        />
                    </div>
                </Forms.FormSection>
            )}

            <div style={{ display: "flex", gap: "8px", justifyContent: "flex-end", paddingTop: "4px" }}>
                <Button
                    color={Button.Colors.TRANSPARENT}
                    look={Button.Looks.LINK}
                    onClick={onCancel}
                >
                    Cancel
                </Button>
                <Button
                    color={Button.Colors.BRAND}
                    onClick={() => {
                        if (!entry.content?.trim() && entry.type !== "hide") {
                            if (entry.type === "add") return;
                        }
                        onSave(entry);
                    }}
                >
                    Save
                </Button>
            </div>
        </div>
    );
}

function FakeMessagesModalContent({
    channelId,
    options,
    onClose,
}: {
    channelId: string;
    options: OpenOptions;
    onClose: () => void;
}) {
    const [, forceUpdate] = React.useReducer(x => x + 1, 0);
    const [editing, setEditing] = React.useState<FakeMessageEntry | null>(null);
    const [editingTarget, setEditingTarget] = React.useState<any>(null);
    const [activeTab, setActiveTab] = React.useState<"entries" | "add">("entries");
    const [channelEnabled, setChannelEnabled] = React.useState<boolean>(
        pluginData.channelEnabled[channelId] !== false
    );

    const channel = ChannelStore.getChannel(channelId);
    const channelName = channel?.name ?? channelId;
    const isDM = !channel?.guild_id;

    const entries = getEntriesForChannel(pluginData, channelId);

    React.useEffect(() => {
        if (options.prefill === "modify" && options.targetMessage) {
            const entry = createEmptyEntry("modify", channelId);
            entry.originalId = options.targetMessage.id;
            entry.content = options.targetMessage.content ?? "";
            entry.authorUsername = options.targetMessage.author?.username ?? "";
            setEditing(entry);
            setEditingTarget(options.targetMessage);
            setActiveTab("add");
        } else if (options.prefill === "add") {
            const entry = createEmptyEntry("add", channelId);
            if (options.insertAfter) entry.insertAfter = options.insertAfter;
            setEditing(entry);
            setActiveTab("add");
        }
    }, []);

    async function handleSaveEntry(entry: FakeMessageEntry) {
        upsertEntry(pluginData, channelId, entry);
        await saveData();
        setEditing(null);
        setEditingTarget(null);
        setActiveTab("entries");
        forceUpdate();
        reloadChannel(channelId);
    }

    async function handleDeleteEntry(entryId: string) {
        removeEntry(pluginData, channelId, entryId);
        await saveData();
        forceUpdate();
        reloadChannel(channelId);
    }

    async function handleToggleChannel(val: boolean) {
        pluginData.channelEnabled[channelId] = val;
        setChannelEnabled(val);
        await saveData();
        reloadChannel(channelId);
    }

    async function handleClearAll() {
        pluginData.entries[channelId] = [];
        await saveData();
        forceUpdate();
        reloadChannel(channelId);
    }

    const tabStyle = (active: boolean) => ({
        padding: "6px 16px",
        borderRadius: "4px",
        cursor: "pointer",
        fontSize: "13px",
        fontWeight: active ? 700 : 400,
        color: active ? "var(--text-normal)" : "var(--text-muted)",
        background: active ? "var(--background-modifier-selected)" : "transparent",
        border: "none",
        transition: "background 0.15s",
    });

    return (
        <div style={{ display: "flex", flexDirection: "column", gap: "0" }}>
            <div style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                padding: "0 0 12px 0",
                borderBottom: "1px solid var(--background-modifier-accent)",
                marginBottom: "12px",
            }}>
                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    <span style={{ fontSize: "16px" }}>{isDM ? "💬" : "#"}</span>
                    <Forms.FormTitle style={{ margin: 0, fontSize: "14px" }}>
                        {isDM ? "DM" : channelName}
                    </Forms.FormTitle>
                    <span style={{
                        fontSize: "11px",
                        color: "var(--text-muted)",
                        fontFamily: "monospace",
                    }}>
                        {channelId}
                    </span>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    <span style={{ fontSize: "12px", color: "var(--text-muted)" }}>
                        {channelEnabled ? "✅ Enabled" : "❌ Disabled"} for this channel
                    </span>
                    <Switch
                        value={channelEnabled}
                        onChange={handleToggleChannel}
                    />
                </div>
            </div>

            <div style={{ display: "flex", gap: "4px", marginBottom: "16px" }}>
                <button style={tabStyle(activeTab === "entries")} onClick={() => setActiveTab("entries")}>
                    📋 Entries ({entries.length})
                </button>
                <button style={tabStyle(activeTab === "add")} onClick={() => {
                    if (!editing) {
                        const entry = createEmptyEntry("add", channelId);
                        setEditing(entry);
                        setEditingTarget(null);
                    }
                    setActiveTab("add");
                }}>
                    ➕ New Entry
                </button>
            </div>

            {activeTab === "entries" && (
                <div>
                    {entries.length === 0 ? (
                        <div style={{
                            textAlign: "center",
                            padding: "32px 16px",
                            color: "var(--text-muted)",
                            background: "var(--background-secondary)",
                            borderRadius: "8px",
                        }}>
                            <div style={{ fontSize: "32px", marginBottom: "8px" }}>🎭</div>
                            <div style={{ fontSize: "14px", fontWeight: 600, marginBottom: "4px" }}>No fake messages yet</div>
                            <div style={{ fontSize: "12px" }}>
                                Click "New Entry" to add one, or right-click a message for quick options.
                            </div>
                        </div>
                    ) : (
                        <>
                            <ScrollerThin style={{ maxHeight: "320px", paddingRight: "4px" }}>
                                {entries.map(entry => (
                                    <EntryCard
                                        key={entry.id}
                                        entry={entry}
                                        onEdit={() => {
                                            setEditing({ ...entry });
                                            setEditingTarget(null);
                                            setActiveTab("add");
                                        }}
                                        onDelete={() => handleDeleteEntry(entry.id)}
                                    />
                                ))}
                            </ScrollerThin>
                            <div style={{ display: "flex", justifyContent: "flex-end", marginTop: "8px" }}>
                                <Button
                                    color={Button.Colors.RED}
                                    look={Button.Looks.OUTLINED}
                                    size={Button.Sizes.SMALL}
                                    onClick={handleClearAll}
                                >
                                    Clear All
                                </Button>
                            </div>
                        </>
                    )}
                </div>
            )}

            {activeTab === "add" && editing && (
                <div>
                    <div style={{ marginBottom: "12px" }}>
                        <Forms.FormTitle>Entry Type</Forms.FormTitle>
                        <div style={{ display: "flex", gap: "8px" }}>
                            {(["add", "modify", "hide"] as FakeEntryType[]).map(t => (
                                <button
                                    key={t}
                                    onClick={() => setEditing(e => e ? { ...e, type: t } : e)}
                                    style={{
                                        padding: "6px 14px",
                                        borderRadius: "4px",
                                        cursor: "pointer",
                                        fontSize: "12px",
                                        fontWeight: editing.type === t ? 700 : 400,
                                        background: editing.type === t ? ENTRY_TYPE_COLORS[t] : "var(--background-secondary)",
                                        color: editing.type === t ? "white" : "var(--text-muted)",
                                        border: `1px solid ${ENTRY_TYPE_COLORS[t]}`,
                                        transition: "all 0.15s",
                                    }}
                                >
                                    {ENTRY_TYPE_LABELS[t]}
                                </button>
                            ))}
                        </div>
                    </div>

                    {(editing.type === "modify" || editing.type === "hide") && !editing.originalId && (
                        <Forms.FormSection style={{ marginBottom: "12px" }}>
                            <Forms.FormTitle>Original Message ID</Forms.FormTitle>
                            <TextInput
                                placeholder="Message ID to edit/hide"
                                value={editing.originalId ?? ""}
                                onChange={v => setEditing(e => e ? { ...e, originalId: v } : e)}
                            />
                            <Forms.FormText type={Forms.FormText.Types.DESCRIPTION}>
                                Right-click a message → "Edit/Hide This Message" to fill this automatically.
                            </Forms.FormText>
                        </Forms.FormSection>
                    )}

                    {editing.type === "add" && (
                        <Forms.FormSection style={{ marginBottom: "12px" }}>
                            <Forms.FormTitle>Insert After Message ID (optional)</Forms.FormTitle>
                            <TextInput
                                placeholder="Leave blank to append at end"
                                value={editing.insertAfter ?? ""}
                                onChange={v => setEditing(e => e ? { ...e, insertAfter: v || undefined } : e)}
                            />
                        </Forms.FormSection>
                    )}

                    <EntryEditor
                        initial={editing}
                        targetMessage={editingTarget}
                        onSave={handleSaveEntry}
                        onCancel={() => {
                            setEditing(null);
                            setEditingTarget(null);
                            setActiveTab("entries");
                        }}
                    />
                </div>
            )}
        </div>
    );
}

export function openFakeMessagesModal(channelId: string, options: OpenOptions) {
    ModalAPI.openModal((props: any) => (
        <ModalRoot {...props} size="MEDIUM">
            <ModalHeader separator={false}>
                <div style={{ display: "flex", alignItems: "center", gap: "10px", flex: 1 }}>
                    <span style={{ fontSize: "20px" }}>🎭</span>
                    <Text variant="heading-lg/semibold">Fake Messages Manager</Text>
                </div>
                <ModalCloseButton onClick={props.onClose} />
            </ModalHeader>
            <ModalContent style={{ padding: "16px 20px 8px" }}>
                <FakeMessagesModalContent
                    channelId={channelId}
                    options={options}
                    onClose={props.onClose}
                />
            </ModalContent>
            <ModalFooter style={{ padding: "8px 20px 16px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", width: "100%" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                        <span style={{ fontSize: "12px", color: "var(--text-muted)" }}>
                            Global:
                        </span>
                        <Switch
                            value={pluginData.globalEnabled}
                            onChange={async v => {
                                pluginData.globalEnabled = v;
                                await saveData();
                            }}
                        />
                        <span style={{ fontSize: "12px", color: "var(--text-muted)" }}>
                            {pluginData.globalEnabled ? "ON" : "OFF"}
                        </span>
                    </div>
                    <Button color={Button.Colors.TRANSPARENT} look={Button.Looks.LINK} onClick={props.onClose}>
                        Close
                    </Button>
                </div>
            </ModalFooter>
        </ModalRoot>
    ));
}
