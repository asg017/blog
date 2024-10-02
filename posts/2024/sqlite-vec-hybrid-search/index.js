import "./styles.css";
import * as d3 from "d3-selection";
import "d3-transition";

const colors = Array.from({ length: 12 }, (_, i) => `var(--hero-c${i + 1})`);

export async function hero() {
  const hero = document.querySelector("#hero");
  const width = hero.parentElement.clientWidth;
  const height = (width * 9) / 16 / 2;
  hero.setAttribute("width", width);
  hero.setAttribute("height", height);

  d3.select(hero)
    .append("rect")
    .attr("width", width)
    .attr("height", height)
    .attr("rx", 8)
    .attr("ry", 8)
    .attr("fill", "var(--svg-bg)");

  const rects = d3
    .select(hero)
    .selectAll("g")
    .data(Array.from({ length: 64 }, (_, i) => i))
    .join((enter) =>
      enter.append("g").call((g) =>
        g
          .attr(
            "transform",
            (d, i) =>
              `translate(${20 + Math.floor(i / 4) * 40}, ${20 + (i % 4) * 40})`
          )
          .append("rect")
          .attr("width", 20)
          .attr("height", 20)
          .attr("fill", (d, i) => colors[i % colors.length])
          .attr("fill-opacity", 0.8)
      )
    );

  while (true) {
    await rects
      .transition()
      .delay((d, i) => (i / 12) * 750)
      .duration(() => 2500 + Math.random() * 1000)
      .select("rect")
      .attrTween("transform", () => (t) => `rotate(${t * 360}, 10, 10)`)
      //.call((g) => )
      .end();
  }
}

hero();
