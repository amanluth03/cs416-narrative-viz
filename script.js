// ---------------------------------------------------------------------------
// Narrative visualization: "Legendary by the Numbers"
// Message: Legendary Pokémon dominate on average, but the category isn't a
// guarantee. Ordinary Pokémon overlap into legendary territory.
// Structure: martini glass. Scene 0 sets up the assumption, scene 1 reveals
// the overlap, both fixed/guided. Scene 2 opens up free exploration (hover +
// legend filter) so the reader can find the exceptions themselves.
// ---------------------------------------------------------------------------

const COLORS = {
  blue: "#2a78d6",   // baseline / "everyone else"
  orange: "#eb6834", // the story's highlight in each scene
  ink: "#0b0b0b",
  inkSecondary: "#52514e"
};

const svg = d3.select("#chart");
const tooltip = d3.select("#tooltip");

const margin = { top: 110, right: 40, bottom: 40, left: 110 };
const outerWidth = 760;
const outerHeight = 480;
const width = outerWidth - margin.left - margin.right;
const height = outerHeight - margin.top - margin.bottom;

// -------------------- parameters (state) --------------------
const state = {
  scene: 0,   // which scene is currently displayed
  data: [],   // parsed Pokémon rows
  legendFilter: { true: true, false: true } // scene 2: which legend groups are shown
};

// -------------------- scene definitions --------------------
const scenes = [
  {
    title: "The Reputation",
    caption: "Legendary Pokémon average far higher total stats than everyone else. That's the reputation, and it checks out.",
    render: renderLegendaryGap,
    explore: false
  },
  {
    title: "The Overlap",
    caption: "But plot every Pokémon's total stats and the two groups aren't so separate. Ordinary Pokémon reach into legendary territory.",
    render: renderOverlapStrip,
    explore: false
  },
  {
    title: "The Exceptions",
    caption: "Every Pokémon plotted by Attack and Defense. Some ordinary Pokémon (blue) hang with the legendaries (orange).",
    render: renderScatter,
    explore: true
  }
];

// -------------------- data load --------------------
d3.csv("data/pokemon.csv", d => ({
  name: d.Name.replace(/^[A-Za-z]+(Mega .+|Primal .+)$/, "$1"),
  type1: d["Type 1"],
  total: +d.Total,
  attack: +d.Attack,
  defense: +d.Defense,
  legendary: String(d.Legendary).trim().toLowerCase() === "true"
})).then(data => {
  state.data = data;
  goToScene(0);
});

// -------------------- navigation (triggers) --------------------
d3.select("#prev-btn").on("click", () => goToScene(state.scene - 1));
d3.select("#next-btn").on("click", () => goToScene(state.scene + 1));

document.addEventListener("keydown", event => {
  if (event.key === "ArrowRight") goToScene(state.scene + 1);
  if (event.key === "ArrowLeft") goToScene(state.scene - 1);
});

function goToScene(index) {
  const clamped = Math.max(0, Math.min(scenes.length - 1, index));
  state.scene = clamped;
  const scene = scenes[clamped];

  svg.selectAll("*").remove();
  hideTooltip();
  scene.render(state.data);

  d3.select("#scene-count").text(`Scene ${clamped + 1} of ${scenes.length}`);
  d3.select("#scene-title").text(scene.title);
  d3.select("#scene-caption").text(scene.caption);
  d3.select("#explore-hint").attr("hidden", scene.explore ? null : true);

  d3.select("#prev-btn").property("disabled", clamped === 0);
  d3.select("#next-btn")
    .property("disabled", clamped === scenes.length - 1)
    .text(clamped === scenes.length - 1 ? "End" : "Next →");

  updateDots();
}

function updateDots() {
  d3.select("#scene-dots")
    .selectAll("button.dot")
    .data(d3.range(scenes.length))
    .join("button")
    .attr("type", "button")
    .attr("class", i => "dot" + (i === state.scene ? " active" : ""))
    .attr("aria-label", i => `Go to scene ${i + 1}`)
    .on("click", (event, i) => goToScene(i));
}

// -------------------- shared helpers --------------------
function chartGroup() {
  return svg.append("g").attr("transform", `translate(${margin.left},${margin.top})`);
}

function addAnnotations(g, annotations) {
  const makeAnnotations = d3.annotation()
    .type(d3.annotationCalloutCircle)
    .annotations(annotations);
  g.append("g").attr("class", "annotation-group").call(makeAnnotations);
}

function showTooltip(event, html) {
  tooltip.attr("hidden", null).html(html);
  moveTooltip(event);
}
function moveTooltip(event) {
  tooltip.style("left", event.clientX + 16 + "px").style("top", event.clientY + 16 + "px");
}
function hideTooltip() {
  tooltip.attr("hidden", true);
}

// -------------------- scene 0: legendary vs non-legendary --------------------
function renderLegendaryGap(data) {
  const labels = { true: "Legendary", false: "Everyone Else" };
  const rolled = d3.rollups(data, v => d3.mean(v, d => d.total), d => d.legendary)
    .map(([legendary, avg]) => ({ legendary, avg }))
    .sort((a, b) => d3.ascending(a.legendary, b.legendary));

  const x = d3.scaleLinear().domain([0, d3.max(rolled, d => d.avg)]).nice().range([0, width]);
  const y = d3.scaleBand().domain(rolled.map(d => d.legendary)).range([0, height]).padding(0.45);

  const g = chartGroup();

  g.append("g").attr("class", "grid")
    .call(d3.axisBottom(x).tickSize(height).tickFormat(""));

  g.append("g").attr("class", "y-axis")
    .call(d3.axisLeft(y).tickFormat(d => labels[d]).tickSize(0))
    .call(sel => sel.select(".domain").remove());

  g.append("g").attr("class", "x-axis")
    .attr("transform", `translate(0,${height})`)
    .call(d3.axisBottom(x).ticks(5));

  g.selectAll(".bar").data(rolled).join("rect")
    .attr("class", "bar")
    .attr("y", d => y(d.legendary))
    .attr("x", 0)
    .attr("height", y.bandwidth())
    .attr("width", d => x(d.avg))
    .attr("fill", d => d.legendary ? COLORS.orange : COLORS.blue);

  const legendaryRow = rolled.find(d => d.legendary);
  const normalRow = rolled.find(d => !d.legendary);
  const diff = legendaryRow.avg - normalRow.avg;

  addAnnotations(g, [{
    note: {
      title: "A different league",
      label: `+${diff.toFixed(0)} points on average.`
    },
    x: x(legendaryRow.avg), y: y(legendaryRow.legendary) + y.bandwidth() / 2,
    dx: -100, dy: -170,
    subject: { radius: 10 }
  }]);
}

// -------------------- scene 1: beeswarm of every Pokémon's total stats --------------------
function renderOverlapStrip(data) {
  const x = d3.scaleLinear().domain([0, d3.max(data, d => d.total)]).nice().range([0, width]);
  const legendaryRowY = height * 0.28;
  const everyoneRowY = height * 0.74;

  const g = chartGroup();

  g.append("g").attr("class", "x-axis")
    .attr("transform", `translate(0,${height})`)
    .call(d3.axisBottom(x).ticks(6));

  g.append("text").attr("class", "axis-label")
    .attr("x", 0).attr("y", legendaryRowY - 16).text("Legendary");
  g.append("text").attr("class", "axis-label")
    .attr("x", 0).attr("y", everyoneRowY - 16).text("Everyone else");

  // beeswarm: x is pinned to the real value, y is only nudged to avoid overlap
  const nodes = data.map(d => Object.assign({}, d, { fx: x(d.total) }));
  const simulation = d3.forceSimulation(nodes)
    .force("y", d3.forceY(d => d.legendary ? legendaryRowY : everyoneRowY).strength(0.15))
    .force("collide", d3.forceCollide(3.4))
    .stop();
  for (let i = 0; i < 200; i++) simulation.tick();

  g.selectAll(".dot-point").data(nodes).join("circle")
    .attr("class", "dot-point")
    .attr("cx", d => d.fx)
    .attr("cy", d => d.y)
    .attr("r", 3.4)
    .attr("fill", d => d.legendary ? COLORS.orange : COLORS.blue)
    .attr("fill-opacity", d => d.legendary ? 0.9 : 0.45);

  const weakestLegendary = d3.min(data.filter(d => d.legendary), d => d.total);
  const overlapCount = data.filter(d => !d.legendary && d.total >= weakestLegendary).length;

  g.append("line").attr("class", "threshold-line")
    .attr("x1", x(weakestLegendary)).attr("x2", x(weakestLegendary))
    .attr("y1", 0).attr("y2", height);

  addAnnotations(g, [{
    note: {
      title: "The categories overlap",
      label: `${overlapCount} ordinary Pokémon match or beat the weakest legendaries (${weakestLegendary} total stats).`
    },
    x: x(weakestLegendary), y: 0,
    dx: -170, dy: 30,
    subject: { radius: 8 }
  }]);
}

// -------------------- scene 2: scatter, free exploration --------------------
function renderScatter(data) {
  const x = d3.scaleLinear().domain([0, d3.max(data, d => d.attack)]).nice().range([0, width]);
  const y = d3.scaleLinear().domain([0, d3.max(data, d => d.defense)]).nice().range([height, 0]);

  const g = chartGroup();

  g.append("g").attr("class", "grid")
    .call(d3.axisLeft(y).tickSize(-width).tickFormat(""));

  g.append("g").attr("class", "x-axis")
    .attr("transform", `translate(0,${height})`)
    .call(d3.axisBottom(x).ticks(6));

  g.append("g").attr("class", "y-axis")
    .call(d3.axisLeft(y).ticks(6));

  g.append("text").attr("class", "axis-label")
    .attr("x", width).attr("y", height - 8).attr("text-anchor", "end")
    .text("Attack →");

  g.append("text").attr("class", "axis-label")
    .attr("x", 4).attr("y", 12).attr("text-anchor", "start")
    .text("↑ Defense");

  // draw legendaries last so they sit on top
  const sorted = [...data].sort((a, b) => (a.legendary === b.legendary) ? 0 : (a.legendary ? 1 : -1));

  g.selectAll(".dot-point").data(sorted).join("circle")
    .attr("class", "dot-point")
    .attr("cx", d => x(d.attack))
    .attr("cy", d => y(d.defense))
    .attr("r", 4.5)
    .attr("fill", d => d.legendary ? COLORS.orange : COLORS.blue)
    .attr("stroke", "#fcfcfb")
    .attr("stroke-width", 0.6)
    .on("mouseenter", (event, d) => showTooltip(event,
      `<strong>${d.name}</strong><br>${d.type1}${d.legendary ? " · Legendary" : ""}<br>Attack ${d.attack} · Defense ${d.defense}`))
    .on("mousemove", moveTooltip)
    .on("mouseleave", hideTooltip);

  // legend that doubles as a filter: click a group to isolate it
  const legendData = [
    { key: true, label: "Legendary", color: COLORS.orange },
    { key: false, label: "Everyone else", color: COLORS.blue }
  ];
  const legend = g.append("g").attr("transform", "translate(10, 32)");
  const rows = legend.selectAll(".legend-row").data(legendData).join("g")
    .attr("class", "legend-row")
    .attr("transform", (d, i) => `translate(0, ${i * 18})`)
    .on("click", (event, d) => {
      state.legendFilter[d.key] = !state.legendFilter[d.key];
      applyLegendFilter(g, data);
    });
  rows.append("circle").attr("r", 5).attr("fill", d => d.color);
  rows.append("text").attr("class", "legend-label").attr("x", 12).attr("y", 4).text(d => d.label);

  g.append("text").attr("class", "axis-label").attr("id", "filter-count")
    .attr("x", 10).attr("y", 74).attr("text-anchor", "start");

  // spotlight an ordinary Pokémon that reaches into legendary territory
  const weakestLegendaryTotal = d3.min(data.filter(d => d.legendary), d => d.total);
  const standout = data.filter(d => !d.legendary && !d.name.includes("Mega") && d.total >= weakestLegendaryTotal)
    .sort((a, b) => d3.descending(a.total, b.total))[0];

  addAnnotations(g, [{
    note: {
      title: standout.name,
      label: `${standout.total} total stats with no legendary status, right in the legendary range.`
    },
    x: x(standout.attack), y: y(standout.defense),
    dx: -40, dy: -215,
    subject: { radius: 9 }
  }]);

  state.legendFilter = { true: true, false: true };
  applyLegendFilter(g, data);
}

function applyLegendFilter(g, data) {
  g.selectAll(".dot-point")
    .style("display", d => state.legendFilter[d.legendary] ? null : "none")
    .attr("fill-opacity", d => d.legendary ? 0.9 : 0.4);

  g.selectAll(".legend-row").style("opacity", d => state.legendFilter[d.key] ? 1 : 0.35);

  g.select(".annotation-group").style("display", state.legendFilter[false] ? null : "none");

  const visible = data.filter(d => state.legendFilter[d.legendary]).length;
  g.select("#filter-count").text(`Showing ${visible} of ${data.length}`);
}
