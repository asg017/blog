/** @jsx h */
import { h } from "https://esm.sh/preact@10.5.15";
import { Post } from "./build.tsx";
import { RssLink } from "./RssDropdown.tsx";

export function TagPage({ tag, posts }: { tag: string; posts: Post[] }) {
  return (
    <html lang="en">
      <head>
        <meta charSet="UTF-8" />
        <link rel="icon" type="image/svg+xml" href="/vite.svg" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>#{tag} | Alex Garcia's Blog</title>
        <link rel="alternate" type="application/rss+xml" title={`Alex Garcia's Blog - ${tag}`} href={`https://alexgarcia.xyz/blog/tag/${tag}/feed.xml`} />
        <script src="../../theme.js"></script>
        <link rel="stylesheet" href="../../base.css" />
        <script
          defer
          data-domain="alexgarcia.xyz/blog"
          src="https://plausible.io/js/script.js"
        ></script>
      </head>
      <body>
        <main>
          <div className="header">
            <div>
              <a href="../../">Alex Garcia's Blog</a>
            </div>
            <div>
              <button class="theme"></button>
            </div>
          </div>
          <section>
            <h1 className="section-heading">All posts tagged as #{tag} <RssLink href="./feed.xml" /></h1>
            {posts
              .sort(
                (a, b) => b.frontmatter.created_at.getTime() - a.frontmatter.created_at.getTime()
              )
              .map((post) => (
                <div className="post-listing">
                  <a href={`../../${post.path}`}>{post.frontmatter.title}</a>
                  <div className="post-meta">
                    {post.frontmatter.created_at.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                  </div>
                </div>
              ))}
          </section>
          <p style="margin-top: 2rem;">
            <a href="../../">← All posts</a>
          </p>
        </main>
      </body>
    </html>
  );
}
