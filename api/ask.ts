/**
 * POST /api/ask — a Vercel server function. Reads LLM_API_KEY (server only,
 * never in the browser bundle), asks Gemini to turn a visitor's question into
 * movie search criteria, and returns them as JSON. The browser checks the JSON
 * again and finds the movies in TMDb.
 */

// Tried in this order: the best model first, lighter ones as fallbacks.
const GEMINI_MODELS = [
  "gemini-3.8-flash",
  "gemini-3.6-flash",
  "gemini-3.5-flash-lite",
];

// 429 = too many requests, 503 = overloaded: worth trying the next model.
const BUSY_STATUSES = [429, 503];

// Protects the free quota from huge pasted texts.
const MAX_QUESTION_LENGTH = 300;

// TMDb's genre names, so the model only picks names the browser can map to ids.
const GENRES = [
  "Action",
  "Adventure",
  "Animation",
  "Comedy",
  "Crime",
  "Documentary",
  "Drama",
  "Family",
  "Fantasy",
  "History",
  "Horror",
  "Music",
  "Mystery",
  "Romance",
  "Science Fiction",
  "TV Movie",
  "Thriller",
  "War",
  "Western",
];

const SYSTEM_PROMPT = `You help visitors of a movie shop find movies.
Turn the visitor's request into search criteria and answer only with JSON that matches the schema.
- reply: one short, friendly sentence in English. Never name specific movies in it; the shop finds them.
- genres: only names from this list: ${GENRES.join(", ")}. Use [] if no genre is asked for.
- yearFrom / yearTo: whole years or null. "the 2020s" means 2020 to 2029.
- director: the director's full name, or null.
- minRating: a number from 0 to 10, or null. "rated above 7" means 7.
- sortBy: "popular", "rating" or "newest", or null.
- titleQuery: only when the visitor looks for a specific title, otherwise null.
- similarTo: only when the visitor wants movies like one specific movie, otherwise null.`;

// Gemini's structured output must follow this shape (the browser's MovieQuery).
const RESPONSE_SCHEMA = {
  type: "OBJECT",
  properties: {
    reply: { type: "STRING" },
    genres: { type: "ARRAY", items: { type: "STRING" } },
    yearFrom: { type: "INTEGER", nullable: true },
    yearTo: { type: "INTEGER", nullable: true },
    director: { type: "STRING", nullable: true },
    minRating: { type: "NUMBER", nullable: true },
    sortBy: {
      type: "STRING",
      enum: ["popular", "rating", "newest"],
      nullable: true,
    },
    titleQuery: { type: "STRING", nullable: true },
    similarTo: { type: "STRING", nullable: true },
  },
  required: [
    "reply",
    "genres",
    "yearFrom",
    "yearTo",
    "director",
    "minRating",
    "sortBy",
    "titleQuery",
    "similarTo",
  ],
};

/**
 * Type guard: true for a plain object. A small copy of the browser's isRecord,
 * because this server file is built on its own and doesn't import browser code.
 * @param value - Anything, typically parsed JSON.
 */
function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

/** @param body - Sent as JSON. @param status - The HTTP status. */
function reply(body: unknown, status: number): Response {
  return Response.json(body, { status });
}

/**
 * @param request - Should have the body { "question": "…" }.
 * @returns The trimmed question (1–300 characters), or null for anything else.
 */
async function readQuestion(request: Request): Promise<string | null> {
  try {
    const body: unknown = await request.json();
    if (!isObject(body) || typeof body.question !== "string") return null;
    const question = body.question.trim();
    return question.length > 0 && question.length <= MAX_QUESTION_LENGTH
      ? question
      : null;
  } catch {
    return null;
  }
}

/**
 * Digs the answer text out of candidates[0].content.parts, checking each level.
 * @param data - Gemini's parsed response.
 * @returns The joined text, or null if there is none.
 */
function readGeminiText(data: unknown): string | null {
  if (!isObject(data) || !Array.isArray(data.candidates)) return null;
  const candidate: unknown = data.candidates[0];
  if (!isObject(candidate) || !isObject(candidate.content)) return null;
  if (!Array.isArray(candidate.content.parts)) return null;

  const text = candidate.content.parts
    .map((part: unknown) =>
      isObject(part) && typeof part.text === "string" ? part.text : "",
    )
    .join("");
  return text === "" ? null : text;
}

/**
 * Asks each model in GEMINI_MODELS in turn until one isn't busy (429/503).
 * The key goes in a header, never in the URL, so it can't end up in logs.
 * @param apiKey - LLM_API_KEY.
 * @param question - The checked question.
 * @returns The first non-busy answer, or the last model's answer.
 */
async function callGemini(apiKey: string, question: string): Promise<Response> {
  const body = JSON.stringify({
    systemInstruction: { parts: [{ text: SYSTEM_PROMPT }] },
    contents: [{ role: "user", parts: [{ text: question }] }],
    generationConfig: {
      responseMimeType: "application/json",
      responseSchema: RESPONSE_SCHEMA,
    },
  });

  for (const [index, model] of GEMINI_MODELS.entries()) {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-goog-api-key": apiKey,
        },
        body,
      },
    );
    const isLastModel = index === GEMINI_MODELS.length - 1;
    if (isLastModel || !BUSY_STATUSES.includes(response.status)) {
      return response;
    }
  }

  throw new Error("No Gemini models configured.");
}

/**
 * Handles POST /api/ask. Statuses: 200 criteria · 400 bad question ·
 * 500 key missing · 502 model failed or sent bad JSON · 503 every model busy.
 * @param request - The browser's request.
 */
export async function POST(request: Request): Promise<Response> {
  const apiKey = process.env.LLM_API_KEY;
  if (!apiKey) {
    return reply({ error: "MovieAI is not configured." }, 500);
  }

  const question = await readQuestion(request);
  if (question === null) {
    return reply({ error: "Ask a question of 1 to 300 characters." }, 400);
  }

  let gemini: Response;
  try {
    gemini = await callGemini(apiKey, question);
  } catch {
    return reply({ error: "Could not reach the language model." }, 502);
  }

  if (BUSY_STATUSES.includes(gemini.status)) {
    return reply({ error: "MovieAI is busy right now." }, 503);
  }
  if (!gemini.ok) {
    return reply({ error: "The language model could not answer." }, 502);
  }

  const text = readGeminiText(await gemini.json().catch(() => null));
  if (text === null) {
    return reply({ error: "The language model gave an empty answer." }, 502);
  }

  try {
    return reply(JSON.parse(text), 200);
  } catch {
    return reply({ error: "The answer was not valid JSON." }, 502);
  }
}
