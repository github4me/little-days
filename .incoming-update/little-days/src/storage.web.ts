import { initialState, State, validateState } from "./domain";
const KEY = "little-days-v1";
export async function loadState(): Promise<State> {
  const raw = localStorage.getItem(KEY);
  return raw ? validateState(JSON.parse(raw)) : structuredClone(initialState);
}
export async function saveState(state: State, recovery = false) {
  const data = JSON.stringify(validateState(state));
  const old = localStorage.getItem(KEY);
  if (recovery)
    localStorage.setItem(
      KEY + "-recovery",
      old ?? JSON.stringify(initialState),
    );
  localStorage.setItem(KEY, data);
}
export async function loadRecovery(): Promise<State | null> {
  const raw = localStorage.getItem(KEY + "-recovery");
  return raw ? validateState(JSON.parse(raw)) : null;
}
export async function loadTheme(): Promise<boolean | null> {
  const v = localStorage.getItem(KEY + "-dark");
  return v === null ? null : v === "true";
}
export async function saveTheme(dark: boolean) {
  localStorage.setItem(KEY + "-dark", String(dark));
}
