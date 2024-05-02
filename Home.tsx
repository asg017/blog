/** @jsx h */
import { h } from "https://esm.sh/preact@10.5.15";
import { Post } from "./build.tsx";

export function HomePage({ posts }: { posts: Post[] }) {
  return (
    <html lang="en">
      <head>
        <meta charSet="UTF-8" />
        <link rel="icon" type="image/svg+xml" href="/vite.svg" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>Alex Garcia's Blog</title>
        <script src="./theme.js"></script>
        <link rel="stylesheet" href="./base.css" />
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
            <h2>All posts</h2>
            {posts.map((post) => (
              <div>
                <li>
                  <span>
                    {post.frontmatter.created_at
                      .toISOString()
                      .substring(0, "YYYY-MM-DD".length)}
                  </span>
                  : <a href={post.path}>{post.frontmatter.title}</a>
                </li>
              </div>
            ))}
          </section>
        </main>
      </body>
    </html>
  );
}
