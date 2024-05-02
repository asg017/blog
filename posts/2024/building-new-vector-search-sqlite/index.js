import "./node_modules/@alex.garcia/sqlite-wasm-toolkit/dist/plugin.css";
import "./styles.css";

import { hero } from "./hero.js";

function main() {
  hero();
  import("./sqlite.js").then(({ load }) => load());
}

addEventListener("DOMContentLoaded", main);
