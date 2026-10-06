import type { ChatResponse } from "./types";

interface ChatHistoryItem {
  role: "user" | "assistant";
  content: string;
}

export async function sendChatMessage(
  message: string,
  lang: string,
  history: ChatHistoryItem[] = []
): Promise<ChatResponse> {
  const res = await fetch("/api/chat", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ message, lang, history }),
  });
  if (!res.ok) {
    throw new Error(`Chat API error: ${res.status}`);
  }
  return (await res.json()) as ChatResponse;
}
