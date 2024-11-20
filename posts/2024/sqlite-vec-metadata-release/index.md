---
title: "sqlite-vec now supports metadata columns and filtering"
description: Metadata, partition key, and auxiliary column support in sqlite-vec
created_at: 2024-11-20
build: make dist
share_photo_url: https://blog-static.alxg.xyz/Screenshot%202024-11-20%20at%208.26.35%E2%80%AFAM.png
---

<script type="module" src="./index.min.js"></script>
<link rel="stylesheet" href="./index.min.css"></link>

<svg id="hero"></svg>

<div class="summary">

> _tl;dr — [`sqlite-vec`](https://github.com/asg017/sqlite-vec), a SQLite
> extension for vector search, now supports
> [metadata columns](https://alexgarcia.xyz/sqlite-vec/features/vec0.html#metadata),
> [auxiliary columns](https://alexgarcia.xyz/sqlite-vec/features/vec0.html#aux),
> and
> [partitioning](https://alexgarcia.xyz/sqlite-vec/features/vec0.html#partition-keys)
> in vec0 virtual tables! You can use these to store metadata like `user_id` or
> `created_at` fields, add additional `WHERE` clauses in KNN queries, and make
> certain selective queries much faster. Try it out!_

<style>
  .summary blockquote {
    font-weight: 500;
  }

  .tbl code {
    font-family: monospace;
  }
</style>
</div>

---

As of the latest
[v0.1.6](https://github.com/asg017/sqlite-vec/releases/tag/v0.1.6) release of
`sqlite-vec`, you can now store non-vector data in `vec0` virtual tables! For
example:

```sql
create virtual table vec_articles using vec0(

  article_id integer primary key,

  -- Vector text embedding of the `headline` column, with 384 dimensions
  headline_embedding float[384],

  -- Partition key, internally shard vector index on article published year
  year integer partition key,

  -- Metadata columns, can appear in `WHERE` clause of KNN queries
  news_desk text,
  word_count integer,
  pub_date text,

  -- Auxiliary columns, unindexed but fast lookups
  +headline text,
  +url text
);
```

Here we are storing a
[New York Time article headlines dataset](https://www.kaggle.com/datasets/johnbandy/new-york-times-headlines)
from the past 30 years, where we embed the headlines with
[`mixedbread-ai/mxbai-embed-xsmall-v1`](https://huggingface.co/mixedbread-ai/mxbai-embed-xsmall-v1).

If we wanted to see the closest related headlines to `'pandemic'` on article
published in 2020 by the `'Sports'` or `'Business'` new desk with more than 500
but less than 1000 words, we can perform a KNN query like so:

```sql
select
  article_id,
  headline,
  news_desk,
  word_count,
  url,
  pub_date,
  distance
from vec_articles
where headline_embedding match lembed('pandemic')
  and k = 8
  and year = 2020
  and news_desk in ('Sports', 'Business')
  and word_count between 500 and 1000;
```

<div class="tbl">

```
┌────────────┬──────────────────────────────────────────────────────────────────────┬───────────┬────────────┬─────────────────────────────┬──────────────────────────┬───────────┐
│ article_id │ headline                                                             │ news_desk │ word_count │ url                         │ pub_date                 │ distance  │
├────────────┼──────────────────────────────────────────────────────────────────────┼───────────┼────────────┼─────────────────────────────┼──────────────────────────┼───────────┤
│    2911716 │ The Pandemic’s Economic Damage Is Growing                            │ Business  │        910 │ https://www.nytimes.com/... │ 2020-07-07T18:12:40+0000 │ 0.8928120 │
│    2892929 │ As Coronavirus Spreads, Olympics Face Ticking Clock and a Tough Call │ Sports    │        987 │ https://www.nytimes.com/... │ 2020-03-06T01:34:36+0000 │ 0.9608180 │
│    2932041 │ The Pandemic Is Already Affecting Next Year’s Sports Schedule        │ Sports    │        620 │ https://www.nytimes.com/... │ 2020-11-11T13:56:25+0000 │ 0.9802038 │
│    2915381 │ The Week in Business: Getting Rich Off the Pandemic                  │ Business  │        814 │ https://www.nytimes.com/... │ 2020-08-02T11:00:03+0000 │ 1.0064692 │
│    2896043 │ The Coronavirus and the Postponement of the Olympics, Explained      │ Sports    │        798 │ https://www.nytimes.com/... │ 2020-03-25T17:45:58+0000 │ 1.0115833 │
│    2898566 │ Robots Welcome to Take Over, as Pandemic Accelerates Automation      │ Business  │        871 │ https://www.nytimes.com/... │ 2020-04-10T09:00:27+0000 │  1.019637 │
│    2898239 │ The Pandemic Feeds Tech Companies’ Power                             │ Business  │        784 │ https://www.nytimes.com/... │ 2020-04-08T16:43:13+0000 │ 1.0200014 │
│    2929224 │ In M.L.S., the Pandemic Changes the Playoff Math                     │ Sports    │        859 │ https://www.nytimes.com/... │ 2020-10-29T17:09:10+0000 │ 1.0238885 │
└────────────┴──────────────────────────────────────────────────────────────────────┴───────────┴────────────┴─────────────────────────────┴──────────────────────────┴───────────┘
```

</div>

<small><i>Here we used
[`sqlite-lembed`](https://github.com/asg017/sqlite-lembed) to embed our query,
but any other embeddings provider could be used!</i></small>

We can reference those metadata columns and parition key columns in the `WHERE`
clause of the KNN query, and get the exact results we want!

Now, what's the difference between metadata, partition key, and auxiliary
columns?

## Metadata columns for `WHERE` clause filtering

Metadata columns are declared with normal column declartions in the `vec0`
constructor. Metadata columns are stored and indexed _alongside_ vectors, and
can appear in the `WHERE` clause of KNN queries.

```sql
create virtual table vec_articles using vec0(
  article_id integer primary key,
  headline_embedding float[384],
  news_desk text,
  word_count integer,
  pub_date text
);

select
  article_id,
  headline,
  news_desk,
  word_count,
  pub_date,
  distance
from vec_articles
where headline_embedding match lembed('new york city housing')
  and k = 20
  and news_desk = 'Metro'
  and word_count < 1000
  and pub_date between '2004-01-20' and '2009-01-20';
```

<div class="tbl">

```
┌────────────┬──────────────────────────────────────────────────────────────────────┬───────────┬────────────┬──────────────────────────┬────────────────────┐
│ article_id │ headline                                                             │ news_desk │ word_count │ pub_date                 │ distance           │
├────────────┼──────────────────────────────────────────────────────────────────────┼───────────┼────────────┼──────────────────────────┼────────────────────┤
│    1717598 │ Manhattan: City to Expand Housing Program                            │ Metro     │         83 │ 2007-02-28T05:00:00+0000 │ 0.7736235857009888 │
│    1607183 │ Manhattan: More Money for Housing                                    │ Metro     │         96 │ 2006-06-16T04:00:00+0000 │ 0.7818768620491028 │
│                                                                                  ...                                                                       │
│    1772158 │ Ask About New York Architecture, On Screen and Off                   │ Metro     │        241 │ 2007-09-17T18:25:57+0000 │  0.930429220199585 │
│    1673007 │ Manhattan: City Balances Budget for 26th Year                        │ Metro     │         87 │ 2006-11-01T05:00:00+0000 │ 0.9327330589294434 │
│    1616702 │ Little Shift in Prices of Manhattan Apartments                       │ Metro     │        615 │ 2006-07-06T04:00:00+0000 │ 0.9354249238967896 │
└────────────┴──────────────────────────────────────────────────────────────────────┴───────────┴────────────┴──────────────────────────┴────────────────────┘
```

</div>

There we retrieved the 20 most related article headlines to
`'new york city housing'`, published by the `'Metro'` news desk, with less than
1000 words, published during the George W Bush administration.

Metadata columns can be boolean, integer, floats, or text values. More types
like [BLOBs](https://github.com/asg017/sqlite-vec/issues/138),
[dates](https://github.com/asg017/sqlite-vec/issues/139), and
[UUID/ULIDs](https://github.com/asg017/sqlite-vec/issues/140) are coming soon!

Only a subset of operators are supported during metadata filtering, including:

- Equality constraints, ie `=` and `!=`
- Comparison constraints, ie `>`, `>=`, `<`, `<=`
- `column in (...)` constraints, only on `INTEGER` and `TEXT` columns on SQLite
  3.38 or above

Notably absent: `REGEXP`, `LIKE`, `GLOB`, and other custom scalar functions.
Also
[`NULL` values are not supported yet](https://github.com/asg017/sqlite-vec/issues/141),

## Partition keys for faster `WHERE` clause filtering

Now the above query was actually a bit slow! There are 3 million rows in the
table, and metadata filters need to visit every single row to do a comparison.
Metadata comparison are quite fast and built for fast filtering, but they have
their limits.

But notice how we only wanted a small subset of values –
`between '2004-01-20' and '2009-01-20'` is only 5 years out of 30 years of data.
We can tell the `vec0` virtual table to internally shard the vector index on a
given key, using partition keys!

```sql
create virtual table vec_articles using vec0(
  article_id integer primary key,
  headline_embedding float[384],

  -- shard the vector index based on published year
  year integer partition key,

  news_desk text,
  word_count integer,
  pub_date text
);

select
  article_id,
  headline,
  news_desk,
  word_count,
  pub_date,
  distance
from vec_articles
where headline_embedding match lembed('new york city housing')
  and k = 20
  -- narrow search to these years only
  and year between 2004 and 2009
  and news_desk = 'Metro'
  and word_count < 1000
  -- finer filtering for exact dates we care about
  and pub_date between '2004-01-20' and '2009-01-20';
```

This KNN query returns the same exact results as the one above - but is 3x
faster! This is because internally, vectors are stored based on the `year` value
of its row. In that KNN query, `sqlite-vec` will recognize constraints on
partition keys, and quickly pre-filter rows before any vectors are compared.

But beware! It's easy to accidentally over-shard a vector index on the wrong
values and cause performance issues. Partition keys are great for date-based
items like `year` or `month`, particulary when each unique partition key value
has 100's or 1000's of vectors. They are also great for user IDs or document
IDs, for "per-user" or "per-document" vector indexes.

Partition key columns can only be `TEXT` or `INTEGER` values, file an issue if
you want to see some other type support. Currently `column in (...)` constraints
are not supported for partition key columns,
[but will be soon](https://github.com/asg017/sqlite-vec/issues/142)!

## Auxiliary columns

Some columns never need to be indexed! You can always store addtionally
`SELECT`-only metadata in separate tables and do a `JOIN` yourself, or you can
use auxiliary columns:

```sql
create virtual table vec_articles using vec0(
  article_id integer primary key,
  headline_embedding float[384],
  +headline text,
  +url text
);

select
  article_id,
  headline,
  url,
  distance
from vec_articles
where headline_embedding match lembed('dodgers game')
  and k = 20;
```

<div class="tbl">

```
┌────────────┬─────────────────────────────────────────────────────────────────────────────────────┬───────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┬────────────────────┐
│ article_id │ headline                                                                            │ url                                                                                                                               │ distance           │
├────────────┼─────────────────────────────────────────────────────────────────────────────────────┼───────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┼────────────────────┤
│    1896278 │ Attention Dodgers Fans: There’s a Game Tonight                                      │ https://bats.blogs.nytimes.com/2008/10/15/attention-dodgers-fans-theres-a-game-tonight/                                           │ 0.6733786463737488 │
│    2556896 │ Dodgers, in Flurry of Activity, Move to Revamp Their Infield                        │ https://www.nytimes.com/2014/12/11/sports/baseball/mlb-jimmy-rollins.html                                                         │ 0.7796685099601746 │
│    2382487 │ Keeping Up With the Dodgers                                                         │ https://www.nytimes.com/2012/12/15/sports/angels-keeping-up-with-the-dodgers-leading-off.html                                     │ 0.7849781513214111 │
│    2585169 │ New Life for the Dodgers’ Old Digs                                                  │ https://www.nytimes.com/slideshow/2015/04/19/sports/baseball/20150419DODGERTOWN.html                                              │ 0.7894293665885925 │
│    1032111 │ Not Dodgers II, but It's Baseball; The Game Is Back in Brooklyn, on a Smaller Scale │ https://www.nytimes.com/2001/06/23/nyregion/not-dodgers-ii-but-it-s-baseball-the-game-is-back-in-brooklyn-on-a-smaller-scale.html │ 0.7978747487068176 │
└────────────┴─────────────────────────────────────────────────────────────────────────────────────┴───────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┴────────────────────┘
```

</div>

Auxiliary columns are denoted by a `+` prefix in the column definition, modeled
after
[the same feature in the SQLite R*Tree extension](https://www.sqlite.org/rtree.html#auxiliary_columns).
These columns are unindex, stored in a separate internal table and `JOIN`'ed at
`SELECT` time. They _cannot_ appear in a KNN `WHERE` query, as performance would
worsen dramatically.

But it saves you from dealing with additional `JOIN`s yourself! They are
especially great for longer `TEXT` or `BLOB` values.

## Roadmap and the future of `sqlite-vec`

Metadata column support is the biggest update to `sqlite-vec` since the initial
[`v0.1.0` launch 3 months ago](https://alexgarcia.xyz/blog/2024/sqlite-vec-stable-release/index.html),
but I have a lot planned for the project!

First off: **ANN indexes.** The `vec0` virtual table is brute-force only, which
really slows down KNN queries on larger datasets. There are strategies like
[binary quantization](https://alexgarcia.xyz/sqlite-vec/guides/binary-quant.html)
or
[Matryoshka embeddings](https://alexgarcia.xyz/sqlite-vec/guides/matryoshka.html)
that can help, but `sqlite-vec` won't be fast until ANN indexes are supported.

I delayed working on ANN indexes until metadata columns were supported, because
its much easier to build an ANN index with metaddata filtering on day 1 than it
is to retroactively try to support them. I think this was the right call —
metadata columns are hard! Follow
[issue #25](https://github.com/asg017/sqlite-vec/issues/25) for future update on
this!

Next: **Quantizers.** Currently `sqlite-vec` only supported simple binary
quantization and scalar quantization with `int8` vectors. But I want to support
`float16`, `float8`, "smarter" binary quantization (ie custom thresholds instead
of just `> 0`), and other techniques that have come about the last few months.
This will also help support ANN indexes, as many of them rely on vector
compression for fast queries.

There's also a ton of **performance work** that `sqlite-vec` needs, especially
with these new metadata column features. This initial release was more of a
"make it work" and not "make it fast", so expect much faster metadata filtering
in upcoming releases!

Sister projects [`sqlite-lembed`](https://github.com/asg017/sqlite-lembed) and
[`sqlite-rembed`](https://github.com/asg017/sqlite-rembed) also need a ton of
love, they both have some older PRs that need merging. Expect releases of both
of these projects very soon!

And finally, **a ton of smaller integrations**! For example, Rody Davis
[submitted Dart and Flutter bindings](https://github.com/asg017/sqlite-vec/pull/119)
that I have not yet merged, Oscar Franco contributed
[Android and iOS bindings](https://github.com/asg017/sqlite-vec/pull/91) that
needs love, and
[Pyodide support is on the horizon](https://github.com/asg017/sqlite-vec/issues/135).
