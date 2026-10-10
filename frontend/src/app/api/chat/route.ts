import { NextRequest, NextResponse } from "next/server";
import type { ChatResponse, ChatProductCard, Product } from "@/lib/types";

export const dynamic = "force-dynamic";

const GROQ_URL = "https://api.groq.com/openai/v1/chat/completions";

interface HistoryItem {
  role: "user" | "assistant";
  content: string;
}

let catalogCache: { items: Product[]; at: number } | null = null;

function env(name: string): string | undefined {
  return process.env[name];
}

const SYSTEM_PROMPT = `Ти — «AI Skin Lab Consultant», експерт-консультант магазину преміальної косметики та парфумерії AI Skin Lab. Ти спілкуєшся з клієнтом у чаті на сайті магазину.

ЖОРСТКІ ПРАВИЛА:
1. Рекомендуй ТІЛЬКИ товари з наданого списку context.products. Заборонено вигадувати товари, бренди чи ціни.
2. Завжди давай РОВНО 3 товари, якщо серед кандидатів є щонайменше 3 наявні (stock>0); якщо менше — стільки, скільки є.
3. Відповідай виключно мовою запиту користувача (uk — українською, ru — російською, en — англійською).
4. Ціни та знижки — лише ті, що в context.products. Якщо is_on_sale=true, згадай promo_price та відсоток знижки.
5. Не давай медичних порад; за серйозних проблем зі шкірою (розацеа, екзема, сильне акне) ввічливо порадь звернутись до дерматолога і запропонуй м'який догляд.
6. Ми працюємо лише з брендами {{BRANDS}} — якщо клієнт питає інший бренд, запропонуй схоже з нашого асортименту.
7. Якщо товар має is_set=true — це подарунковий набір: коротко зазнач його склад (є в description) і рекомендуй його, коли клієнт шукає подарунок або готовий комплект.
8. Не пропонуй товари з stock<=0 та не радь чекати на постачання.
9. Наприкінці відповіді одним рядком додай Instagram-контакт: «Не знайшли потрібне? Напишіть нам в Instagram 👉 @ua_cosmetics_lab».
10. ТОН: теплий, як уважний консультант бутику; конкретний (інгредієнти, ціни); без агресивних продажів; можна використовувати емодзі.

ФОРМАТ ВІДПОВІДІ — ТІЛЬКИ ВАЛІДНИЙ JSON (без markdown, без тексту до або після):
{
  "reply": "2-4 речення: коротко перекажи потребу клієнта і що ти підібрав",
  "products": [
    { "id": "id з context.products", "reason": "1 речення: чому саме цей товар підходить" }
  ],
  "follow_up_questions": ["1-2 уточнювальних питання"],
  "confidence": "high | medium | low"
}

ПРАВИЛЯ ПОЛІВ:
- products[].id має точно відповідати id товару з context.products.
- reason — мовою відповіді, з конкретикою (інгредієнт, тип шкіри, текстура, бюджет, знижка).
- products[] НЕ має бути порожнім, якщо в кандидатах є наявні товари: візьми найближчі за запитом (ціна, тип, знижка) і поясни в reason, чому це компроміс. Порожній products — лише якщо кандидатів немає взагалі, і тоді додай follow_up_questions.
- Якщо confidence не "high" — обов'язково додай follow_up_questions.`;

function localized(p: Product, lang: string, field: "name" | "description"): string {
  if (field === "name") {
    if (lang === "ru" && p.name_ru) return p.name_ru;
    if (lang === "en" && p.name_en) return p.name_en;
    return p.name_uk || p.name;
  }
  if (lang === "ru" && p.description_ru) return p.description_ru;
  if (lang === "en" && p.description_en) return p.description_en;
  return p.description_uk;
}

function nameOf(p: Product, lang: string): string {
  return localized(p, lang, "name") || p.name;
}

async function loadCatalog(): Promise<Product[]> {
  if (catalogCache && Date.now() - catalogCache.at < 60_000) return catalogCache.items;
  const base = env("BACKEND_URL") || "http://localhost:8000";
  const res = await fetch(`${base}/api/catalog`, { cache: "no-store" });
  if (!res.ok) throw new Error(`catalog responded ${res.status}`);
  const data = (await res.json()) as { items: Product[] };
  catalogCache = { items: data.items, at: Date.now() };
  return data.items;
}

function buildContext(products: Product[], lang: string): string {
  const ctx = products
    .filter((p) => p.stock > 0)
    .map((p) => ({
      id: p.id,
      name: nameOf(p, lang),
      brand: p.brand,
      category: p.category,
      price: p.price,
      promo_price: p.promo_price,
      discount_percent: p.discount_percent,
      is_on_sale: p.is_on_sale,
      is_set: p.is_set,
      volume: p.volume,
      description: localized(p, lang, "description").slice(0, 130),
    }));
  return JSON.stringify(ctx);
}

async function callGroq(
  key: string,
  messages: { role: string; content: string }[]
): Promise<string> {
  const models = (env("GROQ_MODEL") || "openai/gpt-oss-120b,openai/gpt-oss-20b")
    .split(",")
    .map((m) => m.trim())
    .filter(Boolean);
  const errors: string[] = [];
  for (const model of models) {
    try {
      const res = await fetch(GROQ_URL, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${key}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model,
          messages,
          temperature: 0.3,
          max_tokens: 2048,
          response_format: { type: "json_object" },
        }),
        signal: AbortSignal.timeout(30_000),
      });
      if (!res.ok) {
        errors.push(`${model}: ${res.status} ${(await res.text()).slice(0, 200)}`);
        continue;
      }
      const data = (await res.json()) as {
        choices?: { message?: { content?: string } }[];
      };
      const text = data.choices?.[0]?.message?.content;
      if (!text) {
        errors.push(`${model}: empty content`);
        continue;
      }
      return text;
    } catch (err) {
      errors.push(`${model}: ${err instanceof Error ? err.message : String(err)}`);
    }
  }
  throw new Error(errors.join(" | ").slice(0, 600));
}

function parseReply(raw: string, catalog: Product[], lang: string): ChatResponse {
  const cleaned = raw
    .trim()
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/\s*```$/, "");
  const data = JSON.parse(cleaned) as {
    reply?: unknown;
    products?: { id?: unknown; reason?: unknown }[];
    follow_up_questions?: unknown;
  };

  const reply = typeof data.reply === "string" ? data.reply.trim() : "";
  if (!reply) throw new Error("missing reply");

  const byId = new Map(catalog.map((p) => [p.id, p]));
  const cards: ChatProductCard[] = [];
  const seen = new Set<string>();
  for (const item of Array.isArray(data.products) ? data.products : []) {
    const p = byId.get(String(item?.id));
    if (!p || p.stock <= 0 || seen.has(p.id)) continue;
    seen.add(p.id);
    cards.push({
      id: p.id,
      name: nameOf(p, lang),
      brand: p.brand,
      price: p.price,
      promo_price: p.promo_price,
      image: p.image,
      discount_percent: p.discount_percent,
      reason:
        typeof item.reason === "string" && item.reason.trim()
          ? item.reason.trim().slice(0, 300)
          : undefined,
    });
    if (cards.length === 3) break;
  }

  let full = reply;
  if (Array.isArray(data.follow_up_questions)) {
    const questions = data.follow_up_questions
      .filter((q): q is string => typeof q === "string" && q.trim().length > 0)
      .slice(0, 2)
      .map((q) => `• ${q.trim()}`);
    if (questions.length) full += `\n\n${questions.join("\n")}`;
  }
  return { reply: full, products: cards };
}

const STOP_WORDS = new Set([
  "і", "та", "й", "або", "для", "мені", "мне", "порадьте", "будь", "ласка",
  "що", "це", "з", "до", "на", "в", "у", "як", "і", "чи", "the", "a", "an",
  "for", "me", "my", "and", "or", "of", "to", "in", "on", "please", "can",
  "you", "what", "is", "are", "те", "мне", "подскажите", "пожалуйста",
]);

// stems appended to the query when any of the group's words is mentioned,
// so "жирна шкіра" also matches tags/descriptions with себо/матув/олійн…
const SKIN_SYNONYMS: string[][] = [
  ["жирн", "олійн", "себо", "матув", "глянц", "пори"],
  ["сух", "влажн", "зневодн", "комфорт"],
  ["комбін", "змішан", "т-зон"],
  ["чутлив", "подразн", "заспок"],
  ["акне", "вугр", "запален", "антисепт"],
  ["зморшк", "антивіков", "підтяг", "еластин", "anti-age"],
  ["влажн", "гіалурон", "hydrat"],
];

function expandQuery(message: string): string {
  const lower = message.toLowerCase();
  const extra = new Set<string>();
  for (const group of SKIN_SYNONYMS) {
    if (group.some((w) => lower.includes(w))) {
      group.forEach((w) => extra.add(w));
    }
  }
  return extra.size ? `${message} ${Array.from(extra).join(" ")}` : message;
}

function retrieve(products: Product[], message: string, lang: string, limit: number): Product[] {
  const words = expandQuery(message)
    .toLowerCase()
    .split(/[^a-zа-яёіїєґ0-9-]+/i)
    .filter((w) => w.length > 0 && !STOP_WORDS.has(w));
  // "до 500 грн" / "до 1000" — always surface products within the budget
  const budgetNums = (message.match(/\d[\d\s]{1,7}\d|\d{3,}/g) || [])
    .map((s) => Number(s.replace(/\s/g, "")))
    .filter((n) => n >= 50 && n <= 100_000);
  const budget = budgetNums.length ? Math.min(...budgetNums) : undefined;
  const wantsSale = /знижк|акці|дешев|sale|discount/i.test(message);
  const scored: { p: Product; score: number }[] = [];
  for (const p of products) {
    if (p.stock <= 0) continue;
    const hay = [
      nameOf(p, lang),
      p.brand,
      p.category,
      p.tags.join(" "),
      localized(p, lang, "description"),
    ]
      .join(" ")
      .toLowerCase();
    let score = 0;
    for (const w of words) {
      if (w.length < 3) continue;
      if (hay.includes(w)) score += w.length >= 5 ? 3 : 2;
      else if (w.length >= 5 && hay.includes(w.slice(0, 5))) score += 1;
    }
    if (budget && (p.promo_price ?? p.price) <= budget) score += 5;
    if (wantsSale && p.is_on_sale) score += 2;
    if (score > 0) scored.push({ p, score });
  }
  scored.sort((a, b) => b.score - a.score);
  const picked = scored.slice(0, limit).map((s) => s.p);
  if (picked.length < limit) {
    const pickedIds = new Set(picked.map((p) => p.id));
    const fillers = [...products]
      .filter((p) => p.stock > 0 && !pickedIds.has(p.id))
      .sort((a, b) => b.discount_percent - a.discount_percent);
    picked.push(...fillers.slice(0, limit - picked.length));
  }
  return picked;
}

const FALLBACK_REPLY: Record<string, string> = {
  uk: "На жаль, AI-сервіс зараз недоступний, але я підібрав варіанти з нашого каталогу під ваш запит 👇 Під кожним — чому саме він підходить. Уточніть тип шкіри та бюджет, і я звужу добірку.",
  ru: "К сожалению, AI-сервис сейчас недоступен, но я подобрал варианты из нашего каталога под ваш запрос 👇 Под каждым — почему именно он подходит. Уточните тип кожи и бюджет, и я сузю подборку.",
  en: "Sorry, the AI service is unavailable right now, but I picked catalog items matching your request 👇 Each card explains why it fits. Tell me your skin type and budget and I will narrow it down.",
};

const CATALOG_UNAVAILABLE: Record<string, string> = {
  uk: "Каталог зараз недоступний. Спробуйте ще раз за хвилину 🙏",
  ru: "Каталог сейчас недоступен. Попробуйте ещё раз через минуту 🙏",
  en: "The catalog is unavailable right now. Please try again in a minute 🙏",
};

const INSTAGRAM_LINE: Record<string, string> = {
  uk: "Не знайшли потрібне? Напишіть нам в Instagram 👉 @ua_cosmetics_lab",
  ru: "Не нашли нужное? Напишите нам в Instagram 👉 @ua_cosmetics_lab",
  en: "Didn't find what you need? Message us on Instagram 👉 @ua_cosmetics_lab",
};

function withInstagram(reply: string, lang: string): string {
  if (/instagram/i.test(reply)) return reply;
  return `${reply}\n\n${INSTAGRAM_LINE[lang] || INSTAGRAM_LINE.uk}`;
}

function firstSentence(text: string, max = 160): string | undefined {
  const s = text.split(/[\n.!?]/).map((x) => x.trim()).find((x) => x.length > 15);
  if (!s) return undefined;
  return s.length > max ? `${s.slice(0, max - 1).trimEnd()}…` : s;
}

function fallbackResponse(message: string, lang: string, products: Product[]): ChatResponse {
  const picks = retrieve(products, message, lang, 3);
  return {
    reply: withInstagram(FALLBACK_REPLY[lang] || FALLBACK_REPLY.uk, lang),
    products: picks.map((p) => ({
      id: p.id,
      name: nameOf(p, lang),
      brand: p.brand,
      price: p.price,
      promo_price: p.promo_price,
      image: p.image,
      discount_percent: p.discount_percent,
      reason:
        firstSentence(localized(p, lang, "description")) ||
        `${p.category} · ${p.brand}`,
    })),
  };
}

function respond(body: ChatResponse, status = 200): NextResponse {
  return NextResponse.json(body, {
    status,
    headers: { "x-ai-skin-lab-source": "next-route" },
  });
}

export async function POST(req: NextRequest) {
  let message = "";
  let lang = "uk";
  let history: HistoryItem[] = [];

  try {
    const body = (await req.json()) as {
      message?: unknown;
      lang?: unknown;
      history?: unknown;
    };
    message = typeof body.message === "string" ? body.message.trim().slice(0, 1000) : "";
    lang = typeof body.lang === "string" && ["uk", "ru", "en"].includes(body.lang) ? body.lang : "uk";
    if (Array.isArray(body.history)) {
      history = body.history
        .filter(
          (h): h is HistoryItem =>
            !!h &&
            (h.role === "user" || h.role === "assistant") &&
            typeof h.content === "string"
        )
        .slice(-6)
        .map((h) => ({ role: h.role, content: h.content.slice(0, 500) }));
    }
  } catch {
    return NextResponse.json({ error: "invalid body" }, { status: 400 });
  }

  if (!message) {
    return NextResponse.json({ error: "empty message" }, { status: 400 });
  }

  let products: Product[];
  try {
    products = await loadCatalog();
  } catch (err) {
    console.error("[chat] catalog load failed:", err);
    return respond({ reply: withInstagram(CATALOG_UNAVAILABLE[lang] || CATALOG_UNAVAILABLE.uk, lang), products: [] });
  }

  const key = env("GROQ_API_KEY");
  if (key) {
    try {
      const candidates = retrieve(products, message, lang, 15);
      const brands = Array.from(new Set(products.map((p) => p.brand).filter(Boolean))).join(", ");
      const system =
        `${SYSTEM_PROMPT.replace("{{BRANDS}}", brands || "CEF Lab, Smart4Derma")}` +
        `\n\ncontext.products — це відібрані за запитом кандидати (JSON). Обери з них 1-3 найкращі:\n${buildContext(candidates, lang)}`;
      const messages: { role: string; content: string }[] = [
        { role: "system", content: system },
        ...history.map((h) => ({ role: h.role, content: h.content })),
        { role: "user", content: message },
      ];
      const raw = await callGroq(key, messages);
      const resp = parseReply(raw, products, lang);
      // guarantee up to 3 cards when the model returned only 1-2
      if (resp.products.length > 0 && resp.products.length < 3) {
        const have = new Set(resp.products.map((c) => c.id));
        for (const c of candidates) {
          if (resp.products.length >= 3) break;
          if (have.has(c.id)) continue;
          have.add(c.id);
          resp.products.push({
            id: c.id,
            name: nameOf(c, lang),
            brand: c.brand,
            price: c.price,
            promo_price: c.promo_price,
            image: c.image,
            discount_percent: c.discount_percent,
            reason:
              firstSentence(localized(c, lang, "description")) ||
              `${c.category} · ${c.brand}`,
          });
        }
      }
      resp.reply = withInstagram(resp.reply, lang);
      return respond(resp);
    } catch (err) {
      console.error("[chat] Groq call failed, using fallback:", err);
    }
  }

  return respond(fallbackResponse(message, lang, products));
}
