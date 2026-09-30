import type { SiteContent } from "./fetch-site";

/** Generate a structured explanation through OpenRouter and accept only a finished answer. */

const OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions";
const GEN_TIMEOUT_MS = 30_000;

// Separate providers give a failed or malformed response a second path.
const DEFAULT_MODELS = ["openai/gpt-4.1", "anthropic/claude-haiku-4.5"];
const MODEL_OVERRIDE = process.env.OPENROUTER_MODEL;
const RESPONSE_FORMAT = {
  type: "json_schema",
  json_schema: {
    name: "site_explanation",
    strict: true,
    schema: {
      type: "object",
      properties: {
        overview: { type: "string" },
        whatItDoes: { type: "string" },
        whyUseful: { type: "string" },
        example: { type: "string" },
        developerDetails: { type: "string" },
      },
      required: ["overview", "whatItDoes", "whyUseful", "example", "developerDetails"],
      additionalProperties: false,
    },
  },
};

export class GenerationError extends Error {}

export type SiteExplanation = {
  overview: string;
  whatItDoes: string;
  whyUseful: string;
  example: string;
  developerDetails: string;
};

const SYSTEM_PROMPT = `You are SiteExplainer. Help someone decide what an unfamiliar website offers and whether it is useful to them. Explain the product or page in clear, concrete language.

Use only the supplied URL, title, description, and page text. The text may contain navigation and marketing noise. Do not invent features, API names, endpoints, customers, prices, or results. A hypothetical example may combine features the page actually describes, but must not sound like a verified customer story. If the page is a blog, documentation, store, portfolio, or other specific page type, say so rather than treating it as a software product.

Fill the response fields without repeating the same feature list:
- overview: One sentence naming what this is, who it serves, and its main job. Start with the site's name or clear category, not "This website". At most 30 words.
- whatItDoes: Two or three sentences showing the main workflow and how the important pieces fit together. Choose the most useful details instead of listing every feature. Save API and SDK specifics for developerDetails. At most 65 words.
- whyUseful: One sentence about the practical problem it solves or work it simplifies. Be specific about the benefit; avoid unsupported performance claims and generic praise. At most 30 words, or an empty string if the page does not support an answer.
- example: One specific, plausible use of the described features, phrased as a possibility ("For example, ..."). At most 35 words, or an empty string if there is too little evidence.
- developerDetails: For developer-facing products only, name an API, SDK, integration, data model, or deployment path the page actually mentions and one concrete operation it enables. Explain what a developer would do with that interface; generic claims about "easy integration" are not useful. Do not infer setup parameters, package names, or code absent from the page. Do not attribute a feature's deployment or administration to an SDK unless the page explicitly says that SDK handles it. At most 40 words, or an empty string if no technical detail is supported.

Aim for 140 to 190 words overall when the page supports it. Be shorter for sparse pages. Use plain paragraphs, no markdown or headings inside fields. If the page is too vague, say what is unclear instead of filling sections with guesses.`;

export async function generateExplanation(
  url: string,
  content: SiteContent,
): Promise<SiteExplanation> {
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
      return await callOpenRouter(apiKey, { model, messages });
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
): Promise<SiteExplanation> {
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
        max_tokens: 700,
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
    explanation = JSON.parse(choice.message.content);
  } catch {
    throw new GenerationError("OpenRouter returned an invalid explanation.");
  }
  if (!explanation || typeof explanation !== "object" || Array.isArray(explanation)) {
    throw new GenerationError("OpenRouter returned an invalid explanation.");
  }
  const fields = explanation as Record<string, unknown>;
  const { overview, whatItDoes, whyUseful, example, developerDetails } = fields;
  if (
    typeof overview !== "string" || !overview.trim() ||
    typeof whatItDoes !== "string" || !whatItDoes.trim() ||
    typeof whyUseful !== "string" ||
    typeof example !== "string" ||
    typeof developerDetails !== "string"
  ) {
    throw new GenerationError("OpenRouter returned an incomplete explanation.");
  }
  const result = {
    overview: postProcess(overview),
    whatItDoes: postProcess(whatItDoes),
    whyUseful: postProcess(whyUseful),
    example: postProcess(example),
    developerDetails: postProcess(developerDetails),
  };
  if (!result.overview || !result.whatItDoes) {
    throw new GenerationError("OpenRouter returned an empty explanation.");
  }
  return result;
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
