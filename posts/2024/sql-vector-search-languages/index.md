---
title: Vector search in 7 different programming languages using SQL
description: Using sqlite-vec in different programming languages and runtimes
created_at: 2024-05-23
build: make dist
share_photo_url: https://blog-static.alxg.xyz/2.png
---

<script type="module" src="./index.min.js"></script>
<link rel="stylesheet" href="./index.min.css"></link>

<svg id="hero"></svg>

As part of the [`sqlite-vec`](https://github.com/asg017/sqlite-vec) project, I
provide multiple "bindings" to various programming languages and runtimes,
including:

- **Python**, as pip packages on [PyPi](https://pypi.org/)
- **Ruby**, as gems on [rubygems](https://rubygems.org/)
- **Node.js** (and consequently **Bun** and **Deno**), as npm packages on
  [npm](https://www.npmjs.com/)
- **Client-side JavaScript/WASM**, as a "demo" npm package
- **Go**, as a [Go module](https://pkg.go.dev/)
- **Rust**, as a cargo crate on [crates.io](https://crates.io/)
- **C**: An "amalgamation" of a single `sqlite-vec.c` and `sqlite-vec.h` file.

This article won't be about how I created the bindings — for that, see
[this blog post for Python](https://observablehq.com/@asg017/making-sqlite-extensions-pip-install-able),
[this one for Node.js](https://observablehq.com/@asg017/making-sqlite-extensions-npm-installable-and-deno?collection=@asg017/sqlite-blog),
and
[this one for Ruby](https://observablehq.com/@asg017/making-sqlite-extension-gem-installable?collection=@asg017/sqlite-blog).
Instead, I want to compare all these languages together, in the specific context
of vector search with `sqlite-vec`.

Here's the goal: For every programming language and runtime listed above, we are
going to write a single-file script that does the following:

1. Loads the `sqlite-vec` SQLite extension
2. Prints the SQLite version and `sqlite-vec` version, using the
   `sqlite_version()` and `vec_version()` SQL functions.
3. Create a `vec0` virtual table and populate it with 4-dimensional vectors.
4. Query the `vec0` table to find the 3 closest vectors to a query vector
   (KNN-style query).

For the 4-dimensional vectors, we will use this "database" of five vectors:

<!-- deno-fmt-ignore-start -->
```js
[0.1, 0.1, 0.1, 0.1]
[0.2, 0.2, 0.2, 0.2]
[0.3, 0.3, 0.3, 0.3]
[0.4, 0.4, 0.4, 0.4]
[0.5, 0.5, 0.5, 0.5]
```

With `id` values of `1`, `2`, `3`, `4`, and `5`, respectively. The query vector
is:

```js
[0.3, 0.3, 0.3, 0.3]
```
<!-- deno-fmt-ignore-end -->

From eye-balling it, we can see the closest vector will always be #3 with a
distance of `0`, since both vectors have equal values. The next two closest
vectors will be #2 and #4.

Let's get into the code! For reference, these examples can be found
[in the `sqlite-vec` examples directory](https://github.com/asg017/sqlite-vec/tree/main/examples).
Feel free to skip to a specific language, or head to the bottom for some
high-level notes:

- [Pure SQL](#baseline-pure-sql)
- [Python](#python)
- [Ruby](#ruby)
- [Node.js](#node-js)
- [Bun](#bun)
- [Deno](#deno-almost)
- [Javscript + WASM](#client-side-java-script)
- [Rust](#rust)
- [Go](#go)
- [C](#c)
- [Final Thoughts](#final-thoughts)

## Baseline: pure SQL

As a baseline, here's this logic in pure SQL:

```sqlite
<!-- @include: ./demos/demo.sql -->
```

And the output, using the SQLite CLI (`v3.45.1`):

```
$ sqlite3 < demo.sql
+------------------+----------------+
| sqlite_version() | vec_version()  |
+------------------+----------------+
| 3.45.1           | v0.0.1-alpha.9 |
+------------------+----------------+
+-------+-------------------+
| rowid |     distance      |
+-------+-------------------+
| 3     | 0.0               |
| 4     | 0.199999988079071 |
| 2     | 0.200000017881393 |
+-------+-------------------+
```

Fairly straightforward! There's little boilerplate, only a few dot-commands at
the top to load the extension and configure the output.

One interesting note: SQLite doesn't have "vectors" or "lists" as a native
datatype. However, we can use SQLite's builtin JSON functions like
[`json_each()`](https://www.sqlite.org/json1.html#jeach) and
[`->>`](https://www.sqlite.org/json1.html#jptr) to help when bulk-inserting
vectors. `sqlite-vec` will automatically recognize and parse vectors provided as
JSON, so we're good to go!

## Python

Here's the Python implementation of the "simple" demo, using
[Python's builtin `sqlite3` library](https://docs.python.org/3/library/sqlite3.html)
and the `sqlite-vec` PyPi package:

<details>
  <summary>Show Python code</summary>

```python
<!-- @include: ./demos/demo.py -->
```

</details>

And the output:

```
$ python demo.py
sqlite_version=3.45.1, vec_version=v0.0.1-alpha.9
[(3, 0.0), (4, 0.19999998807907104), (2, 0.20000001788139343)]
```

Having SQLite in the standard library for your programming language is great!
Nothing extra to install, just works out of the box. However, sometimes your
version of SQLite can "lag", especially if you haven't upgraded in a bit. And
since `sqlite-vec` relies on "new" SQLite features for performance/developer
experience upgrades, it can get a little annoying.

We can insert vectors as JSON strings or in a compact binary format. In general,
the compact binary format is faster to generate. We do have a build a helper
function, `serialize_f32()`, which is a bit cumbersome, but it's only a single
line.

## Ruby

Here's the Ruby implementation of the "simple" demo, using
[the `sqlite3` gem](https://github.com/sparklemotion/sqlite3-ruby) and the
`sqlite-vec` gem:

<details>
  <summary>Show Ruby code</summary>

```ruby
<!-- @include: ./demos/demo.rb -->
```

</details>

And the output:

```
sqlite_version=3.45.3, vec_version=v0.0.1-alpha.3
3
0.0
4
0.19999998807907104
2
0.20000001788139343
```

In Ruby we can use `.pack("f*")` to convert an array of floats into a vector
BLOB. That's nice! We can also use a heredoc for the SQL (`<<-SQL`) which gave
me SQL syntax highlighting in my editor, which is neat.

## Node.js

Here's the Node.js implementation of the "simple" demo, using
[`better-sqlite3`](https://github.com/WiseLibs/better-sqlite3) npm package and
the `sqlite-vec` npm package:

<details>
  <summary>Show Node.js code</summary>

<!-- deno-fmt-ignore-start -->
```js
<!-- @include: ./demos/demo.mjs -->
```
<!-- deno-fmt-ignore-end -->

</details>

And the output:

```
$ node demo.mjs
sqlite_version=3.45.3, vec_version=v0.0.1-alpha.8
[
  { rowid: 3, distance: 0 },
  { rowid: 4, distance: 0.19999998807907104 },
  { rowid: 2, distance: 0.20000001788139343 }
]
```

I'm a big fan of the `better-sqlite3` package! The API make a lot of sense and
is easy to work with. For coverting an array of numbers to a vector BLOB, all we
need to do is wrap it with
[`new Float32Array()`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Float32Array)
and `better-sqlite3` will bind is as a BLOB. Pretty neat!

## Bun

Here's the Bun implementation of the "simple" demo, using
[Buns's builtin `bun:sqlite` library](https://bun.sh/docs/api/sqlite) and the
`sqlite-vec` npm package:

<details>
  <summary>Show Bun code</summary>

<!-- deno-fmt-ignore-start -->
```js
<!-- @include: ./demos/demo.bun.ts -->
```
<!-- deno-fmt-ignore-end -->

</details>

And the output:

```
$ bun demo.ts
sqlite_version=3.45.1, vec_version=v0.0.1-alpha.9
[
  {
    rowid: 3,
    distance: 0,
  }, {
    rowid: 4,
    distance: 0.19999998807907104,
  }, {
    rowid: 2,
    distance: 0.20000001788139343,
  }
]
```

Very similar to the Node.js demo! The only real difference is that the builtin
`bun:sqlite` package is used instead of `better-sqlite3`, which already has a
similar API to `better-sqlite3`, so little code changes are needed. However,
`bun:sqlite` will by default use the system-level SQLite library, with on MacOS
doesn't allow extensions. So I needed to use `Database.setCustomSQLite()` to
point to the brew version of SQLite instead.

Although technically, Bun is compatible with Node.js, so theoretically we could
also run the Node.js version with Bun without fuss. Though when I try on my x86
Mac, it fails for me:

```
$ bun ../simple-node/demo.mjs
dyld[11775]: missing symbol called
Killed: 9
```

## Deno (almost!)

Here's the Deno implementation of the "simple" demo, using
[Deno's `jsr:@db/sqlite` library](https://github.com/denodrivers/sqlite3) and
the `sqlite-vec` npm package:

<details>
  <summary>Show Deno code</summary>

<!-- deno-fmt-ignore-start -->
```js
<!-- @include: ./demos/demo.deno.ts -->
```
<!-- deno-fmt-ignore-end -->

</details>

And the output:

```
$ deno run -A --unstable-ffi demo.ts
error: Error getting response at https://registry.npmjs.org/sqlite-vec for package "sqlite-vec": invalid type: null, expected a sequence at line 1 column 916
    at file:///Users/.../demo.ts:2:28
```

But if fails! This is because
[of an obscure bug](https://github.com/denoland/deno/issues/23776) that should
fix on the next version of Deno. Long story short, I published an old version of
the `sqlite-vec` NPM package with an error on the `package.json` file, which
broke Deno/npm compatability. Thankfully, the Deno team put out a fix quickly,
so hopefully we don't have to wait long for Deno `1.44`!

Nonetheless, I really like Deno's SQLite client library, specifically the
`jsr:@db/sqlite` package. Deno's FFI support is a little awkward, but it's
really fast and has an even nicer API than `better-sqlite3`, on my opinion.

## Client-side JavaScript

`sqlite-vec` can be compiled to WASM to be used in the browser, using the
[official SQLite WASM build](https://sqlite.org/wasm/doc/trunk/index.md). There
is a `sqlite-vec-wasm-demo` NPM package that contains a pre-comiled WASM build
of the SQLite library with `sqlite-vec` statically compiled in, that can be used
like so:

<details>
  <summary>Show WASM code</summary>

```html
<!-- @include: ./demos/index.html -->
```

</details>

If you open that in a web browser, you will see:

```
sqlite_version=3.45.3, vec_version=v0.0.1-alpha.9
[[3,0],[4,0.19999998807907104],[2,0.20000001788139343]]
```

The JavaScript bindings are from the SQLite team, which are a bit awkward, like
`new sqlite3.oo1.DB(":memory:")`. But just like the other JavaScript runtimes,
we can use `new Float32Array(vector).buffer` to bind vectors as BLOBs rather
easily!

# Go

Here's the Go implementation of the "simple" demo, using the
[`mattn/go-sqlite3` CGO SQLite module](https://github.com/mattn/go-sqlite3) and
the `cgo/sqlite-vec` Go module:

<details>
  <summary>Show Go code</summary>

```go
<!-- @include: ./demos/demo.go -->
```

</details>

And the output:

```
sqlite_version=3.45.1, vec_version=v0.0.1-alpha.3
rowid=3, distance=0.000000
rowid=4, distance=0.200000
rowid=2, distance=0.200000
```

I do love go, especially how easy it is to type SQL returned results. But we do
have to write our own `serializeFloat32` function to convert a slice of floats
into a vector BLOB, which is annoying. And if I have to write `if err != nil`
one more time...

## Rust

Here's the Rust implementation of the "simple" demo, using the
[rusqlite](https://github.com/rusqlite/rusqlite) crate and the `sqlite-vec`
crate:

<details>
  <summary>Show Rust code</summary>

```rust
<!-- @include: ./demos/demo.rs -->
```

</details>

And the output:

```
$ cargo run demo.rs
   Compiling sqlite-vec-demo v0.0.0 (/Users/.../simple-rust)
    Finished `dev` profile [unoptimized + debuginfo] target(s) in 1.85s
     Running `target/debug/demo demo.rs`
sqlite_version=3.45.0, vec_version=v0.0.1-alpha.7
[0.100000,0.200000,0.300000]
[(3, 0.0), (4, 0.19999998807907104), (2, 0.20000001788139343)]
```

If you're okay adding the
[`zerocopy` crate](https://docs.rs/zerocopy/latest/zerocopy/), then coverting a
`Vec<f32>` into a vector BLOB is as easy as a `.as_bytes()` call! The syntax can
get a little gnarly, especially around `.query_map().collect()`, but man once
you get it to work, it's extremely productive!

## C

Finally, here's the C implementation of the "simple" demo, using the raw SQLite
C API, and the `sqlite-vec` amalgamation!

<details>
  <summary>Show C code</summary>

```c
<!-- @include: ./demos/demo.c -->
```

</details>

And the output:

```
$ make demo
gcc \
		-DSQLITE_CORE \
		-I../../ -I../../vendor \
		demo.c ../../sqlite-vec.c ../../vendor/sqlite3.c \
		-o demo
$ ./demo
sqlite_version=3.45.3, vec_version=v0.0.1-alpha.9
rowid=3 distance=0.000000
rowid=4 distance=0.200000
rowid=2 distance=0.200000
```

C is not a fun language is write and can be super unsafe. But man, it feels
really nice to have a single `1.5MB` executable with everything you need...

## Final thoughts

### SQL is the standard API across all languages

No matter the language, every single demo above ran basically the same SQL:

```sqlite
select sqlite_version(), vec_version();

create virtual table vec_items using vec0(embedding float[4]);

insert into vec_items(rowid, embedding)
  values (?, ?);

select
  rowid,
  distance
from vec_items
where embedding MATCH ?
order by distance
limit 3;
```

The only real differences were superficial: how the SQLite client library works
for that language, how to convert a list of numbers to the BLOB format, and how
to handle transactions.

I think this is the real super-power of `sqlite-vec`. It's rare to have a vector
search library work in so many different languages and runtimes. But it's even
more rare, perhaps unique, to have an API that's more-or-less the same across
different programming languages. That means you can create and "train" an index
in Python, serve it to users in the browser in JavaScript, in an Express server
with Node.js, or in a CLI with Rust, all without much fuss.

### Creating these bindings was worth it

It took me a loooooong time to figure out a good "distribution" strategy for
SQLite extensions. When I first started creating SQLite extensions, I followed
the pattern established by [sqlean](https://github.com/nalgeon/sqlean), which
was to upload pre-compiled loadable extensions to Github Releases for popular
platforms (MacOS, Linux, Windows, etc.).

This is great, but downloading links yourself can be quite a chore. If you want
to use `sqlite-vec` in your Python package, you don't want to download and
extract a `tar.gz` file: you just want to `pip install` something and go along
your merry way.

So over the last few years, I've developed a few techniques to creating
"binding" packages for these SQLite extensions on popular package managers:
`pypi`, `npm`, `rubygems`, `crates.io`, and Golang modules. At this point, I've
spent more time on these distributions than on SQLite extensions themselves, but
it was worth it!

I haven't blogged about how the Rust/Go bindings work quite yet, but I hope to
soon! I also have a work-in-progress project called
[`sqlite-dist`](https://github.com/asg017/sqlite-dist) that automates a lot of
these bindings, which I also plan to blog about in the near future.

## Is it a good idea to have a SQLite client built into your language/runtime?

Of these examples, only Python and Bun have a builtin client library for SQLite.
For all other languages, it's a 3rd party package that you must install and
update yourself.

One one hand, this is great! No need to install another dependency, just write
and use.

On the other hand, it makes working with modern SQLite features a bit harder.

For Python, the version of SQLite that's "bundled-in" depends on _which_ Python
your using. If you're using the default MacOS Python, that uses the default
MacOS SQLite library, which is outdated and blocks SQLite extensions. If you're
using brew, then it _might_ use whatever SQLite version brew has installed. If
you're using Docker, I have no idea.

For Bun, there's even
[a section in their `bun:sqlite` docs](https://bun.sh/docs/api/sqlite#loadextension)
about this confusion. For MacOS users, the default SQLite library that Bun uses
is the outdated default MacOS SQLite build. So Bun added a
`Database.setCustomSQLite("/path/to/libsqlite.dylib")` method as a workaround.
Which does work, but is an extra step you have to perform at runtime. And if you
want to run your code on other operating systems, you'll need to add a few if
statements to avoid accidentally loading in a SQLite build that doesn't exist. A
small headache!

Now compare this to all the other libraries where SQLite is offered as a third
party package: Node.js, Deno, Ruby, Go, and Rust. To update to a latest version
of SQLite, you usually just need to update the package with whatever package
manager your language/runtime offers. Sometimes there's a delay when a new
SQLite version is released and package maintainers release a new version, which
is something to consider. But it's way less likely that you'll get "surprised"
by code that works on one machine and not the other, and you can handle updates
yourself.
