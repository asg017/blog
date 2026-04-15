/** @jsx h */
import { h } from "https://esm.sh/preact@10.5.15";
import { Post } from "./build.tsx";
import { RssLink } from "./RssDropdown.tsx";

export function HomePage({ posts, tags, tagCounts }: { posts: Post[]; tags: string[]; tagCounts: Record<string, number> }) {
  return (
    <html lang="en">
      <head>
        <meta charSet="UTF-8" />
        <link rel="icon" type="image/svg+xml" href="/vite.svg" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>Alex Garcia's Blog</title>
        <link rel="alternate" type="application/rss+xml" title="Alex Garcia's Blog" href="https://alexgarcia.xyz/blog/everything.xml" />
        <script src="./theme.js"></script>
        <link rel="stylesheet" href="./base.css" />
        <script
          defer
          data-domain="alexgarcia.xyz/blog"
          src="https://plausible.io/js/script.js"
        ></script>
      </head>
      <body>
        <main>
          <div className="header">
            <div></div>
            <div>
              <button class="theme"></button>
            </div>
          </div>
          <section>
            <h1>Alex Garcia's Blog</h1>
            <p>
              I'm <a href="https://alexgarcia.xyz/">Alex Garcia</a>, a software
              engineer based out of Los Angeles.
              <br />
              <br /> This is my new blog approach I'm trying out. I have older
              writings on my{" "}
              <a href="https://observablehq.com/@asg017"> Observable account</a>
              .
            </p>
            <br></br>
          </section>
          <section>
            <h2 className="section-heading">All posts <RssLink href="./everything.xml" /></h2>
            {posts
              .sort(
                (a, b) => b.frontmatter.created_at - a.frontmatter.created_at
              )
              .map((post) => (
                <div className="post-listing">
                  <a href={post.path}>{post.frontmatter.title}{post.frontmatter.draft && <span style="color: orange; font-size: 0.75em; margin-left: 0.5em;">DRAFT</span>}</a>
                  <div className="post-meta">
                    {post.frontmatter.created_at.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                    {post.frontmatter.tags.length > 0 && (
                      <span>
                        {" · "}
                        {post.frontmatter.tags.map((tag, i) => (
                          <span>{i > 0 && ", "}<a className="post-meta-tag" href={`tag/${tag}/`}>#{tag}</a></span>
                        ))}
                      </span>
                    )}
                  </div>
                </div>
              ))}
          </section>
          {tags.length > 0 && (
            <section>
              <h2>Tags</h2>
              <div className="tag-list">
                {tags.map((tag) => {
                  const count = tagCounts[tag];
                  return (
                    <a className="tag" href={`tag/${tag}/`}>
                      #{tag} ({count} {count === 1 ? "post" : "posts"})
                    </a>
                  );
                })}
              </div>
            </section>
          )}
        </main>
      </body>
    </html>
  );
}
