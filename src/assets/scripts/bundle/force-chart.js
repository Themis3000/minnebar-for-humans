import * as d3 from 'd3';
import * as stats from '../../../_data/stats.json';
import sessions from '../../../_data/sessions.json';

const connectionsMax = 3;

stats["connections"].sort((a, b) => b["count"] - a["count"]);
const links = [];
for (const session of sessions) {
  let foundConnections = 0;
  for (const connection of stats["connections"]) {
    if (foundConnections >= connectionsMax)
      break;
    if (!(connection["source"] === session["url"] || connection["target"] === session["url"]))
      continue;
    foundConnections += 1;
    if (links.includes(connection))
      continue;
    links.push(connection);
  }
}

window.addEventListener("load", (e) => {
  const svg = d3.select("#forces");
  const width = 900;
  const height = 900;

  const simulation = d3
    .forceSimulation(sessions)
    .force("link", d3
      .forceLink()
      .id((d) => d["url"])
      .links(links)
      .strength((d) => {
        return d["count"] / 10;
      })
    )
    .force("center", d3.forceCenter(width / 2, height / 2).strength(1))
    .force("manybody", d3.forceManyBody().strength(-200))
    .force("collide", d3
      .forceCollide()
      .radius((d) => getSize(d) + 3)
    )
    .on("tick", ticked);

  const link = svg
  .append("g")
  .attr("class", "links")
  .selectAll("line")
  .data(links)
  .enter()
  .append("line")
  .attr("stroke-width", (d) => {
    return d["count"]*0.1;
  })
  .style("stroke", "pink");

  const nodeG = svg
    .append("g")
    .attr("class", "nodes")
    .selectAll("circle")
    .data(sessions)
    .enter()
    .append("g")
    .on("mouseover", (e) => handleHover(e))
    .call(
      d3
        .drag()
        .on("start", (d) => {
          if (!d.active)
            simulation.alphaTarget(0.3).restart();
            d.subject.fx = d.subject.x;
            d.subject.fy = d.subject.y;
        })
        .on("drag", (d) => {
          d.subject.fx = d.x;
          d.subject.fy = d.y;
        })
        .on("end", (d) => {
          if (!d.active) simulation.alphaTarget(0);
          d.subject.fx = null;
          d.subject.fy = null;
        })
    );

  const node = nodeG
    .append("circle")
    .attr("stroke-width", "2")
    .attr("data-url", (d) => d['url'])
    .attr("r", (d) => getSize(d))
    .attr("fill", (d) => {
      const list = d["list"];
      if (list === "ai")
        return "red";
      if (list === "none")
        return "green";
      return "yellow";
    });

  const labels = nodeG
    .append("text")
    .attr("fill", "#fff")
    .attr("font-size", "15")
    .attr("font-family", "arial")
    .attr("display", "none")
    .attr("pointer-events", "none")
    .attr("font-weight", "bold")
    .text((d) => d["title"]);

  function ticked() {
    link
      .attr("x1", (d) => {
        return inRange(d.source.x, width);
      })
      .attr("y1", (d) => {
        return inRange(d.source.y, height);
      })
      .attr("x2", (d) => {
        return inRange(d.target.x, width);
      })
      .attr("y2", (d) => {
        return inRange(d.target.y, height);
      });

    nodeG
      .attr("transform", (d) => {
        const size = getSize(d);
        const x = inRange(d.x, width - size, size);
        const y = inRange(d.y, height - size, size);
        return `translate(${x}, ${y})`;
      });

    const rightAlignX = width / 3;
    const leftAlignX = (width / 3) * 2;
    labels
      .attr("text-anchor", (d) => {
        if (rightAlignX > d.x)
          return "start";
        if (leftAlignX > d.x)
          return "middle";
        return "end";
      });
  }

  function handleHover(e) {
    const url = e.target.getAttribute("data-url");
    const sessionData = sessions.find((session) => session["url"] === url);
    d3.selectAll(".nodes > g > text")
      .attr("display", "none");

    const g = e.target.parentNode;
    d3.select(g)
      .raise();

    const text = g.getElementsByTagName("text")[0]
    d3.select(text)
      .attr("display", "show");

    const directNeighbours = [];
    for (const link of links) {
      if (link["source"]["url"] === url)
        directNeighbours.push(link["target"]["url"]);
      else if (link["target"]["url"] === url)
        directNeighbours.push(link["source"]["url"]);
    }

    node
      .attr("stroke", (d) => {
        if (directNeighbours.includes(d["url"]))
          return "gold";
        return "";
      });

    sessionTitle.innerText = sessionData["title"];
  }
});

function areaToRadius(area) {
  return Math.sqrt(area/Math.PI);
}

function inRange(num, max, min = 0) {
  if (min > num)
    return min
  if (num > max)
    return max
  return num
}

// Gets the size intended for a node to be
function getSize(d) {
  return areaToRadius(d["participants"].length*25);
}
