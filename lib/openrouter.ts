import type { SiteContent } from "./fetch-site";

/** Generate a short explanation through OpenRouter and accept only a finished answer. */

const OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions";
const GEN_TIMEOUT_MS = 30_000;

// Separate providers give a failed or malformed response a second path.
const DEFAULT_MODELS = ["openai/gpt-4.1-mini", "anthropic/claude-haiku-4.5"];
const MODEL_OVERRIDE = process.env.OPENROUTER_MODEL;
const RESPONSE_FORMAT = {
  type: "json_schema",
  json_schema: {
    name: "site_explanation",
    strict: true,
    schema: {
      type: "object",
      properties: { explanation: { type: "string" } },
      required: ["explanation"],
      additionalProperties: false,
    },
  },
};

export class GenerationError extends Error {}

// Tuned to answer one question: "what the heck does this company/site actually do?"
// Concrete, jargon-free, grounded only in the page text. Voice discipline (plain
// punctuation, no preamble, say-so-if-unsure) is modeled on a good texting-assistant
// prompt; the format anchor keeps small free models on target.
const SYSTEM_PROMPT = `You are SiteExplainer. Someone just landed on a confusing website and wants one thing: a straight answer to "what the heck does this actually do?" Answer it the way you'd explain it to a smart friend in ten seconds.

You are given the URL and the page's own text (title, meta description, and stripped body copy that may include nav, footer, and marketing noise). Work ONLY from that text. Never invent products, customers, funding, metrics, or features that the text doesn't support.

Write the explanation like this:
- Open with the single clearest sentence: what this is and who it's for. Name the category in normal words ("a password manager", "a hosting platform for websites", "an issue tracker for software teams"). Strip the company's own buzzwords (no "next-gen", "synergy", "empowering", "revolutionize", "seamless").
- Then one or two sentences on what you actually do with it, or why someone would use it, in concrete terms.
- If it's plainly a particular kind of page (docs, pricing, a personal portfolio, a blog, an online store), say so.
- 40 to 70 words total. No preamble, no markdown, no bullet points, no quotes, no headings. Do not start with "This website" or "This site". Plain punctuation only; never use em dashes.
- Be confident and neutral. If the page is too vague to tell what it does, say plainly that the site doesn't make it clear.

Example of the target style:
"Stripe is payment infrastructure for online businesses. It gives developers APIs and prebuilt tools to accept card and bank payments, run subscriptions and payouts, and fight fraud, so a company can add checkout to its site or app without building a payment system itself. The page shown is its main product and marketing homepage."`;

export async function generateExplanation(
  url: string,
  content: SiteContent,
): Promise<string> {
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) {
    throw new GenerationError("OPENROUTER_API_KEY is not configured.");
  }

  const userPrompt = [
    `URL: ${url}`,
    content.title ? `Page title: ${content.title}` : "",
    content.description ? `Meta description: ${content.description}` : "",
    "",
    "Page text (cleaned, may include nav/footer noise — ignore that):",
    content.text || "(no body text found)",
    "",
    "Now explain what this website is and does:",
  ]
    .filter(Boolean)
    .join("\n");

  const messages = [
    { role: "system", content: SYSTEM_PROMPT },
    { role: "user", content: userPrompt },
  ];

  const models = MODEL_OVERRIDE ? [MODEL_OVERRIDE] : DEFAULT_MODELS;
  for (const [index, model] of models.entries()) {
    try {
      return postProcess(await callOpenRouter(apiKey, { model, messages }));
    } catch (err) {
      if (index === models.length - 1) throw err;
      console.warn(`[openrouter] ${model} failed, trying fallback:`, err);
    }
  }
  throw new GenerationError("No generation model is configured.");
}

async function callOpenRouter(
  apiKey: string,
  extra: Record<string, unknown>,
): Promise<string> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), GEN_TIMEOUT_MS);

  let res: Response;
  try {
    res = await fetch(OPENROUTER_URL, {
      method: "POST",
      signal: controller.signal,
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
        // Attribution headers OpenRouter shows on its dashboard.
        "HTTP-Referer": process.env.NEXT_PUBLIC_SITE_URL ?? "https://siteexplainer.com",
        "X-Title": "SiteExplainer",
      },
      body: JSON.stringify({
        temperature: 0.3,
        max_tokens: 260,
        response_format: RESPONSE_FORMAT,
        ...extra,
      }),
    });
  } catch (err) {
    const aborted = err instanceof Error && err.name === "AbortError";
    throw new GenerationError(aborted ? "Generation timed out." : "Generation request failed.");
  } finally {
    clearTimeout(timeout);
  }

  if (!res.ok) {
    const detail = await res.text().catch(() => "");
    throw new GenerationError(`OpenRouter error ${res.status}: ${detail.slice(0, 200)}`);
  }

  const data = (await res.json()) as {
    choices?: { finish_reason?: string; message?: { content?: string } }[];
  };
  const choice = data.choices?.[0];
  if (choice?.finish_reason !== "stop" || !choice.message?.content) {
    throw new GenerationError("OpenRouter did not finish an explanation.");
  }
  let explanation: unknown;
  try {
    explanation = JSON.parse(choice.message.content).explanation;
  } catch {
    throw new GenerationError("OpenRouter returned an invalid explanation.");
  }
  if (typeof explanation !== "string" || !explanation.trim()) {
    throw new GenerationError("OpenRouter returned an empty explanation.");
  }
  return explanation;
}

/** Tidy the model output: strip wrapping quotes, normalize odd hyphens/whitespace. */
function postProcess(text: string): string {
  let out = text.trim();
  // Some models wrap the whole answer in quotes.
  if (out.length > 1 && /^["“'].*["”']$/s.test(out)) {
    out = out.slice(1, -1).trim();
  }
  return out
    .replace(/[‐‑]/g, "-") // non-breaking / unicode hyphens -> "-"
    .replace(/\s+\n/g, "\n")
    .replace(/[ \t]{2,}/g, " ")
    .trim();
}
