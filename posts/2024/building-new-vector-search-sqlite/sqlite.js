import { attach } from "@alex.garcia/sqlite-wasm-toolkit/plugin";
import { default as init } from "./sqlite3.mjs";
import { table } from "@observablehq/inputs";

const initialCode = `select
  rowid,
  distance,
  movies.title
from vec_movies
left join movies on movies.rowid = vec_movies.rowid
where overview_embeddings match
  (
    select overview_embeddings
    from vec_movies
    where rowid = :selected_movie
  )
  and k = 10
order by distance;
`;

export async function load() {
  const sqlite3 = await init();
  const target = document.body.querySelector("#target-code");
  const v = new sqlite3.oo1.DB(":memory:").selectValue("select vec_version()");

  const db = await fetch("./movies.bit.db")
    .then((r) => r.arrayBuffer())
    .then((buffer) => {
      const p = sqlite3.wasm.allocFromTypedArray(buffer);
      const db = new sqlite3.oo1.DB();
      const rc = sqlite3.capi.sqlite3_deserialize(
        db.pointer,
        "main",
        p,
        buffer.byteLength,
        buffer.byteLength,
        sqlite3.capi.SQLITE_DESERIALIZE_FREEONCLOSE
      );
      db.checkRc(rc);
      return db;
    });

  let selected_movie = 69;
  function prepareStatement(stmt) {
    if (stmt.getParamIndex(":selected_movie") !== undefined) {
      stmt.bind({ ":selected_movie": selected_movie });
    }
  }

  class MyClass extends EventTarget {
    doSomething() {
      this.dispatchEvent(new Event("something"));
    }
  }
  const m = new MyClass();
  attach({
    db,
    target,
    sqlite3,
    prepareStatement,
    initialCode,
    footerExtra: `, with sqlite-vec ${v}`,
    refresh: m,
  });
  attach({
    db,
    target: document.querySelector("#target1"),
    sqlite3,
    initialCode: `select
  movies.title,
  movies.release_date,
  substr(movies.overview, 0, 20) || '...' as overview_start,
  vec_movies.overview_embeddings
from movies
left join vec_movies on vec_movies.rowid = movies.rowid
limit 10;`,
    footerExtra: `, with sqlite-vec ${v}`,
  });

  const movies = db.selectObjects(
    "select rowid, title, release_date from movies limit 40"
  );
  const moviesTable = table(movies, {
    multiple: false,
    value: movies[0],
    columns: ["title", "release_date"],
  });
  moviesTable.addEventListener("input", (e) => {
    selected_movie = movies[e.target.value].rowid;
    console.log(selected_movie);
    m.dispatchEvent(new CustomEvent("refresh"));
  });
  document.querySelector("#target-table").appendChild(moviesTable);
  moviesTable.setAttribute("id", "movie-select-table");
}
