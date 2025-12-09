import Database from "better-sqlite3";
import { app } from "electron";
import { randomUUID } from "node:crypto";
import path from "node:path";
import "./shim"; // Ensure CommonJS globals exist for native deps

export type Project = {
	id: string;
	name: string;
	system_prompt: string;
	created_at: number;
};

export type Chat = {
	id: string;
	project_id: string;
	name: string;
	created_at: number;
};

export type Message = {
	id: string;
	chat_id: string;
	role: "user" | "assistant" | "system";
	content: string;
	created_at: number;
};

type KeyValue = {
	key: string;
	value: string;
};

let db: Database.Database | null = null;

function migrateProjectsTable(database: Database.Database) {
	// Check if projects table exists
	const tableExists = database
		.prepare(
			"SELECT name FROM sqlite_master WHERE type='table' AND name='projects'",
		)
		.get() as { name: string } | undefined;

	if (!tableExists) {
		// Table doesn't exist yet, will be created below
		return;
	}

	// Check if old columns exist
	const tableInfo = database
		.prepare("PRAGMA table_info(projects)")
		.all() as Array<{ name: string; type: string }>;

	const hasOldColumns = tableInfo.some(
		(col) => col.name === "model_provider" || col.name === "model_id",
	);

	if (hasOldColumns) {
		// Migrate: create new table, copy data, drop old, rename new
		// Temporarily disable foreign keys for the migration
		database.pragma("foreign_keys = OFF");
		database.exec(`
			CREATE TABLE projects_new (
				id TEXT PRIMARY KEY,
				name TEXT NOT NULL,
				system_prompt TEXT NOT NULL DEFAULT '',
				created_at INTEGER NOT NULL
			);
			INSERT INTO projects_new (id, name, system_prompt, created_at)
			SELECT id, name, system_prompt, created_at FROM projects;
			DROP TABLE projects;
			ALTER TABLE projects_new RENAME TO projects;
		`);
		database.pragma("foreign_keys = ON");
	}
}

function ensureDb() {
	if (db) return db;
	const dbPath = path.join(app.getPath("userData"), "wisteria.db");
	db = new Database(dbPath);
	db.pragma("journal_mode = WAL");
	db.pragma("foreign_keys = ON");

	// Run migration before creating tables
	migrateProjectsTable(db);

	db.exec(`
		CREATE TABLE IF NOT EXISTS projects (
			id TEXT PRIMARY KEY,
			name TEXT NOT NULL,
			system_prompt TEXT NOT NULL DEFAULT '',
			created_at INTEGER NOT NULL
		);
		CREATE TABLE IF NOT EXISTS chats (
			id TEXT PRIMARY KEY,
			project_id TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
			name TEXT NOT NULL,
			created_at INTEGER NOT NULL
		);
		CREATE TABLE IF NOT EXISTS messages (
			id TEXT PRIMARY KEY,
			chat_id TEXT NOT NULL REFERENCES chats(id) ON DELETE CASCADE,
			role TEXT NOT NULL,
			content TEXT NOT NULL,
			created_at INTEGER NOT NULL
		);
		CREATE TABLE IF NOT EXISTS kv (
			key TEXT PRIMARY KEY,
			value TEXT NOT NULL
		);
	`);
	return db;
}

export function listProjects(): Project[] {
	const database = ensureDb();
	return database
		.prepare("SELECT * FROM projects ORDER BY created_at DESC")
		.all() as Project[];
}

export function createProject(name: string): Project {
	const database = ensureDb();
	const project: Project = {
		id: randomUUID(),
		name,
		system_prompt: "",
		created_at: Date.now(),
	};
	database
		.prepare(
			"INSERT INTO projects (id, name, system_prompt, created_at) VALUES (@id, @name, @system_prompt, @created_at)",
		)
		.run(project);
	return project;
}

export function updateProject(
	projectId: string,
	data: Partial<Pick<Project, "name" | "system_prompt">>,
): Project | null {
	const database = ensureDb();
	const existing = database
		.prepare("SELECT * FROM projects WHERE id = ?")
		.get(projectId) as Project | undefined;
	if (!existing) return null;
	const updated: Project = {
		...existing,
		...data,
	};
	database
		.prepare(
			"UPDATE projects SET name=@name, system_prompt=@system_prompt WHERE id=@id",
		)
		.run(updated);
	return updated;
}

export function deleteProject(projectId: string) {
	const database = ensureDb();
	database.prepare("DELETE FROM projects WHERE id = ?").run(projectId);
}

export function listChats(projectId: string): Chat[] {
	const database = ensureDb();
	return database
		.prepare(
			"SELECT * FROM chats WHERE project_id = ? ORDER BY created_at DESC",
		)
		.all(projectId) as Chat[];
}

export function createChat(projectId: string, name: string): Chat {
	const database = ensureDb();
	const chat: Chat = {
		id: randomUUID(),
		project_id: projectId,
		name,
		created_at: Date.now(),
	};
	database
		.prepare(
			"INSERT INTO chats (id, project_id, name, created_at) VALUES (@id, @project_id, @name, @created_at)",
		)
		.run(chat);
	return chat;
}

export function deleteChat(chatId: string) {
	const database = ensureDb();
	database.prepare("DELETE FROM chats WHERE id = ?").run(chatId);
}

export function listMessages(chatId: string): Message[] {
	const database = ensureDb();
	return database
		.prepare("SELECT * FROM messages WHERE chat_id = ? ORDER BY created_at ASC")
		.all(chatId) as Message[];
}

export function appendMessage(
	chatId: string,
	role: Message["role"],
	content: string,
): Message {
	const database = ensureDb();
	const msg: Message = {
		id: randomUUID(),
		chat_id: chatId,
		role,
		content,
		created_at: Date.now(),
	};
	database
		.prepare(
			"INSERT INTO messages (id, chat_id, role, content, created_at) VALUES (@id, @chat_id, @role, @content, @created_at)",
		)
		.run(msg);
	return msg;
}

export function saveKey(key: string, value: string) {
	const database = ensureDb();
	database
		.prepare(
			"INSERT INTO kv (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value=excluded.value",
		)
		.run(key, value);
}

export function readKey(key: string): string | null {
	const database = ensureDb();
	const row = database
		.prepare("SELECT value FROM kv WHERE key = ?")
		.get(key) as KeyValue | undefined;
	return row?.value ?? null;
}

export function closeDb() {
	if (db) {
		db.close();
		db = null;
	}
}
