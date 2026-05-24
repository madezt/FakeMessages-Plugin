export type FakeEntryType = "add" | "modify" | "hide";

export interface FakeMessageEntry {
    id: string;
    type: FakeEntryType;

    originalId?: string;

    authorId?: string;
    authorUsername?: string;
    authorAvatar?: string;
    content?: string;
    timestamp?: string;
    insertAfter?: string;
}

export interface FakeMessagesData {
    globalEnabled: boolean;
    channelEnabled: Record<string, boolean>;
    entries: Record<string, FakeMessageEntry[]>;
}

export function createEmptyEntry(type: FakeEntryType, channelId: string): FakeMessageEntry {
    return {
        id: `fake_${type}_${Date.now()}_${Math.random().toString(36).slice(2)}`,
        type,
        timestamp: new Date().toISOString(),
    };
}

export function getEntriesForChannel(data: FakeMessagesData, channelId: string): FakeMessageEntry[] {
    return data.entries[channelId] ?? [];
}

export function removeEntry(data: FakeMessagesData, channelId: string, entryId: string): void {
    if (!data.entries[channelId]) return;
    data.entries[channelId] = data.entries[channelId].filter(e => e.id !== entryId);
}

export function upsertEntry(data: FakeMessagesData, channelId: string, entry: FakeMessageEntry): void {
    if (!data.entries[channelId]) data.entries[channelId] = [];
    const idx = data.entries[channelId].findIndex(e => e.id === entry.id);
    if (idx !== -1) {
        data.entries[channelId][idx] = entry;
    } else {
        data.entries[channelId].push(entry);
    }
}
