// U–Th chemistry for carbonates (UMN Minnesota Isotope Lab / Edwards lab procedure).
import * as THREE from 'three';
import { Exploder } from '../core/explode.js';
import { section, buttons, readouts, h, para, note, sources, table } from '../core/ui.js';
import { mesh, roundedBox } from '../core/geom.js';
import { registerParts } from '../components/parts.js';
import { buildHotplate, buildBeaker, buildCentrifugeTube, buildCentrifuge, buildDropperBottle, LM } from '../components/labware.js';
import { ColumnStage } from './columnStage.js';
import { protocolById } from '../physics/protocols.js';
import { REFS } from '../physics/refs.js';
import { glowSprite } from '../core/beam.js';

const SRC = (n) => `UMN Edwards lab IMG_00${n}`;
const BENCH = [
  { title: 'Weigh sample into a 30 mL Teflon beaker (Day 1)', src: SRC(64), where: 'beaker',
    text: 'Powders arrive in screw-top glass vials. In the balance room (wipe bench and balance top-to-bottom, left-to-right): tare the labelled 30 mL Teflon beaker, pour in the sample without the vial touching it, weigh, rinse the walls twice with superclean H₂O, recap and swirl. ≈50 mg is a good start for pilot ages; aim for ~4 million counts of ²³⁰Th and ²³⁴U. ~10 samples : 1 blank : 1 replicate.',
    fx: { beaker: [0.15, 0xf5f5f4] } },
  { title: 'Digest: 10 drops 14 N HNO₃, spray 7 N HNO₃', src: SRC(65), where: 'beaker',
    text: 'In a clean fume hood, open each beaker (cap on its side), add 10 drops 14 N HNO₃ to the wall, then spray 7 N HNO₃ to wash down powder — carefully: carbonates effervesce (CO₂).',
    fx: { beaker: [0.35, 0xf0f9ff], bubbles: true } },
  { title: 'Spike (only fully dissolved samples)', src: SRC(65), where: 'beaker', lit: true,
    text: 'Spike aliquots come only from the resident post-doc/lab manager. Use the spike spreadsheet for target spike mass (unknowns: assume 300 ppb U; aim for ²³⁵U/²³³U ≈ 13; blanks < 10 µL). Pipette into a tared clean beaker, weigh, pour ALL into the sample. Radioactive-waste rules apply. (Spike isotopes are not named on these pages; Edwards-lab spikes are ²²⁹Th–²³³U–²³⁶U — Cheng et al. 2013 — literature.)',
    fx: { beaker: [0.38, 0xfda4af], spike: true } },
  { title: 'Dry at 170 °C to a non-moving white gel', src: SRC(65), where: 'beaker',
    text: 'Tap moisture down, dry at 170 °C; do NOT dry to powder (it can pop out of the beaker).',
    fx: { beaker: [0.06, 0xffffff], heat: 1 } },
  { title: 'Fe co-precipitation (Day 2)', src: `${SRC(65)}; ${SRC(66)}`, where: 'tube',
    text: 'Redissolve in just enough 2 N HCl (spray the walls; too much → CaCl₂ saturation problem). Pour into a labelled centrifuge tube; add 1 drop FeCl₂; add 5–20 drops conc. NH₄OH (record the number), swirl (don’t shake): Fe(OH)₃ flakes appear and scavenge U and Th. Do not proceed unless flakes are visible. Wait > 30 min.',
    fx: { tube: [0.6, 0xfef9c3], flakes: 1 } },
  { title: 'Centrifuge 3 × 7 min at 2500 rpm', src: SRC(65), where: 'centrifuge',
    text: 'Balance tubes in pairs (< 0.1 g difference). After each spin pour off the supernatant to waste, add superclean H₂O to ~1/5 of the tube, re-balance and spin again; after the last spin pour off and rack the tubes.',
    fx: { tube: [0.15, 0xdbeafe], flakes: 1, spin: true } },
  { title: 'Dissolve Fe in 14 N HNO₃; dry; take up in 1 CV 7 N HNO₃', src: SRC(66), where: 'beaker',
    text: '10 drops 14 N HNO₃ into each tube; transfer the dissolved Fe back to its beaker; spray the tube walls with 7 N HNO₃ into the beaker. Dry at 170 °C to ~half a drop; 2 drops 14 N HNO₃; if sticky add 1–2 drops H₂O₂, dry completely and repeat; dry to a half-drop + 1 drop 14 N HNO₃; redissolve in 1 CV 7 N HNO₃.',
    fx: { beaker: [0.12, 0xfde68a], tube: [0, 0], flakes: 0, heat: 0.7 } },
  { title: 'Make columns (Day 2–3)', src: `${SRC(66)}; ${SRC(67)}`, where: 'column',
    text: 'Sort columns by size (a CV is the volume of the thin part of the column; drops per CV are posted). Insert frits evenly, round out the reservoir, fill with superclean H₂O with no bubbles (fill upside-down at the tap, flip, fill reservoir), pipette in resin — ~500 µL to start — with only a little excess in the reservoir. Resin type is not stated on these pages (AG1-X8 anion resin per Edwards et al., 1987).',
    fx: { column: true } },
];
const FINAL = [
  { title: 'Final drydown → ICP solution', src: `${SRC(67)}; ${SRC(68)}`, where: 'beaker',
    text: 'Dry until half a drop remains; 2 drops 14 N HNO₃ (H₂O₂ if sticky); once at a half-drop add 1 drop 14 N HNO₃, dry again, spray the walls with ICP solution, warm 1–2 min, then partially dry the ICP solution and transfer to a labelled ICP vial (≤ ¼ full). Optional second Th column for samples run on Faraday cups.',
    fx: { beaker: [0.1, 0xdbeafe], heat: 0.5 } },
];

export default {
  id: 'uth',
  title: 'U–Th (Edwards lab)',
  group: 'Other systems',
  icon: '⊛',
  blurb: 'Carbonate digestion, spike, Fe co-precipitation, AG1-X8 column: Fe → Th (6 N HCl) → U (H₂O)',
  async create(ctx) {
    const { app } = ctx;
    const root = new THREE.Group();
    const ex = new Exploder();
    const bench = mesh(roundedBox(1.1, 0.03, 0.5, 0.008), LM.bench(), { name: 'bench' });
    bench.position.set(-0.25, -0.015, 0);
    root.add(bench);

    const hot = buildHotplate({ w: 0.24, d: 0.22 });
    hot.group.position.set(-0.38, 0, 0.02);
    root.add(hot.group);
    registerParts(ex, hot.parts);
    const beaker = buildBeaker(30, { roundBottom: false, capped: false, name: '30 mL Teflon beaker' });
    beaker.group.position.set(-0.38, hot.topY, 0.02);
    root.add(beaker.group);
    registerParts(ex, beaker.parts, { extra: [0, 0.05, 0] });
    ctx.label(beaker.group, '30 mL Teflon beaker', { offset: [0, beaker.height + 0.02, 0] });
    const hno3 = buildDropperBottle({ liquid: 0xf0f9ff, label: '14 N HNO₃' });
    hno3.group.position.set(-0.48, 0, 0.16);
    root.add(hno3.group);
    registerParts(ex, hno3.parts);

    const tube = buildCentrifugeTube({ volume: 15 });
    tube.group.position.set(-0.2, 0, 0.12);
    root.add(tube.group);
    registerParts(ex, tube.parts);
    ctx.label(tube.group, 'Centrifuge tube', { sub: 'Fe(OH)₃ co-precipitate', offset: [0, tube.height + 0.02, 0] });
    const cen = buildCentrifuge();
    cen.group.position.set(-0.64, 0, -0.08);
    cen.group.scale.setScalar(0.7);
    root.add(cen.group);
    registerParts(ex, cen.parts, { scale: 0.7 });

    const stage = new ColumnStage(ctx, protocolById('uth-edwards'), { exploder: ex, origin: new THREE.Vector3(0.05, 0, 0) });
    root.add(stage.root);

    // CO₂ bubbles
    const bubbles = [];
    for (let i = 0; i < 24; i++) {
      const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowSprite(), color: 0xffffff, transparent: true, opacity: 0.8, depthWrite: false }));
      s.scale.setScalar(0.004);
      s.visible = false;
      s.userData.beam = true;
      root.add(s);
      bubbles.push({ s, t: Math.random() });
    }

    const STEPS = [...BENCH.map((b) => ({ kind: 'bench', ...b })), ...stage.protocol.steps.map((s, i) => ({ kind: 'column', idx: i, title: `Column: ${s.label}`, src: `${SRC(67)} (column chemistry)`, text: s.note ? s.note : '' })), ...FINAL.map((b) => ({ kind: 'bench', ...b }))];
    const st = { i: 0, playing: false, t: 0, bubbles: false, spin: false };

    const card = section('U–Th for carbonates — step by step', { icon: '⊛' });
    const ctl = buttons([
      { label: '⏮', onClick: () => go(st.i - 1) },
      { label: '▶ Play', primary: true, onClick: () => { st.playing = !st.playing; ctl.els[1].textContent = st.playing ? '❚❚ Pause' : '▶ Play'; if (STEPS[st.i].kind === 'column') st.playing ? stage.play() : stage.pause(); } },
      { label: '⏭', onClick: () => go(st.i + 1) },
      { label: '↺', onClick: () => go(0) },
    ]);
    const ro = readouts([{ id: 'step', label: 'Step', wide: true }, { id: 'src', label: 'Source', wide: true }]);
    const text = h('p');
    const list = h('div', { style: 'max-height:250px; overflow:auto' });
    const rows = STEPS.map((s, i) => {
      const r = h('div', { class: 'ro wide', style: 'margin:3px 0; padding:4px 8px; cursor:pointer; font-size:12px' }, h('b', {}, `${i + 1}. `), s.title, s.lit ? h('span', { class: 'tag a' }, 'partly literature') : '');
      r.addEventListener('click', () => go(i));
      list.append(r);
      return r;
    });
    card.body.append(para('Transcribed from “Processing Carbonate Samples for U/Th Isotope Analysis” (Minnesota Isotope Lab; method from River Shen; rev. 02/22/2023 by D. Parmenter & R. L. Edwards).'), ctl.el, ro.el, text, list);

    const holder = h('div');
    holder.append(...stage.buildPanel({ title: 'Column chemistry (Day 3)', intro: 'CV = volume of the thin portion of the column; the model assumes CV ≈ 0.5 mL (≈ the suggested 500 µL resin starting amount).' }));
    stage.listeners.push(() => {
      // follow the stage when it advances on its own
      const cur = STEPS[st.i];
      if (cur.kind === 'column' && stage.player.step !== cur.idx) {
        const j = STEPS.findIndex((s) => s.kind === 'column' && s.idx === stage.player.step);
        if (j >= 0) select(j, false);
      }
      if (cur.kind === 'column' && !stage.player.playing && stage.player.t >= 1 && st.playing && stage.player.step === stage.protocol.steps.length - 1) go(st.i + 1);
    });

    const sw = section('Seawater & hydrothermal fluids (same lab)', { icon: '≈', open: false });
    sw.body.append(table(['Step', 'Seawater / vent fluid (IMG_0069–0071)'], [
      ['Volume', '~500 mL seawater, ~100–300 mL vent fluid (Lost City), Nalgene bottles'],
      ['Spike', 'coral-B (seawater, ~3 ng/g U) or Speleoth-B (fluids); in 7 mL Teflon beaker, pour into sample, shake'],
      ['Equilibrate', '80 °C oven for ~4–7 days'],
      ['Fe co-ppt', '3 drops Fe, ~30 min; ~15 drops NH₄OH; centrifuge 3 × 7 min at 3600 rpm in ≤250 mL bottles (repeat pours for 500 mL)'],
      ['Dissolve', '~7–10 drops 14 N HNO₃; 1–2 drops HClO₄, dry; 1 drop 14 N HNO₃, dry (×2); HClO₄, dry'],
      ['Columns', '5 cm columns; condition 6 N HCl, SC H₂O, 7 N HNO₃; Fe off with 7 N HNO₃; Th with 6 N HCl; U with SC H₂O; ~1 drop HClO₄, dry'],
      ['Second Th column', '0.3–0.5 cc 7 N HNO₃; 4 cm columns; repeat Fe and Th steps'],
      ['Storage', '1 mL vials “U” and “Th”; 14 N HNO₃ dry ×2; ~0.2 mL 1 % HNO₃; make up to ~0.5 mL'],
    ]));
    const refs = section('Sources', { icon: '✓', open: false });
    refs.body.append(sources([REFS.edwards, REFS.edwards87, REFS.shen02, REFS.cheng13]), note('HClO₄ must be used only in a perchloric-rated hood. Spikes are radioactive — follow your radiation-safety rules.', 'warn'));

    function select(i, apply = true) {
      st.i = Math.max(0, Math.min(STEPS.length - 1, i));
      const s = STEPS[st.i];
      ro.step.set(`${st.i + 1} / ${STEPS.length}: ${s.title}`);
      ro.src.set(s.src || '');
      text.innerHTML = s.text || '';
      rows.forEach((r, j) => (r.style.outline = j === st.i ? '2px solid var(--accent)' : ''));
      if (!apply) return;
      const fx = s.fx || {};
      if (fx.beaker) beaker.setFill(fx.beaker[0], fx.beaker[1]);
      if (fx.tube) tube.setFill(fx.tube[0], fx.tube[1]);
      if (fx.flakes != null) tube.setFlakes(fx.flakes);
      hot.setHeat(fx.heat ?? 0);
      st.bubbles = !!fx.bubbles;
      st.spin = !!fx.spin;
      let focus = null;
      if (s.kind === 'column') { stage.goto(s.idx); if (st.playing) stage.play(); focus = stage.root; }
      else { stage.pause(); focus = { beaker: beaker.group, tube: tube.group, centrifuge: cen.group, column: stage.root }[s.where]; }
      if (focus && st.fly) {
        const c = new THREE.Box3().setFromObject(focus).getCenter(new THREE.Vector3());
        const d = s.kind === 'column' || s.where === 'column' ? 0.22 : 0.35;
        app.flyTo([c.x + d * 0.4, c.y + d * 0.6, c.z + d], c.toArray());
      }
      st.t = 0;
    }
    const go = (i) => select(i, true);
    st.fly = false;
    const hp = new URLSearchParams(location.hash.slice(1));
    go(hp.get('step') ? +hp.get('step') - 1 : 0);
    st.fly = true;

    return {
      root, exploder: ex, scale: 0.9,
      camera: { position: [-0.12, 0.55, 0.95], target: [-0.27, 0.06, 0] },
      panel: [card.el, holder, sw.el, refs.el],
      update(dt) {
        stage.update(dt);
        if (st.spin) cen.rotor.rotation.y += dt * 25;
        bubbles.forEach((b) => {
          b.s.visible = st.bubbles && app.state.beams;
          if (!st.bubbles) return;
          b.t += dt * (0.6 + Math.random() * 0.2);
          if (b.t > 1) b.t = 0;
          const p = beaker.group.position;
          const a = (b.t * 37 + bubbles.indexOf(b)) % (Math.PI * 2);
          b.s.position.set(p.x + Math.cos(a) * beaker.radius * 0.5, p.y + 0.004 + b.t * beaker.height * 0.4, p.z + Math.sin(a) * beaker.radius * 0.5);
        });
        const s = STEPS[st.i];
        if (st.playing && s.kind === 'bench') {
          st.t += dt / 6;
          if (st.t >= 1) {
            if (st.i < STEPS.length - 1) go(st.i + 1); else { st.playing = false; ctl.els[1].textContent = '▶ Play'; }
          }
        }
      },
      dispose() { stage.dispose(); },
    };
  },
};
