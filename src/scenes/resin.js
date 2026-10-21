// Resin & partitioning explainer: a resin bead at micro-scale with its functional groups,
// complexes being exchanged, and D/k′ vs acid curves for every resin in the catalogue.
import * as THREE from 'three';
import { Exploder } from '../core/explode.js';
import { Chart } from '../core/chart.js';
import { section, segmented, h, para, table, note, sources } from '../core/ui.js';
import { mesh } from '../core/geom.js';
import { RESINS, DTABLE, ELEMENTS, distribution } from '../physics/resins.js';
import { REFS } from '../physics/refs.js';
import { glowSprite } from '../core/beam.js';

const GROUPS = {
  AG1X8: { site: 'N⁺(CH₃)₃', color: 0x60a5fa, counter: 'Cl⁻', ion: 'PbCl₃⁻ / UO₂Cl₄²⁻', ionColor: 0x3b82f6, charge: '+', text: 'Fixed cationic sites hold mobile Cl⁻ counter-ions. Metals that form anionic chloro-complexes at high Cl⁻ activity displace Cl⁻ and are retained; lowering the HCl molarity (or switching to water) dissociates the complex and releases the metal.' },
  AG50WX8: { site: 'SO₃⁻', color: 0xf97316, counter: 'H⁺', ion: 'Sr²⁺ / Lu³⁺', ionColor: 0x16a34a, charge: '−', text: 'Fixed sulfonate sites exchange H⁺ for metal cations. Higher charge → stronger retention; more acid (more H⁺) → weaker retention. HF complexes Hf, Zr, Ti as neutral/anionic fluorides that are not held.' },
  SR: { site: '18-crown-6', color: 0xa78bfa, counter: 'octanol', ion: 'Sr(NO₃)₂', ionColor: 0x16a34a, charge: '○', text: 'A crown ether dissolved in octanol on an inert support: its cavity matches Sr²⁺ (and Pb²⁺). Sr is extracted as a nitrate ion-pair from 3–8 M HNO₃ and released in dilute HNO₃ or water.' },
  LN: { site: 'HDEHP', color: 0x34d399, counter: 'H⁺', ion: 'Lu³⁺ · Hf⁴⁺', ionColor: 0xef4444, charge: '−', text: 'Di(2-ethylhexyl)phosphoric acid (HDEHP) extracts lanthanides by exchanging its acidic proton; k′ climbs steeply across the series, so Yb can be washed off in 2.5 M HCl while Lu stays. Hf⁴⁺ is held even in 6 M HCl until HF is added.' },
  TRU: { site: 'CMPO/TBP', color: 0x22d3ee, counter: '—', ion: 'Ln(NO₃)₃', ionColor: 0xec4899, charge: '○', text: 'CMPO in TBP: a neutral solvating extractant that takes up trivalent REE (and actinides) from ≥1 M HNO₃; very dilute HNO₃ releases the REE group.' },
  UTEVA: { site: 'DAAP', color: 0xfbbf24, counter: '—', ion: 'UO₂(NO₃)₂', ionColor: 0xf59e0b, charge: '○', text: 'Diamyl amylphosphonate solvates U(VI) and Th(IV) nitrates from HNO₃; Th is stripped in 5 M HCl, U in dilute HCl.' },
  DGA: { site: 'TODGA', color: 0x94a3b8, counter: '—', ion: 'Ca²⁺ / Ln³⁺', ionColor: 0xfacc15, charge: '○', text: 'Tetraoctyl-diglycolamide: very strong extraction of trivalent ions and Ca from HNO₃.' },
  TEVA: { site: 'Aliquat 336', color: 0x818cf8, counter: 'NO₃⁻', ion: 'Th(NO₃)₆²⁻ / ReO₄⁻', ionColor: 0x0ea5e9, charge: '+', text: 'A liquid quaternary-amine anion exchanger on an inert support (like AG1, but extraction-chromatographic).' },
};

export default {
  id: 'resin',
  title: 'Resins & partitioning',
  group: 'Concepts',
  icon: '◍',
  blurb: 'Bead-scale view of exchange sites, chloro-complexes and D / k′ versus acid for each resin',
  async create(ctx) {
    const root = new THREE.Group();
    const ex = new Exploder();
    let resin = 'AG1X8';

    // bead
    const R = 0.1;
    const beadMat = new THREE.MeshPhysicalMaterial({ color: 0xf3e3b5, roughness: 0.55, metalness: 0, transparent: true, opacity: 0.55, clearcoat: 0.4, depthWrite: false });
    const bead = mesh(new THREE.SphereGeometry(R, 64, 48), beadMat, { name: 'resin bead' });
    bead.position.y = 0.16;
    bead.renderOrder = 2;
    root.add(bead);
    // internal polymer network (cross-linked chains)
    const net = new THREE.Group();
    const chainMat = new THREE.LineBasicMaterial({ color: 0x9a7b4f, transparent: true, opacity: 0.45 });
    const rnd = mulberry(4);
    for (let c = 0; c < 70; c++) {
      const pts = [];
      let p = new THREE.Vector3((rnd() - 0.5) * 1.6 * R, (rnd() - 0.5) * 1.6 * R, (rnd() - 0.5) * 1.6 * R);
      for (let k = 0; k < 8; k++) {
        p = p.clone().add(new THREE.Vector3((rnd() - 0.5) * 0.04, (rnd() - 0.5) * 0.04, (rnd() - 0.5) * 0.04));
        if (p.length() > R * 0.95) p.setLength(R * 0.9);
        pts.push(p);
      }
      net.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(pts), chainMat));
    }
    bead.add(net);
    bead.userData.part = { name: 'Resin bead (schematic, ~75 µm → shown ×2000)', info: 'Ion-exchange beads are cross-linked polystyrene–divinylbenzene (8 % DVB in “X8”); extraction-chromatographic resins coat an inert polymer bead with an organic extractant.' };
    ctx.label(bead, 'Resin bead', { sub: 'polystyrene–DVB / inert support', offset: [0, R + 0.02, 0] });

    // exchange sites on the surface
    const siteGeo = new THREE.SphereGeometry(0.0038, 12, 8);
    let sites = null;
    const siteMat = new THREE.MeshPhysicalMaterial({ color: 0x60a5fa, roughness: 0.3, emissive: 0x60a5fa, emissiveIntensity: 0.3 });
    const NS = 180;
    sites = new THREE.InstancedMesh(siteGeo, siteMat, NS);
    const sitePos = [];
    const m4 = new THREE.Matrix4();
    for (let i = 0; i < NS; i++) {
      const v = new THREE.Vector3(rnd() * 2 - 1, rnd() * 2 - 1, rnd() * 2 - 1).normalize().multiplyScalar(R * 1.01);
      sitePos.push(v);
      m4.makeTranslation(v.x, v.y, v.z);
      sites.setMatrixAt(i, m4);
    }
    bead.add(sites);
    sites.userData.part = { name: 'Functional groups', info: '' };

    // ions (counter-ions and analyte complexes) as sprites
    const ions = [];
    const mkIon = (color, size) => {
      const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowSprite(), color, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending }));
      s.scale.setScalar(size);
      root.add(s);
      return s;
    };
    for (let i = 0; i < 40; i++) {
      const site = sitePos[Math.floor(rnd() * NS)];
      ions.push({ s: mkIon(0xffffff, 0.012), site, phase: rnd() * Math.PI * 2, kind: 'counter' });
    }
    for (let i = 0; i < 14; i++) {
      ions.push({ s: mkIon(0x3b82f6, 0.016), site: sitePos[Math.floor(rnd() * NS)], phase: rnd() * 10, kind: 'analyte', from: new THREE.Vector3((rnd() - 0.5) * 0.6, 0.16 + (rnd() - 0.5) * 0.4, (rnd() - 0.5) * 0.6) });
    }

    // a small column in the corner for scale context
    const colG = new THREE.Group();
    const col = mesh(new THREE.CylinderGeometry(0.006, 0.006, 0.12, 24), new THREE.MeshPhysicalMaterial({ color: 0xf3e3b5, roughness: 0.8 }));
    col.position.y = 0.06;
    colG.add(col);
    colG.position.set(0.24, 0, -0.05);
    root.add(colG);
    ctx.label(colG, 'Resin bed', { sub: 'millions of beads', offset: [0, 0.13, 0] });

    // ---------- panel
    const pick = section('Resin', { icon: '◍' });
    const seg = segmented({ options: Object.keys(RESINS).map((k) => ({ value: k, label: RESINS[k].name.replace(' Resin', '').replace(' (Ln-spec)', '').replace(' (Sr-spec)', '') })), value: resin, onChange: (v) => { resin = v; refresh(); } });
    const desc = h('div');
    pick.body.append(seg.el, desc);
    const dCard = section('Distribution vs acid', { icon: '⇅' });
    const medBox = h('div');
    const chart = new Chart(dCard.body, { height: 210, xLabel: 'acid molarity (M)', yLabel: 'D', yLog: true, legendPos: 'tr' });
    dCard.body.prepend(medBox);
    dCard.body.append(note('Illustrative curves, hand-shaped after Kraus & Nelson (1956), Strelow (1960), Faris & Buchanan (1964), Horwitz et al. (1992, 1993), Pin & Zalduegui (1997). Rule of thumb: an element elutes after ≈ (ε + D·ρ)·V<sub>bed</sub> for ion-exchange resins, or (1 + k′)·FCV for extraction resins.', 'warn'));
    let medium = 'HCl';
    const tbl = section('Resin catalogue (particle sizes & chemistry)', { icon: '☰', open: false });
    tbl.body.append(table(['Resin', 'Type / functional group', 'Sizes'], Object.values(RESINS).map((r) => [`<b>${r.name}</b><br><span class="src">${r.maker}</span>`, `${r.type}<br>${r.group}`, r.sizes.join(', ') + `<br><span class="src">${r.sizeNote}</span>`])),
      sources([REFS.bioRad, REFS.eichrom, REFS.krausNelson, REFS.strelow60, REFS.faris64, REFS.horwitz92, REFS.horwitz93, REFS.pin97, REFS.munker01]));

    function refresh() {
      const r = RESINS[resin];
      const g = GROUPS[resin];
      beadMat.color.setHex(r.color);
      siteMat.color.setHex(g.color); siteMat.emissive.setHex(g.color);
      ions.forEach((io) => { if (io.kind === 'analyte') io.s.material.color.setHex(g.ionColor); });
      sites.userData.part = { name: `Functional group: ${g.site}`, info: g.text };
      desc.replaceChildren(
        h('p', { html: `<b>${r.name}</b> — ${r.type}. Matrix: ${r.matrix}. Group: <b>${r.group}</b>. Capacity: ${r.capacity}.` }),
        h('p', { html: g.text }),
        h('p', { class: 'src', html: `Typical retained species: <b>${g.ion}</b> · counter-ion: ${g.counter} · sizes: ${r.sizes.join(', ')}. ${r.verified ? 'Resin data: ' + r.cite : ''}` }),
      );
      const media = Object.keys(DTABLE[resin] || {}).filter((k) => k !== 'H2O' && k !== 'HCit' && k !== 'MLA');
      if (!media.includes(medium)) medium = media[0];
      medBox.replaceChildren(media.length ? segmented({ options: media.map((m) => ({ value: m, label: m.replace('HNO3', 'HNO₃') })), value: medium, onChange: (v) => { medium = v; drawChart(); } }).el : para('No tabulated curves for this resin in this project.'));
      drawChart();
    }
    function drawChart() {
      const r = RESINS[resin];
      const tbl = DTABLE[resin]?.[medium] || {};
      const xs = [];
      for (let m = 0.05; m <= 12.001; m += 0.05) xs.push(+m.toFixed(2));
      chart.setOptions({ yLabel: r.kind === 'ion-exchange' ? 'D (mL g⁻¹)' : 'k′', xLabel: medium === 'HCl-HF' ? 'HF (M ×30) in 6 M HCl' : `${medium.replace('HNO3', 'HNO₃')} (M)` });
      chart.setSeries(Object.keys(tbl).map((e) => ({ name: ELEMENTS[e]?.name ?? e, color: ELEMENTS[e]?.color ?? '#888', x: xs, y: xs.map((m) => distribution(resin, e, medium === 'HCl-HF' ? { acid: medium, M: 6, HF: m / 30 } : { acid: medium, M: m })) })));
    }
    refresh();

    let time = 0;
    return {
      root, exploder: ex, scale: 0.6,
      camera: { position: [0.12, 0.26, 0.42], target: [0.03, 0.15, 0] },
      panel: [pick.el, dCard.el, tbl.el],
      update(dt) {
        time += dt;
        bead.rotation.y += dt * 0.12;
        const wp = new THREE.Vector3();
        ions.forEach((io, i) => {
          wp.copy(io.site).applyMatrix4(bead.matrixWorld);
          if (io.kind === 'counter') {
            const wob = new THREE.Vector3(Math.sin(time * 2 + io.phase), Math.cos(time * 1.7 + io.phase), Math.sin(time * 1.3 + io.phase)).multiplyScalar(0.006);
            io.s.position.copy(wp).addScaledVector(wp.clone().sub(bead.position).normalize(), 0.012).add(wob);
          } else {
            // analyte complexes drift in, bind for a while, leave (dynamic equilibrium)
            const cyc = ((time * 0.18 + io.phase) % 3) / 3; // 0..1
            const out = io.from;
            const bound = wp.clone().addScaledVector(wp.clone().sub(bead.position).normalize(), 0.014);
            const k = cyc < 0.35 ? cyc / 0.35 : cyc < 0.75 ? 1 : 1 - (cyc - 0.75) / 0.25;
            const e = k * k * (3 - 2 * k);
            io.s.position.lerpVectors(out, bound, e);
          }
        });
      },
      dispose() { chart.dispose(); },
    };
  },
};

function mulberry(seed) {
  let a = seed >>> 0;
  return () => { a = (a + 0x6d2b79f5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
}
