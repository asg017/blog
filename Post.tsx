/** @jsx h */
import { h } from "https://esm.sh/preact@10.5.15";
import { Post } from "./build.tsx";

const pageCss = Deno.readTextFileSync("page.css");

export function PostPage({ post }: { post: Post }) {
  return (
    <html lang="en">
      <head>
        <meta charSet="UTF-8" />
        <link rel="icon" type="image/svg+xml" href="/vite.svg" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>{post.frontmatter.title} | Alex Garcia's Blog</title>

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
              <button class="theme"></button>
            </div>
          </div>
          <h1>{post.frontmatter.title}</h1>
          <p style="margin-top: .5rem; margin-bottom: 2.5rem; font-size: 15px;">
            {post.frontmatter.created_at
              .toISOString()
              .substring(0, "yyyy-mm-dd".length)}{" "}
            by <a href="https://alexgarcia.xyz/">Alex Garcia</a>
          </p>
          <section
            dangerouslySetInnerHTML={{ __html: post.render() }}
          ></section>
        </main>
      </body>
    </html>
  );
}
