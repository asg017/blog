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
