import type { MetadataRoute } from "next";
import { getAllSlugs } from "@/lib/summary";
import { SITE_URL } from "@/lib/site";

// Refresh the sitemap hourly as new pages get generated.
export const revalidate = 3600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const slugs = await getAllSlugs();
  const pages: MetadataRoute.Sitemap = slugs.map((slug) => ({
    url: `${SITE_URL}/${slug}`,
    changeFrequency: "monthly",
    priority: 0.6,
  }));

  return [
    { url: SITE_URL, changeFrequency: "daily", priority: 1 },
    ...pages,
  ];
}
