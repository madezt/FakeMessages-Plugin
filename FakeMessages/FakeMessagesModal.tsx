import { findByPropsLazy } from "@webpack";
import { React, UserStore, ChannelStore } from "@webpack/common";
import { Forms, Button, TextInput, Switch, Text, Tooltip, ScrollerThin } from "@webpack/common";
import { pluginData, saveData, reloadChannel } from "./index";
import { FakeMessageEntry, FakeEntryType, createEmptyEntry, removeEntry, upsertEntry, getEntriesForChannel } from "./FakeMessageStore";

const ModalAPI = findByPropsLazy("openModal", "closeModal");
const MC = findByPropsLazy("ModalRoot", "ModalContent", "ModalFooter");

const ModalRoot = (p: any) => React.createElement(MC.ModalRoot, p);
const ModalHeader = (p: any) => React.createElement(MC.ModalHeader, p);
const ModalContent = (p: any) => React.createElement(MC.ModalContent, p);
const ModalFooter = (p: any) => React.createElement(MC.ModalFooter, p);
const ModalCloseButton = (p: any) => React.createElement(MC.ModalCloseButton, p);

interface OpenOptions {
    prefill?: "add" | "modify";
    targetMessage?: any;
    insertAfter?: string;
}

const TYPE_CONFIG: Record<FakeEntryType, { label: string; color: string; icon: string; }> = {
    add:    { label: "Add",    color: "#3ba55c", icon: "➕" },
    modify: { label: "Edit",   color: "#faa61a", icon: "✏️" },
    hide:   { label: "Hide",   color: "#ed4245", icon: "🙈" },
};

const S = {
    card: (color: string): React.CSSProperties => ({
        background: "var(--background-secondary)",
        borderRadius: "6px",
        padding: "10px 12px",
        marginBottom: "6px",
        display: "flex",
        alignItems: "center",
        gap: "10px",
        borderLeft: `3px solid ${color}`,
        transition: "background 0.1s",
    }),
    typePill: (active: boolean, color: string): React.CSSProperties => ({
        flex: 1,
        padding: "7px 0",
        borderRadius: "4px",
        border: `1px solid ${active ? color : "var(--background-modifier-accent)"}`,
        background: active ? `${color}22` : "transparent",
        color: active ? color : "var(--text-muted)",
        fontWeight: active ? 700 : 400,
        fontSize: "12px",
        cursor: "pointer",
        transition: "all 0.15s",
        textAlign: "center" as const,
    }),
    iconBtn: (danger = false): React.CSSProperties => ({
        background: "transparent",
        border: "none",
        borderRadius: "4px",
        color: danger ? "var(--status-danger)" : "var(--interactive-normal)",
        cursor: "pointer",
        padding: "4px 6px",
        fontSize: "14px",
        lineHeight: 1,
        transition: "background 0.1s, color 0.1s",
        flexShrink: 0,
    }),
    tab: (active: boolean): React.CSSProperties => ({
        padding: "7px 14px",
        fontSize: "13px",
        fontWeight: active ? 600 : 400,
        color: active ? "var(--header-primary)" : "var(--text-muted)",
        background: "none",
        border: "none",
        borderBottom: active ? "2px solid var(--brand-500, #5865f2)" : "2px solid transparent",
        cursor: "pointer",
        transition: "color 0.1s, border-color 0.1s",
        marginBottom: "-1px",
    }),
    textarea: (focused: boolean): React.CSSProperties => ({
        width: "100%",
        background: "var(--input-background, var(--background-secondary))",
        border: `1px solid ${focused ? "var(--brand-500, #5865f2)" : "var(--background-modifier-accent)"}`,
        borderRadius: "4px",
        color: "var(--text-normal)",
        padding: "8px 10px",
        fontSize: "14px",
        lineHeight: "1.5",
        resize: "vertical",
        fontFamily: "inherit",
        outline: "none",
        boxSizing: "border-box" as const,
        transition: "border-color 0.15s",
        minHeight: "80px",
    }),
} as const;

function EntryCard({ entry, onEdit, onDelete }: {
    entry: FakeMessageEntry;
    onEdit: () => void;
    onDelete: () => void;
}) {
    const cfg = TYPE_CONFIG[entry.type];
    const [hovered, setHovered] = React.useState(false);

    return (
        <div
            style={{ ...S.card(cfg.color), background: hovered ? "var(--background-modifier-hover)" : "var(--background-secondary)" }}
            onMouseEnter={() => setHovered(true)}
            onMouseLeave={() => setHovered(false)}
        >
            <span style={{ fontSize: "16px", flexShrink: 0 }}>{cfg.icon}</span>
            <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "2px" }}>
                    <span style={{ fontSize: "11px", fontWeight: 700, color: cfg.color, textTransform: "uppercase", letterSpacing: "0.06em" }}>
                        {cfg.label}
                    </span>
                    {entry.originalId && (
                        <span style={{ fontSize: "10px", color: "var(--text-muted)", fontFamily: "monospace", background: "var(--background-tertiary)", padding: "1px 5px", borderRadius: "3px" }}>
                            …{entry.originalId.slice(-8)}
                        </span>
                    )}
                </div>
                {entry.type === "hide" ? (
                    <div style={{ fontSize: "12px", color: "var(--text-muted)", fontStyle: "italic" }}>Hidden from view</div>
                ) : (
                    <div style={{ display: "flex", flexDirection: "column", gap: "1px" }}>
                        {entry.authorUsername && (
                            <div style={{ fontSize: "12px", color: "var(--header-secondary)", fontWeight: 500 }}>
                                {entry.authorUsername}
                            </div>
                        )}
                        {entry.content && (
                            <div style={{ fontSize: "13px", color: "var(--text-normal)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: "320px" }}>
                                {entry.content}
                            </div>
                        )}
                        {!entry.content && !entry.authorUsername && (
                            <div style={{ fontSize: "12px", color: "var(--text-muted)", fontStyle: "italic" }}>No content</div>
                        )}
                    </div>
                )}
            </div>
            <div style={{ display: "flex", gap: "2px", opacity: hovered ? 1 : 0.4, transition: "opacity 0.15s" }}>
                {entry.type !== "hide" && (
                    <Tooltip text="Edit">
                        {(tp: any) => (
                            <button {...tp} onClick={onEdit} style={S.iconBtn()}>✏️</button>
                        )}
                    </Tooltip>
                )}
                <Tooltip text="Remove">
                    {(tp: any) => (
                        <button {...tp} onClick={onDelete} style={S.iconBtn(true)}>🗑️</button>
                    )}
                </Tooltip>
            </div>
        </div>
    );
}

function TypeSelector({ value, onChange }: { value: FakeEntryType; onChange: (t: FakeEntryType) => void; }) {
    return (
        <div style={{ display: "flex", gap: "6px", marginBottom: "16px" }}>
            {(Object.entries(TYPE_CONFIG) as [FakeEntryType, typeof TYPE_CONFIG[FakeEntryType]][]).map(([type, cfg]) => (
                <button key={type} onClick={() => onChange(type)} style={S.typePill(value === type, cfg.color)}>
                    {cfg.icon} {cfg.label}
                </button>
            ))}
        </div>
    );
}

function EntryEditor({ initial, onSave, onCancel, targetMessage }: {
    initial: FakeMessageEntry;
    onSave: (entry: FakeMessageEntry) => void;
    onCancel: () => void;
    targetMessage?: any;
}) {
    const me = UserStore.getCurrentUser();
    const [entry, setEntry] = React.useState<FakeMessageEntry>({ ...initial });
    const [textareaFocused, setTextareaFocused] = React.useState(false);
    const isNew = !initial.originalId && initial.type !== "add";

    const update = (patch: Partial<FakeMessageEntry>) => setEntry(e => ({ ...e, ...patch }));

    function handleTypeChange(type: FakeEntryType) {
        setEntry(e => ({
            id: e.id,
            type,
            ...(type === "add" ? { content: e.content, authorUsername: e.authorUsername, authorId: e.authorId, timestamp: e.timestamp, insertAfter: e.insertAfter } : {}),
            ...(type === "modify" ? { content: e.content, authorUsername: e.authorUsername, originalId: e.originalId } : {}),
            ...(type === "hide" ? { originalId: e.originalId } : {}),
        }));
    }

    const canSave =
        entry.type === "hide" ? !!entry.originalId?.trim() :
        entry.type === "modify" ? !!entry.originalId?.trim() && (!!entry.content?.trim() || !!entry.authorUsername?.trim()) :
        entry.type === "add" ? !!entry.content?.trim() : false;

    const contentValue = entry.content ?? (entry.type === "modify" ? targetMessage?.content ?? "" : "");
    const charCount = contentValue.length;

    return (
        <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            <TypeSelector value={entry.type} onChange={handleTypeChange} />

            {(entry.type === "modify" || entry.type === "hide") && (
                <div>
                    <Forms.FormTitle style={{ marginBottom: "6px" }}>Message ID</Forms.FormTitle>
                    <TextInput
                        placeholder="Right-click a message → 'Edit/Hide' to fill automatically"
                        value={entry.originalId ?? ""}
                        onChange={(v: string) => update({ originalId: v.trim() || undefined })}
                    />
                    {!entry.originalId?.trim() && (
                        <Forms.FormText type={Forms.FormText.Types.DESCRIPTION} style={{ color: "var(--status-danger, #ed4245)", marginTop: "4px" }}>
                            Required — right-click a message → "Edit/Hide Message (Fake)" to auto-fill this.
                        </Forms.FormText>
                    )}
                </div>
            )}

            {entry.type === "add" && (
                <>
                    <div>
                        <Forms.FormTitle style={{ marginBottom: "6px" }}>Author Name</Forms.FormTitle>
                        <TextInput
                            placeholder={me?.username ?? "username"}
                            value={entry.authorUsername ?? ""}
                            onChange={(v: string) => update({ authorUsername: v || undefined })}
                        />
                        <Forms.FormText type={Forms.FormText.Types.DESCRIPTION}>
                            Leave blank to use your name.
                        </Forms.FormText>
                    </div>
                    <div>
                        <Forms.FormTitle style={{ marginBottom: "6px" }}>Author User ID <span style={{ fontWeight: 400, color: "var(--text-muted)" }}>(optional)</span></Forms.FormTitle>
                        <TextInput
                            placeholder={me?.id ?? "for correct avatar"}
                            value={entry.authorId ?? ""}
                            onChange={(v: string) => update({ authorId: v.trim() || undefined })}
                        />
                    </div>
                    <div>
                        <Forms.FormTitle style={{ marginBottom: "6px" }}>Insert After Message ID <span style={{ fontWeight: 400, color: "var(--text-muted)" }}>(optional)</span></Forms.FormTitle>
                        <TextInput
                            placeholder="Leave blank to append at bottom"
                            value={entry.insertAfter ?? ""}
                            onChange={(v: string) => update({ insertAfter: v.trim() || undefined })}
                        />
                    </div>
                </>
            )}

            {entry.type === "modify" && (
                <div>
                    <Forms.FormTitle style={{ marginBottom: "6px" }}>Author Name Override <span style={{ fontWeight: 400, color: "var(--text-muted)" }}>(optional)</span></Forms.FormTitle>
                    <TextInput
                        placeholder={targetMessage?.author?.username ?? "leave blank to keep original"}
                        value={entry.authorUsername ?? ""}
                        onChange={(v: string) => update({ authorUsername: v || undefined })}
                    />
                </div>
            )}

            {entry.type !== "hide" && (
                <div>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: "6px" }}>
                        <Forms.FormTitle style={{ margin: 0 }}>
                            Message Content
                            {entry.type === "add" && <span style={{ color: "var(--status-danger, #ed4245)", marginLeft: "2px" }}>*</span>}
                        </Forms.FormTitle>
                        <span style={{ fontSize: "11px", color: charCount > 1900 ? "var(--status-danger, #ed4245)" : "var(--text-muted)" }}>
                            {charCount}/2000
                        </span>
                    </div>
                    <textarea
                        value={contentValue}
                        onChange={e => update({ content: e.target.value })}
                        onFocus={() => setTextareaFocused(true)}
                        onBlur={() => setTextareaFocused(false)}
                        placeholder="Enter message content..."
                        maxLength={2000}
                        style={S.textarea(textareaFocused)}
                    />
                    {entry.type === "add" && !entry.content?.trim() && (
                        <Forms.FormText type={Forms.FormText.Types.DESCRIPTION} style={{ color: "var(--status-danger, #ed4245)", marginTop: "4px" }}>
                            Required.
                        </Forms.FormText>
                    )}
                </div>
            )}

            {entry.type === "add" && (
                <div>
                    <Forms.FormTitle style={{ marginBottom: "6px" }}>Timestamp <span style={{ fontWeight: 400, color: "var(--text-muted)" }}>(optional)</span></Forms.FormTitle>
                    <TextInput
                        placeholder={new Date().toISOString()}
                        value={entry.timestamp ?? ""}
                        onChange={(v: string) => update({ timestamp: v.trim() || undefined })}
                    />
                    <Forms.FormText type={Forms.FormText.Types.DESCRIPTION}>
                        ISO 8601 — e.g. {new Date().toISOString().slice(0, 19)}Z. Leave blank for current time.
                    </Forms.FormText>
                </div>
            )}

            <div style={{ display: "flex", gap: "8px", justifyContent: "flex-end", paddingTop: "4px", borderTop: "1px solid var(--background-modifier-accent)" }}>
                <Button color={Button.Colors.TRANSPARENT} look={Button.Looks.LINK} onClick={onCancel}>
                    Cancel
                </Button>
                <Button
                    color={Button.Colors.BRAND}
                    disabled={!canSave}
                    onClick={() => canSave && onSave({ ...entry, content: contentValue || undefined })}
                >
                    {initial.originalId || initial.type === "add" ? "Save Changes" : "Create"}
                </Button>
            </div>
        </div>
    );
}

function FakeMessagesModalContent({ channelId, options }: { channelId: string; options: OpenOptions; }) {
    const [, forceUpdate] = React.useReducer(x => x + 1, 0);
    const [editing, setEditing] = React.useState<FakeMessageEntry | null>(null);
    const [editingTarget, setEditingTarget] = React.useState<any>(null);
    const [activeTab, setActiveTab] = React.useState<"list" | "editor">("list");
    const [channelEnabled, setChannelEnabled] = React.useState(pluginData.channelEnabled[channelId] !== false);
    const [confirmClear, setConfirmClear] = React.useState(false);

    const channel = ChannelStore.getChannel(channelId);
    const isDM = !channel?.guild_id;
    const channelLabel = isDM ? "DM" : (channel?.name ?? channelId);

    const entries = getEntriesForChannel(pluginData, channelId);

    React.useEffect(() => {
        if (options.prefill === "modify" && options.targetMessage) {
            const entry = createEmptyEntry("modify");
            entry.originalId = options.targetMessage.id;
            entry.content = options.targetMessage.content ?? "";
            entry.authorUsername = options.targetMessage.author?.username ?? undefined;
            setEditing(entry);
            setEditingTarget(options.targetMessage);
            setActiveTab("editor");
        } else if (options.prefill === "add") {
            const entry = createEmptyEntry("add");
            if (options.insertAfter) entry.insertAfter = options.insertAfter;
            setEditing(entry);
            setActiveTab("editor");
        }
    }, []);

    function openNewEntry() {
        setEditing(createEmptyEntry("add"));
        setEditingTarget(null);
        setActiveTab("editor");
    }

    async function handleSave(entry: FakeMessageEntry) {
        upsertEntry(pluginData, channelId, entry);
        await saveData();
        setEditing(null);
        setEditingTarget(null);
        setActiveTab("list");
        forceUpdate();
        reloadChannel(channelId);
    }

    function handleCancel() {
        setEditing(null);
        setEditingTarget(null);
        setActiveTab("list");
    }

    async function handleDelete(entryId: string) {
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
        setConfirmClear(false);
        forceUpdate();
        reloadChannel(channelId);
    }

    const editorLabel = editing && (editing.originalId || editing.type === "add" && entries.some(e => e.id === editing.id))
        ? "✏️ Edit Entry"
        : "✚ New Entry";

    return (
        <div style={{ display: "flex", flexDirection: "column", minHeight: 0 }}>

            {/* Channel bar */}
            <div style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                background: "var(--background-secondary)",
                borderRadius: "6px",
                padding: "8px 12px",
                marginBottom: "12px",
            }}>
                <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                    <span style={{ color: "var(--text-muted)", fontWeight: 700, fontSize: "15px" }}>
                        {isDM ? "✉" : "#"}
                    </span>
                    <Text variant="text-md/semibold">{channelLabel}</Text>
                    <span style={{
                        fontSize: "10px",
                        color: channelEnabled ? "#3ba55c" : "var(--status-danger, #ed4245)",
                        fontWeight: 600,
                        textTransform: "uppercase",
                        letterSpacing: "0.06em",
                        background: channelEnabled ? "#3ba55c22" : "#ed424522",
                        padding: "2px 6px",
                        borderRadius: "3px",
                    }}>
                        {channelEnabled ? "ON" : "OFF"}
                    </span>
                </div>
                <Tooltip text={channelEnabled ? "Disable for this channel" : "Enable for this channel"}>
                    {(tp: any) => (
                        <div {...tp}>
                            <Switch value={channelEnabled} onChange={handleToggleChannel} />
                        </div>
                    )}
                </Tooltip>
            </div>

            {/* Tab bar */}
            <div style={{ display: "flex", borderBottom: "1px solid var(--background-modifier-accent)", marginBottom: "14px" }}>
                <button
                    style={S.tab(activeTab === "list")}
                    onClick={() => { if (activeTab !== "list") handleCancel(); }}
                >
                    Entries
                    <span style={{
                        marginLeft: "6px",
                        background: entries.length ? "var(--brand-500, #5865f2)" : "var(--background-modifier-accent)",
                        color: entries.length ? "white" : "var(--text-muted)",
                        borderRadius: "10px",
                        padding: "0 6px",
                        fontSize: "11px",
                        fontWeight: 700,
                    }}>
                        {entries.length}
                    </span>
                </button>
                <button
                    style={S.tab(activeTab === "editor")}
                    onClick={() => { if (activeTab !== "editor") openNewEntry(); }}
                >
                    {activeTab === "editor" ? editorLabel : "✚ New Entry"}
                </button>
            </div>

            {/* Entries list */}
            {activeTab === "list" && (
                entries.length === 0 ? (
                    <div style={{ textAlign: "center", padding: "32px 16px", color: "var(--text-muted)" }}>
                        <div style={{ fontSize: "36px", marginBottom: "10px", opacity: 0.6 }}>🎭</div>
                        <div style={{ fontSize: "14px", fontWeight: 600, color: "var(--header-secondary)", marginBottom: "6px" }}>
                            No fake messages
                        </div>
                        <div style={{ fontSize: "12px", lineHeight: 1.6 }}>
                            Click <strong>✚ New Entry</strong> above, or right-click{"\n"}any message for quick options.
                        </div>
                        <Button
                            color={Button.Colors.BRAND}
                            look={Button.Looks.OUTLINED}
                            size={Button.Sizes.SMALL}
                            style={{ marginTop: "14px" }}
                            onClick={openNewEntry}
                        >
                            ✚ Create First Entry
                        </Button>
                    </div>
                ) : (
                    <div>
                        <ScrollerThin style={{ maxHeight: "300px", paddingRight: "4px" }} fade>
                            {entries.map(entry => (
                                <EntryCard
                                    key={entry.id}
                                    entry={entry}
                                    onEdit={() => {
                                        setEditing({ ...entry });
                                        setEditingTarget(null);
                                        setActiveTab("editor");
                                    }}
                                    onDelete={() => handleDelete(entry.id)}
                                />
                            ))}
                        </ScrollerThin>
                        <div style={{ display: "flex", justifyContent: "flex-end", marginTop: "10px" }}>
                            {confirmClear ? (
                                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                                    <Text variant="text-sm/normal" style={{ color: "var(--text-muted)" }}>
                                        Remove all {entries.length} {entries.length === 1 ? "entry" : "entries"}?
                                    </Text>
                                    <Button color={Button.Colors.RED} size={Button.Sizes.SMALL} onClick={handleClearAll}>
                                        Confirm
                                    </Button>
                                    <Button color={Button.Colors.TRANSPARENT} look={Button.Looks.LINK} size={Button.Sizes.SMALL} onClick={() => setConfirmClear(false)}>
                                        Cancel
                                    </Button>
                                </div>
                            ) : (
                                <Button
                                    color={Button.Colors.RED}
                                    look={Button.Looks.OUTLINED}
                                    size={Button.Sizes.SMALL}
                                    onClick={() => setConfirmClear(true)}
                                >
                                    Clear All
                                </Button>
                            )}
                        </div>
                    </div>
                )
            )}

            {/* Editor */}
            {activeTab === "editor" && editing && (
                <EntryEditor
                    key={editing.id}
                    initial={editing}
                    targetMessage={editingTarget}
                    onSave={handleSave}
                    onCancel={handleCancel}
                />
            )}
        </div>
    );
}

export function openFakeMessagesModal(channelId: string, options: OpenOptions) {
    ModalAPI.openModal((props: any) => (
        <ModalRoot {...props} size="MEDIUM">
            <ModalHeader separator={false} style={{ padding: "16px 20px 12px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "10px", flex: 1 }}>
                    <span style={{ fontSize: "22px" }}>🎭</span>
                    <Text variant="heading-lg/semibold">Fake Messages</Text>
                </div>
                <ModalCloseButton onClick={props.onClose} />
            </ModalHeader>

            <ModalContent style={{ padding: "0 20px 8px" }}>
                <FakeMessagesModalContent channelId={channelId} options={options} />
            </ModalContent>

            <ModalFooter style={{ padding: "10px 20px", background: "var(--background-secondary-alt, var(--background-secondary))" }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", width: "100%" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                        <Text variant="text-sm/normal" style={{ color: "var(--text-muted)" }}>Global</Text>
                        <Switch
                            value={pluginData.globalEnabled}
                            onChange={async (v: boolean) => {
                                pluginData.globalEnabled = v;
                                await saveData();
                            }}
                        />
                        <Text variant="text-sm/medium" style={{ color: pluginData.globalEnabled ? "#3ba55c" : "var(--status-danger, #ed4245)" }}>
                            {pluginData.globalEnabled ? "On" : "Off"}
                        </Text>
                    </div>
                    <Button color={Button.Colors.TRANSPARENT} look={Button.Looks.LINK} onClick={props.onClose}>
                        Close
                    </Button>
                </div>
            </ModalFooter>
        </ModalRoot>
    ));
}
