// ---------------------------------------------------------------------------
// Narrative visualization: "Legendary by the Numbers"
// Structure: martini glass — scenes 0 and 1 are fixed/guided, scene 2 opens
// up free exploration via hover tooltips.
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
  data: []    // parsed Pokémon rows
};

// -------------------- scene definitions --------------------
const scenes = [
  {
    title: "Not All Types Are Created Equal",
    caption: "Averaging every Pokémon's total base stats by primary type reveals a clear pecking order.",
    render: renderTypeOverview,
    explore: false
  },
  {
    title: "The Real Divide Is Legendary Status",
    caption: "Split Pokémon into Legendary vs. everyone else, and the type differences from the last scene shrink next to this gap.",
    render: renderLegendaryGap,
    explore: false
  },
  {
    title: "Explore the Individuals",
    caption: "Every Pokémon plotted by Attack and Defense. Legendaries (orange) crowd the top right.",
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

// -------------------- scene 0: average total stats by type --------------------
function renderTypeOverview(data) {
  const rolled = d3.rollups(data, v => d3.mean(v, d => d.total), d => d.type1)
    .map(([type, avg]) => ({ type, avg }))
    .sort((a, b) => d3.descending(a.avg, b.avg));

  const x = d3.scaleLinear().domain([0, d3.max(rolled, d => d.avg)]).nice().range([0, width]);
  const y = d3.scaleBand().domain(rolled.map(d => d.type)).range([0, height]).padding(0.25);

  const g = chartGroup();

  g.append("g").attr("class", "grid")
    .call(d3.axisBottom(x).tickSize(height).tickFormat(""));

  g.append("g").attr("class", "y-axis")
    .call(d3.axisLeft(y).tickSize(0))
    .call(sel => sel.select(".domain").remove());

  g.append("g").attr("class", "x-axis")
    .attr("transform", `translate(0,${height})`)
    .call(d3.axisBottom(x).ticks(5));

  const top = rolled[0];

  g.selectAll(".bar").data(rolled).join("rect")
    .attr("class", "bar")
    .attr("y", d => y(d.type))
    .attr("x", 0)
    .attr("height", y.bandwidth())
    .attr("width", d => x(d.avg))
    .attr("fill", d => d.type === top.type ? COLORS.orange : COLORS.blue);

  addAnnotations(g, [{
    note: {
      title: `${top.type} leads`,
      label: `${top.avg.toFixed(0)} avg. total stats — highest of any type.`
    },
    x: x(top.avg), y: y(top.type) + y.bandwidth() / 2,
    dx: -130, dy: -30,
    subject: { radius: 10 }
  }]);
}

// -------------------- scene 1: legendary vs non-legendary --------------------
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
    .attr("fill-opacity", d => d.legendary ? 0.9 : 0.4)
    .attr("stroke", "#fcfcfb")
    .attr("stroke-width", 0.6)
    .on("mouseenter", (event, d) => showTooltip(event,
      `<strong>${d.name}</strong><br>${d.type1}${d.legendary ? " · Legendary" : ""}<br>Attack ${d.attack} · Defense ${d.defense}`))
    .on("mousemove", moveTooltip)
    .on("mouseleave", hideTooltip);

  // legend
  const legendData = [
    { label: "Legendary", color: COLORS.orange },
    { label: "Everyone else", color: COLORS.blue }
  ];
  const legend = g.append("g").attr("transform", `translate(${width - 128}, 4)`);
  const rows = legend.selectAll("g").data(legendData).join("g")
    .attr("transform", (d, i) => `translate(0, ${i * 18})`);
  rows.append("circle").attr("r", 5).attr("fill", d => d.color);
  rows.append("text").attr("class", "legend-label").attr("x", 12).attr("y", 4).text(d => d.label);

  const standout = data.filter(d => d.legendary)
    .sort((a, b) => d3.descending(a.attack + a.defense, b.attack + b.defense))[0];

  addAnnotations(g, [{
    note: {
      title: standout.name,
      label: `${standout.attack} Attack / ${standout.defense} Defense — one of the most dominant stat lines here.`
    },
    x: x(standout.attack), y: y(standout.defense),
    dx: -90, dy: -40,
    subject: { radius: 9 }
  }]);
}
