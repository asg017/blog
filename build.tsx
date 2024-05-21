/** @jsx h */

import { extract as extractFrontmatter } from "https://deno.land/std@0.223.0/front_matter/yaml.ts";
import * as path from "https://deno.land/std@0.223.0/path/mod.ts";
import {
  ensureDirSync,
  emptyDirSync,
} from "https://deno.land/std@0.223.0/fs/mod.ts";
import { h } from "https://esm.sh/preact@10.5.15";
import { renderToString } from "https://esm.sh/preact-render-to-string@5.1.19?deps=preact@10.5.15";
import * as v from "npm:valibot";
// @deno-types="npm:@types/markdown-it"
import markdownit from "npm:markdown-it";
import { include } from "npm:@mdit/plugin-include";
import mdAnchor from "npm:markdown-it-anchor";
import slugify from "npm:@sindresorhus/slugify";
import {
  // won't work with SQL until this is released: https://github.com/shikijs/shiki/commit/cc13539ea19d690e07de6b52478844f846f80f00
  // transformerNotationHighlight,
  transformerMetaHighlight,
} from "npm:@shikijs/transformers";
import { fromHighlighter } from "npm:@shikijs/markdown-it/core";
import { getHighlighter } from "npm:shiki";
import { PostPage } from "./Post.tsx";
import { HomePage } from "./Home.tsx";
import { copySync } from "https://deno.land/std@0.223.0/fs/copy.ts";

const md = markdownit({
  html: true,
});
const sqlite = JSON.parse(
  Deno.readTextFileSync("static/sqlite.tmlanguage.json")
);
md.use(
  fromHighlighter(
    await getHighlighter({
      themes: [
        import("npm:shiki/themes/catppuccin-latte.mjs"),
        import("npm:shiki/themes/catppuccin-mocha.mjs"),
      ],
      langs: [
        sqlite,
        import("npm:shiki/langs/bash.mjs"),
        import("npm:shiki/langs/python.mjs"),
        import("npm:shiki/langs/c.mjs"),
        import("npm:shiki/langs/go.mjs"),
        import("npm:shiki/langs/rust.mjs"),
        import("npm:shiki/langs/javascript.mjs"),
        import("npm:shiki/langs/html.mjs"),
        import("npm:shiki/langs/ruby.mjs"),
      ],
    }),
    {
      themes: {
        light: "catppuccin-latte",
        dark: "catppuccin-mocha",
      },
      defaultColor: false,
      transformers: [transformerMetaHighlight()],
    }
  )
);

md.use(include, {
  currentPath: (env) => env.filePath,
});

md.use(mdAnchor, {
  level: 1,
  slugify: slugify,
  permalink: true,
  // renderPermalink: (slug, opts, state, permalink) => {},
  permalinkClass: "header-anchor",
  //permalinkSymbol: "¶",
  permalinkBefore: true,
});
const FrontmatterSchema = v.object({
  title: v.string(),
  description: v.string(),
  share_photo_url: v.string(),
  created_at: v.date(),
  updated_at: v.optional(v.date()),
  build: v.optional(v.string()),
  skip: v.optional(v.boolean()),
});

export interface Post {
  frontmatter: v.Output<typeof FrontmatterSchema>;
  body: string;
  slug: string;
  path: string;
  render: () => string;
}

function logSuccess(path: string) {
  console.log(`%c✓%c ${path}`, "color: green", "color: unset");
}

import { expandGlobSync } from "https://deno.land/std@0.223.0/fs/expand_glob.ts";

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
      let mdPath;
      if (entry.isFile) {
        mdPath = path.join("posts", postDir.name, entry.name);
      } else {
        mdPath = path.join("posts", postDir.name, entry.name, "index.md");
      }
      const mdSource = Deno.readTextFileSync(mdPath);
      const { attrs, body } = extractFrontmatter(mdSource);
      if (attrs.skip) continue;
      const frontmatter = v.parse(FrontmatterSchema, attrs);
      if (frontmatter.build) {
        const [cmd, ...args] = frontmatter.build.split(" ");
        const process = await new Deno.Command(cmd, {
          args,
          cwd: path.join("posts", postDir.name, entry.name),
          stdout: "piped",
          stderr: "piped",
        }).output();
        Deno.stdout.write(process.stdout);
        Deno.stdout.write(process.stderr);
        if (process.code) {
          throw Error("failed");
        }
        //await process.status;
        copySync(
          path.join("posts", postDir.name, entry.name, "dist"),
          path.join("dist", year, slug)
        );
      }

      const post: Post = {
        frontmatter,
        body,
        slug,
        path: `${year}/${slug}/index.html`,
        render: () =>
          md.render(body, {
            filePath: mdPath,
          }),
      };
      const html = renderToString(<PostPage post={post} />);
      posts.push(post);

      ensureDirSync(path.join("dist", year, slug));
      const outPath = path.join("dist", year, slug, "index.html");
      Deno.writeTextFileSync(outPath, html);
      logSuccess(outPath);
    }
  }

  Deno.writeTextFileSync(
    path.join("dist", "index.html"),
    renderToString(<HomePage posts={posts} />)
  );
  logSuccess(path.join("dist", "index.html"));

  /*copySync(
    "static/MonaspaceNeon-Regular.otf",
    "dist/MonaspaceNeon-Regular.otf"
  );
  copySync("static/theme.js", "dist/theme.js");
  copySync("static/base.css", "dist/base.css");*/
}

if (import.meta.main) main();
