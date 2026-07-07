import { writeFileSync, mkdirSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, "..");
const outputPath = resolve(root, "public/data/catalog-points.json");

const C = 299792.458;
const H0 = 70;

const limits = {
  sdss: 7000,
  twomrs: 6000,
  glade: 5000,
  cosmicflows: 5000,
};

function parseNumber(value) {
  if (!value || value === "null") return null;
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

function hmsToDegrees(value) {
  if (!value) return null;
  const parts = value.trim().split(/\s+/).map(Number);
  if (parts.length !== 3 || parts.some((p) => !Number.isFinite(p))) return null;
  return (parts[0] + parts[1] / 60 + parts[2] / 3600) * 15;
}

function dmsToDegrees(value) {
  if (!value) return null;
  const text = value.trim();
  const sign = text.startsWith("-") ? -1 : 1;
  const parts = text.replace(/^[+-]/, "").split(/\s+/).map(Number);
  if (parts.length !== 3 || parts.some((p) => !Number.isFinite(p))) return null;
  return sign * (parts[0] + parts[1] / 60 + parts[2] / 3600);
}

function comovingDistanceMpc(z) {
  if (!Number.isFinite(z) || z <= 0) return null;
  const steps = 96;
  const omegaM = 0.315;
  const omegaLambda = 0.685;
  let sum = 0;
  for (let i = 0; i <= steps; i += 1) {
    const x = (z * i) / steps;
    const invE = 1 / Math.sqrt(omegaM * Math.pow(1 + x, 3) + omegaLambda);
    const weight = i === 0 || i === steps ? 1 : i % 2 === 0 ? 2 : 4;
    sum += weight * invE;
  }
  return (C / H0) * (z / (3 * steps)) * sum;
}

function fromRaDecDistance(source, ra, dec, distanceMpc, extra = {}) {
  if (![ra, dec, distanceMpc].every(Number.isFinite)) return null;
  if (distanceMpc <= 0) return null;
  return {
    source,
    ra: Number(ra.toFixed(6)),
    dec: Number(dec.toFixed(6)),
    distanceMpc: Number(distanceMpc.toFixed(4)),
    ...extra,
  };
}

async function getText(url, options = {}) {
  const response = await fetch(url, options);
  if (!response.ok) throw new Error(`${response.status} ${response.statusText}: ${url}`);
  return response.text();
}

async function fetchSdss() {
  const sql = `
    select top ${limits.sdss} p.ra,p.dec,s.z,p.modelMag_r
    from SpecObj as s
    join PhotoObj as p on s.bestobjid=p.objid
    where s.class='GALAXY'
      and s.z between 0.005 and 0.35
      and p.modelMag_r between 12 and 21
  `.replace(/\s+/g, " ");
  const url = new URL("https://skyserver.sdss.org/dr18/SkyServerWS/SearchTools/SqlSearch");
  url.searchParams.set("cmd", sql);
  url.searchParams.set("format", "csv");
  const text = await getText(url);
  return text
    .split(/\r?\n/)
    .filter((line) => line && !line.startsWith("#") && !line.startsWith("ra,"))
    .map((line) => {
      const [raRaw, decRaw, zRaw, magRaw] = line.split(",");
      const ra = parseNumber(raRaw);
      const dec = parseNumber(decRaw);
      const z = parseNumber(zRaw);
      const mag = parseNumber(magRaw);
      const distanceMpc = comovingDistanceMpc(z);
      return fromRaDecDistance("SDSS", ra, dec, distanceMpc, {
        redshift: Number(z.toFixed(7)),
        magnitude: mag == null ? null : Number(mag.toFixed(3)),
        size: mag == null ? 2.2 : Math.max(1.2, 4.4 - (mag - 12) * 0.24),
      });
    })
    .filter(Boolean);
}

async function fetch2Mrs() {
  const query = `select top ${limits.twomrs} ra,dec,radial_velocity from twomassrsc where radial_velocity > 300 and radial_velocity < 30000`;
  const url = new URL("https://heasarc.gsfc.nasa.gov/xamin/vo/tap/sync");
  url.searchParams.set("REQUEST", "doQuery");
  url.searchParams.set("LANG", "ADQL");
  url.searchParams.set("FORMAT", "text");
  url.searchParams.set("QUERY", query);
  const text = await getText(url);
  const rows = text.split(/\r?\n/).filter((line) => line.includes("|") && !line.startsWith("ra"));
  return rows
    .map((line) => {
      const [raRaw, decRaw, velocityRaw] = line.split("|").map((part) => part.trim());
      const ra = parseNumber(raRaw);
      const dec = parseNumber(decRaw);
      const velocity = parseNumber(velocityRaw);
      const z = velocity / C;
      const distanceMpc = velocity / H0;
      return fromRaDecDistance("2MRS", ra, dec, distanceMpc, {
        redshift: Number(z.toFixed(7)),
        velocityKms: Math.round(velocity),
        size: 2.7,
      });
    })
    .filter(Boolean);
}

async function fetchGlade() {
  const controller = new AbortController();
  const response = await fetch("http://elysium.elte.hu/~dalyag/GLADE+.txt", {
    headers: { Range: "bytes=0-22000000" },
    signal: controller.signal,
  });
  if (!response.ok && response.status !== 206) {
    throw new Error(`${response.status} ${response.statusText}: GLADE+`);
  }

  const decoder = new TextDecoder();
  const reader = response.body.getReader();
  let carry = "";
  const points = [];

  while (points.length < limits.glade) {
    const { value, done } = await reader.read();
    if (done) break;
    carry += decoder.decode(value, { stream: true });
    const lines = carry.split(/\r?\n/);
    carry = lines.pop() ?? "";

    for (const line of lines) {
      if (!line.trim()) continue;
      const cols = line.trim().split(/\s+/);
      const flag = cols[7];
      if (flag !== "G") continue;
      const ra = parseNumber(cols[8]);
      const dec = parseNumber(cols[9]);
      const bMag = parseNumber(cols[10]);
      const zCmb = parseNumber(cols[28]);
      const dL = parseNumber(cols[32]);
      const distanceMpc = dL && zCmb ? dL / (1 + zCmb) : dL;
      const point = fromRaDecDistance("GLADE+", ra, dec, distanceMpc, {
        redshift: zCmb == null ? null : Number(zCmb.toFixed(8)),
        magnitude: bMag,
        size: bMag == null ? 2.4 : Math.max(1.5, 5.8 - bMag * 0.26),
      });
      if (point) points.push(point);
      if (points.length >= limits.glade) break;
    }
  }

  controller.abort();
  return points;
}

function parseAsuTable(text) {
  const lines = text.split(/\r?\n/);
  const headerIndex = lines.findIndex((line) => line && !line.startsWith("#") && line.includes("\t"));
  if (headerIndex === -1) return [];
  const headers = lines[headerIndex].split("\t").map((h) => h.trim());
  const dataStart = headerIndex + 3;
  return lines
    .slice(dataStart)
    .filter((line) => line && !line.startsWith("#") && line.includes("\t"))
    .map((line) => {
      const values = line.split("\t");
      return Object.fromEntries(headers.map((header, index) => [header, values[index]?.trim() ?? ""]));
    });
}

async function fetchCosmicflows() {
  const url = new URL("https://vizier.cds.unistra.fr/viz-bin/asu-tsv");
  url.searchParams.set("-source", "J/ApJ/944/94/table2");
  url.searchParams.set("-out.max", String(limits.cosmicflows));
  url.searchParams.set("-out", "RAJ2000,DEJ2000,DM,Vcmb,PGC");
  const text = await getText(url);
  return parseAsuTable(text)
    .map((row) => {
      const ra = parseNumber(row.RAJ2000);
      const dec = parseNumber(row.DEJ2000);
      const dm = parseNumber(row.DM);
      const velocity = parseNumber(row.Vcmb);
      const distanceMpc = dm == null ? null : Math.pow(10, (dm - 25) / 5);
      const z = velocity == null ? null : velocity / C;
      return fromRaDecDistance("Cosmicflows-4", ra, dec, distanceMpc, {
        redshift: z == null ? null : Number(z.toFixed(7)),
        velocityKms: velocity == null ? null : Math.round(velocity),
        pgc: parseNumber(row.PGC),
        size: 3.2,
      });
    })
    .filter(Boolean);
}

const sourceFetchers = [
  ["SDSS", fetchSdss, "SDSS DR18 SkyServer galaxy spectra"],
  ["2MRS", fetch2Mrs, "NASA HEASARC 2MASS Redshift Survey"],
  ["GLADE+", fetchGlade, "Official GLADE+ ASCII catalog, bounded stream sample"],
  ["Cosmicflows-4", fetchCosmicflows, "VizieR J/ApJ/944/94 table2"],
];

const allPoints = [];
const sources = [];
for (const [id, fetcher, provenance] of sourceFetchers) {
  process.stdout.write(`Fetching ${id}... `);
  const points = await fetcher();
  allPoints.push(...points);
  sources.push({ id, count: points.length, provenance });
  console.log(`${points.length} points`);
}

mkdirSync(dirname(outputPath), { recursive: true });
writeFileSync(
  outputPath,
  JSON.stringify(
    {
      meta: {
        generatedAt: new Date().toISOString(),
        units: "Mpc for true/catalog distances; viewer can use log-radius display",
        sources,
      },
      points: allPoints,
    },
    null,
    2,
  ),
);

console.log(`Wrote ${allPoints.length} normalized points to ${outputPath}`);
