import type { MetadataRoute } from "next";

import { getPublishedSkills, getTagsWithCounts } from "@/lib/skills";

const BASE_URL = "https://skillnow.cn";

export const dynamic = "force-static";

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();

  const staticPages: MetadataRoute.Sitemap = [
    {
      url: `${BASE_URL}/`,
      lastModified: now,
      changeFrequency: "weekly",
      priority: 1,
    },
    {
      url: `${BASE_URL}/skills/`,
      lastModified: now,
      changeFrequency: "weekly",
      priority: 0.9,
    },
    {
      url: `${BASE_URL}/tags/`,
      lastModified: now,
      changeFrequency: "weekly",
      priority: 0.6,
    },
    {
      url: `${BASE_URL}/rankings/`,
      lastModified: now,
      changeFrequency: "weekly",
      priority: 0.6,
    },
    {
      url: `${BASE_URL}/about/`,
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.5,
    },
    {
      url: `${BASE_URL}/privacy/`,
      lastModified: now,
      changeFrequency: "yearly",
      priority: 0.2,
    },
    {
      url: `${BASE_URL}/terms/`,
      lastModified: now,
      changeFrequency: "yearly",
      priority: 0.2,
    },
  ];

  const skillPages: MetadataRoute.Sitemap = getPublishedSkills().map(
    (skill) => ({
      url: `${BASE_URL}/skills/${skill.slug}/`,
      lastModified: new Date(`${skill.updatedAt}T00:00:00+08:00`),
      changeFrequency: "monthly",
      priority: 0.8,
    }),
  );

  const tagPages: MetadataRoute.Sitemap = getTagsWithCounts().map((tag) => ({
    url: `${BASE_URL}/tags/${tag.slug}/`,
    lastModified: now,
    changeFrequency: "weekly",
    priority: 0.5,
  }));

  return [...staticPages, ...skillPages, ...tagPages];
}
