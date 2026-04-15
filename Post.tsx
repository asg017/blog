/** @jsx h */
import { h } from "https://esm.sh/preact@10.5.15";
import { Post } from "./build.tsx";
import { RssLink } from "./RssDropdown.tsx";

const pageCss = Deno.readTextFileSync("page.css");

export function PostPage({ post }: { post: Post }): h.JSX.Element {
  const tags = post.frontmatter.tags;
  return (
    <html lang="en">
      <head>
        <meta charSet="UTF-8" />
        <link rel="icon" type="image/svg+xml" href="/vite.svg" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>{post.frontmatter.title} | Alex Garcia's Blog</title>

        <link rel="alternate" type="application/rss+xml" title="Alex Garcia's Blog" href="https://alexgarcia.xyz/blog/everything.xml" />
        <meta name="description" content={post.frontmatter.description} />
        <meta name="twitter:card" content="summary" />
        <meta name="twitter:image" content={post.frontmatter.share_photo_url} />

        <meta name="twitter:creator" content="@agarcia_me" />
        <meta
          property="og:url"
          content={`https://alexgarcia.xyz/blog/${post.path}`}
        />
        <meta property="og:title" content={post.frontmatter.title} />
        <meta property="og:image" content={post.frontmatter.share_photo_url} />
        <meta property="og:type" content="article" />
        <meta
          property="og:description"
          content={post.frontmatter.description}
        />
        <meta
          property="og:updated_time"
          content={
            post.frontmatter.updated_at?.toISOString() ??
            post.frontmatter.created_at.toISOString()
          }
        />

        <style dangerouslySetInnerHTML={{ __html: pageCss }}></style>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin=""
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@100..900&display=swap"
          rel="stylesheet"
        ></link>
        <script src="../../theme.js"></script>
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
              <RssLink href="../../everything.xml" />
              <button class="theme"></button>
            </div>
          </div>
          <h1>{post.frontmatter.title}</h1>
          <p style="margin-top: .5rem; margin-bottom: 0.5rem; font-size: 15px;">
            {post.frontmatter.created_at
              .toISOString()
              .substring(0, "yyyy-mm-dd".length)}{" "}
            by <a href="https://alexgarcia.xyz/">Alex Garcia</a>
          </p>
          {tags.length > 0 && (
            <p style="margin-top: 0; margin-bottom: 2.5rem; font-size: 14px;" className="post-tags">
              {tags.map((tag, i) => (
                <span>
                  {i > 0 && " "}
                  <a href={`../../tag/${tag}/`}>#{tag}</a>
                </span>
              ))}
            </p>
          )}
          {tags.length === 0 && <div style="margin-bottom: 2rem"></div>}
          <section
            dangerouslySetInnerHTML={{ __html: post.render() }}
          ></section>
        </main>
      </body>
    </html>
  );
}
