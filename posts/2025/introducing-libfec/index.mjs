import * as d3 from "npm:d3-selection";
import "npm:d3-transition";

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

  const circleData = Array.from({ length: 32 }, (_, i) => ({
    id: i,
    x: Math.random() * (width - 40) + 20,
    y: Math.random() * (height - 40) + 20,
    color: 'var(--ctp-green)'
  }));

  const linkData = [];
  const numLinks = Math.floor(circleData.length * 0.8);
  
  for (let i = 0; i < numLinks; i++) {
    const source = circleData[Math.floor(Math.random() * circleData.length)];
    const target = circleData[Math.floor(Math.random() * circleData.length)];
    
    // Avoid self-links and duplicate links
    if (source.id !== target.id) {
      const existingLink = linkData.find(link => 
        (link.source.id === source.id && link.target.id === target.id) ||
        (link.source.id === target.id && link.target.id === source.id)
      );
      
      if (!existingLink) {
        linkData.push({ source, target });
      }
    }
  }

  d3
    .select(hero)
    .selectAll("line.link")
    .data(linkData)
    .join("line")
    .attr("class", "link")
    .attr("x1", d => d.source.x)
    .attr("y1", d => d.source.y)
    .attr("x2", d => d.target.x)
    .attr("y2", d => d.target.y)
    .attr("stroke", 'var(--ctp-green)')
    .attr("stroke-width", 4)
    .attr("stroke-opacity", 0.3);

  const circles = d3
    .select(hero)
    .selectAll("circle.animated")
    .data(circleData)
    .join("circle")
    .attr("class", "animated")
    .attr("cx", d => d.x)
    .attr("cy", d => d.y)
    .attr("r", 8)
    .attr("fill", d => d.color)
    .attr("fill-opacity", 0.7);

  function animate() {
    circles
      .transition()
      .duration(3000 + Math.random() * 2000)
      .attr("r", () => 6 + Math.random() * 12)
      .on("end", animate);
  }

  animate();
}

hero();
