// import { prisma } from '../../lib/prisma';

// export default async function handle(req: any, res: any) {
//   const { url, summary } = req.body;

//   const summaryData = await prisma.page.findFirst({
//     where: { url }
//   });

//   if (summaryData) {
//     return res.json({
//       error: 'summary already exists'
//     })
//   }

//   const result = await prisma.page.create({
//     data: {
//       url: url,
//       summary: summary
//     },
//   });
//   res.json(result);
// }

import { prisma } from '../../lib/prisma';

export default async function createSummary(req: any, res: any) {
  try {
    const { url, summary, site_text } = req.body;

    // Validate user input
    if (!url || !summary) {
      return res.status(400).json({ error: 'Invalid input' });
    }

    // Check if summary already exists
    const existingSummary = await prisma.page.findFirst({ where: { url } });
    if (existingSummary) {
      return res.status(409).json({ error: 'Summary already exists' });
    }

    // Create new summary
    const result = await prisma.page.create({ data: { url, summary, site_text } });
    res.status(201).json(result);
  } catch (error) {
    // Handle errors
    console.error(error);
    res.status(500).json({ error: 'Server error' });
  } 
}