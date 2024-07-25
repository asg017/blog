---
title: "Introducing sqlite-rembed: A SQLite extension for generating text embeddings from remote APIs"
description: Generate embeddings with pure SQL from OpenAI, Cohere, Nomic, llamafile, Ollama, ...
created_at: 2024-07-25
build: make dist
share_photo_url: https://blog-static.alxg.xyz/Screen%20Shot%202024-07-24%20at%2010.42.43%20PM.png
---

<script type="module" src="./index.min.js"></script>
<link rel="stylesheet" href="./index.min.css"></link>

<svg id="hero"></svg>

<div class="summary">

> \_tl;dr — [`sqlite-rembed`](https://github.com/asg017/sqlite-rembed) is a new
> SQLite extension for generating text embeddings from remote APIs — like OpenAI, Nomic, Cohere, llamafile, Ollama, and more! It bundles its own HTTP client, so it can be used in small environments like the official SQLite CLI. It doesn't support batch embeddings yet, but can still be useful in many cases.

<style>
  .summary blockquote {
    font-weight: 500;
  }
</style>
</div>

---

`sqlite-rembed` is a new SQLite extension I've been experimenting with, as a sister project to [`sqlite-vec`](https://github.com/asg017/sqlite-vec). It connects to various 3rd party APIs to generate text embeddings.

For example, to use [OpenAI's embedding service](https://platform.openai.com/docs/guides/embeddings), this is all you need:

```sql
INSERT INTO temp.rembed_clients(name, options)
  VALUES ('text-embedding-3-small', 'openai');

select rembed(
  'text-embedding-3-small',
  'The United States Postal Service is an independent agency...'
); -- X'A452...01FC', Blob<6144 bytes>
```

Here we register a new rembed "client" named `text-embedding-3-small`, using the special `openai` option. By default, The `openai` option will source your API key from the `OPENAI_API_KEY` environment variable, and use the client name (`text-embedding-3-small`) as the model name.

Now, we can use the `rembed()` SQL function to generate embeddings from OpenAI! It returns the embeddings in a compact BLOB format, the same format that `sqlite-vec` uses. In this case, `text-embedding-3-small` returns 1536 dimensions, so a `1536 * 4 = 6144` length BLOB is returned.

And `sqlite-rembed` has support for other providers! Here's an example that uses [Nomic's embedding API](https://docs.nomic.ai/reference/endpoints/nomic-embed-text):

```sql
INSERT INTO temp.rembed_clients(name, options)
  VALUES ('nomic-embed-text-v1.5', 'nomic');

select rembed(
  'nomic-embed-text-v1.5',
  'The United States Postal Service is an independent agency...'
);
```

And with [Cohere's embedding API](https://docs.cohere.com/reference/embed):

```sql
INSERT INTO temp.rembed_clients(name, options)
  VALUES ('embed-english-v3.0', 'cohere');

select rembed(
  'embed-english-v3.0',
  'The United States Postal Service is an independent agency...'
);
```

Notice how you can have multiple clients, all with different names and using different API providers. Secrets are sourced from places you expect: `NOMIC_API_KEY`, `CO_API_KEY`, and so on.

If you want to manually configure which API keys to use, or change the "base URL" of a provider, you can do so with `rembed_client_options()`:

```sql
INSERT INTO temp.rembed_clients(name, options) VALUES
  (
    'text-embedding-3-small',
    rembed_client_options(
      'format', 'openai',
      'key', :OPENAI_API_KEY -- SQL parameter to bind an API key
    )
  );
```

In total, `sqlite-rembed` currently has support for the following embedding providers:

- OpenAI
- Nomic
- Cohere
- Jina
- MixedBread
- Llamafile
- Ollama

## "Remote" embeddings can still be local!

`sqlite-rembed` stands for "**SQLite** **r**emote **embed**dings," in contrast to its sister project [`sqlite-lembed`](https://github.com/asg017/sqlite-lembed) that stands for "**SQLite** **l**ocal **embed**dings." For `sqlite-lembed`, "local" means inside the same process, no external process or server needed. "Remote" in `sqlite-rembed` just means "outside the current process", which isn't always an outside `https://...` server.

You can totally run a embeddings model locally with llamafile, Ollama, or some other "OpenAI compatible" service, and point `sqlite-rembed` to a `http://localhost:...` endpoint.

Let's take llamafile as an example: follow the ["Getting Started with LLaMAfiler"](https://github.com/Mozilla-Ocho/llamafile/blob/main/llamafile/server/doc/getting_started.md) guide. Once up, you'll have a local embeddings server available to you at `http://127.0.0.1:8080/`. To use it from `sqlite-rembed`, register with the `llamafile` option:

```sql
INSERT INTO temp.rembed_clients(name, options)
 VALUES ('llamafile', 'llamafile');

.mode quote

select rembed('llamafile', 'Tennis star Coco Gauff will carry the U.S. flag...');
```

And that's it! Not a single byte of your data will leave your computer.

Another option is [Ollama's embeddings support](https://ollama.com/blog/embedding-models). Once installed, Ollama will have a constantly running server at `http://localhost:11434`. To use from `sqlite-rembed`, register a `ollama` client like so:

```sql
INSERT INTO temp.rembed_clients(name, options)
  VALUES ('snowflake-arctic-embed:s', 'ollama');

select rembed('ollama', 'LeVar Burton talks about his changing...');
```

Where the [`snowflake-arctic-embed:s`](https://ollama.com/library/snowflake-arctic-embed:s) model I downloaded with `ollama pull snowflake-arctic-embed:s`. This approach is nice because the Ollama service will be constantly running in the background, and will "wake up" embedding models into memory on first request (and will unload after 5 minutes of inactivity). Again, not a single byte of your data leaves your computer.

---

So try out `sqlite-rembed` today! There are pre-compiled binaries on Github releases, or you can `pip install sqlite-rembed` or `npm install sqlite-remebed`.
