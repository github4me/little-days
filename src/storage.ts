import * as SQLite from "expo-sqlite";
import { initialState, State, validateState } from "./domain";
let database: ReturnType<typeof SQLite.openDatabaseAsync> | undefined;
async function db() {
  if (!database)
    database = (async () => {
      const d = await SQLite.openDatabaseAsync("little-days.db");
      await d.execAsync(
        "PRAGMA journal_mode = WAL; CREATE TABLE IF NOT EXISTS app_data (key TEXT PRIMARY KEY NOT NULL, value TEXT NOT NULL);",
      );
      return d;
    })();
  return database;
}
export async function loadState(): Promise<State> {
  const row = await (
    await db()
  ).getFirstAsync<{ value: string }>(
    "SELECT value FROM app_data WHERE key = ?",
    "state",
  );
  return row
    ? validateState(JSON.parse(row.value))
    : { ...initialState, profile: { ...initialState.profile }, entries: [] };
}
export async function saveState(state: State, recovery = false): Promise<void> {
  const data = JSON.stringify(validateState(state)),
    d = await db();
  await d.withExclusiveTransactionAsync(async (tx) => {
    if (recovery) {
      const previous = await tx.getFirstAsync<{ value: string }>(
        "SELECT value FROM app_data WHERE key = ?",
        "state",
      );
      await tx.runAsync(
        "INSERT OR REPLACE INTO app_data (key,value) VALUES (?,?)",
        "recovery",
        previous?.value ?? JSON.stringify(initialState),
      );
    }
    await tx.runAsync(
      "INSERT OR REPLACE INTO app_data (key,value) VALUES (?,?)",
      "state",
      data,
    );
  });
}
export async function loadRecovery(): Promise<State | null> {
  const row = await (
    await db()
  ).getFirstAsync<{ value: string }>(
    "SELECT value FROM app_data WHERE key = ?",
    "recovery",
  );
  return row ? validateState(JSON.parse(row.value)) : null;
}
export async function loadTheme(): Promise<boolean | null> {
  const row = await (
    await db()
  ).getFirstAsync<{ value: string }>(
    "SELECT value FROM app_data WHERE key = ?",
    "dark",
  );
  return row ? row.value === "true" : null;
}
export async function saveTheme(dark: boolean) {
  await (
    await db()
  ).runAsync(
    "INSERT OR REPLACE INTO app_data (key,value) VALUES (?,?)",
    "dark",
    String(dark),
  );
}
