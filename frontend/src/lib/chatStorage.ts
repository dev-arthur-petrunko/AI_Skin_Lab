/**
 * Chat history persistence: keep the conversation in localStorage for
 * 20 minutes after the last activity, then drop it completely.
 */
export const CHAT_TTL_MS = 20 * 60 * 1000;

const CHAT_KEY = "ai-skinlab.chat.v1";

interface StoredChat<T> {
  at: number;
  messages: T[];
}

export function loadChat<T>(): T[] | null {
  try {
    const raw = window.localStorage.getItem(CHAT_KEY);
    if (!raw) return null;
    const data = JSON.parse(raw) as StoredChat<T>;
    if (!Array.isArray(data.messages) || typeof data.at !== "number" || data.messages.length === 0) {
      clearChat();
      return null;
    }
    if (Date.now() - data.at > CHAT_TTL_MS) {
      clearChat();
      return null;
    }
    return data.messages;
  } catch {
    return null;
  }
}

export function saveChat<T>(messages: T[]): void {
  try {
    window.localStorage.setItem(CHAT_KEY, JSON.stringify({ at: Date.now(), messages }));
  } catch {
    // storage unavailable/full — chat keeps working without persistence
  }
}

export function clearChat(): void {
  try {
    window.localStorage.removeItem(CHAT_KEY);
  } catch {
    // ignore
  }
}
