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

  const arrows = d3
    .select(hero)
    .selectAll("g")
    .data(Array.from({ length: 24 }, (_, i) => i))
    .join((enter) =>
      enter.append("g").call((g) =>
        g
          .append("line")
          .attr("x1", (d, i) => 10 + (i * width) / 6)
          .attr("x2", (d, i) => 10 + (i * width) / 6)
          .attr("y1", 0)
          .attr("y2", height)
          .attr("stroke", (d, i) => colors[i % colors.length])
          .attr("stroke-width", 4)
          .attr("stroke-opacity", 0.4)
      )
    );

  const minWidth = 100;
  while (true) {
    const positions = arrows.data().map((d) => {
      const min = Math.random() * (width - minWidth);
      const max = Math.random() * (width - (min + minWidth)) + (min + minWidth);
      return [min, max];
    });

    await arrows
      .transition()
      .delay(() => Math.random() * 750)
      .duration(() => 2000 + Math.random() * 3000)
      .call((g) =>
        g
          .selectAll("line")
          .attr("x1", (d, i) => -positions[d][0])
          .attr("x2", (d, i) => positions[d][1])
      )
      .end();
  }
}

hero();
