/** @jsx h */

import { extract as extractFrontmatter } from "jsr:@std/front-matter/yaml";
import { ensureDirSync, emptyDirSync } from "jsr:@std/fs";
import { copySync } from "jsr:@std/fs/copy";
import { expandGlobSync } from "jsr:@std/fs/expand-glob";
import * as path from "jsr:@std/path";

import { h } from "https://esm.sh/preact@10.5.15";
import { renderToString } from "https://esm.sh/preact-render-to-string@5.1.19?deps=preact@10.5.15";

import * as v from "npm:valibot";

import { md } from "./markdown.ts";
import { generateFeed } from "./rss.ts";
import { PostPage } from "./Post.tsx";
import { HomePage } from "./Home.tsx";
import { TagPage } from "./TagPage.tsx";

const stringOrStringArray = v.pipe(
  v.optional(v.union([v.string(), v.array(v.string())])),
  v.transform((val) => {
    if (val === undefined) return undefined;
    return Array.isArray(val) ? val : [val];
  }),
);

const FrontmatterSchema = v.object({
  title: v.string(),
  description: v.string(),
  share_photo_url: v.string(),
  created_at: v.date(),
  updated_at: v.optional(v.date()),
  build: v.optional(v.string()),
  skip: v.optional(v.boolean()),
  tag: stringOrStringArray,
  tags: stringOrStringArray,
});

export interface Post {
  frontmatter: Omit<v.InferOutput<typeof FrontmatterSchema>, "tag" | "tags"> & { tags: string[] };
  body: string;
  slug: string;
  path: string;
  render: () => string;
}

function logSuccess(path: string) {
  console.log(`%c✓%c ${path}`, "color: green", "color: unset");
}

function writePage(outPath: string, html: string) {
  ensureDirSync(path.dirname(outPath));
  Deno.writeTextFileSync(outPath, html);
  logSuccess(outPath);
}

async function main() {
  const posts: Post[] = [];

  emptyDirSync("dist");
  for (const entry of expandGlobSync("./static/*")) {
    copySync(entry.path, "dist/" + entry.name);
  }

  for (const postDir of Deno.readDirSync("./posts")) {
    const year = postDir.name;
    for (const entry of Deno.readDirSync("./posts/" + postDir.name)) {
      const slug = entry.name.replace(".md", "");
      const mdPath = entry.isFile
        ? path.join("posts", year, entry.name)
        : path.join("posts", year, entry.name, "index.md");

      const mdSource = Deno.readTextFileSync(mdPath);
      const { attrs, body } = extractFrontmatter(mdSource);
      // @ts-ignore idgaf
      if (attrs.skip) continue;
      let parsed;
      try {
        parsed = v.parse(FrontmatterSchema, attrs);
      } catch (e) {
        const issues = e.issues?.map((i: any) => `  ${i.path?.map((p: any) => p.key).join(".") || "?"}: ${i.message}`).join("\n") ?? e.message;
        throw new Error(`Failed to parse frontmatter in ${mdPath}:\n${issues}`);
      }
      const frontmatter = {
        ...parsed,
        tags: [...(parsed.tag ?? []), ...(parsed.tags ?? [])],
      };

      if (frontmatter.build) {
        const [cmd, ...args] = frontmatter.build.split(" ");
        const process = await new Deno.Command(cmd, {
          args,
          cwd: path.join("posts", year, entry.name),
          stdout: "piped",
          stderr: "piped",
        }).output();
        Deno.stdout.write(process.stdout);
        Deno.stdout.write(process.stderr);
        if (process.code) throw Error(`Build command "${frontmatter.build}" failed in ${mdPath}`);
        copySync(
          path.join("posts", year, entry.name, "dist"),
          path.join("dist", year, slug)
        );
      }

      posts.push({
        frontmatter,
        body,
        slug,
        path: `${year}/${slug}/index.html`,
        render: () => md.render(body, { filePath: mdPath }),
      });

      ensureDirSync(path.join("dist", year, slug));
    }
  }

  // Collect tags
  const tagCounts: Record<string, number> = {};
  for (const post of posts) {
    for (const tag of post.frontmatter.tags) {
      tagCounts[tag] = (tagCounts[tag] ?? 0) + 1;
    }
  }
  const tags = Object.keys(tagCounts).sort((a, b) => tagCounts[b] - tagCounts[a] || a.localeCompare(b));

  // Render pages
  for (const post of posts) {
    writePage(
      path.join("dist", year(post), post.slug, "index.html"),
      renderToString(<PostPage post={post} />)
    );
  }

  writePage(
    path.join("dist", "index.html"),
    renderToString(<HomePage posts={posts} tags={tags} tagCounts={tagCounts} />)
  );

  for (const tag of tags) {
    const tagPosts = postsForTag(posts, tag);
    writePage(
      path.join("dist", "tag", tag, "index.html"),
      renderToString(<TagPage tag={tag} posts={tagPosts} />)
    );
  }

  // RSS feeds
  const BASE_URL = "https://alexgarcia.xyz/blog";
  writeFeed(path.join("dist", "everything.xml"), "Alex Garcia's Blog", `${BASE_URL}/everything.xml`, posts);
  for (const tag of tags) {
    writeFeed(
      path.join("dist", "tag", tag, "feed.xml"),
      `Alex Garcia's Blog - ${tag}`,
      `${BASE_URL}/tag/${tag}/feed.xml`,
      postsForTag(posts, tag)
    );
  }
}

function year(post: Post) {
  return post.path.split("/")[0];
}

function postsForTag(posts: Post[], tag: string) {
  return posts.filter((p) => p.frontmatter.tags.includes(tag));
}

function writeFeed(outPath: string, title: string, selfUrl: string, feedPosts: Post[]) {
  ensureDirSync(path.dirname(outPath));
  Deno.writeTextFileSync(outPath, generateFeed(title, selfUrl, feedPosts));
  logSuccess(outPath);
}

if (import.meta.main) main();
