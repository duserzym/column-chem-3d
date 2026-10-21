// Chemical abrasion (CA-ID-TIMS) and dissolution of zircon, step by step (guidebook).
import * as THREE from 'three';
import { Exploder } from '../core/explode.js';
import { Chart } from '../core/chart.js';
import { section, buttons, readouts, h, para, note, sources, segmented } from '../core/ui.js';
import { mesh, roundedBox } from '../core/geom.js';
import { registerParts } from '../components/parts.js';
import { buildParrVessel, buildOven, buildFurnace, buildHotplate, buildSonicator, buildBeaker, buildZircon, buildDropperBottle, LM } from '../components/labware.js';
import { REFS } from '../physics/refs.js';

const HF = 0xe0f7fa, HCL = 0xfef3c7, HNO3 = 0xf0f9ff, H2O = 0xdbeafe, SPIKE = 0xfda4af;

// t: duration (h) for the timeline; T: temperature (°C)
const STEPS = [
  { title: 'Anneal zircons', where: 'furnace', T: 900, t: 60, acid: '—', vessel: 'Quartz crucible in muffle furnace', src: 'literature', lit: true,
    text: 'Grains are annealed before chemical abrasion to heal radiation damage in the crystalline domains (Mattinson, 2005). The guidebook refers to the mineral-separation guidebook for the recipe; 800–1100 °C for 36–60 h is typical in the literature (shown: 900 °C, 60 h).',
    fx: { furnace: 1 }, zircon: 'pristine' },
  { title: 'Load grains into hex beakers', where: 'hotplate', T: 20, t: 0.3, acid: '3.5 M HNO₃', vessel: '3 mL round-bottom PFA “hex” beakers',
    text: 'Transfer annealed grains (in ethanol) into labelled 3 mL hex beakers containing 1 mL MQ-H₂O. In the clean lab pipette off the water, rinse twice with 10 drops clean 3.5 M HNO₃, then add 10 drops 3.5 M HNO₃ for loading. (Rutile/titanite: sonicate 15 min in 3.5 M HNO₃ instead of chemical abrasion; phosphates: 0.5 M HNO₃.)',
    fx: { hex: [0.4, HNO3] }, zircon: 'annealed' },
  { title: 'Grain → 300 µL microcapsule; 4 drops 29 M HF', where: 'parr', T: 20, t: 0.5, acid: '29 M HF (4 drops)', vessel: '300 µL Savillex PFA microcapsule',
    text: 'Under the microscope, draw each grain into a gel-loading tip (pipette set ≈7 µL) and eject into its capsule (5 capsules per puck, 3 pucks per vessel = 15). Check the hex beaker to be sure the grain moved. Add 4 drops double-distilled 29 M HF (zircon, titanite, rutile) and cap.',
    fx: { caps: [0.45, HF], explode: 0.75 }, zircon: 'annealed' },
  { title: 'Assemble the Parr vessel (29 M HF moat)', where: 'parr', T: 20, t: 0.3, acid: '7 mL 29 M HF moat', vessel: 'PTFE liner in steel jacket',
    text: 'Pucks on the stem, into the large Teflon liner with 7 mL 29 M HF “moat” acid. Cap, wrap with Parafilm, carry to the oven lab; remove Parafilm, slide into the steel jacket with the bottom plate LOOSE, assemble the cap and tighten the screws with a torque wrench in an alternating star pattern.',
    fx: { caps: [0.45, HF], moat: HF, explode: 0 }, zircon: 'annealed' },
  { title: 'Chemical abrasion: 190 °C, ~12 h', where: 'oven', T: 190, t: 12, acid: '29 M HF', vessel: 'Parr vessel in oven',
    text: '≈12 h at 190 °C dissolves the high-U, radiation-damaged, open-system domains (Pb loss) and leaves the crystalline residue. Some grains need lower T (they dissolve completely) or higher T (persistent Pb loss).',
    fx: { oven: 1, caps: [0.45, HF], explode: 0 }, zircon: 'abraded', animate: true },
  { title: 'Cool, open, decant leachate', where: 'parr', T: 20, t: 1, acid: 'leachate → hex beaker', vessel: 'Parr vessel (opened)',
    text: 'Cool on a metal plate in the fume hood until hand-cool; loosen screws, remove the liner and wipe it. Under laminar flow: rinse cap, remove pucks, empty the moat. Uncap each capsule and dump the contents (grain + leachate) into its hex beaker (already holding 1 mL MQ). Fill each capsule with 6 M HCl and put the pucks on the hot plate to clean.',
    fx: { caps: [0.9, HCL], hex: [0.6, H2O], explode: 0.75 }, zircon: 'abraded' },
  { title: 'Acid-wash residue: 3.5 M HNO₃, sonicate 30 min, 120 °C 30 min', where: 'sonicator', T: 120, t: 1, acid: '10 drops 3.5 M HNO₃', vessel: 'hex beaker',
    text: 'Pipette the grain out, discard the leachate, return the grain and add 10 drops 3.5 M HNO₃. Cap, sonicate 30 min, then 30 min on a 120 °C hot plate. Then empty the 6 M HCl from the microcapsules ready for reloading.',
    fx: { hex: [0.4, HNO3], hotplate: 0.6 }, zircon: 'abraded' },
  { title: 'Rinse 3 × 10 drops MQ-H₂O; back into capsule', where: 'hotplate', T: 20, t: 0.3, acid: 'MQ-H₂O', vessel: 'hex beaker → microcapsule',
    text: 'Three rinses of 10 drops MQ-H₂O (pipetting the grain out and back each time), a final 10 drops, then deliver the grain into its designated microcapsule. Rinse the hex beakers, add 1 mL 3.5 M HNO₃ and flux ≥1 h for the next user.',
    fx: { hex: [0.4, H2O], caps: [0.1, H2O], explode: 0.75 }, zircon: 'abraded' },
  { title: 'Add 4 drops conc. HF', where: 'parr', T: 20, t: 0.1, acid: '29 M HF', vessel: 'microcapsule',
    text: '4 drops distilled concentrated HF, cap, back in the puck — ready for spiking.',
    fx: { caps: [0.45, HF], explode: 0.75 }, zircon: 'abraded' },
  { title: 'Spike: mixed U–Pb tracer, ≈0.01 g', where: 'parr', T: 20, t: 0.3, acid: 'U–Pb spike (2–3 “micro” drops)', vessel: '30 mL spike dropper bottle',
    text: 'Only under the laminar-flow hood: wet wipers to kill static; weigh the capped spike bottle, dispense ~0.01 g (2–3 microdrops) into the open capsule without touching it, reweigh; spike mass by difference — record in notebook and spike log. (The guidebook says “mixed U–Pb spike”; EARTHTIME ET535/ET2535 are common examples — not named in the document.)',
    fx: { caps: [0.5, SPIKE], explode: 0.75, spike: true }, zircon: 'abraded' },
  { title: 'Dissolve: 29 M HF, 220 °C, 48 h', where: 'oven', T: 220, t: 48, acid: '29 M HF + 7 mL HF moat', vessel: 'Parr vessel in oven',
    text: 'Pucks back on the stem with 7 mL 29 M HF moat; jacket assembled as before; 48 h at 220 °C for zircon and titanite (phosphates: dry spike first, dissolve in 4 drops 6 M HCl at 180 °C for 48 h).',
    fx: { oven: 1, caps: [0.5, HF], moat: HF, explode: 0 }, zircon: 'dissolved', animate: true },
  { title: 'Dry down at 120 °C', where: 'hotplate', T: 120, t: 3, acid: '—', vessel: 'microcapsules in pucks',
    text: 'Cool, open, remove pucks; uncap capsules (caps on Parafilm) and dry completely on a 120 °C hot plate.',
    fx: { caps: [0.03, 0xf5f5f4], hotplate: 1, explode: 0.75 }, zircon: 'gone' },
  { title: '6 M HCl, 180 °C overnight (fluorides → chlorides)', where: 'oven', T: 180, t: 16, acid: '4 drops 6 M HCl + 7 mL 6 M HCl moat', vessel: 'Parr vessel in oven',
    text: '4 drops double-distilled 6 M HCl in each capsule; 7 mL 6 M HCl moat; 180 °C overnight (12–24 h) to convert insoluble fluorides to chlorides.',
    fx: { oven: 1, caps: [0.45, HCL], moat: HCL, explode: 0 }, zircon: 'gone' },
  { title: 'Dry; take up in loading acid', where: 'parr', T: 20, t: 0.5, acid: '2 drops 3 M HCl (zircon) / 3 drops 1 M HBr (titanite, phosphate)', vessel: 'microcapsule',
    text: 'Dry at 120 °C, cool a few minutes, add 2 drops 3 M HCl for zircon (or 3 drops 1 M HBr for titanite/phosphates); redissolve ≥30 min before column chemistry → continue in the “U–Pb anion columns” scene.',
    fx: { caps: [0.25, HCL], explode: 0.75 }, zircon: 'gone', next: '#scene=upb' },
];

export default {
  id: 'abrasion',
  title: 'Chemical abrasion & dissolution',
  group: 'U–Pb (focus)',
  icon: '◇',
  blurb: 'Anneal → HF leach in Parr bomb (190 °C) → acid wash → spike → dissolve (220 °C, 48 h)',
  async create(ctx) {
    const { app } = ctx;
    const root = new THREE.Group();
    const ex = new Exploder();
    const bench = mesh(roundedBox(1.5, 0.04, 0.7, 0.01), LM.bench(), { name: 'bench' });
    bench.position.y = -0.02;
    root.add(bench);

    const furnace = buildFurnace();
    furnace.group.position.set(-0.55, 0, -0.05);
    root.add(furnace.group);
    registerParts(ex, furnace.parts, { orderOffset: 0.1 });
    ctx.label(furnace.group, 'Muffle furnace', { sub: 'annealing', offset: [0, 0.4, 0] });

    const hot = buildHotplate();
    hot.group.position.set(-0.18, 0, 0.05);
    root.add(hot.group);
    registerParts(ex, hot.parts);
    const hex = [];
    for (let i = 0; i < 3; i++) {
      const b = buildBeaker(3, { roundBottom: true, capped: true, name: 'hex beaker (3 mL PFA)' });
      b.group.position.set(-0.26 + i * 0.07, hot.topY, 0.08);
      root.add(b.group);
      registerParts(ex, b.parts, { extra: [0, 0, 0] });
      hex.push(b);
    }
    ctx.label(hex[1].group, 'Hex beakers (3 mL)', { offset: [0, 0.06, 0] });

    const son = buildSonicator();
    son.group.position.set(-0.2, 0, -0.2);
    root.add(son.group);
    registerParts(ex, son.parts);

    const parr = buildParrVessel();
    parr.group.position.set(0.12, 0, 0.05);
    root.add(parr.group);
    registerParts(ex, parr.parts, { scale: 1 });
    ctx.label(parr.group, 'Parr-type vessel', { sub: '15 microcapsules', offset: [0, parr.height + 0.03, 0] });

    const oven = buildOven();
    oven.group.position.set(0.5, 0, -0.08);
    root.add(oven.group);
    registerParts(ex, oven.parts);
    ctx.label(oven.group, 'Oven', { sub: '180 / 190 / 220 °C', offset: [0, 0.55, 0] });

    const spike = buildDropperBottle({ liquid: SPIKE, label: 'mixed U–Pb spike' });
    spike.group.position.set(0.28, 0, 0.18);
    root.add(spike.group);
    registerParts(ex, spike.parts);
    ctx.label(spike.group, 'U–Pb spike', { offset: [0, 0.09, 0] });

    // zircon close-up (schematic, hugely magnified)
    const zr = buildZircon({ len: 0.16, w: 0.055 });
    const zg = new THREE.Group();
    zg.add(zr.group);
    zg.position.set(-0.02, 0.42, -0.1);
    zg.rotation.z = 0.35;
    root.add(zg);
    zg.userData.part = { name: 'Zircon (schematic, ~×2000)', info: 'Oscillatory growth zoning: high-U zones (dark) accumulate α-recoil damage, become metamict and lose Pb. HF at 190 °C preferentially dissolves these damaged zones; the remaining crystalline residue yields concordant dates (Mattinson, 2005).' };
    ctx.label(zg, 'Zircon (schematic, ×≈2000)', { offset: [0, 0.16, 0] });
    const zState = { target: 'pristine', damage: 1, scale: 1 };

    // ---------------- panel
    const st = { i: 0, playing: false, t: 0 };
    const card = section('Chemical abrasion & dissolution', { icon: '◇' });
    const ctl = buttons([
      { label: '⏮', onClick: () => go(st.i - 1) },
      { label: '▶ Play', primary: true, onClick: () => { st.playing = !st.playing; ctl.els[1].textContent = st.playing ? '❚❚ Pause' : '▶ Play'; } },
      { label: '⏭', onClick: () => go(st.i + 1) },
      { label: '↺', onClick: () => go(0) },
    ]);
    const ro = readouts([{ id: 'step', label: 'Step', wide: true }, { id: 'T', label: 'Temperature' }, { id: 't', label: 'Duration' }, { id: 'acid', label: 'Acid', wide: true }, { id: 'vessel', label: 'Vessel', wide: true }]);
    const text = h('p');
    const nextLink = h('div');
    card.body.append(para('Steps follow the user’s U-Th-Pb Lab Guidebook (chemical abrasion after Mattinson, 2005). The view explodes/assembles the digestion vessel as the procedure opens and closes it.'), ctl.el, ro.el, text, nextLink);
    const list = h('div', { style: 'max-height:240px; overflow:auto' });
    const rows = STEPS.map((s, i) => {
      const r = h('div', { class: 'ro wide', style: 'margin:3px 0; padding:4px 8px; cursor:pointer; font-size:12px' }, h('b', {}, `${i + 1}. `), s.title, s.lit ? h('span', { class: 'tag a' }, 'literature') : '');
      r.addEventListener('click', () => go(i));
      list.append(r);
      return r;
    });
    card.body.append(list);
    const tl = section('Thermal history of a CA-TIMS zircon', { icon: '♨' });
    const chart = new Chart(tl.body, { height: 170, xLabel: 'cumulative time (h)', yLabel: '°C', yLog: false, yMin: 0 });
    tl.body.append(note('The anneal (≈60 h, 800–1100 °C) dominates the clock; the guidebook steps after it span ~4–5 days including the 48 h dissolution.', ''));
    const xs = [], ys = [];
    let acc = 0;
    STEPS.forEach((s) => { xs.push(acc); ys.push(s.T); acc += s.t; xs.push(acc); ys.push(s.T); });
    const stepStart = (i) => STEPS.slice(0, i).reduce((a, s) => a + s.t, 0);
    const refs = section('Sources', { icon: '✓', open: false });
    refs.body.append(sources([REFS.guidebook, REFS.mattinson05, REFS.krogh73, REFS.gerstenberger97]), note('Always follow your lab’s SOP. Concentrated HF causes deep, delayed burns and systemic toxicity; pressurised PTFE vessels at 220 °C can fail violently.', 'warn'));

    function go(i) {
      st.i = Math.max(0, Math.min(STEPS.length - 1, i));
      st.t = 0;
      const s = STEPS[st.i];
      ro.step.set(`${st.i + 1} / ${STEPS.length}: ${s.title}`);
      ro.T.set(`${s.T} °C`, s.T > 150 ? 'warn' : '');
      ro.t.set(s.t >= 1 ? `${s.t} h` : `${Math.round(s.t * 60)} min`);
      ro.acid.set(s.acid);
      ro.vessel.set(s.vessel);
      text.innerHTML = s.text;
      nextLink.replaceChildren(s.next ? h('a', { class: 'btn primary', href: s.next, style: 'text-decoration:none' }, 'Continue → U–Pb anion columns') : '');
      rows.forEach((r, j) => (r.style.outline = j === st.i ? '2px solid var(--accent)' : ''));
      const fx = s.fx || {};
      furnace.setHeat(fx.furnace ?? 0);
      oven.setHeat(fx.oven ?? 0);
      hot.setHeat(fx.hotplate ?? 0);
      if (fx.caps) parr.capsules.forEach((c) => c.setFill(fx.caps[0], fx.caps[1]));
      if (fx.hex) hex.forEach((b) => b.setFill(fx.hex[0], fx.hex[1]));
      if (fx.moat) parr.setMoat(fx.moat);
      if (fx.explode != null) animateExplode(fx.explode);
      zState.target = s.zircon;
      chart.setSeries([{ name: 'temperature', color: '#ef4444', x: xs, y: ys, width: 2, fill: true }]);
      chart.setMarks([{ x0: stepStart(st.i), x1: stepStart(st.i) + Math.max(0.5, s.t), color: '#3b82f6', alpha: 0.25 }]);
      const cam = { furnace: furnace.group, hotplate: hot.group, sonicator: son.group, parr: parr.group, oven: oven.group }[s.where];
      if (cam && st.flying !== false) {
        const c = new THREE.Box3().setFromObject(cam).getCenter(new THREE.Vector3());
        app.flyTo([c.x + 0.25, c.y + 0.35, c.z + 0.65], [c.x * 0.7, c.y + 0.05, c.z]);
      }
    }
    let exAnim = null;
    function animateExplode(target) {
      const from = app.state.explode, t0 = performance.now();
      exAnim = (now) => { const u = Math.min(1, (now - t0) / 900); app.setExplode(from + (target - from) * u * u * (3 - 2 * u)); if (u >= 1) exAnim = null; };
    }
    st.flying = false;
    const hp = new URLSearchParams(location.hash.slice(1));
    go(hp.get('step') ? +hp.get('step') - 1 : 0);
    st.flying = true;

    return {
      root, exploder: ex, scale: 1.6,
      camera: { position: [0.25, 1.05, 2.05], target: [0, 0.2, 0] },
      panel: [card.el, tl.el, refs.el],
      update(dt) {
        if (exAnim) exAnim(performance.now());
        // zircon state
        const tgt = zState.target;
        const dmgT = tgt === 'pristine' || tgt === 'annealed' ? 1 : 0;
        const scT = tgt === 'dissolved' || tgt === 'gone' ? 0.001 : tgt === 'abraded' ? 0.9 : 1;
        const rate = STEPS[st.i].animate ? 0.6 : 3;
        zState.damage += (dmgT - zState.damage) * Math.min(1, dt * rate);
        zState.scale += (scT - zState.scale) * Math.min(1, dt * rate);
        zr.zones.forEach((z) => {
          if (z.userData.damaged) { z.userData.mat.opacity = 0.75 * zState.damage; z.scale.setScalar(0.85 + 0.15 * zState.damage); }
        });
        zr.zones[0].userData.mat.opacity = 0.35 * zState.scale;
        zr.group.scale.setScalar(Math.max(0.001, zState.scale));
        zg.rotation.y += dt * 0.3;
        if (st.playing) {
          st.t += dt / 6;
          if (st.t >= 1) { if (st.i < STEPS.length - 1) go(st.i + 1); else { st.playing = false; ctl.els[1].textContent = '▶ Play'; } }
        }
      },
      dispose() { chart.dispose(); },
    };
  },
};
