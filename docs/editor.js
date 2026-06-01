const state = {
  svg: null,
  selectedLabel: null,
  drag: null,
};

const els = {
  slot: document.querySelector("#svgSlot"),
  status: document.querySelector("#status"),
  sourceSvg: document.querySelector("#sourceSvg"),
  uploadSvg: document.querySelector("#uploadSvg"),
  reloadSvg: document.querySelector("#reloadSvg"),
  exportSvg: document.querySelector("#exportSvg"),
  zoom: document.querySelector("#zoom"),
  labelSelect: document.querySelector("#labelSelect"),
  labelX: document.querySelector("#labelX"),
  labelY: document.querySelector("#labelY"),
  labelAnchor: document.querySelector("#labelAnchor"),
  fontFamily: document.querySelector("#fontFamily"),
  labelSize: document.querySelector("#labelSize"),
  labelStrokeWidth: document.querySelector("#labelStrokeWidth"),
  labelFill: document.querySelector("#labelFill"),
  labelStroke: document.querySelector("#labelStroke"),
  routeColor: document.querySelector("#routeColor"),
  routeWidth: document.querySelector("#routeWidth"),
  haloWidth: document.querySelector("#haloWidth"),
  routeOpacity: document.querySelector("#routeOpacity"),
  linePattern: document.querySelector("#linePattern"),
  layerToggles: document.querySelector("#layerToggles"),
  backgroundColor: document.querySelector("#backgroundColor"),
  landColor: document.querySelector("#landColor"),
  forestColor: document.querySelector("#forestColor"),
  farmlandColor: document.querySelector("#farmlandColor"),
  waterColor: document.querySelector("#waterColor"),
  roadColor: document.querySelector("#roadColor"),
};

const layerNames = [
  ["layer-grid", "Grid"],
  ["layer-land", "Land"],
  ["layer-farmland", "Velden"],
  ["layer-forest", "Bos"],
  ["layer-water", "Water"],
  ["layer-roads", "Wegen"],
  ["layer-route", "Route"],
  ["layer-leaders", "Label lijnen"],
  ["layer-markers", "Markers"],
  ["layer-labels", "Labels"],
  ["layer-title", "Titel"],
];

function setStatus(message) {
  els.status.textContent = message;
}

async function loadSvg() {
  setStatus("SVG laden...");
  const response = await fetch(els.sourceSvg.value, { cache: "no-store" });
  if (!response.ok) {
    throw new Error(`Kan ${els.sourceSvg.value} niet laden. Upload een SVG-bestand om te starten.`);
  }
  injectSvg(await response.text(), els.sourceSvg.value);
}

function injectSvg(svgText, sourceName) {
  els.slot.innerHTML = svgText;
  state.svg = els.slot.querySelector("svg");
  state.selectedLabel = null;
  if (!state.svg) {
    throw new Error("Geen SVG gevonden in het bestand");
  }
  initialiseSvg();
  setStatus(`${sourceName} geladen`);
}

function initialiseSvg() {
  state.svg.querySelectorAll(".route-label").forEach((label) => {
    label.addEventListener("pointerdown", startDragLabel);
    label.addEventListener("click", () => selectLabel(label));
  });
  buildLabelList();
  buildLayerToggles();
  readRouteControls();
  readColorControls();
  const first = state.svg.querySelector(".route-label");
  if (first) selectLabel(first);
}

function buildLabelList() {
  els.labelSelect.innerHTML = "";
  state.svg.querySelectorAll(".route-label").forEach((label) => {
    const option = document.createElement("option");
    option.value = label.dataset.label;
    option.textContent = label.textContent.trim();
    els.labelSelect.append(option);
  });
}

function buildLayerToggles() {
  els.layerToggles.innerHTML = "";
  layerNames.forEach(([id, name]) => {
    if (!state.svg.querySelector(`#${id}`)) return;
    const row = document.createElement("label");
    row.className = "layer-toggle";
    row.innerHTML = `<span>${name}</span><input type="checkbox" checked data-layer="${id}">`;
    row.querySelector("input").addEventListener("change", (event) => {
      const layer = state.svg.querySelector(`#${event.target.dataset.layer}`);
      layer.style.display = event.target.checked ? "" : "none";
    });
    els.layerToggles.append(row);
  });
}

function selectLabel(label) {
  state.svg.querySelectorAll(".route-label").forEach((item) => item.classList.remove("is-selected"));
  state.selectedLabel = label;
  label.classList.add("is-selected");
  els.labelSelect.value = label.dataset.label;
  syncLabelControls(label);
}

function syncLabelControls(label) {
  els.labelX.value = Math.round(readNumber(label, "x"));
  els.labelY.value = Math.round(readNumber(label, "y"));
  els.labelAnchor.value = label.getAttribute("text-anchor") || "start";
  els.fontFamily.value = label.getAttribute("font-family") || els.fontFamily.value;
  els.labelSize.value = parseFloat(label.getAttribute("font-size") || "17").toFixed(1);
  els.labelStrokeWidth.value = parseFloat(label.getAttribute("stroke-width") || "0").toFixed(1);
  els.labelFill.value = toColorInput(label.getAttribute("fill") || "#2f2a24");
  els.labelStroke.value = toColorInput(label.getAttribute("stroke") || "#f7f3ea");
}

function readRouteControls() {
  const route = state.svg.querySelector("#route-line");
  const halo = state.svg.querySelector("#route-halo");
  if (!route || !halo) return;
  els.routeColor.value = toColorInput(route.getAttribute("stroke") || "#c2410c");
  els.routeWidth.value = parseFloat(route.getAttribute("stroke-width") || "6").toFixed(1);
  els.haloWidth.value = parseFloat(halo.getAttribute("stroke-width") || "13").toFixed(1);
  els.routeOpacity.value = route.getAttribute("opacity") || "1";
}

function readColorControls() {
  els.backgroundColor.value = toColorInput(state.svg.querySelector("#map-background")?.getAttribute("fill") || "#f7f3ea");
  els.landColor.value = toColorInput(state.svg.querySelector(".land-shape")?.getAttribute("fill") || "#e5dfd2");
  els.forestColor.value = toColorInput(state.svg.querySelector(".forest-shape")?.getAttribute("fill") || "#9fbe86");
  els.farmlandColor.value = toColorInput(state.svg.querySelector(".farmland-shape")?.getAttribute("fill") || "#dfe7c7");
  els.waterColor.value = toColorInput(state.svg.querySelector(".water-shape")?.getAttribute("fill") || "#a8cfe0");
  els.roadColor.value = toColorInput(state.svg.querySelector(".major-road-line")?.getAttribute("stroke") || "#b9aea0");
}

function startDragLabel(event) {
  event.preventDefault();
  const label = event.currentTarget;
  selectLabel(label);
  const point = pointerToSvg(event);
  state.drag = {
    label,
    offsetX: point.x - readNumber(label, "x"),
    offsetY: point.y - readNumber(label, "y"),
  };
  label.setPointerCapture(event.pointerId);
}

function pointerToSvg(event) {
  const point = state.svg.createSVGPoint();
  point.x = event.clientX;
  point.y = event.clientY;
  return point.matrixTransform(state.svg.getScreenCTM().inverse());
}

function moveSelectedLabel(x, y) {
  const label = state.selectedLabel;
  if (!label) return;
  label.setAttribute("x", x.toFixed(2));
  label.setAttribute("y", y.toFixed(2));
  updateLeader(label);
  syncLabelControls(label);
}

function updateLeader(label) {
  const leader = state.svg.querySelector(`.leader-line[data-label="${label.dataset.label}"]`);
  if (!leader) return;
  const pointX = parseFloat(label.dataset.pointX);
  const pointY = parseFloat(label.dataset.pointY);
  const box = label.getBBox();
  const anchor = label.getAttribute("text-anchor") || "start";
  const gap = 8;
  const endX = anchor === "end" ? box.x + box.width + gap : box.x - gap;
  const endY = box.y + box.height / 2;
  leader.setAttribute("d", `M${pointX.toFixed(2)},${pointY.toFixed(2)} L${endX.toFixed(2)},${endY.toFixed(2)}`);
}

function applySelectedLabelControls() {
  const label = state.selectedLabel;
  if (!label) return;
  label.setAttribute("x", Number(els.labelX.value).toFixed(2));
  label.setAttribute("y", Number(els.labelY.value).toFixed(2));
  label.setAttribute("text-anchor", els.labelAnchor.value);
  label.setAttribute("font-family", els.fontFamily.value);
  label.setAttribute("font-size", els.labelSize.value);
  label.setAttribute("stroke-width", els.labelStrokeWidth.value);
  label.setAttribute("fill", els.labelFill.value);
  label.setAttribute("stroke", els.labelStroke.value);
  updateLeader(label);
}

function applyAllLabelStyle() {
  state.svg.querySelectorAll(".route-label").forEach((label) => {
    label.setAttribute("font-family", els.fontFamily.value);
    label.setAttribute("font-size", els.labelSize.value);
    label.setAttribute("stroke-width", els.labelStrokeWidth.value);
    label.setAttribute("fill", els.labelFill.value);
    label.setAttribute("stroke", els.labelStroke.value);
    updateLeader(label);
  });
}

function applyRouteStyle() {
  const route = state.svg.querySelector("#route-line");
  const halo = state.svg.querySelector("#route-halo");
  if (!route || !halo) return;
  route.setAttribute("stroke", els.routeColor.value);
  route.setAttribute("stroke-width", els.routeWidth.value);
  route.setAttribute("opacity", els.routeOpacity.value);
  halo.setAttribute("stroke-width", els.haloWidth.value);
  const dash = dashArray(els.linePattern.value, Number(els.routeWidth.value));
  [route, halo].forEach((path) => {
    if (dash) path.setAttribute("stroke-dasharray", dash);
    else path.removeAttribute("stroke-dasharray");
  });
}

function dashArray(pattern, width) {
  if (pattern === "dash") return `${width * 4} ${width * 2}`;
  if (pattern === "dot") return `0 ${width * 2.2}`;
  if (pattern === "dashdot") return `${width * 4} ${width * 1.8} 0 ${width * 1.8}`;
  return "";
}

function applyColor(selector, attr, value) {
  state.svg.querySelectorAll(selector).forEach((node) => node.setAttribute(attr, value));
}

function exportSvg() {
  if (!state.svg) return;
  state.svg.querySelectorAll(".is-selected").forEach((node) => node.classList.remove("is-selected"));
  const xml = new XMLSerializer().serializeToString(state.svg);
  const blob = new Blob([`<?xml version="1.0" encoding="UTF-8"?>\n${xml}\n`], { type: "image/svg+xml" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = "route-map-edited.svg";
  link.click();
  URL.revokeObjectURL(url);
  if (state.selectedLabel) state.selectedLabel.classList.add("is-selected");
}

function readNumber(node, attr) {
  return parseFloat(node.getAttribute(attr) || "0");
}

function toColorInput(value) {
  if (/^#[0-9a-f]{6}$/i.test(value)) return value;
  return "#000000";
}

window.addEventListener("pointermove", (event) => {
  if (!state.drag) return;
  const point = pointerToSvg(event);
  moveSelectedLabel(point.x - state.drag.offsetX, point.y - state.drag.offsetY);
});

window.addEventListener("pointerup", () => {
  state.drag = null;
});

els.reloadSvg.addEventListener("click", () => loadSvg().catch((error) => setStatus(error.message)));
els.sourceSvg.addEventListener("change", () => loadSvg().catch((error) => setStatus(error.message)));
els.uploadSvg.addEventListener("change", async () => {
  const file = els.uploadSvg.files?.[0];
  if (!file) return;
  try {
    injectSvg(await file.text(), file.name);
  } catch (error) {
    setStatus(error.message);
  }
});
els.exportSvg.addEventListener("click", exportSvg);
els.zoom.addEventListener("input", () => {
  els.slot.style.width = `${els.zoom.value}%`;
});
els.labelSelect.addEventListener("change", () => {
  const label = state.svg.querySelector(`.route-label[data-label="${els.labelSelect.value}"]`);
  if (label) selectLabel(label);
});
[els.labelX, els.labelY, els.labelAnchor].forEach((input) => input.addEventListener("input", applySelectedLabelControls));
[els.fontFamily, els.labelSize, els.labelStrokeWidth, els.labelFill, els.labelStroke].forEach((input) => {
  input.addEventListener("input", () => {
    applySelectedLabelControls();
    applyAllLabelStyle();
  });
});
[els.routeColor, els.routeWidth, els.haloWidth, els.routeOpacity, els.linePattern].forEach((input) => {
  input.addEventListener("input", applyRouteStyle);
});
els.backgroundColor.addEventListener("input", () => applyColor("#map-background", "fill", els.backgroundColor.value));
els.landColor.addEventListener("input", () => applyColor(".land-shape", "fill", els.landColor.value));
els.forestColor.addEventListener("input", () => applyColor(".forest-shape", "fill", els.forestColor.value));
els.farmlandColor.addEventListener("input", () => applyColor(".farmland-shape", "fill", els.farmlandColor.value));
els.waterColor.addEventListener("input", () => {
  applyColor(".water-shape", "fill", els.waterColor.value);
  applyColor(".waterway-line", "stroke", els.waterColor.value);
});
els.roadColor.addEventListener("input", () => applyColor(".major-road-line", "stroke", els.roadColor.value));

loadSvg().catch((error) => setStatus(error.message));
