import type { SiteContent } from "./fetch-site";

/**
 * Explanation generation via OpenRouter's "openrouter/auto" router, which picks a
 * cheap, capable model per request. One non-streaming call keeps the server code
 * simple — the result is cached in Redis forever, so we only pay once per URL.
 */

const OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions";
const MODEL = "openrouter/auto";
const GEN_TIMEOUT_MS = 30_000;

export class GenerationError extends Error {}

const SYSTEM_PROMPT =
  "You are SiteExplainer. You read the raw text of a website and explain, in plain " +
  "English, what it actually is and what it does — cutting through marketing jargon. " +
  "Write 2–4 short sentences (max ~90 words). Lead with what the site/product is. " +
  "Be concrete and neutral. Do not use markdown, headings, bullet points, or quotes. " +
  "Do not start with 'This website' every time. Never invent features that aren't in the text.";

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
        // Optional attribution headers OpenRouter uses for its dashboard.
        "HTTP-Referer": process.env.NEXT_PUBLIC_SITE_URL ?? "https://siteexplainer.com",
        "X-Title": "SiteExplainer",
      },
      body: JSON.stringify({
        model: MODEL,
        temperature: 0.3,
        max_tokens: 220,
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          { role: "user", content: userPrompt },
        ],
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
    choices?: { message?: { content?: string } }[];
  };
  const text = data.choices?.[0]?.message?.content?.trim();
  if (!text) {
    throw new GenerationError("OpenRouter returned an empty explanation.");
  }
  return text;
}
