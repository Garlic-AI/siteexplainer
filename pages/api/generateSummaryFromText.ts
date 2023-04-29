// import { Page } from '@prisma/client'
// import { prisma } from '../../lib/prisma'
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
    

    const prompt = `You are given a website's entire content without any formatting, including extraneous text like 'home', 'login', and 'contact' etc. Ignore those sections and focus on the main content of the website. What is the website about and what are its intentions? Try to figure out the main content of the website, and explain it using simplified language that a 10-year-old would understand. DO NOT use existing text from the website, but explain it in your own words. Make sure not to leave out any information that might be pertinent to a reader.

  "${content}"

  Write a detailed summary of the above website, make sure the length of your summary is at most 200 words.
  `

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

    const stream = await OpenAIStream(payload);
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
