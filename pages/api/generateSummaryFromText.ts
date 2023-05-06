// import { Page } from '@prisma/client'
// import { prisma } from '../../lib/prisma'
import { ipAddress } from "@vercel/edge";
import { OpenAIStream, OpenAIStreamPayload } from "../../utils/OpenAIStream";

if (!process.env.OPENAI_API_KEY) {
  throw new Error("Missing env var from OpenAI");
}

export const config = {
  runtime: "edge",
};

const handler = async (req: Request): Promise<Response> => {
  const { content } = (await req.json()) as {
    content?: string;
  };
  if (!content) {
    return new Response(null, {
      status: 400,
      statusText: "No website text in request"
    });
  }
  try {
    

    const prompt = `You are given the entire content of a website, but it doesn't have any formatting. The content includes extra text like "home," "login," and "contact." Your task is to understand the main content of the website and explain it in simple language. Imagine you're explaining it to a 10-year-old. Here's what you need to do:\n
    - Focus on the main content and ignore extra sections like [16]Privacy - [17]Terms
    - Figure out what the website is about and what it wants to do.
    - Use your own words to explain the website's main content. Don't copy any text from the website.
    - Make sure your explanation is easy for a 10-year-old to understand.
    - Include all important information that a reader should know.
    - Write a detailed summary that is no longer than 200 words.\n
    The content of the website is provided below:\n
      "\${content}"\n
    Now, write your summary. A person reading your summary should instantly understand the purpose of the website.`;
    
    

    const payload: OpenAIStreamPayload = {
      model: "gpt-3.5-turbo",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.3,
      top_p: 1,
      frequency_penalty: 0,
      presence_penalty: 0,
      max_tokens: 400,
      stream: true,
      n: 1,
  };

    const clientIpAddress = ipAddress(req) || 'unknown';

    const stream = await OpenAIStream(payload, clientIpAddress);
    return new Response(stream);
  } catch (e: any) {
    console.log({ e });
    return new Response(null, {
      status: 400,
      statusText: "Bad response"
    });
  }
};

export default handler;




// import { OpenAIStream, OpenAIStreamPayload } from "../../utils/OpenAIStream";
// import { PrismaClient } from '@prisma/client'

// const prisma = new PrismaClient()

// if (!process.env.OPENAI_API_KEY) {
//   throw new Error("Missing env var from OpenAI");
// }

// export const config = {
//   runtime: "edge",
// };

// const handler = async (req: Request): Promise<Response> => {
//   const { url } = (await req.json()) as {
//     url  ?: string;
//   };

//   let siteText: string;
//   if (url) {
//     // check if the url is in the db
//     const summary = await prisma.summary.findFirst({
//       where: {
//         website: "https://vercel.com"
//       }
//     });
//     // if it is return the summary from the db
//     if (summary) {
//       return new Response(summary.summary);
//     }

//     // else generate a new summary
//     const response = await fetch(`https://www.w3.org/services/html2txt?url=${encodeURIComponent(url)}&noinlinerefs=on&nonums=on`);
//     siteText = await response.text();
//   } else {
//     return new Response("No prompt in the request", { status: 400 });
//   }

//   const prompt = `${siteText}`

//   const payload: OpenAIStreamPayload = {
//     model: "text-davinci-003",
//     prompt,
//     temperature: 0.7,
//     top_p: 1,
//     frequency_penalty: 0,
//     presence_penalty: 0,
//     max_tokens: 200,
//     stream: true,
//     n: 1,
//   };

//   const stream = await OpenAIStream(payload);

//   // add the summary to the db
//   // await prisma.summary.create({
//   //   data: {
//   //     website: url,
//   //     summary: stream
//   //   }
//   // })

//   return new Response(stream);
// };

// export default handler;
