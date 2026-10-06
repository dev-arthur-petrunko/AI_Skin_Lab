"use client";

import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useLocale, useTranslations } from "next-intl";
import { sendChatMessage } from "@/lib/chatClient";
import ChatBubble, { type ChatProduct } from "./ChatBubble";

interface Message {
  id: number;
  role: "user" | "assistant";
  content: string;
  products: ChatProduct[];
}

export default function ChatWidget() {
  const t = useTranslations("chat");
  const locale = useLocale();

  const [open, setOpen] = useState(false);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [typingId, setTypingId] = useState<number | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);

  const scrollRef = useRef<HTMLDivElement>(null);
  const idRef = useRef(0);

  useEffect(() => {
    setMessages([{ id: 0, role: "assistant", content: t("welcome"), products: [] }]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    scrollRef.current?.scrollTo({
      top: scrollRef.current.scrollHeight,
      behavior: "smooth",
    });
  }, [messages, loading]);

  const suggestions = [t("suggestion1"), t("suggestion2"), t("suggestion3")];

  async function submit(text: string) {
    const message = text.trim();
    if (!message || loading) return;

    setInput("");
    const userMsg: Message = { id: ++idRef.current, role: "user", content: message, products: [] };
    setMessages((prev) => [...prev, userMsg]);
    setLoading(true);

    try {
      const history = messages.slice(-6).map((m) => ({ role: m.role, content: m.content }));
      const data = await sendChatMessage(message, locale, history);
      const replyId = ++idRef.current;
      setMessages((prev) => [
        ...prev,
        { id: replyId, role: "assistant", content: data.reply, products: data.products },
      ]);
      setTypingId(replyId);
    } catch {
      setMessages((prev) => [
        ...prev,
        { id: ++idRef.current, role: "assistant", content: t("error"), products: [] },
      ]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <motion.button
        type="button"
        onClick={() => setOpen((v) => !v)}
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: 1, type: "spring", stiffness: 200, damping: 16 }}
        whileHover={{ scale: 1.06 }}
        whileTap={{ scale: 0.95 }}
        className="fixed bottom-5 right-5 z-50 flex h-14 items-center gap-2 rounded-full btn btn-primary !px-5"
        aria-label={t("open")}
      >
        <span className="relative flex h-6 w-6 items-center justify-center">
          ✨
          <span className="absolute -right-0.5 -top-0.5 h-2.5 w-2.5 animate-pulse rounded-full bg-[var(--sale)]" />
        </span>
        <span className="hidden sm:inline">{t("open")}</span>
      </motion.button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 32, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 32, scale: 0.96 }}
            transition={{ type: "spring", stiffness: 260, damping: 24 }}
            className="fixed bottom-24 right-4 z-50 flex h-[70vh] max-h-[640px] w-[calc(100vw-2rem)] max-w-md flex-col overflow-hidden rounded-3xl tile !rounded-3xl !p-0"
          >
            <div className="flex items-center gap-3 px-5 py-4">
              <span className="flex h-9 w-9 items-center justify-center rounded-full glass !rounded-full text-lg">
                ✨
              </span>
              <div className="flex-1">
                <div className="text-sm font-semibold">{t("title")}</div>
                <div className="flex items-center gap-1.5 text-[11px] text-espresso/70">
                  <span className="h-1.5 w-1.5 rounded-full bg-green-400" />
                  {t("subtitle")}
                </div>
              </div>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="rounded-full p-1.5 transition hover:bg-[var(--pic)]"
                aria-label="Close"
              >
                ✕
              </button>
            </div>

            <div ref={scrollRef} className="chat-scroll flex-1 space-y-4 overflow-y-auto p-4">
              {messages.map((m) => (
                <div key={m.id} className={m.role === "user" ? "flex justify-end" : "flex justify-start"}>
                  {m.role === "user" ? (
                    <div className="max-w-[85%] rounded-2xl rounded-tr-sm bg-[var(--azure)] px-4 py-3 text-sm leading-relaxed text-white">
                      {m.content}
                    </div>
                  ) : (
                    <ChatBubble
                      content={m.content}
                      isTyping={typingId === m.id}
                      onFinish={() => setTypingId((cur) => (cur === m.id ? null : cur))}
                      products={m.products}
                    />
                  )}
                </div>
              ))}

              {loading && (
                <div className="flex justify-start">
                  <div className="glass rounded-2xl rounded-tl-sm !p-3 px-4 py-3 text-sm">
                    <span className="typing-dot" />
                    <span className="typing-dot" />
                    <span className="typing-dot" />
                    <span className="ml-2 text-xs">{t("thinking")}</span>
                  </div>
                </div>
              )}
            </div>

            {messages.length <= 1 && !loading && (
              <div className="flex flex-wrap gap-2 px-4 pt-3">
                {suggestions.map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => submit(s)}
                    className="chip-f !px-3 !py-1.5 !text-xs"
                  >
                    {s}
                  </button>
                ))}
              </div>
            )}

            <form
              onSubmit={(e) => {
                e.preventDefault();
                submit(input);
              }}
              className="flex items-center gap-2 p-3"
            >
              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder={t("placeholder")}
                className="input flex-1 !py-2.5"
              />
              <button
                type="submit"
                disabled={loading || !input.trim()}
                className="btn btn-primary !h-10 !w-10 !p-0 disabled:opacity-40"
                aria-label={t("send")}
              >
                ↑
              </button>
            </form>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
