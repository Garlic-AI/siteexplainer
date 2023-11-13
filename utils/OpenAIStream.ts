import {
  createParser,
  ParsedEvent,
  ReconnectInterval,
} from "eventsource-parser";

import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

const redis = new Redis({
  url: "UPSTASH_REDIS_REST_URL",
  token: "UPSTASH_REDIS_REST_TOKEN",
});
// Create a new ratelimiter, that allows 10 requests per day
const ratelimit = new Ratelimit({
  redis: redis,
  limiter: Ratelimit.fixedWindow(10, "86400 s"),
});

export type ChatGPTAgent = "user" | "system";

export interface ChatGPTMessage {
  role: ChatGPTAgent;
  content: string;
}

export interface OpenAIStreamPayload {
  model: string;
  messages: ChatGPTMessage[];
  temperature: number;
  top_p: number;
  frequency_penalty: number;
  presence_penalty: number;
  max_tokens: number;
  stream: boolean;
  n: number;
}

const HELICONE_API_KEY = process.env.HELICONE_API_KEY;

// Define the OpenAI API key
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

// Define the Helicone base URL
const HELICONE_BASE_URL = "https://oai.hconeai.com/v1";

export async function OpenAIStream(
  payload: OpenAIStreamPayload,
  ipAddress: string
) {
  const encoder = new TextEncoder();
  const decoder = new TextDecoder();

  let counter = 0;

  // // Define the rate limiting policy
  // const rateLimitPolicy = "5;d=86400;s=ip"; // 5 requests per 86400 seconds (1 day), segmented by IP address not used

  const identifier = "api";
  const result = await ratelimit.limit(identifier);

  if (!result.success) {
    return new ReadableStream({
      start(controller) {
        controller.enqueue(new TextEncoder().encode("You are out of requests. You get 10 requests per day. Please come back tomorrow for more requests, or if you need to run siteexplainer on custom data, reach out to us at contact@siteexplainer.com."));
        controller.close();
      }
    });
}


  const res = await fetch(`${HELICONE_BASE_URL}/chat/completions`, {
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${OPENAI_API_KEY ?? ""}`,
      "Helicone-Auth": `Bearer ${HELICONE_API_KEY}`,
      "Helicone-Cache-Enabled": "true",
      // "Helicone-Property-IP": ipAddress, // Include the IP address in the request headers
      // "Helicone-RateLimit-Policy": rateLimitPolicy, // Include the rate limiting policy in the request headers //doesn't seem to work
      "Helicone-Property-Tool": "explainer",
    },
    method: "POST",
    body: JSON.stringify(payload),
  });

  const stream = new ReadableStream({
    async start(controller) {
      // callback
      function onParse(event: ParsedEvent | ReconnectInterval) {
        if (event.type === "event") {
          const data = event.data;
          // https://beta.openai.com/docs/api-reference/completions/create#completions/create-stream
          if (data === "[DONE]") {
            controller.close();
            return;
          }
          try {
            const json = JSON.parse(data);
            const text = json.choices[0].delta?.content || "";
            if (counter < 2 && (text.match(/\n/) || []).length) {
              // this is a prefix character (i.e., "\n\n"), do nothing
              return;
            }
            const queue = encoder.encode(text);
            controller.enqueue(queue);
            counter++;
          } catch (e) {
            // maybe parse error
            controller.error(e);
          }
        }
      }

      // stream response (SSE) from OpenAI may be fragmented into multiple chunks
      // this ensures we properly read chunks and invoke an event for each SSE event stream
      const parser = createParser(onParse);
      // https://web.dev/streams/#asynchronous-iteration
      for await (const chunk of res.body as any) {
        parser.feed(decoder.decode(chunk));
      }
    },
  });

  return stream;
}