const NEARBY_GALAXIES = [
  {
    name: "Large Magellanic Cloud",
    aliases: ["LMC"],
    type: "satellite dwarf galaxy",
    ra: 80.894,
    dec: -69.756,
    distanceMpc: 0.05,
    matchRadiusDeg: 2.5,
  },
  {
    name: "Small Magellanic Cloud",
    aliases: ["SMC"],
    type: "satellite dwarf galaxy",
    ra: 13.187,
    dec: -72.829,
    distanceMpc: 0.062,
    matchRadiusDeg: 1.8,
  },
  {
    name: "Andromeda Galaxy",
    aliases: ["M31", "NGC 224"],
    type: "spiral galaxy",
    ra: 10.685,
    dec: 41.269,
    distanceMpc: 0.78,
    matchRadiusDeg: 1.6,
  },
  {
    name: "Triangulum Galaxy",
    aliases: ["M33", "NGC 598"],
    type: "spiral galaxy",
    ra: 23.462,
    dec: 30.66,
    distanceMpc: 0.86,
    matchRadiusDeg: 0.7,
  },
  {
    name: "M32",
    aliases: ["NGC 221"],
    type: "compact elliptical satellite galaxy",
    ra: 10.674,
    dec: 40.865,
    distanceMpc: 0.78,
    matchRadiusDeg: 0.18,
  },
  {
    name: "NGC 205",
    aliases: ["M110"],
    type: "dwarf elliptical satellite galaxy",
    ra: 10.092,
    dec: 41.685,
    distanceMpc: 0.82,
    matchRadiusDeg: 0.25,
  },
  {
    name: "NGC 147",
    aliases: ["Caldwell 17"],
    type: "dwarf spheroidal satellite galaxy",
    ra: 8.3,
    dec: 48.509,
    distanceMpc: 0.73,
    matchRadiusDeg: 0.25,
  },
  {
    name: "NGC 185",
    aliases: ["Caldwell 18"],
    type: "dwarf spheroidal satellite galaxy",
    ra: 9.741,
    dec: 48.337,
    distanceMpc: 0.62,
    matchRadiusDeg: 0.25,
  },
  {
    name: "IC 10",
    aliases: ["starburst dwarf"],
    type: "irregular dwarf galaxy",
    ra: 5.072,
    dec: 59.303,
    distanceMpc: 0.79,
    matchRadiusDeg: 0.35,
  },
  {
    name: "IC 1613",
    aliases: ["Caldwell 51"],
    type: "irregular dwarf galaxy",
    ra: 16.199,
    dec: 2.118,
    distanceMpc: 0.73,
    matchRadiusDeg: 0.3,
  },
  {
    name: "WLM Galaxy",
    aliases: ["Wolf-Lundmark-Melotte"],
    type: "barred irregular dwarf galaxy",
    ra: 0.492,
    dec: -15.461,
    distanceMpc: 0.99,
    matchRadiusDeg: 0.35,
  },
  {
    name: "NGC 55",
    aliases: ["Caldwell 72"],
    type: "Magellanic spiral galaxy",
    ra: 3.723,
    dec: -39.197,
    distanceMpc: 2.0,
    matchRadiusDeg: 0.5,
  },
  {
    name: "NGC 300",
    aliases: ["Caldwell 70"],
    type: "spiral galaxy",
    ra: 13.723,
    dec: -37.684,
    distanceMpc: 2.0,
    matchRadiusDeg: 0.5,
  },
  {
    name: "Sculptor Galaxy",
    aliases: ["NGC 253", "Silver Coin Galaxy"],
    type: "starburst spiral galaxy",
    ra: 11.888,
    dec: -25.288,
    distanceMpc: 3.5,
    matchRadiusDeg: 0.5,
  },
  {
    name: "Mirach's Ghost",
    aliases: ["NGC 404"],
    type: "lenticular galaxy",
    ra: 17.362,
    dec: 35.718,
    distanceMpc: 3.1,
    matchRadiusDeg: 0.25,
  },
  {
    name: "NGC 2403",
    aliases: ["Caldwell 7"],
    type: "spiral galaxy",
    ra: 114.214,
    dec: 65.602,
    distanceMpc: 3.2,
    matchRadiusDeg: 0.35,
  },
  {
    name: "Bode's Galaxy",
    aliases: ["M81", "NGC 3031"],
    type: "spiral galaxy",
    ra: 148.888,
    dec: 69.065,
    distanceMpc: 3.6,
    matchRadiusDeg: 0.45,
  },
  {
    name: "Cigar Galaxy",
    aliases: ["M82", "NGC 3034"],
    type: "starburst galaxy",
    ra: 148.969,
    dec: 69.679,
    distanceMpc: 3.6,
    matchRadiusDeg: 0.35,
  },
  {
    name: "Centaurus A",
    aliases: ["NGC 5128"],
    type: "active elliptical galaxy",
    ra: 201.365,
    dec: -43.019,
    distanceMpc: 3.8,
    matchRadiusDeg: 0.55,
  },
  {
    name: "Southern Pinwheel Galaxy",
    aliases: ["M83", "NGC 5236"],
    type: "barred spiral galaxy",
    ra: 204.254,
    dec: -29.866,
    distanceMpc: 4.6,
    matchRadiusDeg: 0.45,
  },
  {
    name: "M94",
    aliases: ["NGC 4736", "Croc's Eye Galaxy"],
    type: "spiral galaxy",
    ra: 192.721,
    dec: 41.12,
    distanceMpc: 4.4,
    matchRadiusDeg: 0.3,
  },
  {
    name: "Black Eye Galaxy",
    aliases: ["M64", "NGC 4826"],
    type: "spiral galaxy",
    ra: 194.182,
    dec: 21.683,
    distanceMpc: 5.2,
    matchRadiusDeg: 0.3,
  },
  {
    name: "Pinwheel Galaxy",
    aliases: ["M101", "NGC 5457"],
    type: "face-on spiral galaxy",
    ra: 210.803,
    dec: 54.349,
    distanceMpc: 6.9,
    matchRadiusDeg: 0.5,
  },
  {
    name: "M106",
    aliases: ["NGC 4258"],
    type: "intermediate spiral galaxy",
    ra: 184.74,
    dec: 47.304,
    distanceMpc: 7.6,
    matchRadiusDeg: 0.3,
  },
  {
    name: "Whirlpool Galaxy",
    aliases: ["M51", "NGC 5194"],
    type: "interacting spiral galaxy",
    ra: 202.47,
    dec: 47.195,
    distanceMpc: 8.6,
    matchRadiusDeg: 0.35,
  },
  {
    name: "Sunflower Galaxy",
    aliases: ["M63", "NGC 5055"],
    type: "spiral galaxy",
    ra: 198.955,
    dec: 42.029,
    distanceMpc: 8.9,
    matchRadiusDeg: 0.3,
  },
  {
    name: "Sombrero Galaxy",
    aliases: ["M104", "NGC 4594"],
    type: "lenticular galaxy",
    ra: 189.998,
    dec: -11.623,
    distanceMpc: 9.6,
    matchRadiusDeg: 0.3,
  },
  {
    name: "M66",
    aliases: ["NGC 3627"],
    type: "barred spiral galaxy",
    ra: 170.063,
    dec: 12.991,
    distanceMpc: 10.8,
    matchRadiusDeg: 0.25,
  },
  {
    name: "Hamburger Galaxy",
    aliases: ["NGC 3628"],
    type: "edge-on spiral galaxy",
    ra: 170.071,
    dec: 13.59,
    distanceMpc: 11.0,
    matchRadiusDeg: 0.25,
  },
  {
    name: "Virgo A",
    aliases: ["M87", "NGC 4486"],
    type: "giant elliptical galaxy",
    ra: 187.706,
    dec: 12.391,
    distanceMpc: 16.4,
    matchRadiusDeg: 0.3,
  },
];

function degToRad(deg) {
  return (deg * Math.PI) / 180;
}

function angularSeparationDeg(aRa, aDec, bRa, bDec) {
  const ra1 = degToRad(aRa);
  const dec1 = degToRad(aDec);
  const ra2 = degToRad(bRa);
  const dec2 = degToRad(bDec);
  const cosSeparation =
    Math.sin(dec1) * Math.sin(dec2) + Math.cos(dec1) * Math.cos(dec2) * Math.cos(ra1 - ra2);
  return (Math.acos(Math.max(-1, Math.min(1, cosSeparation))) * 180) / Math.PI;
}

function distanceToleranceMpc(distanceMpc) {
  return Math.max(0.18, distanceMpc * 0.55);
}

export function matchNearbyGalaxy(point) {
  if (!point || !Number.isFinite(point.ra) || !Number.isFinite(point.dec) || !Number.isFinite(point.distanceMpc)) {
    return null;
  }
  if (point.distanceMpc > 24) return null;

  let best = null;
  for (const galaxy of NEARBY_GALAXIES) {
    const separationDeg = angularSeparationDeg(point.ra, point.dec, galaxy.ra, galaxy.dec);
    if (separationDeg > galaxy.matchRadiusDeg) continue;

    const distanceDeltaMpc = Math.abs(point.distanceMpc - galaxy.distanceMpc);
    const toleranceMpc = distanceToleranceMpc(galaxy.distanceMpc);
    if (distanceDeltaMpc > toleranceMpc) continue;

    const score = (separationDeg / galaxy.matchRadiusDeg) * 0.75 + (distanceDeltaMpc / toleranceMpc) * 0.25;
    if (!best || score < best.score) {
      best = {
        ...galaxy,
        separationDeg,
        distanceDeltaMpc,
        score,
      };
    }
  }

  return best;
}
