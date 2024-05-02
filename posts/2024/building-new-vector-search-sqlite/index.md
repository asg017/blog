---
title: I'm writing a new vector search SQLite Extension
description: sqlite-vec is an upcoming vector search SQLite extension, coming soon!
created_at: 2024-04-29
build: make dist
share_photo_url: https://alexgarcia.xyz/blog/1.png
---

<script type="module" src="./index.min.js"></script>
<link rel="stylesheet" href="./index.min.css"></link>

<svg id="hero"></svg>

<div class="summary">

> _tl;dr — [`sqlite-vec`](https://github.com/asg017/sqlite-vec) will be a new
> SQLite extension for vector search, replacing `sqlite-vss`. It will be an
> embeddable "fast enough" vector search tool, that can run anywhere SQLite
> runs - including WASM! It's still in active development, but
> [check out the repo](https://github.com/asg017/sqlite-vec) to learn when it
> will be ready!_

---

</div>

<style>
  .summary blockquote {
    font-weight: 500;
  }
</style>

I'm working on a new SQLite extension! It's called
[`sqlite-vec`](https://github.com/asg017/sqlite-vec), an extension for vector
search, written purely in C. It's meant to replace
[`sqlite-vss`](https://github.com/asg017/sqlite-vss), another vector search
SQLite extension I released in February 2023, which
[has a number of problems](#wrong-sqlite-vss). I believe the approach I'm taking
with `sqlite-vec` solves a number of problem it's predecessor has, will have a
much nicer and performant SQL API, and is a better fit for all applications who
want an embed vector search solution!

## What `sqlite-vec` will be

`sqlite-vec` will be a SQLite extension written purely in C with no
dependencies. It will provide custom SQL functions and virtual tables for fast
vector search, as well as other tools and utilities for working with vectors
(quantization, JSON/BLOB/numpy conversions, vector arithmetic, etc.).

A quick same of what vector search will look like with `sqlite-vec`, in pure
SQL:

```sqlite
.load ./vec0

-- a "vector store" for 8-dimensional floating point numbers
create virtual table vec_examples using vec0(
  sample_embedding float[8]
);

-- vectors can be provided as JSON or in a compact binary format
insert into vec_examples(rowid, sample_embedding)
  values
    (1, '[-0.200, 0.250, 0.341, -0.211, 0.645, 0.935, -0.316, -0.924]'),
    (2, X'E5D0E23E894100BF8FC2B53E426045BFF4FD343F7D3F35BFA4703DBE1058B93E'),
    (3, '[0.716, -0.927, 0.134, 0.052, -0.669, 0.793, -0.634, -0.162]'),
    (4, X'8FC235BFC3F5A83E9EEF273F9EEF273DA4707DBF23DB393FB81EC53E7D3F75BF');


-- KNN style query goes brrrr
  select
    rowid,
    distance
  from vec_examples
  where sample_embedding match '[0.890, 0.544, 0.825, 0.961, 0.358, 0.0196, 0.521, 0.175]'
  order by distance
  limit 2;

/*
rowid,distance
2,2.38687372207642
1,2.38978505134583
*/
```

Using `sqlite-vec` means using pure SQL, just `CREATE VIRTUAL TABLE`,
`INSERT INTO`, and `SELECT` statements.

This work is exciting - for many reasons! First off, "written in pure C" means
it will be able to run anywhere. The previous `sqlite-vss` extension, which had
some cumbersome C++ dependencies, was only able to reliably run on Linux and
MacOS machines, with binaries in the `3MB`-`5MB` range. By contrast,
`sqlite-vec` will run on all platforms (Linux/MacOS/Windows), in the browser
with WebAssembly, and even smaller devices like mobile phones and Raspberry Pis!
Smaller binaries too, in the few 100's of KB range.

Additionally, `sqlite-vec` has more control over memory usage. By default,
vectors are stored in 'chunks' in shadow tables, and are read chunk-by-chunk
during KNN searches. This means you don't need to store everything in RAM!
Though if you do want in-memory speed, you could use the
[`PRAGMA mmap_size`](https://www.sqlite.org/pragma.html#pragma_mmap_size)
command to make KNN searches much faster.

And finally, `sqlite-vec` is built in a new "era" of vector search tooling and
research. There will be better support for "adative-length embeddings" (aka
[Matryoshka embeddings](https://huggingface.co/blog/matryoshka)), and
`int8`/`bit` vector support for
[binary and scalar quantization](https://huggingface.co/blog/embedding-quantization).
This means more control over the speed, accuracy, and disk space that your
vectors take up.

Though initial, `sqlite-vec` will only support exhaustive full-scan vector
search! There will be no "approximate nearest neighbors" (ANN) options. But I
hope to add IVF + HNSW in the future!

## Demo

Enough yappin' let's see a demo

`sqlite-vec` is running right now in your browser! If you open up devtools,
you'll see an (un-optimized) `5.9MB` `sqlite3.wasm` file, which is the
[official SQLite WASM build](https://sqlite.org/wasm/doc/trunk/about.md) with
`sqlite-vec` compiled in. There is a `movies.bit.db` SQLite database also
loaded, which is a `2.6MB` SQLite database, which has
[this movies dataset](https://www.kaggle.com/datasets/tmdb/tmdb-movie-metadata?select=tmdb_5000_movies.csv)
with 4,800 movie overviews in the `articles` table. The separate `vec_movies`
virtual table is a vector index of those "overviews" embedded, with
[Nomic's 1.5 embeddings model](https://blog.nomic.ai/posts/nomic-embed-matryoshka),
quantized to binary vectors.

Here's a quick sample of what the data looks like:

<div id="target1"></div>

Here we see the `articles` table has columns like `title`, `release_date`, and
`overview`. The `overview` column here is important - it's a very short sentence
describing the plot of the movie. We also have the `vec_articles` virtual table,
which stores embeddings of the `articles.overview` as the `overview_embeddings`
column. Thy are binary vector of 768 dimensions, which takes up 96 bytes
(`768 / 8 = 96`).

Now let's see how a KNN-style search works! Here's a lil' table select
component. Select a movie with the radio button on the left-hand side.

<div id="target-table"></div>

The movie ID you selected will now pre-populate the `:selected_movie` SQL
parameter in this KNN SQL query!

<div id="target-code"></div>

Those are the 10 closest movies, to the one you selected! The "closest" one
(using hamming distance, because it's a binary vector) will always be the same
movie, with a distance of 0. Keep in mind, embedding a single-sentence plot
description of a small movie dataset doesn't give the best results (and binary
quantization sacrifices even more quality), but the core idea remains. Fast,
"good enough" vector search, in your browser!

More docs about this KNN-style query will come soon, but in case you wanted to
poke around at the internals, try adding a `EXPLAIN QUERY PLAN` to the beginning
of the `SELECT` statement. You'll see the `0:knn` "index" that `vec_movies`
uses.

<h2 id="wrong-sqlite-vss"> But what's wrong with <code>sqlite-vss</code>?</h2>

I won't go into all the details, but there were a number of roadblocks in the
development and adoption of `sqlite-vss`, including:

- Only worked on Linux + MacOS machines (no Windows, WASM, mobile devices, etc.)
- Stored vectors all in-memory
- Various transaction-related bugs and issues
- Extremely hard and time-consuming to compile
- Missing common vector operations (scalar/binary quantization)

Nearly all of these are because `sqlite-vss` depended on
[Faiss](https://github.com/facebookresearch/faiss). With a lot of time and
energy, some of these issues could _maybe_ be solved, but many of them would be
blocked by Faiss.

Given all this, a no-dependency and low-level solution seemed really enticing.
Turns out, vector search isn't too complicated, so `sqlite-vec` was born!

## Still not ready, but soon!

The core features of `sqlite-vec` work, but I have very little error handling +
testing. I have 246 TODOs in the `sqlite-vec.c` file, which I'm tracking with a
lil script:

```
$ make progress
deno run --allow-read=sqlite-vec.c scripts/progress.ts
Number of todo_assert()'s:      191
Number of "// TODO" comments:   41
Number of todo panics:          14
Total TODOs:                    246

░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░ (0/246)

0% complete to sqlite-vec v0
```

Once those 246 TODOs are completed, then the first `v0.1.0` of `sqlite-vec` will
be released, with documentation, demos, bindings, and more! I'm aiming for a
month or so, but we shall see!

## I'm looking for sponsors!

Is your company interested in the success of `sqlite-vec`? I'd love to chat!
[Email me](https://alexgarcia.xyz/) for more information.
