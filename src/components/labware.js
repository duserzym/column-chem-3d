// Clean-lab labware at real scale (metres): PFA/PTFE columns, beakers, microcapsules,
// Parr-type digestion vessels, dropper bottles, hotplates, ovens, furnaces, centrifuges.
// Geometry is representative (no vendor drawings). Builders return { group, parts, ... }
// following src/components/parts.js.
import * as THREE from 'three';
import { M } from '../core/materials.js';
import { mesh, roundedBox, tubeShell, rod } from '../core/geom.js';
import { part } from './parts.js';

const mm = 1e-3;
const cache = new Map();
const mk = (k, f) => { if (!cache.has(k)) cache.set(k, f()); return cache.get(k); };

/** Labware materials (no transmission → cheap; translucency via opacity). */
export const LM = {
  pfa: () => mk('pfa', () => new THREE.MeshPhysicalMaterial({ color: 0xf2f4f1, roughness: 0.35, metalness: 0, transparent: true, opacity: 0.42, clearcoat: 0.4, side: THREE.DoubleSide, depthWrite: false, name: 'PFA (translucent)' })),
  pfaSolid: () => mk('pfaSolid', () => new THREE.MeshPhysicalMaterial({ color: 0xf4f3ee, roughness: 0.45, metalness: 0, clearcoat: 0.3, name: 'PFA' })),
  ptfe: () => mk('ptfe', () => new THREE.MeshPhysicalMaterial({ color: 0xf7f7f3, roughness: 0.6, metalness: 0, sheen: 0.4, name: 'PTFE (Teflon)' })),
  fep: () => mk('fep', () => new THREE.MeshPhysicalMaterial({ color: 0xeef6f7, roughness: 0.15, metalness: 0, transparent: true, opacity: 0.3, clearcoat: 0.8, side: THREE.DoubleSide, depthWrite: false, name: 'FEP heat-shrink tubing' })),
  glassClear: () => mk('glassClear', () => new THREE.MeshPhysicalMaterial({ color: 0xe8f4ff, roughness: 0.03, metalness: 0, transparent: true, opacity: 0.22, clearcoat: 1, side: THREE.DoubleSide, depthWrite: false, name: 'quartz / glass' })),
  frit: () => mk('frit', () => new THREE.MeshPhysicalMaterial({ color: 0xe9e9e2, roughness: 0.95, metalness: 0, name: 'porous PE frit' })),
  pp: () => mk('pp', () => new THREE.MeshPhysicalMaterial({ color: 0xf2efe4, roughness: 0.4, metalness: 0, transparent: true, opacity: 0.55, depthWrite: false, name: 'polypropylene' })),
  bench: () => mk('bench', () => new THREE.MeshPhysicalMaterial({ color: 0x2f3338, roughness: 0.8, metalness: 0, name: 'epoxy resin benchtop' })),
  enamel: (c = 0xe8e8e4) => mk('enamel' + c, () => new THREE.MeshPhysicalMaterial({ color: c, roughness: 0.35, metalness: 0.1, clearcoat: 0.5, name: 'painted enclosure' })),
  ceramicTop: () => mk('ceramicTop', () => new THREE.MeshPhysicalMaterial({ color: 0xdcdcd4, roughness: 0.25, metalness: 0, clearcoat: 0.6, name: 'ceramic hotplate top' })),
  furnaceBrick: () => mk('furnaceBrick', () => new THREE.MeshPhysicalMaterial({ color: 0xe8dcc4, roughness: 0.95, metalness: 0, name: 'refractory insulation' })),
  label: () => mk('label', () => new THREE.MeshPhysicalMaterial({ color: 0xffffff, roughness: 0.8, name: 'label' })),
};

/** Liquid colours by medium (visual cue only). */
export function liquidColor(med) {
  if (!med) return 0xdbeafe;
  switch (med.acid) {
    case 'HCl': return med.M >= 5 ? 0xfef3c7 : 0xfefce8;
    case 'HBr': return 0xfde68a;
    case 'HNO3': return 0xf0f9ff;
    case 'HCl-HF': return 0xecfccb;
    case 'HCit': return 0xfce7f3;
    case 'MLA': return 0xede9fe;
    case 'HF': return 0xecfeff;
    default: return 0xdbeafe; // water
  }
}

export function liquidMaterial(color = 0xdbeafe, opacity = 0.55) {
  return new THREE.MeshPhysicalMaterial({ color, roughness: 0.05, metalness: 0, transparent: true, opacity, clearcoat: 1, depthWrite: false, name: 'solution' });
}

/** Lathe helper: profile [[r, y]...] (metres) → mesh. */
function lathe(profile, mat, seg = 40, name = '') {
  const g = new THREE.LatheGeometry(profile.map(([r, y]) => new THREE.Vector2(r, y)), seg);
  return mesh(g, mat, { name });
}

// ---------------------------------------------------------------------------------------
/**
 * Ion-exchange column (heat-shrink micro-column, Savillex-type PFA column or long quartz).
 * Origin at the drip tip; +Y up. Returns handles to drive bands, liquid and drops.
 * @param {object} geom {kind, id_mm, bedHeight_mm, reservoir_mL}
 */
export function buildColumn(geom, { resinColor = 0xf3e3b5, plates = 40 } = {}) {
  const group = new THREE.Group();
  group.name = 'ion-exchange column';
  const parts = [];
  const r = (geom.id_mm / 2) * mm;
  const wall = geom.kind === 'heatshrink' ? 0.35 * mm : geom.kind === 'quartz' ? 1.0 * mm : 0.9 * mm;
  const bedH = Math.max(4 * mm, geom.bedHeight_mm * mm);
  const tipH = 6 * mm;
  const fritH = Math.max(0.8 * mm, r * 0.5);
  // reservoir: cylinder whose volume ≈ reservoir_mL
  const resR = Math.max(r * 2.2, Math.min(14 * mm, Math.cbrt((geom.reservoir_mL * 1e-6) / Math.PI) * 0.75));
  const resH = (geom.reservoir_mL * 1e-6) / (Math.PI * resR * resR);
  const mat = geom.kind === 'heatshrink' ? LM.fep() : geom.kind === 'quartz' ? LM.glassClear() : LM.pfa();
  const y0 = tipH, y1 = y0 + fritH + bedH, y2 = y1 + resR * 1.2, y3 = y2 + resH;
  const body = lathe([
    [r * 0.35, 0], [r * 0.35 + wall, 0], [r + wall, tipH * 0.6], [r + wall, y1], [resR + wall, y2], [resR + wall, y3 + 1 * mm], [resR + wall * 1.6, y3 + 1.6 * mm],
    [resR, y3 + 1.6 * mm], [resR, y2 + 0.4 * mm], [r, y1 + 0.4 * mm], [r, tipH * 0.6], [r * 0.35, 0.2 * mm],
  ], mat, 48, 'column body');
  body.renderOrder = 3;
  const shell = new THREE.Group();
  shell.add(body);
  group.add(shell);
  parts.push(part(shell, [-(resR + 8 * mm), 0, 0], geom.kind === 'heatshrink' ? 'FEP/PTFE heat-shrink micro-column' : geom.kind === 'quartz' ? 'Long column (quartz/PFA)' : 'PFA column (Savillex-type)',
    `Inner diameter ${geom.id_mm} mm; resin bed ${(geom.bedHeight_mm).toFixed(1)} mm tall (${(geom.bed_mL * 1000).toFixed(geom.bed_mL < 1 ? 0 : 0)} µL); reservoir ≈${geom.reservoir_mL} mL. Stored in acid (e.g. 4 N HNO₃ or 6 M HCl) between uses.`, { order: 0.1, shell: true }));

  const frit = mesh(new THREE.CylinderGeometry(r * 0.98, r * 0.98, fritH, 28), LM.frit(), { name: 'frit' });
  frit.position.y = y0 + fritH / 2;
  group.add(frit);
  parts.push(part(frit, [0, -12 * mm, 0], 'Porous frit', 'Polyethylene/PTFE frit (or quartz wool) that holds the resin bed; it must sit level so the bed is not channelled.', { order: 0.5 }));

  // resin bed with a band texture (1 × plates canvas)
  const canvas = document.createElement('canvas');
  canvas.width = 4; canvas.height = Math.max(16, plates);
  const ctx2d = canvas.getContext('2d');
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.magFilter = THREE.LinearFilter;
  const resinMat = new THREE.MeshPhysicalMaterial({ map: tex, roughness: 0.85, metalness: 0, sheen: 0.5, emissive: 0xffffff, emissiveMap: tex, emissiveIntensity: 0.25, name: 'resin bed' });
  const resin = mesh(new THREE.CylinderGeometry(r * 0.97, r * 0.97, bedH, 32, 1), resinMat, { name: 'resin bed' });
  resin.position.y = y0 + fritH + bedH / 2;
  // convex-up resin surface (as instructed in the guidebook)
  const cap = mesh(new THREE.SphereGeometry(r * 0.97, 24, 8, 0, Math.PI * 2, 0, Math.PI / 2), resinMat, { name: 'resin surface' });
  cap.scale.y = 0.35;
  cap.position.y = bedH / 2;
  resin.add(cap);
  const resinG = new THREE.Group();
  resinG.add(resin);
  group.add(resinG);
  parts.push(part(resinG, [8 * mm + resR, 0, 0], 'Resin bed', 'Slurried in MQ-H₂O, packed without bubbles, with a slightly convex-up surface projecting into the reservoir. Coloured bands show where each element sits (model).', { order: 0.4 }));

  const baseRGB = new THREE.Color(resinColor);
  function drawBands(profiles, colors, inputs) {
    const H = canvas.height, N = profiles?.[0]?.length ?? 0;
    ctx2d.fillStyle = '#' + baseRGB.getHexString();
    ctx2d.fillRect(0, 0, 4, H);
    if (!N) { tex.needsUpdate = true; return; }
    for (let row = 0; row < H; row++) {
      // canvas row 0 → texture v = 1 → top of the cylinder → plate 0 (top of the bed)
      const plate = Math.min(N - 1, Math.floor((row / H) * N));
      let rr = baseRGB.r, gg = baseRGB.g, bb = baseRGB.b;
      profiles.forEach((prof, i) => {
        const inp = inputs[i] || 1;
        const a = Math.min(1, Math.sqrt((prof[plate] * N) / (inp * 1.2)));
        if (a <= 0.003) return;
        const c = new THREE.Color(colors[i]);
        rr = rr * (1 - a * 0.92) + c.r * a * 0.92;
        gg = gg * (1 - a * 0.92) + c.g * a * 0.92;
        bb = bb * (1 - a * 0.92) + c.b * a * 0.92;
      });
      ctx2d.fillStyle = `rgb(${Math.round(rr * 255)},${Math.round(gg * 255)},${Math.round(bb * 255)})`;
      ctx2d.fillRect(0, row, 4, 1);
    }
    tex.needsUpdate = true;
  }
  drawBands(null);

  // reservoir liquid
  const liqMat = liquidMaterial();
  const liquid = mesh(new THREE.CylinderGeometry(resR * 0.98, resR * 0.98, 1, 32), liqMat, { name: 'reagent in reservoir' });
  liquid.renderOrder = 2;
  liquid.visible = false;
  shell.add(liquid); // moves with the column body when exploded
  const liqBase = y2;
  function setLiquid(frac, med) {
    // frac of reservoir volume
    const h = Math.max(0, Math.min(1, frac)) * resH;
    liquid.visible = h > 0.0002;
    liquid.scale.y = Math.max(h, 1e-5);
    liquid.position.y = liqBase + h / 2;
    liqMat.color.setHex(liquidColor(med));
  }

  return {
    group, parts, drawBands, setLiquid, resin: resinG,
    tip: new THREE.Vector3(0, 0, 0), top: new THREE.Vector3(0, y3 + 2 * mm, 0),
    height: y3 + 1.6 * mm, resR, bedTop: y1, bedBottom: y0 + fritH,
  };
}

/** 30 mL Teflon dropper bottle with spaghetti tip. */
export function buildDropperBottle({ liquid = 0xfefce8, label = '' } = {}) {
  const group = new THREE.Group();
  const body = lathe([[0, 0], [14 * mm, 0], [15 * mm, 2 * mm], [15 * mm, 42 * mm], [9 * mm, 50 * mm], [6 * mm, 52 * mm], [0, 52 * mm]], LM.ptfe(), 40, 'dropper bottle');
  const cap = lathe([[0, 52 * mm], [6.5 * mm, 52 * mm], [6.5 * mm, 60 * mm], [3 * mm, 66 * mm], [1.2 * mm, 76 * mm], [0.6 * mm, 80 * mm], [0, 80 * mm]], LM.ptfe(), 32, 'spaghetti tip');
  const liq = mesh(new THREE.CylinderGeometry(13.6 * mm, 13.6 * mm, 30 * mm, 32), liquidMaterial(liquid, 0.4), { name: 'reagent' });
  liq.position.y = 17 * mm;
  group.add(body, cap, liq);
  return { group, parts: [part(group, [0, 0.03, 0], `30 mL Teflon dropper bottle${label ? ' — ' + label : ''}`, 'Reagents are dispensed in calibrated drops (≈30 µL each) straight from the bottle — no pipettes, fewer contamination sources (guidebook).')], tip: new THREE.Vector3(0, 80 * mm, 0), setLiquid: (c) => liq.material.color.setHex(c) };
}

/** Savillex-type PFA beaker (round- or flat-bottom), volume in mL. */
export function buildBeaker(volume = 7, { roundBottom = true, capped = false, name = 'Savillex PFA beaker' } = {}) {
  const group = new THREE.Group();
  const r = Math.cbrt((volume * 1e-6) / (Math.PI * 1.3)) * 1.0;
  const h = r * 1.3 * 1.1;
  const prof = roundBottom
    ? [[0, 0], [r * 0.6, r * 0.12], [r, r * 0.55], [r, h], [r * 1.08, h], [r * 1.08, h + 2 * mm], [r * 0.93, h + 2 * mm], [r * 0.93, r * 0.55], [r * 0.55, r * 0.2], [0, 0.0015]]
    : [[0, 0], [r, 0], [r, h], [r * 1.08, h], [r * 1.08, h + 2 * mm], [r * 0.93, h + 2 * mm], [r * 0.93, 1.5 * mm], [0, 1.5 * mm]];
  const b = lathe(prof, LM.pfa(), 40, name);
  b.renderOrder = 3;
  group.add(b);
  const liqMat = liquidMaterial(0xdbeafe, 0.5);
  const liq = mesh(new THREE.CylinderGeometry(r * 0.9, r * 0.9, 1, 32), liqMat, { name: 'solution' });
  liq.visible = false;
  group.add(liq);
  let capMesh = null;
  if (capped) {
    capMesh = mesh(new THREE.CylinderGeometry(r * 1.15, r * 1.15, 8 * mm, 32), LM.pfaSolid(), { name: 'screw cap' });
    capMesh.position.y = h + 6 * mm;
    group.add(capMesh);
  }
  function setFill(frac, color = 0xdbeafe) {
    const hh = Math.max(0, Math.min(1, frac)) * h * 0.85;
    liq.visible = hh > 0.0003;
    liq.scale.y = Math.max(hh, 1e-5);
    liq.position.y = (roundBottom ? r * 0.15 : 1.5 * mm) + hh / 2;
    liqMat.color.setHex(color);
  }
  return { group, parts: [part(group, [0, 0.02, 0], `${volume} mL ${name}`, 'Perfluoroalkoxy (PFA) labware: chemically inert, very low blank after acid cleaning (HF, then 6 M HCl fluxing).')], setFill, radius: r, height: h, cap: capMesh };
}

/** 300 µL Savillex PFA microcapsule with screw cap. */
export function buildMicrocapsule() {
  const group = new THREE.Group();
  const body = lathe([[0, 0], [2.4 * mm, 0], [3.0 * mm, 1 * mm], [3.0 * mm, 13 * mm], [2.4 * mm, 13 * mm], [2.4 * mm, 1.4 * mm], [0, 1.4 * mm]], LM.pfaSolid(), 24, 'microcapsule');
  const cap = mesh(new THREE.CylinderGeometry(3.5 * mm, 3.5 * mm, 5 * mm, 20), LM.pfaSolid(), { name: 'capsule cap' });
  cap.position.y = 15 * mm;
  const liqMat = liquidMaterial(0xecfeff, 0.6);
  const liq = mesh(new THREE.CylinderGeometry(2.3 * mm, 2.3 * mm, 1, 16), liqMat, { name: 'acid in capsule' });
  liq.visible = false;
  group.add(body, cap, liq);
  return {
    group, cap, liq,
    setFill(frac, color) { const h = frac * 9 * mm; liq.visible = h > 0.0002; liq.scale.y = Math.max(h, 1e-5); liq.position.y = 1.4 * mm + h / 2; if (color != null) liqMat.color.setHex(color); },
  };
}

/** Parr-type acid digestion vessel: steel jacket + PTFE liner + stem with 3 pucks × 5 microcapsules. */
export function buildParrVessel() {
  const group = new THREE.Group();
  group.name = 'Parr-type digestion vessel';
  const parts = [];
  const R = 34 * mm, H = 110 * mm;
  // steel jacket body (open top)
  const jacket = new THREE.Group();
  const body = lathe([[R + 8 * mm, 6 * mm], [R + 8 * mm, H], [R + 2 * mm, H], [R + 2 * mm, 10 * mm], [0, 10 * mm]], M.steelBrushed(), 48, 'steel jacket');
  jacket.add(body);
  for (let i = 0; i < 3; i++) {
    const knurl = mesh(new THREE.TorusGeometry(R + 8.4 * mm, 0.8 * mm, 6, 48), M.steel());
    knurl.rotation.x = Math.PI / 2; knurl.position.y = H - (10 + i * 4) * mm;
    jacket.add(knurl);
  }
  group.add(jacket);
  parts.push(part(jacket, [0, 0, 0], 'Steel jacket (body)', 'Stainless-steel pressure jacket. The PTFE liner slides in; the bottom plate is left loose so the liner can expand (guidebook).', { order: 0.0, shell: true }));
  const bottom = mesh(new THREE.CylinderGeometry(R + 6 * mm, R + 6 * mm, 5 * mm, 40), M.steel(), { name: 'loose bottom plate' });
  bottom.position.y = 3 * mm;
  group.add(bottom);
  parts.push(part(bottom, [0, -0.06, 0], 'Bottom plate (kept loose)', 'Left loose when assembling so thermal expansion of the PTFE liner is not constrained.', { order: 0.05 }));
  // cap + screws
  const capG = new THREE.Group();
  const capMesh = mesh(new THREE.CylinderGeometry(R + 10 * mm, R + 10 * mm, 18 * mm, 48), M.steel(), { name: 'jacket cap' });
  capG.add(capMesh);
  for (let i = 0; i < 6; i++) {
    const a = (i / 6) * Math.PI * 2;
    const s = mesh(new THREE.CylinderGeometry(3.5 * mm, 3.5 * mm, 22 * mm, 6), M.steelPolished(), { name: 'cap screw' });
    s.position.set(Math.cos(a) * (R * 0.55), 6 * mm, Math.sin(a) * (R * 0.55));
    capG.add(s);
  }
  capG.position.y = H + 9 * mm;
  group.add(capG);
  parts.push(part(capG, [0, 0.16, 0], 'Jacket cap & cap screws', 'Tightened with a torque wrench in an alternating star pattern so the liner seals evenly.', { order: 0.0 }));
  // PTFE liner + lid
  const liner = new THREE.Group();
  const lb = lathe([[0, 12 * mm], [R, 12 * mm], [R, H - 2 * mm], [R - 3 * mm, H - 2 * mm], [R - 3 * mm, 16 * mm], [0, 16 * mm]], LM.ptfe(), 48, 'PTFE liner');
  liner.add(lb);
  const moatMat = liquidMaterial(0xecfeff, 0.55);
  const moat = mesh(new THREE.CylinderGeometry(R - 3.2 * mm, R - 3.2 * mm, 1, 40), moatMat, { name: 'moat acid (7 mL)' });
  moat.scale.y = 2.2 * mm; moat.position.y = 16 * mm + 1.1 * mm;
  liner.add(moat);
  group.add(liner);
  parts.push(part(liner, [0, 0.13, 0.09], 'Large PTFE liner cup', 'Holds 7 mL of “moat” acid matching the acid in the capsules (29 M HF or 6 M HCl) so capsules see equal vapour pressure inside and out.', { order: 0.15, shell: true }));
  const lid = mesh(new THREE.CylinderGeometry(R + 1 * mm, R + 1 * mm, 6 * mm, 40), LM.ptfe(), { name: 'liner lid' });
  lid.position.y = H + 1 * mm;
  group.add(lid);
  parts.push(part(lid, [0, 0.12, 0], 'Liner lid', 'Covered and wrapped with Parafilm for transport to the oven lab; Parafilm removed before the jacket is assembled.', { order: 0.1 }));
  // stem + 3 pucks × 5 capsules
  const stem = new THREE.Group();
  const post = rod(new THREE.Vector3(0, 16 * mm, 0), new THREE.Vector3(0, H - 10 * mm, 0), 3 * mm, LM.ptfe());
  stem.add(post);
  const capsules = [];
  const pucks = [];
  for (let k = 0; k < 3; k++) {
    const puck = new THREE.Group();
    const disc = mesh(new THREE.CylinderGeometry(R - 5 * mm, R - 5 * mm, 9 * mm, 40), LM.ptfe(), { name: 'PTFE puck' });
    puck.add(disc);
    for (let i = 0; i < 5; i++) {
      const a = (i / 5) * Math.PI * 2;
      const c = buildMicrocapsule();
      c.group.position.set(Math.cos(a) * 17 * mm, -2 * mm, Math.sin(a) * 17 * mm);
      puck.add(c.group);
      capsules.push(c);
    }
    puck.position.y = 22 * mm + k * 28 * mm;
    stem.add(puck);
    pucks.push(puck);
    parts.push(part(puck, [0.08 * (k - 1), 0.05 + 0.04 * k, 0.18], `Puck ${k + 1} (5 × 300 µL microcapsules)`, 'Five 300 µL Savillex PFA microcapsules per white Teflon puck; three pucks per vessel = 15 capsules.', { order: 0.35 + 0.05 * k }));
  }
  group.add(stem);
  parts.push(part(stem, [0, 0.12, 0.18], 'Stem', 'Central PTFE stem carrying the pucks.', { order: 0.3 }));
  return { group, parts, capsules, pucks, moat, setMoat: (color) => moatMat.color.setHex(color), height: H + 18 * mm };
}

/** Bench hotplate with temperature dial. */
export function buildHotplate({ w = 0.3, d = 0.3 } = {}) {
  const group = new THREE.Group();
  const base = mesh(roundedBox(w, 0.06, d, 0.008), LM.enamel(0xe6e8ea), { name: 'hotplate body' });
  base.position.y = 0.03;
  const top = mesh(roundedBox(w * 0.92, 0.008, d * 0.92, 0.003), LM.ceramicTop(), { name: 'hotplate top' });
  top.position.y = 0.064;
  const glowMat = new THREE.MeshBasicMaterial({ color: 0xff5a1f, transparent: true, opacity: 0, toneMapped: false });
  const glow = mesh(new THREE.PlaneGeometry(w * 0.8, d * 0.8), glowMat, { name: 'heat glow' });
  glow.rotation.x = -Math.PI / 2; glow.position.y = 0.0685;
  const dial = mesh(new THREE.CylinderGeometry(0.012, 0.012, 0.01, 20), M.black(), { name: 'dial' });
  dial.rotation.x = Math.PI / 2; dial.position.set(0, 0.03, d / 2 + 0.005);
  group.add(base, top, glow, dial);
  return { group, parts: [part(group, [0, 0, 0], 'Hotplate', 'Used at 120 °C for beaker fluxing and dry-downs, 170 °C (U–Th), lower for HBr and MLA dry-downs.')], topY: 0.068, setHeat: (f) => { glowMat.opacity = 0.35 * f; } };
}

/** Laboratory oven (for the Parr vessels). */
export function buildOven() {
  const group = new THREE.Group();
  const parts = [];
  const shell = mesh(roundedBox(0.55, 0.5, 0.5, 0.01), LM.enamel(0xd7dbe0), { name: 'oven cabinet' });
  shell.position.y = 0.25;
  const door = new THREE.Group();
  const dm = mesh(roundedBox(0.5, 0.42, 0.02, 0.006), LM.enamel(0xc7ccd3), { name: 'oven door' });
  const win = mesh(new THREE.PlaneGeometry(0.3, 0.2), LM.glassClear(), { name: 'window' });
  win.position.z = 0.011;
  const handle = mesh(roundedBox(0.3, 0.02, 0.02, 0.005), M.steelPolished());
  handle.position.set(0, 0.17, 0.02);
  door.add(dm, win, handle);
  door.position.set(0, 0.25, 0.26);
  const glowMat = new THREE.MeshBasicMaterial({ color: 0xff7a2f, transparent: true, opacity: 0, toneMapped: false });
  const glow = mesh(new THREE.PlaneGeometry(0.46, 0.4), glowMat);
  glow.position.set(0, 0.25, 0.248);
  group.add(shell, glow, door);
  parts.push(part(door, [0, 0, 0.25], 'Oven door', 'Ovens at 180 °C (HCl / cleaning), 190 °C (chemical abrasion, ~12 h) and 220 °C (HF dissolution, 48 h) per the guidebook.', { order: 0 }));
  parts.push(part(shell, [0, 0, 0], 'Laboratory oven', 'Convection oven for steel-jacketed digestion vessels.', { shell: true }));
  return { group, parts, setHeat: (f) => { glowMat.opacity = 0.25 * f; } };
}

/** Muffle furnace with quartz crucible (zircon annealing). */
export function buildFurnace() {
  const group = new THREE.Group();
  const parts = [];
  const body = mesh(roundedBox(0.42, 0.36, 0.4, 0.01), LM.enamel(0x6b7280), { name: 'muffle furnace' });
  body.position.y = 0.18;
  const cavity = mesh(roundedBox(0.22, 0.14, 0.04, 0.004), LM.furnaceBrick(), { name: 'chamber' });
  cavity.position.set(0, 0.2, 0.185);
  const glowMat = new THREE.MeshBasicMaterial({ color: 0xff8c2a, transparent: true, opacity: 0, toneMapped: false });
  const glow = mesh(new THREE.CircleGeometry(0.018, 24), glowMat);
  glow.position.set(0, 0.2, 0.2515); // hot peep-hole in the door
  const door = new THREE.Group();
  const dm = mesh(roundedBox(0.26, 0.18, 0.05, 0.006), LM.enamel(0x4b5563), { name: 'furnace door' });
  const plug = mesh(roundedBox(0.2, 0.12, 0.03, 0.004), LM.furnaceBrick());
  plug.position.z = -0.03;
  door.add(dm, plug);
  door.position.set(0, 0.2, 0.225);
  const crucible = lathe([[0, 0], [18 * mm, 0], [22 * mm, 16 * mm], [20.5 * mm, 16 * mm], [16.5 * mm, 1.5 * mm], [0, 1.5 * mm]], LM.glassClear(), 32, 'quartz crucible');
  crucible.position.set(0, 0.135, 0.15);
  group.add(body, cavity, glow, crucible, door);
  parts.push(part(door, [0, 0.12, 0.15], 'Furnace door', '', { order: 0 }));
  parts.push(part(crucible, [0, 0.12, 0.3], 'Quartz crucible (zircons)', 'Zircons are annealed in quartz crucibles before chemical abrasion (typically 800–1100 °C for 36–60 h in the literature; e.g. 900 °C, 60 h). The guidebook defers to the mineral-separation guidebook for the exact recipe.', { order: 0.3 }));
  parts.push(part(body, [0, 0, 0], 'Muffle furnace', 'High-temperature annealing repairs radiation damage in the crystalline domains so that HF leaching removes only the most damaged, Pb-loss-prone zones (Mattinson, 2005).', { shell: true }));
  return { group, parts, setHeat: (f) => { glowMat.opacity = 0.9 * f; }, crucible };
}

/** Ultrasonic bath. */
export function buildSonicator() {
  const group = new THREE.Group();
  const b = mesh(roundedBox(0.26, 0.14, 0.18, 0.01), M.steelBrushed(), { name: 'ultrasonic bath' });
  b.position.y = 0.07;
  const water = mesh(new THREE.BoxGeometry(0.22, 0.004, 0.14), liquidMaterial(0xbfe3ff, 0.6));
  water.position.y = 0.125;
  group.add(b, water);
  return { group, parts: [part(group, [0, 0, 0], 'Ultrasonic bath', 'Hex beakers sonicated 30 min in 3.5 M HNO₃ after chemical abrasion (guidebook).')] };
}

/** 15/50 mL centrifuge tube with optional Fe(OH)₃ flakes. */
export function buildCentrifugeTube({ volume = 15 } = {}) {
  const group = new THREE.Group();
  const R = volume > 20 ? 14 * mm : 8 * mm, H = volume > 20 ? 105 * mm : 100 * mm;
  const t = lathe([[0, 0], [R * 0.3, 0], [R, R * 1.8], [R, H], [R * 0.9, H], [R * 0.9, R * 1.8], [R * 0.25, 1 * mm], [0, 1 * mm]], LM.pp(), 32, 'centrifuge tube');
  const capM = mesh(new THREE.CylinderGeometry(R * 1.12, R * 1.12, 12 * mm, 24), LM.enamel(0x3b82f6), { name: 'cap' });
  capM.position.y = H + 6 * mm;
  const liqMat = liquidMaterial(0xfef9c3, 0.45);
  const liq = mesh(new THREE.CylinderGeometry(R * 0.86, R * 0.4, 1, 24), liqMat, { name: 'solution' });
  liq.visible = false;
  liq.scale.y = 1e-5;
  const flakesMat = new THREE.MeshPhysicalMaterial({ color: 0xb45309, roughness: 0.9, transparent: true, opacity: 0 });
  const flakes = mesh(new THREE.ConeGeometry(R * 0.5, R * 1.4, 18), flakesMat, { name: 'Fe(OH)₃ precipitate' });
  flakes.rotation.x = Math.PI; flakes.position.y = R * 0.8;
  group.add(t, capM, liq, flakes);
  return {
    group, parts: [part(group, [0, 0.03, 0], 'Centrifuge tube', 'Fe co-precipitation: Fe(OH)₃ flakes scavenge U and Th; centrifuged 3 × 7 min.')],
    setFill(frac, color) { const h = frac * (H - R * 1.8); liq.visible = h > 0.0005; liq.scale.y = Math.max(h, 1e-5); liq.position.y = R * 1.8 + h / 2 - 2 * mm; if (color != null) liqMat.color.setHex(color); },
    setFlakes(a) { flakesMat.opacity = a; flakesMat.transparent = a < 1; }, height: H,
  };
}

/** Benchtop centrifuge (lid opens on explode). */
export function buildCentrifuge() {
  const group = new THREE.Group();
  const parts = [];
  const body = mesh(roundedBox(0.4, 0.26, 0.45, 0.03), LM.enamel(0xeef0f2), { name: 'centrifuge' });
  body.position.y = 0.13;
  const rotor = new THREE.Group();
  const hub = mesh(new THREE.CylinderGeometry(0.09, 0.09, 0.04, 32), M.aluminium(), { name: 'rotor' });
  rotor.add(hub);
  for (let i = 0; i < 6; i++) {
    const a = (i / 6) * Math.PI * 2;
    const b = mesh(new THREE.CylinderGeometry(0.014, 0.014, 0.06, 16), M.aluminium(), { name: 'bucket' });
    b.position.set(Math.cos(a) * 0.075, 0.01, Math.sin(a) * 0.075);
    rotor.add(b);
  }
  rotor.position.y = 0.27;
  const lid = mesh(roundedBox(0.36, 0.03, 0.36, 0.012), LM.enamel(0x94a3b8), { name: 'lid' });
  lid.position.y = 0.275;
  group.add(body, rotor, lid);
  parts.push(part(lid, [0, 0.14, -0.12], 'Centrifuge lid', '', { order: 0, shell: true, rotate: [-0.9, 0, 0] }));
  parts.push(part(rotor, [0, 0.05, 0], 'Swing-bucket rotor', 'Balanced pairs of tubes (tare to < 0.1 g difference); 2500 rpm for carbonate samples, 3600 rpm for seawater Nalgene bottles (Edwards lab).', { order: 0.2 }));
  return { group, parts, rotor };
}

/** Zircon crystal (prism + pyramids) with internal growth zoning (radiation-damaged high-U zones). */
export function buildZircon({ len = 0.2, w = 0.07 } = {}) {
  const group = new THREE.Group();
  const shape = (s) => {
    const g = new THREE.CylinderGeometry(w * s, w * s, len * s, 4, 1);
    g.rotateY(Math.PI / 4);
    const top = new THREE.ConeGeometry(w * s * 1.0, w * s * 1.1, 4); top.rotateY(Math.PI / 4); top.translate(0, (len * s) / 2 + w * s * 0.55, 0);
    const bot = top.clone(); bot.rotateX(Math.PI);
    return [g, top, bot];
  };
  const zones = [];
  const zoneColors = [0xd9b98a, 0xb8814a, 0xe7cfa6, 0x9a5a2a, 0xf0dcb8];
  [1.0, 0.82, 0.64, 0.46, 0.28].forEach((s, i) => {
    const damaged = i % 2 === 1;
    const mat = new THREE.MeshPhysicalMaterial({ color: zoneColors[i], roughness: damaged ? 0.6 : 0.15, metalness: 0, transparent: true, opacity: i === 0 ? 0.35 : 0.75, clearcoat: damaged ? 0 : 0.9, depthWrite: i !== 0, name: damaged ? 'high-U, radiation-damaged zone' : 'low-U crystalline zone' });
    const z = new THREE.Group();
    for (const g of shape(s)) z.add(mesh(g, mat));
    z.userData.damaged = damaged;
    z.userData.mat = mat;
    group.add(z);
    zones.push(z);
  });
  return { group, zones };
}

/** Simple column rack holding columns above collection beakers. */
export function buildRack({ width = 0.16, height = 0.16, depth = 0.05 } = {}) {
  const group = new THREE.Group();
  const mat = mk('acrylic', () => new THREE.MeshPhysicalMaterial({ color: 0xdbeafe, roughness: 0.08, metalness: 0, transparent: true, opacity: 0.28, clearcoat: 1, depthWrite: false, name: 'acrylic' }));
  const shelf = mesh(roundedBox(width, 0.006, depth, 0.002), mat, { name: 'rack shelf' });
  shelf.position.y = height;
  const base = mesh(roundedBox(width, 0.006, depth, 0.002), mat, { name: 'rack base' });
  base.position.y = 0.003;
  group.add(shelf, base);
  for (const sx of [-1, 1]) {
    const post = mesh(roundedBox(0.006, height, depth * 0.6, 0.002), mat);
    post.position.set((sx * width) / 2, height / 2, 0);
    group.add(post);
  }
  return { group, parts: [part(group, [0, 0, -0.08], 'Column rack', 'Acrylic/PP rack; collection beakers sit underneath each drip tip.', { shell: true })], shelfY: height };
}

/** Retort stand with clamp holding a column (rod behind the column). */
export function buildStand({ height = 0.16, clampY = 0.1 } = {}) {
  const group = new THREE.Group();
  const base = mesh(roundedBox(0.09, 0.008, 0.07, 0.003), LM.enamel(0x374151), { name: 'stand base' });
  base.position.set(0, 0.004, -0.02);
  const rodM = rod(new THREE.Vector3(0, 0.008, -0.035), new THREE.Vector3(0, height, -0.035), 0.0035, M.steelPolished());
  const arm = rod(new THREE.Vector3(0, clampY, -0.035), new THREE.Vector3(0, clampY, -0.006), 0.0022, M.steel());
  const ring = mesh(new THREE.TorusGeometry(0.0055, 0.0012, 8, 24), M.steel(), { name: 'clamp ring' });
  ring.rotation.x = Math.PI / 2; ring.position.set(0, clampY, 0);
  group.add(base, rodM, arm, ring);
  return { group, parts: [part(group, [0, 0, -0.06], 'Column stand & clamp', 'Holds the column vertically above the collection beaker.', { order: 0 })] };
}
