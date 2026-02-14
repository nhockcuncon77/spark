import * as SQLite from "expo-sqlite";
import { Platform } from "react-native";

export interface DBMessage {
    id: string;
    chat_id: string;
    type: string;
    content: string;
    sender_id: string;
    received: number;
    seen: number;
    media: string;
    reactions: string;
    created_at: string;
    updated_at: string | null;
}

export interface Message {
    id: string;
    type: string;
    content: string;
    sender_id: string;
    received: boolean;
    seen: boolean;
    media: { id: number; type: string; url: string; created_at: string }[];
    reactions: { id: string; sender_id: string; content: string; created_at: string }[];
    created_at: string;
    updated_at?: string;
}

const MAX_MESSAGES_PER_CHAT = 690;

let db: SQLite.SQLiteDatabase | null = null;

async function getDb(): Promise<SQLite.SQLiteDatabase> {
    if (db) return db;

    if (Platform.OS === "web") {
        throw new Error("SQLite not supported on web");
    }

    db = await SQLite.openDatabaseAsync("spark_chat.db");

    await db.execAsync(`
    CREATE TABLE IF NOT EXISTS messages (
      id TEXT PRIMARY KEY,
      chat_id TEXT NOT NULL,
      type TEXT NOT NULL,
      content TEXT,
      sender_id TEXT NOT NULL,
      received INTEGER DEFAULT 0,
      seen INTEGER DEFAULT 0,
      media TEXT,
      reactions TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT
    );
    CREATE INDEX IF NOT EXISTS idx_messages_chat ON messages(chat_id, created_at DESC);
  `);

    return db;
}

function toDBMessage(chatId: string, msg: Message): DBMessage {
    return {
        id: msg.id,
        chat_id: chatId,
        type: msg.type,
        content: msg.content,
        sender_id: msg.sender_id,
        received: msg.received ? 1 : 0,
        seen: msg.seen ? 1 : 0,
        media: JSON.stringify(msg.media || []),
        reactions: JSON.stringify(msg.reactions || []),
        created_at: msg.created_at,
        updated_at: msg.updated_at || null,
    };
}

function fromDBMessage(row: DBMessage): Message {
    return {
        id: row.id,
        type: row.type,
        content: row.content,
        sender_id: row.sender_id,
        received: row.received === 1,
        seen: row.seen === 1,
        media: JSON.parse(row.media || "[]"),
        reactions: JSON.parse(row.reactions || "[]"),
        created_at: row.created_at,
        updated_at: row.updated_at || undefined,
    };
}

export async function getMessages(chatId: string, limit = 50, beforeId?: string): Promise<Message[]> {
    if (Platform.OS === "web") return [];

    const database = await getDb();

    let rows: DBMessage[];
    if (beforeId) {
        rows = await database.getAllAsync<DBMessage>(
            `SELECT * FROM messages 
       WHERE chat_id = ? AND created_at < (SELECT created_at FROM messages WHERE id = ?)
       ORDER BY created_at DESC LIMIT ?`,
            [chatId, beforeId, limit]
        );
    } else {
        rows = await database.getAllAsync<DBMessage>(
            `SELECT * FROM messages WHERE chat_id = ? ORDER BY created_at DESC LIMIT ?`,
            [chatId, limit]
        );
    }

    return rows.map(fromDBMessage).reverse();
}

export async function saveMessage(chatId: string, message: Message): Promise<void> {
    if (Platform.OS === "web") return;

    const database = await getDb();
    const dbMsg = toDBMessage(chatId, message);

    await database.runAsync(
        `INSERT OR REPLACE INTO messages (id, chat_id, type, content, sender_id, received, seen, media, reactions, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [dbMsg.id, dbMsg.chat_id, dbMsg.type, dbMsg.content, dbMsg.sender_id, dbMsg.received, dbMsg.seen, dbMsg.media, dbMsg.reactions, dbMsg.created_at, dbMsg.updated_at]
    );

    await trimMessages(chatId);
}

export async function saveMessages(chatId: string, messages: Message[]): Promise<void> {
    if (Platform.OS === "web" || messages.length === 0) return;

    const database = await getDb();

    for (const message of messages) {
        const dbMsg = toDBMessage(chatId, message);
        await database.runAsync(
            `INSERT OR REPLACE INTO messages (id, chat_id, type, content, sender_id, received, seen, media, reactions, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [dbMsg.id, dbMsg.chat_id, dbMsg.type, dbMsg.content, dbMsg.sender_id, dbMsg.received, dbMsg.seen, dbMsg.media, dbMsg.reactions, dbMsg.created_at, dbMsg.updated_at]
        );
    }

    await trimMessages(chatId);
}

export async function updateMessageSeen(chatId: string, messageIds: string[]): Promise<void> {
    if (Platform.OS === "web" || messageIds.length === 0) return;

    const database = await getDb();
    const placeholders = messageIds.map(() => "?").join(",");

    await database.runAsync(
        `UPDATE messages SET seen = 1 WHERE chat_id = ? AND id IN (${placeholders})`,
        [chatId, ...messageIds]
    );
}

export async function markAllSeenBefore(chatId: string, messageId: string): Promise<void> {
    if (Platform.OS === "web") return;

    const database = await getDb();

    await database.runAsync(
        `UPDATE messages SET seen = 1 
     WHERE chat_id = ? AND created_at <= (SELECT created_at FROM messages WHERE id = ?)`,
        [chatId, messageId]
    );
}

async function trimMessages(chatId: string): Promise<void> {
    const database = await getDb();

    const countResult = await database.getFirstAsync<{ count: number }>(
        `SELECT COUNT(*) as count FROM messages WHERE chat_id = ?`,
        [chatId]
    );

    if (countResult && countResult.count > MAX_MESSAGES_PER_CHAT) {
        const deleteCount = countResult.count - MAX_MESSAGES_PER_CHAT;
        await database.runAsync(
            `DELETE FROM messages WHERE chat_id = ? AND id IN (
        SELECT id FROM messages WHERE chat_id = ? ORDER BY created_at ASC LIMIT ?
      )`,
            [chatId, chatId, deleteCount]
        );
    }
}

export async function getLatestMessageId(chatId: string): Promise<string | null> {
    if (Platform.OS === "web") return null;

    const database = await getDb();
    const result = await database.getFirstAsync<{ id: string }>(
        `SELECT id FROM messages WHERE chat_id = ? ORDER BY created_at DESC LIMIT 1`,
        [chatId]
    );

    return result?.id || null;
}

export async function clearChat(chatId: string): Promise<void> {
    if (Platform.OS === "web") return;

    const database = await getDb();
    await database.runAsync(`DELETE FROM messages WHERE chat_id = ?`, [chatId]);
}

export async function closeDb(): Promise<void> {
    if (db) {
        await db.closeAsync();
        db = null;
    }
}
