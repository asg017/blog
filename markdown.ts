import markdownit from "npm:markdown-it";
import { include } from "npm:@mdit/plugin-include";
import mdAnchor from "npm:markdown-it-anchor";
import slugify from "npm:@sindresorhus/slugify";
import { transformerMetaHighlight } from "npm:@shikijs/transformers";
import { fromHighlighter } from "npm:@shikijs/markdown-it/core";
import { createHighlighter } from "npm:shiki";

const sqlite = JSON.parse(
  Deno.readTextFileSync("static/sqlite.tmlanguage.json")
);

const md = markdownit({ html: true });

md.use(
  fromHighlighter(
    await createHighlighter({
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
      themes: { light: "catppuccin-latte", dark: "catppuccin-mocha" },
      defaultColor: false,
      transformers: [transformerMetaHighlight()],
    }
  )
);

md.use(include, {
  currentPath: (env: { filePath: string }) => env.filePath,
});

md.use(mdAnchor, {
  level: 1,
  slugify: slugify,
  permalink: true,
  permalinkClass: "header-anchor",
  permalinkBefore: true,
});

export { md };
