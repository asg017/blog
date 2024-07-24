---
title: "Introducing sqlite-lembed: A SQLite extension for generating text embeddings locally"
description: Generate text embeddings in SQL with GGUF models!
created_at: 2024-07-24
build: make dist
share_photo_url: https://blog-static.alxg.xyz/Screen%20Shot%202024-07-23%20at%2011.37.14%20PM.png
---

<script type="module" src="./index.min.js"></script>
<link rel="stylesheet" href="./index.min.css"></link>

<svg id="hero"></svg>

<div class="summary">

> _tl;dr — [`sqlite-lembed`](https://github.com/asg017/sqlite-lembed) is a SQLite extension for generating text embeddings, meant to work alongside [`sqlite-vec`](https://github.com/asg017/sqlite-vec). With a single embeddings model file provided in the `.gguf` format, you can generate embeddings using regular SQL functions, and store them directly inside your SQLite database. No extra server, process, or configuration needed!_

---

</div>

<style>
  .summary blockquote {
    font-weight: 500;
  }
</style>

I've been working on [`sqlite-vec`](https://github.com/asg017/sqlite-vec) for quite some time now - 3 months [since I first announced it](https://alexgarcia.xyz/blog/2024/building-new-vector-search-sqlite/index.html), More than 7 months since my first prototype, and more than 2 years since [my first SQLite vector search attempt](https://github.com/asg017/sqlite-vss). And the initial stable version coming soon, I promise! `v0.1.0` is scheduled for next week.

But one weakness of `sqlite-vec` compared to other vector storage tools is that **you must generate embeddings yourself**. Some vector databases have helper functions and wrappers that automatically generate embeddings for you when inserting text.

But this feature never made sense for `sqlite-vec`. It's a [single C file](https://github.com/asg017/sqlite-vec/blob/main/sqlite-vec.c) with no external dependencies. Adding embedding model inference would drastically add scope and make things too complicated.

At the same time, I don't want to `pip install openai` or `pip install sentence-transformers` every time I want to generate embeddings on some text. I want something that is lightweight, a single binary, and works with SQLite.

So, with the help of [`llama.cpp`'s embeddings support](https://github.com/ggerganov/llama.cpp/pull/5796), `sqlite-lembed` is born!

## Usage

There are a few ways to install `sqlite-lembed` - `npm install sqlite-lembed`, `pip install sqlite-lembed`, `gem install sqlite-lembed`, or grabbing pre-compiled extension from [the Releases page](https://github.com/asg017/sqlite-lembed/releases). Or if you want to directly install and give your IT admins a scare, install with:

```bash
curl -L https://github.com/asg017/sqlite-lembed/releases/download/v0.0.1-alpha.4/install.sh | sh
```

You now have a `lembed0.dylib` (MacOS) or `lembed0.so` (Linux) file in your current directory!

Now you'll need an embeddings models in [`.gguf` format](https://huggingface.co/docs/hub/en/gguf). A few open source options include [`nomic-embed-text-v1.5`](https://huggingface.co/nomic-ai/nomic-embed-text-v1.5-GGUF) and [`mxbai-embed-large-v1`](https://huggingface.co/mixedbread-ai/mxbai-embed-large-v1), but here we will download the smaller and older [`all-MiniLM-L6-v2`](https://huggingface.co/sentence-transformers/all-MiniLM-L6-v2) model like so:

```bash
curl -L -o all-MiniLM-L6-v2.e4ce9877.q8_0.gguf https://huggingface.co/asg017/sqlite-lembed-model-examples/resolve/main/all-MiniLM-L6-v2/all-MiniLM-L6-v2.e4ce9877.q8_0.gguf
```

Now we can generate some embeddings! Fire up the `sqlite3` CLI and run these setup commands.

```sql
.load ./lembed0

INSERT INTO temp.lembed_models(name, model)
  select 'all-MiniLM-L6-v2', lembed_model_from_file('all-MiniLM-L6-v2.e4ce9877.q8_0.gguf');
```

The `temp.lembed_model` virtual table lets you "register" models with pure `INSERT INTO` statements. The `name` field is a unique identifier for a given model, and `model` is provided as a path to the `.gguf` model, on disk, with the `lembed_model_from_file()` function.

Let's try out this new `'all-MiniLM-L6-v2'` model with the `lembed()` function.

```sql

select lembed(
  'all-MiniLM-L6-v2',
  'The United States Postal Service is an independent agency...'
); -- X'A402...09C3' (1536 bytes)
```

That's out first embedding! A 384 dimensional floating point vector (defined as part of the `all-MiniLM-L6-v2` model), taking up 1,536 bytes of space with 4 bytes per element.

Now a single embedding of a single sentence isn't that exciting — let's try a larger sample. Since we will be comparing multiple vectors together, let's bring in `sqlite-vec` into our project. Again you can `npm install` or `gem install` or `pip install` `sqlite-vec`, but if you live dangerously you can install with:

```bash
curl -L https://github.com/asg017/sqlite-vec/releases/download/0.0.1-alpha.37/install.sh | sh
```

Let's create a corpus of some random news headlines and store that in a "regular" SQLite table.

```sql
create table articles(
  headline text
);

-- Random NPR headlines from 2024-06-04
insert into articles VALUES
  ('Shohei Ohtani''s ex-interpreter pleads guilty to charges related to gambling and theft'),
  ('The jury has been selected in Hunter Biden''s gun trial'),
  ('Larry Allen, a Super Bowl champion and famed Dallas Cowboy, has died at age 52'),
  ('After saying Charlotte, a lone stingray, was pregnant, aquarium now says she''s sick'),
  ('An Epoch Times executive is facing money laundering charge');
```

Ok now let's generate some embeddings! We will store the embedding directly into a new `vec0` virtual table. We can always join this new table back with the `articles` table for metadata.

```sql

.load ./vec0

-- Build a vector table with embeddings of article headlines
create virtual table vec_articles using vec0(
  headline_embeddings float[384]
);

insert into vec_articles(rowid, headline_embeddings)
  select rowid, lembed('all-MiniLM-L6-v2', headline)
  from articles;

```

Now every `headline` in `articles` has been embed and stored in `vec_articles`. To perform a KNN-style search, we can do:

```sql
param set :query 'firearm courtroom'

with matches as (
  select
    rowid,
    distance
  from vec_articles
  where headline_embeddings match lembed('all-MiniLM-L6-v2', :query)
  order by distance
  limit 3
)
select
  headline,
  distance
from matches
left join articles on articles.rowid = matches.rowid;

/*
+--------------------------------------------------------------+------------------+
|                           headline                           |     distance     |
+--------------------------------------------------------------+------------------+
| Shohei Ohtani's ex-interpreter pleads guilty to charges rela | 1.14812409877777 |
| ted to gambling and theft                                    |                  |
+--------------------------------------------------------------+------------------+
| The jury has been selected in Hunter Biden's gun trial       | 1.18380105495453 |
+--------------------------------------------------------------+------------------+
| An Epoch Times executive is facing money laundering charge   | 1.27715671062469 |
+--------------------------------------------------------------+------------------+
*/
```

And there we go! Notice how "firearm courtroom" doesn't appear in any of these headlines, but it can still figure out that "Hunter Biden's gun trial" is related, and the other two justice-related articles appear on top.

So there you have it - text embeddings and vector search, all with the `sqlite3` CLI, two extensions, and a single `.gguf` file.

## Last notes

**It is not required to use `sqlite-lembed` with `sqlite-vec`**, or vice-versa. You can use any embeddings provider with `sqlite-vec` — the OpenAI API, other JSON endpoints, PyTorch models, etc. As long as your embeddings can be provided as JSON or a compact BLOG format, you're good to go.

Similarly, **it is not required to use `sqlite-vec` with `sqlite-lembed`**. You can dump embeddings generated by `sqlite-lembed` into any other vector store you like, or in regular SQLite tables with `sqlite-vec`.

Also, Windows isn't supported yet. Sorry! Hopefully soon, `llama.cpp` does support Windows, but Github Actions can be quite a nightmare. WASM is also not supported yet, but hoping to figure that out in the near future.

And lastly — **`sqlite-lembed` is still in beta**! While `sqlite-vec` stabilized on v0.1.0 next week, `sqlite-lembed` will be actively developed for the near future. Mostly because the `llama.cpp` dependency is also under active deveopment, but I hope that the main SQL API won't change much.
