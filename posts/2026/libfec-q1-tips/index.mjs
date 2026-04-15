import * as d3 from "npm:d3-selection";
import "npm:d3-transition";
import { easeSinInOut } from "npm:d3-ease";

export function hero() {
  const hero = document.querySelector("#hero");
  const width = hero.parentElement.clientWidth;
  const height = (width * 9) / 16 / 2;
  hero.setAttribute("width", width);
  hero.setAttribute("height", height);

  d3.select(hero)
    .append("rect")
    .attr("width", width)
    .attr("height", height)
    .attr("fill", "var(--svg-bg)");

  const mx = 32;
  const my = 16;
  const numBars = 16;
  const innerWidth = width - 2 * mx;
  const innerHeight = height - 2 * my;
  const gap = 4;
  const barWidth = (innerWidth - gap * (numBars - 1)) / numBars;

  const barData = Array.from({ length: numBars }, (_, i) => ({
    id: i,
    x: mx + i * (barWidth + gap),
    height: 0.2 * innerHeight + Math.random() * 0.6 * innerHeight,
    speed: 3000 + Math.random() * 4000,
  }));

  const bars = d3
    .select(hero)
    .selectAll("rect.bar")
    .data(barData)
    .join("rect")
    .attr("class", "bar")
    .attr("x", (d) => d.x)
    .attr("width", barWidth)
    .attr("y", (d) => height - my - d.height)
    .attr("height", (d) => d.height)
    .attr("fill", "var(--ctp-green)")
    .attr("fill-opacity", 0.7)
    .attr("rx", 2);

  function animateBar(sel) {
    const newH = 0.15 * innerHeight + Math.random() * 0.7 * innerHeight;
    sel
      .transition()
      .duration(sel.datum().speed)
      .ease(easeSinInOut)
      .attr("y", height - my - newH)
      .attr("height", newH)
      .on("end", function () {
        animateBar(d3.select(this));
      });
  }

  bars.each(function () {
    animateBar(d3.select(this));
  });
}

hero();
