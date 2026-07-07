import * as THREE from "three";
import { Body, GeoMoon, HelioVector, PlanetOrbitalPeriod, RotateVector, Rotation_GAL_EQJ, Vector } from "astronomy-engine";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { matchNearbyGalaxy } from "./nearby-galaxy-names.js";
import "./styles.css";

const DATA_URL = `${import.meta.env.BASE_URL}data/catalog-points.json`;
const routeParams = new URLSearchParams(window.location.search);
const isWallpaperMode = routeParams.has("wallpaper");
const startsSolarClose = routeParams.has("solar-close");
if (isWallpaperMode) document.documentElement.dataset.mode = "wallpaper";

const SOURCE_COLORS = {
  SDSS: new THREE.Color("#7de7f4"),
  "2MRS": new THREE.Color("#f6c96f"),
  "GLADE+": new THREE.Color("#c9a5ff"),
  "Cosmicflows-4": new THREE.Color("#8cf59a"),
};

const POINT_MEANINGS = {
  SDSS: "a spectroscopic galaxy entry",
  "2MRS": "a near-infrared galaxy redshift entry",
  "GLADE+": "a galaxy catalog entry",
  "Cosmicflows-4": "a galaxy distance and velocity measurement",
};

const LOCAL_LENS = {
  radius: 18,
  labelRevealDistance: 74,
  solarLabelRevealDistance: 3.4,
  solarLabelHideDistance: 0.72,
  originLabelMinDistance: 62,
  focusStartDistance: 118,
  focusFullDistance: 38,
};
const SOLAR_MODEL = {
  radius: 0.29,
  maxAu: 30.5,
  planetLabelLift: 0.032,
  sunRadius: 0.025,
  earthRadius: 0.02,
  moonRadius: 0.0074,
  moonOrbitRadius: 0.058,
};
const LOCAL_SYSTEM_REFRESH_MS = 60_000;
const MILKY_WAY_MODEL = {
  radius: 11.5,
  coreRadius: 2.7,
  sunOffset: 6,
};
const CATALOG_SPHERE_RADIUS = 500;
const PLANETS = [
  { body: Body.Mercury, name: "Mercury", color: "#b8a48f", radius: 0.008 },
  { body: Body.Venus, name: "Venus", color: "#f6d48f", radius: 0.01 },
  { body: Body.Earth, name: "Earth", color: "#7de7f4", radius: 0.011 },
  { body: Body.Mars, name: "Mars", color: "#e27b58", radius: 0.009 },
  { body: Body.Jupiter, name: "Jupiter", color: "#f3c48c", radius: 0.023 },
  { body: Body.Saturn, name: "Saturn", color: "#d8c47f", radius: 0.021 },
  { body: Body.Uranus, name: "Uranus", color: "#8ee8df", radius: 0.017 },
  { body: Body.Neptune, name: "Neptune", color: "#7896ff", radius: 0.017 },
];
const GALACTIC_TO_EQUATORIAL = Rotation_GAL_EQJ();

const canvas = document.querySelector("#universe");
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: false, powerPreference: "high-performance" });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setClearColor(0x020506, 1);
renderer.autoClear = true;
renderer.domElement.style.cursor = "crosshair";

const scene = new THREE.Scene();
scene.fog = new THREE.FogExp2(0x020506, 0.002);

const camera = new THREE.PerspectiveCamera(52, window.innerWidth / window.innerHeight, 0.001, 4000);
camera.position.set(0, 120, 680);

const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.dampingFactor = 0.045;
controls.rotateSpeed = 0.38;
controls.zoomSpeed = 0.82;
controls.panSpeed = 0.35;
controls.minDistance = 0.46;
controls.maxDistance = 1850;
if (startsSolarClose) {
  camera.position.set(0.18, 0.16, 0.74);
  controls.target.set(0, 0, 0);
  controls.update();
}

const root = new THREE.Group();
scene.add(root);

const shell = new THREE.Mesh(
  new THREE.SphereGeometry(CATALOG_SPHERE_RADIUS, 96, 48),
  new THREE.MeshBasicMaterial({
    color: 0x7de7f4,
    wireframe: true,
    transparent: true,
    opacity: 0.075,
  }),
);
root.add(shell);

const equator = new THREE.LineSegments(
  new THREE.WireframeGeometry(new THREE.SphereGeometry(CATALOG_SPHERE_RADIUS, 64, 24)),
  new THREE.LineBasicMaterial({ color: 0x7de7f4, transparent: true, opacity: 0.055 }),
);
root.add(equator);

const observer = new THREE.Group();
observer.renderOrder = 6;
root.add(observer);

const localSystem = new THREE.Group();
localSystem.renderOrder = 6;
root.add(localSystem);

const lensFill = new THREE.Mesh(
  new THREE.SphereGeometry(LOCAL_LENS.radius, 48, 24),
  new THREE.MeshBasicMaterial({
    color: 0xfff2c2,
    transparent: true,
    opacity: 0.035,
    blending: THREE.AdditiveBlending,
    depthTest: false,
    depthWrite: false,
  }),
);
lensFill.renderOrder = 3;
observer.add(lensFill);

const lensRingMaterial = new THREE.MeshBasicMaterial({
  color: 0xfff2c2,
  transparent: true,
  opacity: 0.24,
  blending: THREE.AdditiveBlending,
  side: THREE.DoubleSide,
  depthTest: false,
  depthWrite: false,
});

function addLensRing(rotation) {
  const ring = new THREE.Mesh(
    new THREE.RingGeometry(LOCAL_LENS.radius - 0.18, LOCAL_LENS.radius + 0.18, 128),
    lensRingMaterial.clone(),
  );
  ring.rotation.set(rotation.x, rotation.y, rotation.z);
  ring.renderOrder = 3;
  observer.add(ring);
}

addLensRing({ x: 0, y: 0, z: 0 });
addLensRing({ x: Math.PI / 2, y: 0, z: 0 });
addLensRing({ x: 0, y: Math.PI / 2, z: 0 });

const originCore = new THREE.Mesh(
  new THREE.SphereGeometry(0.44, 32, 16),
  new THREE.MeshBasicMaterial({
    color: 0xfff2c2,
    transparent: true,
    opacity: 0.16,
    blending: THREE.AdditiveBlending,
    depthTest: false,
    depthWrite: false,
  }),
);
originCore.renderOrder = 8;
observer.add(originCore);

const selectionMarker = new THREE.Mesh(
  new THREE.SphereGeometry(7, 24, 12),
  new THREE.MeshBasicMaterial({ color: 0xf2d18b, transparent: true, opacity: 0.96 }),
);
selectionMarker.visible = false;
root.add(selectionMarker);

const datasetControls = document.querySelector("#dataset-controls");
const stats = document.querySelector("#stats");
const scaleToggle = document.querySelector("#scale-toggle");
const autoToggle = document.querySelector("#auto-toggle");
const pointInspector = document.querySelector("#point-inspector");
const pointLabel = document.querySelector("#point-label");
const originLabel = document.querySelector("#origin-label");
const raycaster = new THREE.Raycaster();
raycaster.params.Points.threshold = 7;
const pointer = new THREE.Vector2();
const projectedPoint = new THREE.Vector3();
const projectedOrigin = new THREE.Vector3();

let data;
let meshes = new Map();
let sourceEnabled = new Map();
let useLogRadius = true;
let autoRotate = true;
let maxDistanceMpc = 1;
let selectedPoint = null;
let pointerStart = null;
let lastLocalSystemRefresh = 0;
const localDetailLabels = [];
const solarDetailLabels = [];
let catalogFocus = 1;

function degToRad(deg) {
  return (deg * Math.PI) / 180;
}

function distanceToRadius(mpc) {
  if (useLogRadius) return (Math.log1p(mpc) / Math.log1p(maxDistanceMpc)) * CATALOG_SPHERE_RADIUS;
  return (mpc / maxDistanceMpc) * CATALOG_SPHERE_RADIUS;
}

function toCartesian(point) {
  const ra = degToRad(point.ra);
  const dec = degToRad(point.dec);
  const r = distanceToRadius(point.distanceMpc);
  const cosDec = Math.cos(dec);
  return {
    x: r * cosDec * Math.cos(ra),
    y: r * Math.sin(dec),
    z: -r * cosDec * Math.sin(ra),
  };
}

function buildPoints() {
  for (const mesh of meshes.values()) root.remove(mesh);
  meshes.clear();

  const bySource = new Map();
  for (const point of data.points) {
    if (!bySource.has(point.source)) bySource.set(point.source, []);
    bySource.get(point.source).push(point);
  }
  for (const [source, points] of bySource.entries()) {
    const positions = new Float32Array(points.length * 3);
    const colors = new Float32Array(points.length * 3);
    const sizes = new Float32Array(points.length);
    const base = SOURCE_COLORS[source] ?? new THREE.Color("#dce8e8");

    points.forEach((point, index) => {
      const p = toCartesian(point);
      positions[index * 3] = p.x;
      positions[index * 3 + 1] = p.y;
      positions[index * 3 + 2] = p.z;
      const depth = Math.min(point.distanceMpc / maxDistanceMpc, 1);
      const color = base.clone().lerp(new THREE.Color("#ffffff"), Math.max(0, 0.16 - depth * 0.08));
      colors[index * 3] = color.r;
      colors[index * 3 + 1] = color.g;
      colors[index * 3 + 2] = color.b;
      sizes[index] = Math.max(1.2, point.size ?? 2.0);
    });

    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute("color", new THREE.BufferAttribute(colors, 3));
    geometry.setAttribute("size", new THREE.BufferAttribute(sizes, 1));

    const material = new THREE.PointsMaterial({
      size: source === "SDSS" ? 2.4 : 3.1,
      vertexColors: true,
      transparent: true,
      opacity: 0.86,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    });

    const mesh = new THREE.Points(geometry, material);
    mesh.visible = sourceEnabled.get(source) ?? true;
    mesh.userData = { source, count: points.length, points, baseOpacity: material.opacity, baseSize: material.size };
    meshes.set(source, mesh);
    root.add(mesh);
  }

  if (selectedPoint) placeSelection(selectedPoint);
}

function renderControls() {
  datasetControls.replaceChildren();
  const sources = data.meta.sources;
  for (const source of sources) {
    sourceEnabled.set(source.id, true);
    const label = document.createElement("label");
    label.className = "source-toggle";
    label.style.setProperty("--source-color", `#${SOURCE_COLORS[source.id].getHexString()}`);

    const input = document.createElement("input");
    input.type = "checkbox";
    input.checked = true;
    input.addEventListener("change", () => {
      sourceEnabled.set(source.id, input.checked);
      const mesh = meshes.get(source.id);
      if (mesh) mesh.visible = input.checked;
      if (selectedPoint?.source === source.id && !input.checked) clearSelection();
      updateStats();
    });

    const name = document.createElement("strong");
    name.textContent = source.id;

    const count = document.createElement("span");
    count.textContent = source.count.toLocaleString();

    label.append(input, name, count);
    datasetControls.append(label);
  }
}

function updateStats() {
  const visible = [...meshes.values()]
    .filter((mesh) => mesh.visible)
    .reduce((sum, mesh) => sum + mesh.userData.count, 0);
  stats.innerHTML = `
    <dt>visible points</dt><dd>${visible.toLocaleString()}</dd>
    <dt>catalog sample</dt><dd>${data.points.length.toLocaleString()}</dd>
    <dt>max data distance</dt><dd>${Math.round(maxDistanceMpc).toLocaleString()} Mpc</dd>
    <dt>outer shell</dt><dd>~100 Gly diameter</dd>
  `;
}

function formatDecimal(value, digits = 2) {
  if (!Number.isFinite(value)) return "unknown";
  return value.toLocaleString(undefined, {
    maximumFractionDigits: digits,
    minimumFractionDigits: value < 10 ? Math.min(digits, 1) : 0,
  });
}

function formatDistance(mpc) {
  const millionLightYears = mpc * 3.26156;
  const mpcText = mpc >= 1000 ? `${formatDecimal(mpc / 1000, 2)} Gpc` : `${formatDecimal(mpc, 1)} Mpc`;
  return `${mpcText} / ${formatDecimal(millionLightYears, 0)} million ly`;
}

function sceneVectorFromEquatorial(vector) {
  return new THREE.Vector3(vector.x, vector.z, -vector.y);
}

function sceneVectorFromGalactic(x, y, z = 0) {
  return sceneVectorFromEquatorial(RotateVector(GALACTIC_TO_EQUATORIAL, new Vector(x, y, z, new Date())));
}

function heliocentricScenePosition(body, date) {
  const vector = HelioVector(body, date);
  return {
    vector: sceneVectorFromEquatorial(vector),
    au: vector.Length(),
  };
}

function compressedAuRadius(au) {
  return (Math.log1p(au * 1.55) / Math.log1p(SOLAR_MODEL.maxAu * 1.55)) * SOLAR_MODEL.radius;
}

function solarModelPoint(position) {
  if (position.au === 0) return new THREE.Vector3(0, 0, 0);
  const scale = compressedAuRadius(position.au) / position.au;
  return position.vector.clone().multiplyScalar(scale);
}

function roundedRect(context, x, y, width, height, radius) {
  context.beginPath();
  context.moveTo(x + radius, y);
  context.lineTo(x + width - radius, y);
  context.quadraticCurveTo(x + width, y, x + width, y + radius);
  context.lineTo(x + width, y + height - radius);
  context.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
  context.lineTo(x + radius, y + height);
  context.quadraticCurveTo(x, y + height, x, y + height - radius);
  context.lineTo(x, y + radius);
  context.quadraticCurveTo(x, y, x + radius, y);
  context.closePath();
}

function makeTextSprite(
  text,
  { color = "#eef6f5", background = "rgba(2, 7, 9, 0.74)", fontSize = 26, worldScale = 0.25 } = {},
) {
  const canvas = document.createElement("canvas");
  const context = canvas.getContext("2d");
  context.font = `700 ${fontSize}px Arial`;
  const paddingX = 16;
  const paddingY = 9;
  const width = Math.ceil(context.measureText(text).width + paddingX * 2);
  const height = Math.ceil(fontSize + paddingY * 2);

  canvas.width = width;
  canvas.height = height;
  context.font = `700 ${fontSize}px Arial`;
  context.textBaseline = "middle";
  context.fillStyle = background;
  roundedRect(context, 0, 0, width, height, 8);
  context.fill();
  context.fillStyle = color;
  context.fillText(text, paddingX, height / 2);

  const texture = new THREE.CanvasTexture(canvas);
  texture.minFilter = THREE.LinearFilter;
  texture.magFilter = THREE.LinearFilter;
  const material = new THREE.SpriteMaterial({
    map: texture,
    transparent: true,
    depthTest: false,
    depthWrite: false,
  });
  const sprite = new THREE.Sprite(material);
  sprite.scale.set(width * worldScale, height * worldScale, 1);
  sprite.renderOrder = 10;
  return sprite;
}

function trackLocalLabel(sprite) {
  localDetailLabels.push(sprite);
  return sprite;
}

function trackSolarLabel(sprite) {
  solarDetailLabels.push(sprite);
  return sprite;
}

function makeLine(points, color, opacity = 0.45) {
  const geometry = new THREE.BufferGeometry().setFromPoints(points);
  const material = new THREE.LineBasicMaterial({
    color,
    transparent: true,
    opacity,
    depthTest: false,
    depthWrite: false,
  });
  const line = new THREE.Line(geometry, material);
  line.renderOrder = 4;
  return line;
}

function makeOrbitLine(planet, date) {
  const periodDays = PlanetOrbitalPeriod(planet.body);
  const sampleCount = planet.name === "Neptune" || planet.name === "Uranus" ? 216 : 160;
  const startTime = date.getTime() - (periodDays * 86400000) / 2;
  const stepMs = (periodDays * 86400000) / sampleCount;
  const points = [];

  for (let index = 0; index <= sampleCount; index += 1) {
    const sampleDate = new Date(startTime + stepMs * index);
    points.push(solarModelPoint(heliocentricScenePosition(planet.body, sampleDate)));
  }

  return makeLine(points, planet.color, 0.58);
}

function makeGalacticPlanePoints(radius, center, count = 180) {
  const points = [];
  for (let index = 0; index <= count; index += 1) {
    const angle = (index / count) * Math.PI * 2;
    points.push(center.clone().add(sceneVectorFromGalactic(Math.cos(angle) * radius, Math.sin(angle) * radius, 0)));
  }
  return points;
}

function seededRandom(seed) {
  const value = Math.sin(seed * 12.9898) * 43758.5453;
  return value - Math.floor(value);
}

function makeCanvasTexture(width, height, draw) {
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const context = canvas.getContext("2d");
  draw(context, width, height);
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.minFilter = THREE.LinearFilter;
  texture.magFilter = THREE.LinearFilter;
  return texture;
}

function makeEquirectTexture(width, height, draw) {
  const texture = makeCanvasTexture(width, height, draw);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.ClampToEdgeWrapping;
  return texture;
}

function mapLonLat(lon, lat, width, height) {
  return [((lon + 180) / 360) * width, ((90 - lat) / 180) * height];
}

function drawLonLatPolygon(context, width, height, points, fillStyle, strokeStyle = "rgba(11,28,20,.48)") {
  context.beginPath();
  points.forEach(([lon, lat], index) => {
    const [x, y] = mapLonLat(lon, lat, width, height);
    if (index === 0) context.moveTo(x, y);
    else context.lineTo(x, y);
  });
  context.closePath();
  context.fillStyle = fillStyle;
  context.fill();
  context.strokeStyle = strokeStyle;
  context.lineWidth = 2;
  context.stroke();
}

function drawGeoEllipse(context, width, height, lon, lat, lonRadius, latRadius, fillStyle, alpha = 1) {
  const [x, y] = mapLonLat(lon, lat, width, height);
  context.save();
  context.globalAlpha = alpha;
  context.fillStyle = fillStyle;
  context.beginPath();
  context.ellipse(x, y, (lonRadius / 360) * width, (latRadius / 180) * height, 0, 0, Math.PI * 2);
  context.fill();
  context.restore();
}

function makeEarthSurfaceTexture() {
  return makeEquirectTexture(1024, 512, (context, width, height) => {
    const ocean = context.createLinearGradient(0, 0, width, height);
    ocean.addColorStop(0, "#092f5b");
    ocean.addColorStop(0.45, "#0b6094");
    ocean.addColorStop(1, "#06233d");
    context.fillStyle = ocean;
    context.fillRect(0, 0, width, height);

    for (let index = 0; index < 120; index += 1) {
      const x = seededRandom(index + 410) * width;
      const y = seededRandom(index + 420) * height;
      context.fillStyle = `rgba(135,220,244,${0.03 + seededRandom(index + 430) * 0.06})`;
      context.beginPath();
      context.ellipse(x, y, 22 + seededRandom(index + 440) * 46, 1.5 + seededRandom(index + 450) * 5, 0, 0, Math.PI * 2);
      context.fill();
    }

    const land = "#78aa67";
    const dry = "#bfa463";
    const forest = "#2f8952";

    drawLonLatPolygon(context, width, height, [
      [-168, 70], [-138, 72], [-112, 61], [-92, 54], [-66, 50], [-52, 33], [-82, 17],
      [-100, 18], [-116, 31], [-126, 48], [-155, 58],
    ], land);
    drawLonLatPolygon(context, width, height, [
      [-82, 12], [-66, 9], [-54, -6], [-48, -23], [-58, -42], [-70, -55], [-78, -35],
      [-74, -14], [-86, 2],
    ], "#6aa260");
    drawLonLatPolygon(context, width, height, [
      [-52, 78], [-24, 76], [-18, 64], [-44, 58], [-60, 66],
    ], "#d6ece8", "rgba(210,244,244,.5)");
    drawLonLatPolygon(context, width, height, [
      [-10, 70], [28, 72], [62, 64], [96, 59], [138, 55], [162, 48], [146, 26],
      [108, 20], [78, 8], [38, 24], [8, 34], [-10, 52],
    ], land);
    drawLonLatPolygon(context, width, height, [
      [-18, 36], [10, 34], [32, 18], [44, -8], [30, -34], [10, -36], [-4, -18],
      [-16, 6],
    ], "#7fab5d");
    drawLonLatPolygon(context, width, height, [
      [66, 28], [88, 22], [101, 6], [114, 0], [110, -9], [82, 7],
    ], "#5f9f5d");
    drawLonLatPolygon(context, width, height, [
      [113, -12], [154, -20], [150, -39], [118, -34], [112, -22],
    ], "#a39d61");
    drawLonLatPolygon(context, width, height, [
      [164, -34], [180, -41], [177, -47], [166, -45],
    ], "#7faf6c");

    drawGeoEllipse(context, width, height, -63, -6, 20, 14, forest, 0.82);
    drawGeoEllipse(context, width, height, 23, 0, 15, 12, forest, 0.74);
    drawGeoEllipse(context, width, height, 102, 14, 16, 10, forest, 0.72);
    drawGeoEllipse(context, width, height, -105, 58, 26, 9, "#3f7c51", 0.55);
    drawGeoEllipse(context, width, height, 68, 57, 48, 10, "#3f7c51", 0.52);
    drawGeoEllipse(context, width, height, 18, 21, 24, 9, dry, 0.78);
    drawGeoEllipse(context, width, height, 47, 25, 18, 7, dry, 0.66);
    drawGeoEllipse(context, width, height, 134, -24, 19, 11, dry, 0.68);

    context.fillStyle = "rgba(232,250,250,.9)";
    context.fillRect(0, 0, width, 34);
    context.fillRect(0, height - 40, width, 40);
    drawGeoEllipse(context, width, height, -42, 75, 24, 6, "rgba(232,250,250,.82)", 1);

    context.strokeStyle = "rgba(225,255,255,.08)";
    context.lineWidth = 1;
    for (let lon = -150; lon <= 180; lon += 30) {
      const [x] = mapLonLat(lon, 0, width, height);
      context.beginPath();
      context.moveTo(x, 0);
      context.lineTo(x, height);
      context.stroke();
    }
    for (let lat = -60; lat <= 60; lat += 30) {
      const [, y] = mapLonLat(0, lat, width, height);
      context.beginPath();
      context.moveTo(0, y);
      context.lineTo(width, y);
      context.stroke();
    }
    const [primeX] = mapLonLat(0, 0, width, height);
    const [, equatorY] = mapLonLat(0, 0, width, height);
    context.strokeStyle = "rgba(255,242,194,.28)";
    context.lineWidth = 2;
    context.beginPath();
    context.moveTo(primeX, 0);
    context.lineTo(primeX, height);
    context.stroke();
    context.beginPath();
    context.moveTo(0, equatorY);
    context.lineTo(width, equatorY);
    context.stroke();
  });
}

function makeEarthCloudTexture() {
  return makeEquirectTexture(1024, 512, (context, width, height) => {
    context.clearRect(0, 0, width, height);
    context.strokeStyle = "rgba(238,255,255,.28)";
    context.lineWidth = 3;
    for (let index = 0; index < 70; index += 1) {
      const x = seededRandom(index + 720) * width;
      const y = (0.18 + seededRandom(index + 730) * 0.64) * height;
      const length = 24 + seededRandom(index + 740) * 92;
      context.beginPath();
      context.moveTo(x, y);
      context.bezierCurveTo(
        x + length * 0.28,
        y - 9 + seededRandom(index + 750) * 18,
        x + length * 0.66,
        y + 8 - seededRandom(index + 760) * 16,
        x + length,
        y + seededRandom(index + 770) * 10 - 5,
      );
      context.stroke();
    }
  });
}

function makeMoonSurfaceTexture() {
  return makeEquirectTexture(512, 256, (context, width, height) => {
    const surface = context.createLinearGradient(0, 0, width, height);
    surface.addColorStop(0, "#d7d6cf");
    surface.addColorStop(0.55, "#8f938f");
    surface.addColorStop(1, "#4e5351");
    context.fillStyle = surface;
    context.fillRect(0, 0, width, height);

    for (let index = 0; index < 110; index += 1) {
      const x = seededRandom(index + 910) * width;
      const y = seededRandom(index + 920) * height;
      const radius = 3 + seededRandom(index + 930) * 17;
      context.fillStyle = `rgba(35,38,37,${0.12 + seededRandom(index + 940) * 0.26})`;
      context.beginPath();
      context.arc(x, y, radius, 0, Math.PI * 2);
      context.fill();
      context.strokeStyle = "rgba(238,236,224,.2)";
      context.lineWidth = 1;
      context.stroke();
    }

    drawGeoEllipse(context, width, height, -20, 8, 24, 13, "rgba(64,67,66,.28)", 1);
    drawGeoEllipse(context, width, height, 42, -18, 20, 11, "rgba(55,58,57,.24)", 1);
  });
}

function makeSunSurfaceTexture() {
  return makeEquirectTexture(512, 256, (context, width, height) => {
    const surface = context.createLinearGradient(0, 0, width, height);
    surface.addColorStop(0, "#fff2a5");
    surface.addColorStop(0.32, "#ffc45d");
    surface.addColorStop(0.72, "#f36c24");
    surface.addColorStop(1, "#9e2b10");
    context.fillStyle = surface;
    context.fillRect(0, 0, width, height);

    for (let index = 0; index < 120; index += 1) {
      const x = seededRandom(index + 1110) * width;
      const y = seededRandom(index + 1120) * height;
      context.save();
      context.translate(x, y);
      context.rotate(seededRandom(index + 1130) * Math.PI);
      context.globalAlpha = 0.14 + seededRandom(index + 1140) * 0.18;
      context.fillStyle = index % 9 === 0 ? "#771d0a" : "#ffe08a";
      context.beginPath();
      context.ellipse(0, 0, 10 + seededRandom(index + 1150) * 28, 2 + seededRandom(index + 1160) * 7, 0, 0, Math.PI * 2);
      context.fill();
      context.restore();
    }
  });
}

function makeRadialTexture(size, stops) {
  return makeCanvasTexture(size, size, (context, width, height) => {
    const gradient = context.createRadialGradient(width / 2, height / 2, 1, width / 2, height / 2, width / 2);
    for (const [offset, color] of stops) gradient.addColorStop(offset, color);
    context.fillStyle = gradient;
    context.fillRect(0, 0, width, height);
  });
}

const earthSurfaceTexture = makeEarthSurfaceTexture();
const earthCloudTexture = makeEarthCloudTexture();
const moonSurfaceTexture = makeMoonSurfaceTexture();
const sunSurfaceTexture = makeSunSurfaceTexture();
const sunGlowTexture = makeRadialTexture(192, [
  [0, "rgba(255,255,255,.95)"],
  [0.18, "rgba(255,218,105,.82)"],
  [0.56, "rgba(255,116,35,.24)"],
  [1, "rgba(255,116,35,0)"],
]);

function preserveMaterialTexture(material) {
  material.userData.preserveMap = true;
  return material;
}

function disposeLocalSystem() {
  localSystem.traverse((object) => {
    if (object.geometry) object.geometry.dispose();
    const materials = Array.isArray(object.material) ? object.material : [object.material];
    for (const material of materials) {
      if (!material) continue;
      if (material.map && !material.userData.preserveMap) material.map.dispose();
      material.dispose();
    }
  });
  localSystem.clear();
}

function makeMilkyWayDust(center, count = 950) {
  const positions = new Float32Array(count * 3);
  const colors = new Float32Array(count * 3);

  for (let index = 0; index < count; index += 1) {
    const arm = Math.floor(seededRandom(index + 10) * 4);
    const radius = Math.sqrt(seededRandom(index + 20)) * MILKY_WAY_MODEL.radius;
    const angle =
      arm * (Math.PI / 2) +
      radius * 0.34 +
      (seededRandom(index + 30) - 0.5) * (0.42 + radius / MILKY_WAY_MODEL.radius);
    const height = (seededRandom(index + 40) - 0.5) * 0.34;
    const point = center
      .clone()
      .add(sceneVectorFromGalactic(Math.cos(angle) * radius, Math.sin(angle) * radius * 0.82, height));

    positions[index * 3] = point.x;
    positions[index * 3 + 1] = point.y;
    positions[index * 3 + 2] = point.z;

    const coreMix = Math.max(0, 1 - radius / MILKY_WAY_MODEL.radius);
    colors[index * 3] = 0.48 + coreMix * 0.48;
    colors[index * 3 + 1] = 0.78 + coreMix * 0.18;
    colors[index * 3 + 2] = 0.95 - coreMix * 0.28;
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
  geometry.setAttribute("color", new THREE.BufferAttribute(colors, 3));
  const material = new THREE.PointsMaterial({
    size: 0.12,
    vertexColors: true,
    transparent: true,
    opacity: 0.68,
    blending: THREE.AdditiveBlending,
    depthTest: false,
    depthWrite: false,
  });
  const dust = new THREE.Points(geometry, material);
  dust.renderOrder = 5;
  return dust;
}

function addMilkyWayContext() {
  const center = sceneVectorFromGalactic(MILKY_WAY_MODEL.sunOffset, 0, 0);
  localSystem.add(makeMilkyWayDust(center));
  localSystem.add(makeLine(makeGalacticPlanePoints(MILKY_WAY_MODEL.radius, center), 0x7de7f4, 0.34));
  localSystem.add(makeLine(makeGalacticPlanePoints(MILKY_WAY_MODEL.coreRadius, center), 0xfff2c2, 0.28));

  const armA = [];
  const armB = [];
  for (let index = 0; index <= 80; index += 1) {
    const t = index / 80;
    const angle = t * Math.PI * 2.1;
    const radius = MILKY_WAY_MODEL.coreRadius * 0.45 + t * MILKY_WAY_MODEL.radius * 0.86;
    armA.push(center.clone().add(sceneVectorFromGalactic(Math.cos(angle) * radius, Math.sin(angle) * radius, 0)));
    armB.push(center.clone().add(sceneVectorFromGalactic(Math.cos(angle + Math.PI) * radius, Math.sin(angle + Math.PI) * radius, 0)));
  }
  localSystem.add(makeLine(armA, 0xc9a5ff, 0.34));
  localSystem.add(makeLine(armB, 0xc9a5ff, 0.34));

  const sunInGalaxy = new THREE.Mesh(
    new THREE.SphereGeometry(0.34, 16, 8),
    new THREE.MeshBasicMaterial({
      color: 0xfff2c2,
      transparent: true,
      opacity: 0.12,
      blending: THREE.AdditiveBlending,
      depthTest: false,
      depthWrite: false,
    }),
  );
  sunInGalaxy.position.copy(center).add(sceneVectorFromGalactic(-MILKY_WAY_MODEL.sunOffset, 0, 0));
  sunInGalaxy.renderOrder = 6;
  localSystem.add(sunInGalaxy);

  const label = makeTextSprite("Milky Way compressed; Sun ~26k ly from center", {
    color: "#dce8e8",
    background: "rgba(2, 7, 9, 0.68)",
    fontSize: 16,
    worldScale: 0.009,
  });
  label.position.copy(center).add(sceneVectorFromGalactic(-MILKY_WAY_MODEL.sunOffset * 0.22, -MILKY_WAY_MODEL.radius * 0.58, 0.4));
  localSystem.add(trackLocalLabel(label));
}

function addCatalogSphereContext() {
  const label = makeTextSprite("Galaxy catalog sphere around our Solar System + Milky Way", {
    color: "#dce8e8",
    background: "rgba(2, 7, 9, 0.66)",
    fontSize: 21,
  });
  label.position.set(-28, -CATALOG_SPHERE_RADIUS * 0.34, CATALOG_SPHERE_RADIUS * 0.58);
  localSystem.add(label);
}

function earthRotationAngle(date) {
  const siderealDayMs = 86_164_090.5;
  const j2000Noon = Date.UTC(2000, 0, 1, 12, 0, 0);
  const turns = ((date.getTime() - j2000Noon) / siderealDayMs) % 1;
  return turns * Math.PI * 2;
}

function addSunVisual() {
  const glow = new THREE.Sprite(
    preserveMaterialTexture(
      new THREE.SpriteMaterial({
        map: sunGlowTexture,
        color: 0xffd979,
        transparent: true,
        opacity: 0.86,
        blending: THREE.AdditiveBlending,
        depthTest: false,
        depthWrite: false,
      }),
    ),
  );
  glow.scale.set(SOLAR_MODEL.sunRadius * 6.2, SOLAR_MODEL.sunRadius * 6.2, 1);
  glow.renderOrder = 8;
  localSystem.add(glow);

  const sun = new THREE.Mesh(
    new THREE.SphereGeometry(SOLAR_MODEL.sunRadius, 48, 24),
    preserveMaterialTexture(new THREE.MeshBasicMaterial({ map: sunSurfaceTexture, color: 0xffd287, depthTest: false, depthWrite: false })),
  );
  sun.rotation.y = Math.PI * 0.15;
  sun.renderOrder = 9;
  localSystem.add(sun);
}

function addEarthMoonVisual(earthPoint, now) {
  const earthGroup = new THREE.Group();
  earthGroup.position.copy(earthPoint);
  earthGroup.renderOrder = 8;

  const earthRotation = earthRotationAngle(now);
  const earth = new THREE.Mesh(
    new THREE.SphereGeometry(SOLAR_MODEL.earthRadius, 56, 32),
    preserveMaterialTexture(new THREE.MeshBasicMaterial({ map: earthSurfaceTexture, depthTest: false, depthWrite: false })),
  );
  earth.rotation.y = -earthRotation;
  earth.renderOrder = 8;
  earthGroup.add(earth);

  const clouds = new THREE.Mesh(
    new THREE.SphereGeometry(SOLAR_MODEL.earthRadius * 1.035, 56, 32),
    preserveMaterialTexture(
      new THREE.MeshBasicMaterial({
        map: earthCloudTexture,
        transparent: true,
        opacity: 0.54,
        blending: THREE.AdditiveBlending,
        depthTest: false,
        depthWrite: false,
      }),
    ),
  );
  clouds.rotation.y = -earthRotation * 0.92;
  clouds.renderOrder = 9;
  earthGroup.add(clouds);
  localSystem.add(earthGroup);

  const moonGeoVector = sceneVectorFromEquatorial(GeoMoon(now));
  const moonDirection = moonGeoVector.lengthSq() > 0 ? moonGeoVector.clone().normalize() : new THREE.Vector3(1, 0, 0);
  const moonPoint = earthPoint.clone().add(moonDirection.clone().multiplyScalar(SOLAR_MODEL.moonOrbitRadius));

  const moonLine = makeLine([earthPoint, moonPoint], 0xd7dee0, 0.36);
  moonLine.renderOrder = 7;
  localSystem.add(moonLine);

  const moon = new THREE.Mesh(
    new THREE.SphereGeometry(SOLAR_MODEL.moonRadius, 36, 20),
    preserveMaterialTexture(new THREE.MeshBasicMaterial({ map: moonSurfaceTexture, color: 0xd8d6cc, depthTest: false, depthWrite: false })),
  );
  moon.position.copy(moonPoint);
  moon.rotation.y = earthRotation * 0.18;
  moon.renderOrder = 8;
  localSystem.add(moon);

  const moonLabel = makeTextSprite("Moon", {
    color: "#d7dee0",
    background: "rgba(2, 7, 9, 0.64)",
    fontSize: 11,
    worldScale: 0.00034,
  });
  moonLabel.position.copy(moonPoint).add(moonDirection.multiplyScalar(0.018));
  localSystem.add(trackSolarLabel(moonLabel));
}

function renderLocalSystem(now = new Date()) {
  lastLocalSystemRefresh = now.getTime();
  disposeLocalSystem();
  localDetailLabels.length = 0;
  solarDetailLabels.length = 0;

  addSunVisual();

  const stamp = makeTextSprite(`Solar System ${now.toISOString().slice(11, 16)} UTC`, {
    color: "#fff2c2",
    background: "rgba(2, 7, 9, 0.7)",
    fontSize: 14,
    worldScale: 0.00046,
  });
  stamp.position.set(0, SOLAR_MODEL.radius + 0.14, 0);
  localSystem.add(trackSolarLabel(stamp));

  const scaleNote = makeTextSprite("Solar System inside Sun sphere", {
    color: "#b5c7ca",
    background: "rgba(2, 7, 9, 0.62)",
    fontSize: 13,
    worldScale: 0.00042,
  });
  scaleNote.position.set(0, SOLAR_MODEL.radius + 0.085, 0);
  localSystem.add(trackSolarLabel(scaleNote));

  const sunLabel = makeTextSprite("Sun", {
    color: "#fff2c2",
    background: "rgba(2, 7, 9, 0.78)",
    fontSize: 13,
    worldScale: 0.00042,
  });
  sunLabel.position.set(0.055, 0.048, 0);
  localSystem.add(trackSolarLabel(sunLabel));

  for (const planet of PLANETS) {
    localSystem.add(makeOrbitLine(planet, now));
  }

  for (const planet of PLANETS) {
    const position = heliocentricScenePosition(planet.body, now);
    const point = solarModelPoint(position);
    if (planet.body === Body.Earth) {
      addEarthMoonVisual(point, now);
    } else {
      const mesh = new THREE.Mesh(
        new THREE.SphereGeometry(planet.radius, 18, 10),
        new THREE.MeshBasicMaterial({ color: planet.color, depthTest: false, depthWrite: false }),
      );
      mesh.position.copy(point);
      mesh.renderOrder = 7;
      localSystem.add(mesh);
    }

    const outward = point.lengthSq() > 0 ? point.clone().normalize() : new THREE.Vector3(1, 0, 0);
    const label = makeTextSprite(`${planet.name} ${formatDecimal(position.au, 1)} AU`, {
      color: planet.color,
      background: "rgba(2, 7, 9, 0.68)",
      fontSize: 12,
      worldScale: 0.00038,
    });
    label.position.copy(point).add(outward.multiplyScalar(0.038)).add(new THREE.Vector3(0, SOLAR_MODEL.planetLabelLift, 0));
    localSystem.add(trackSolarLabel(label));
  }

  addMilkyWayContext();
  addCatalogSphereContext();
}

function sourceProvenance(sourceId) {
  return data.meta.sources.find((source) => source.id === sourceId)?.provenance ?? sourceId;
}

function pointTitle(point, namedGalaxy) {
  if (namedGalaxy) return namedGalaxy.name;
  if (point.pgc) return `${point.source} PGC ${point.pgc.toLocaleString()}`;
  return `${point.source} catalog point`;
}

function addMetric(list, name, value) {
  if (value == null || value === "") return;
  const term = document.createElement("dt");
  term.textContent = name;
  const detail = document.createElement("dd");
  detail.textContent = value;
  list.append(term, detail);
}

function renderInspector(point) {
  const namedGalaxy = matchNearbyGalaxy(point);
  const eyebrow = document.createElement("div");
  eyebrow.className = "inspector__eyebrow";
  eyebrow.textContent = "selected pixel";

  const heading = document.createElement("h2");
  heading.textContent = pointTitle(point, namedGalaxy);

  const body = document.createElement("p");
  if (namedGalaxy) {
    body.textContent = `This pixel represents ${namedGalaxy.name}, ${namedGalaxy.type}, matched using the local nearby-galaxy name list. The plotted source is ${POINT_MEANINGS[point.source] ?? "a catalog object"} from ${sourceProvenance(point.source)}.`;
  } else {
    body.textContent = `This pixel represents ${POINT_MEANINGS[point.source] ?? "a catalog object"} from ${sourceProvenance(point.source)}.`;
  }

  const metrics = document.createElement("dl");
  addMetric(metrics, "aliases", namedGalaxy?.aliases.join(", "));
  addMetric(metrics, "name offset", namedGalaxy == null ? null : `${formatDecimal(namedGalaxy.separationDeg, 3)} deg`);
  addMetric(metrics, "distance", formatDistance(point.distanceMpc));
  addMetric(metrics, "redshift", point.redshift == null ? null : formatDecimal(point.redshift, 7));
  addMetric(metrics, "velocity", point.velocityKms == null ? null : `${point.velocityKms.toLocaleString()} km/s`);
  addMetric(metrics, "magnitude", point.magnitude == null ? null : formatDecimal(point.magnitude, 3));
  addMetric(metrics, "RA", `${formatDecimal(point.ra, 3)} deg`);
  addMetric(metrics, "Dec", `${formatDecimal(point.dec, 3)} deg`);

  pointInspector.replaceChildren(eyebrow, heading, body, metrics);
  pointInspector.hidden = false;

  pointLabel.replaceChildren();
  const source = document.createElement("strong");
  source.textContent = namedGalaxy?.name ?? point.source;
  const distance = document.createElement("span");
  distance.textContent = namedGalaxy ? namedGalaxy.aliases.join(" / ") : formatDistance(point.distanceMpc);
  pointLabel.append(source, distance);
  pointLabel.hidden = false;
}

function placeSelection(point) {
  const position = toCartesian(point);
  selectionMarker.position.set(position.x, position.y, position.z);
  selectionMarker.visible = true;
  renderInspector(point);
  updatePointLabelPosition();
}

function selectPoint(point) {
  selectedPoint = point;
  placeSelection(point);
}

function clearSelection() {
  selectedPoint = null;
  selectionMarker.visible = false;
  pointInspector.hidden = true;
  pointLabel.hidden = true;
}

function rectsOverlap(a, b) {
  return Math.min(a.right, b.right) - Math.max(a.left, b.left) > 2 && Math.min(a.bottom, b.bottom) - Math.max(a.top, b.top) > 2;
}

function labelFitsViewport(rect) {
  const margin = 8;
  return rect.left >= margin && rect.top >= margin && rect.right <= window.innerWidth - margin && rect.bottom <= window.innerHeight - margin;
}

function visiblePanelRects() {
  return [...document.querySelectorAll(".hud, .legend, .inspector:not([hidden]), .origin-label")]
    .filter((element) => getComputedStyle(element).display !== "none")
    .map((element) => element.getBoundingClientRect());
}

function placePointLabel(x, y) {
  const panels = visiblePanelRects();
  for (const placement of ["above", "right", "below", "left"]) {
    pointLabel.dataset.placement = placement;
    pointLabel.style.left = `${x}px`;
    pointLabel.style.top = `${y}px`;
    pointLabel.hidden = false;

    const rect = pointLabel.getBoundingClientRect();
    const overlapsPanel = panels.some((panel) => rectsOverlap(rect, panel));
    if (labelFitsViewport(rect) && !overlapsPanel) return;
  }

  pointLabel.hidden = true;
}

function updatePointLabelPosition() {
  if (!selectedPoint) return;

  selectionMarker.getWorldPosition(projectedPoint);
  projectedPoint.project(camera);
  const visible =
    projectedPoint.z > -1 &&
    projectedPoint.z < 1 &&
    projectedPoint.x > -1.08 &&
    projectedPoint.x < 1.08 &&
    projectedPoint.y > -1.08 &&
    projectedPoint.y < 1.08;

  pointLabel.hidden = !visible;
  if (!visible) return;

  const x = ((projectedPoint.x + 1) / 2) * window.innerWidth;
  const y = ((-projectedPoint.y + 1) / 2) * window.innerHeight;
  placePointLabel(x, y);
}

function updateLocalLabelVisibility() {
  const distance = controls.getDistance();
  const showLabels = distance <= LOCAL_LENS.labelRevealDistance;
  const showSolarLabels =
    distance <= LOCAL_LENS.solarLabelRevealDistance && distance >= LOCAL_LENS.solarLabelHideDistance;
  for (const label of localDetailLabels) label.visible = showLabels;
  for (const label of solarDetailLabels) label.visible = showSolarLabels;
}

function updateLocalFocus() {
  const distance = controls.getDistance();
  const nextFocus = THREE.MathUtils.smoothstep(distance, LOCAL_LENS.focusFullDistance, LOCAL_LENS.focusStartDistance);
  if (Math.abs(nextFocus - catalogFocus) < 0.002) return;
  catalogFocus = nextFocus;

  const catalogOpacityScale = THREE.MathUtils.lerp(0.12, 1, catalogFocus);
  const catalogSizeScale = THREE.MathUtils.lerp(0.42, 1, catalogFocus);
  for (const mesh of meshes.values()) {
    mesh.material.opacity = mesh.userData.baseOpacity * catalogOpacityScale;
    mesh.material.size = mesh.userData.baseSize * catalogSizeScale;
  }
  shell.material.opacity = THREE.MathUtils.lerp(0.018, 0.075, catalogFocus);
  equator.material.opacity = THREE.MathUtils.lerp(0.012, 0.055, catalogFocus);
}

function updateOriginLabelPosition() {
  if (controls.getDistance() < LOCAL_LENS.originLabelMinDistance) {
    originLabel.hidden = true;
    return;
  }

  observer.getWorldPosition(projectedOrigin);
  projectedOrigin.project(camera);

  const visible =
    projectedOrigin.z > -1 &&
    projectedOrigin.z < 1 &&
    projectedOrigin.x > -1.08 &&
    projectedOrigin.x < 1.08 &&
    projectedOrigin.y > -1.08 &&
    projectedOrigin.y < 1.08;

  originLabel.hidden = !visible;
  if (!visible) return;

  const x = ((projectedOrigin.x + 1) / 2) * window.innerWidth;
  const y = ((-projectedOrigin.y + 1) / 2) * window.innerHeight;
  originLabel.style.left = `${x}px`;
  originLabel.style.top = `${y}px`;
}

function pickPoint(event) {
  const rect = renderer.domElement.getBoundingClientRect();
  pointer.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
  pointer.y = -(((event.clientY - rect.top) / rect.height) * 2 - 1);
  raycaster.setFromCamera(pointer, camera);

  const visibleMeshes = [...meshes.values()].filter((mesh) => mesh.visible);
  const [hit] = raycaster.intersectObjects(visibleMeshes, false);
  if (!hit) {
    clearSelection();
    return;
  }

  const point = hit.object.userData.points[hit.index];
  if (point) selectPoint(point);
}

async function init() {
  const response = await fetch(DATA_URL);
  data = await response.json();
  maxDistanceMpc = Math.max(...data.points.map((point) => point.distanceMpc), 1);
  renderLocalSystem();
  renderControls();
  buildPoints();
  updateStats();
}

scaleToggle.addEventListener("click", () => {
  useLogRadius = !useLogRadius;
  scaleToggle.textContent = useLogRadius ? "log radius" : "linear radius";
  scaleToggle.classList.toggle("is-off", !useLogRadius);
  buildPoints();
});

autoToggle.addEventListener("click", () => {
  autoRotate = !autoRotate;
  autoToggle.classList.toggle("is-off", !autoRotate);
});

window.addEventListener("resize", () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
  updateOriginLabelPosition();
  updatePointLabelPosition();
});

canvas.addEventListener("pointerdown", (event) => {
  if (event.button !== 0) return;
  pointerStart = { x: event.clientX, y: event.clientY };
});

canvas.addEventListener("pointerup", (event) => {
  if (!pointerStart || event.button !== 0) return;
  const moved = Math.hypot(event.clientX - pointerStart.x, event.clientY - pointerStart.y);
  pointerStart = null;
  if (moved <= 5) pickPoint(event);
});

function animate() {
  requestAnimationFrame(animate);
  if (Date.now() - lastLocalSystemRefresh > LOCAL_SYSTEM_REFRESH_MS) renderLocalSystem();
  if (autoRotate) root.rotation.y += 0.0009;
  shell.rotation.y -= 0.0004;
  controls.update();
  updateLocalFocus();
  updateLocalLabelVisibility();
  updateOriginLabelPosition();
  updatePointLabelPosition();
  renderer.render(scene, camera);
}

init().then(animate).catch((error) => {
  stats.innerHTML = `<dt>load error</dt><dd>${error.message}</dd>`;
});
