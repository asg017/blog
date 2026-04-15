import type { Post } from "./build.tsx";

const BASE_URL = "https://alexgarcia.xyz/blog";

function escapeXml(s: string) {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

export function generateFeed(title: string, selfUrl: string, feedPosts: Post[]) {
  const sorted = [...feedPosts].sort(
    (a, b) => b.frontmatter.created_at.getTime() - a.frontmatter.created_at.getTime()
  );
  return `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>${escapeXml(title)}</title>
    <link>${BASE_URL}</link>
    <description>${escapeXml(title)}</description>
    <language>en-us</language>
    <atom:link href="${selfUrl}" rel="self" type="application/rss+xml"/>
${sorted
  .map(
    (post) => `    <item>
      <title>${escapeXml(post.frontmatter.title)}</title>
      <link>${BASE_URL}/${post.path}</link>
      <guid>${BASE_URL}/${post.path}</guid>
      <pubDate>${post.frontmatter.created_at.toUTCString()}</pubDate>
      <description>${escapeXml(post.frontmatter.description)}</description>
    </item>`
  )
  .join("\n")}
  </channel>
</rss>`;
}
