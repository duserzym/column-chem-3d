// Shared column "stage": a column on a rack, a dropper bottle, collection beakers and a
// step player driven by the plate-theory simulation. Used by the U–Pb, systems-atlas and
// U–Th scenes.
import * as THREE from 'three';
import { Exploder } from '../core/explode.js';
import { Chart } from '../core/chart.js';
import { h, section, buttons, readouts, table, note, segmented } from '../core/ui.js';
import { mesh, roundedBox } from '../core/geom.js';
import { registerParts } from '../components/parts.js';
import { buildColumn, buildDropperBottle, buildBeaker, buildStand, liquidColor, LM } from '../components/labware.js';
import { runProtocol } from '../physics/chromatography.js';
import { RESINS, ELEMENTS, DTABLE, distribution, mediumLabel } from '../physics/resins.js';

const mm = 1e-3;
const fmtVol = (v) => (v < 1 ? `${(v * 1000).toFixed(0)} µL` : `${v.toFixed(v < 10 ? 2 : 1)} mL`);

export class ColumnStage {
  constructor(ctx, protocol, { origin = new THREE.Vector3(), exploder = new Exploder(), labelPrefix = '' } = {}) {
    this.ctx = ctx;
    this.root = new THREE.Group();
    this.root.position.copy(origin);
    this.ex = exploder;
    this.labelPrefix = labelPrefix;
    this.player = { step: 0, t: 0, playing: false, speed: 1 };
    this.drops = [];
    this.listeners = [];
    this.setProtocol(protocol);
  }

  // ------------------------------------------------------------------ build
  setProtocol(protocol) {
    this.protocol = protocol;
    this.run = runProtocol(protocol);
    this.colors = protocol.elements.map((e) => ELEMENTS[e]?.color ?? '#999');
    // clear old scene content
    this.ex.removeUnder(this.root);
    for (const c of [...this.root.children]) {
      this.root.remove(c);
      c.traverse((o) => { if (o.isCSS2DObject) o.element.remove(); });
    }
    const R = RESINS[protocol.resin];
    const g = protocol.column;
    // bench slab
    const bench = mesh(roundedBox(0.36, 0.02, 0.22, 0.004), LM.bench(), { name: 'bench' });
    bench.position.y = -0.01;
    this.root.add(bench);
    // rack and column (tip 70 mm above bench so beakers fit underneath)
    const col = buildColumn(g, { resinColor: R.color, plates: this.run.column.N });
    this.col = col;
    const tipY = 0.07;
    const clampY = tipY + col.bedTop + 3 * mm;
    const stand = buildStand({ height: clampY + 0.03, clampY });
    this.root.add(stand.group);
    registerParts(this.ex, stand.parts, { order: 0 });
    col.group.position.set(0, tipY, 0);
    this.root.add(col.group);
    registerParts(this.ex, col.parts, { orderOffset: 0.2, orderScale: 0.6 });
    this.tipWorld = new THREE.Vector3(0, tipY, 0);
    // dropper bottle (reagent of the current step)
    const bottle = buildDropperBottle();
    bottle.group.position.set(0.11, 0, -0.05);
    bottle.group.rotation.y = -0.5;
    this.bottle = bottle;
    this.root.add(bottle.group);
    registerParts(this.ex, bottle.parts, { order: 0.3, extra: [0.03, 0, 0] });
    // collection beakers: one per cut + waste
    const cutKeys = ['waste', ...Object.keys(protocol.collectLabels || {}).filter((k) => k !== 'waste')];
    this.beakers = {};
    cutKeys.forEach((k, i) => {
      const b = buildBeaker(k === 'waste' ? 15 : 7, { roundBottom: k !== 'waste', name: k === 'waste' ? 'waste beaker' : 'Savillex beaker' });
      b.key = k;
      b.home = new THREE.Vector3(-0.07 - i * 0.045, 0, 0.06);
      b.group.position.copy(b.home);
      this.root.add(b.group);
      b.group.userData.part = { name: protocol.collectLabels?.[k] || (k === 'waste' ? 'Waste' : k), info: k === 'waste' ? 'Matrix and unwanted elements.' : `Collection beaker for the ${protocol.collectLabels?.[k] || k} cut.` };
      this.ctx.label(b.group, protocol.collectLabels?.[k] || 'Waste', { offset: [0, b.height + 0.012, 0] });
      this.beakers[k] = b;
    });
    // labels
    this.ctx.label(col.resin, `${R.name}`, { sub: `${fmtVol(protocol.bedVolume)} bed`, offset: [0.012, 0, 0] });
    this.stepLabelObj = new THREE.Object3D();
    this.stepLabelObj.position.set(0, tipY + col.height + 0.012, 0);
    this.root.add(this.stepLabelObj);
    this.stepLabel = this.ctx.label(this.stepLabelObj, '—', { className: 'callout' });
    // drops pool
    this.dropMat = new THREE.MeshPhysicalMaterial({ color: 0xdbeafe, roughness: 0.05, transparent: true, opacity: 0.8, clearcoat: 1 });
    this.dropPool = [];
    for (let i = 0; i < 10; i++) {
      const d = mesh(new THREE.SphereGeometry(1.9 * mm, 12, 8), this.dropMat, { name: 'drop', cast: false });
      d.visible = false;
      d.userData.beam = true; // toggled by the "Flows" button
      this.root.add(d);
      this.dropPool.push({ m: d, v: 0, alive: false });
    }
    this.cumByCut = Object.fromEntries(cutKeys.map((k) => [k, 0]));
    this.player.step = 0; this.player.t = 0;
    this.ex.set(this.ex.t || 0);
    this.applyState(true);
    this.emit();
  }

  on(fn) { this.listeners.push(fn); }
  emit() { for (const f of this.listeners) f(this); }

  // ------------------------------------------------------------------ player
  stepDuration(st) {
    if (!st.med || !(st.vol > 0)) return 1.2;
    return Math.min(9, 2.2 + 1.4 * Math.log10(1 + (st.vol / this.protocol.bedVolume)));
  }
  play() { this.player.playing = true; if (this.player.step >= this.protocol.steps.length - 1 && this.player.t >= 1) this.goto(0); this.emit(); }
  pause() { this.player.playing = false; this.emit(); }
  goto(i, t = 0) { this.player.step = Math.max(0, Math.min(this.protocol.steps.length - 1, i)); this.player.t = t; this.applyState(true); this.emit(); }
  next() { this.goto(this.player.step + 1); }
  prev() { this.goto(this.player.step - 1); }

  /** Interpolated snapshot for (step, t). */
  snapshotAt(step, t) {
    const snaps = this.run.snaps;
    let best = null;
    for (const s of snaps) {
      if (s.step < step || (s.step === step && s.frac <= t + 1e-9)) best = s;
      else break;
    }
    return best;
  }

  applyState(rebuildLevels = false) {
    const { step, t } = this.player;
    const st = this.protocol.steps[step];
    const snap = this.snapshotAt(step, st?.med ? t : 1);
    this.col.drawBands(snap?.profile ?? null, this.colors, this.run.input);
    const resFrac = st?.med ? Math.min(1, st.vol / this.protocol.column.reservoir_mL) * (1 - t) : 0;
    this.col.setLiquid(resFrac, st?.med);
    this.bottle.setLiquid(liquidColor(st?.med));
    // beaker under the tip
    const key = st?.collect || 'waste';
    for (const [k, b] of Object.entries(this.beakers)) {
      const target = k === key && st?.med ? new THREE.Vector3(0, 0, 0) : b.home;
      b.target = target;
    }
    // fill levels: volume collected so far per cut
    if (rebuildLevels) {
      const vol = Object.fromEntries(Object.keys(this.beakers).map((k) => [k, 0]));
      this.protocol.steps.forEach((s, i) => {
        if (!s.med) return;
        const f = i < step ? 1 : i === step ? t : 0;
        const k = s.collect || 'waste';
        if (vol[k] != null) vol[k] += s.vol * f;
      });
      this.cumByCut = vol;
    }
    for (const [k, b] of Object.entries(this.beakers)) {
      const cap = k === 'waste' ? 15 : 7;
      b.setFill(Math.min(0.95, 0.04 + this.cumByCut[k] / (cap * 0.25)), k === 'waste' ? 0xe2e8f0 : 0xfef3c7);
    }
    const lbl = st ? `${step + 1}/${this.protocol.steps.length} · ${st.label}${st.med ? ' — ' + fmtVol(st.vol) + ' ' + mediumLabel(st.med) : ''}` : '';
    this.stepLabel.element.innerHTML = lbl;
  }

  update(dt) {
    const p = this.player;
    const st = this.protocol.steps[p.step];
    if (p.playing && st) {
      p.t += (dt * p.speed) / this.stepDuration(st);
      if (p.t >= 1) {
        if (p.step < this.protocol.steps.length - 1) { p.step++; p.t = 0; this.emit(); }
        else { p.t = 1; p.playing = false; this.emit(); }
      }
      // accumulate fill
      if (st.med) {
        const k = st.collect || 'waste';
        this.cumByCut[k] = (this.cumByCut[k] || 0) + (st.vol * dt * p.speed) / this.stepDuration(st);
      }
      this.applyState(false);
      this.onTick && this.onTick(this);
      // spawn drops while liquid is flowing
      if (st.med && Math.random() < dt * 5 * p.speed) this.spawnDrop(st.med);
    }
    // beakers glide to targets
    for (const b of Object.values(this.beakers)) {
      if (b.target) b.group.position.lerp(b.target, Math.min(1, dt * 4));
    }
    // drops fall
    for (const d of this.dropPool) {
      if (!d.alive) continue;
      d.v += 1.2 * dt; // slowed gravity for readability
      d.m.position.y -= d.v * dt;
      if (d.m.position.y < 0.012) { d.alive = false; d.m.visible = false; }
    }
  }

  spawnDrop(med) {
    const d = this.dropPool.find((x) => !x.alive);
    if (!d) return;
    d.alive = true; d.v = 0.02;
    d.m.visible = this.ctx.app.state.beams;
    d.m.position.copy(this.tipWorld).add(new THREE.Vector3(0, -0.002, 0));
    this.dropMat.color.setHex(liquidColor(med));
  }

  // ------------------------------------------------------------------ panel
  buildPanel({ title = 'Column chemistry', intro = '' } = {}) {
    const P = this.protocol;
    const cards = [];
    const main = section(title, { icon: '⫼' });
    this.playerBtns = buttons([
      { label: '⏮', title: 'Previous step', onClick: () => this.prev() },
      { label: '▶ Play', primary: true, onClick: () => (this.player.playing ? this.pause() : this.play()) },
      { label: '⏭', title: 'Next step', onClick: () => this.next() },
      { label: '↺', title: 'Restart', onClick: () => this.goto(0) },
    ]);
    const speed = segmented({ options: [{ value: 0.5, label: '½×' }, { value: 1, label: '1×' }, { value: 2, label: '2×' }, { value: 4, label: '4×' }], value: 1, onChange: (v) => (this.player.speed = v) });
    this.ro = readouts([
      { id: 'step', label: 'Step', wide: true }, { id: 'med', label: 'Medium' }, { id: 'vol', label: 'Volume (drops)' },
      { id: 'cut', label: 'Collect into' }, { id: 'src', label: 'Source' },
    ]);
    main.body.append(intro ? h('p', { html: intro }) : '', this.playerBtns.el, speed.el, this.ro.el);
    this.stepList = h('div', { style: 'max-height: 260px; overflow:auto; margin-top:6px' });
    main.body.append(this.stepList);
    cards.push(main.el);

    const chartCard = section('Elution (plate model)', { icon: '∿' });
    this.curveChart = new Chart(chartCard.body, { height: 190, xLabel: 'volume through column (mL)', yLabel: 'relative concentration', yMin: 0, yMax: 1.08, legendPos: 'tr' });
    this.recBox = h('div');
    chartCard.body.append(this.recBox, note(`Plate model with ${this.run.column.N} theoretical plates; FCV = ε·V<sub>bed</sub> = ${fmtVol(this.run.column.fcv)}. Distribution coefficients are illustrative (shapes after Kraus & Nelson, Strelow, Faris & Buchanan, Horwitz) — they reproduce the logic of the procedure, not exact yields.`, 'warn'));
    cards.push(chartCard.el);

    const dCard = section(`Partitioning on ${RESINS[P.resin].name}`, { icon: '⇅', open: false });
    const media = Object.keys(DTABLE[P.resin] || {}).filter((k) => k !== 'H2O');
    this.dMedium = media.includes('HCl') ? 'HCl' : media[0];
    const medSeg = segmented({ options: media.map((m) => ({ value: m, label: m.replace('HNO3', 'HNO₃') })), value: this.dMedium, onChange: (v) => { this.dMedium = v; this.drawD(); } });
    this.dChart = new Chart(dCard.body, { height: 180, xLabel: 'acid molarity (M)', yLabel: RESINS[P.resin].kind === 'ion-exchange' ? 'D (mL/g)' : 'k′', yLog: true, legendPos: 'tr' });
    dCard.body.prepend(medSeg.el);
    dCard.body.append(h('p', { class: 'src', html: `<b>${RESINS[P.resin].name}</b>: ${RESINS[P.resin].group}. ${RESINS[P.resin].mechanism}` }));
    cards.push(dCard.el);

    this.charts = [this.curveChart, this.dChart];
    this.fillStepList();
    this.drawCurve();
    this.drawD();
    this.drawRecovery();
    this.on(() => this.refreshPanel());
    this.onTick = () => this.refreshPanel(true);
    this.refreshPanel();
    return cards;
  }

  fillStepList() {
    const P = this.protocol;
    this.stepRows = P.steps.map((s, i) => {
      const row = h('div', { class: 'ro wide', style: 'margin:3px 0; padding:4px 8px; cursor:pointer; display:flex; gap:8px; align-items:baseline' },
        h('b', { style: 'min-width:20px' }, String(i + 1)),
        h('span', { style: 'flex:1; font-size:12px', html: `${s.label}${s.med ? ` — <span style="font-family:var(--mono)">${fmtVol(s.vol)}${s.drops ? ` (${s.drops} drops)` : ''}</span> ${mediumLabel(s.med)}` : ''}${s.uncertain ? ' <span class="tag a">uncertain</span>' : ''}` }),
        h('span', { class: 'tag' + (s.collect && s.collect !== 'waste' ? ' v' : ''), html: P.collectLabels?.[s.collect || 'waste'] ?? (s.collect || 'waste') }));
      row.addEventListener('click', () => this.goto(i));
      this.stepList.append(row);
      return row;
    });
  }

  refreshPanel(light = false) {
    const P = this.protocol, p = this.player, s = P.steps[p.step];
    if (!this.ro) return;
    this.playerBtns.els[1].textContent = p.playing ? '❚❚ Pause' : '▶ Play';
    this.ro.step.set(`${p.step + 1} / ${P.steps.length}: ${s.label}`);
    this.ro.med.set(s.med ? mediumLabel(s.med) : '—');
    this.ro.vol.set(s.med ? `${fmtVol(s.vol)}${s.drops ? ` (${s.drops})` : ''}` : '—');
    this.ro.cut.set(P.collectLabels?.[s.collect || 'waste'] ?? s.collect ?? 'waste', s.collect && s.collect !== 'waste' ? 'good' : '');
    this.ro.src.set(s.source || (P.source.split(';')[0]));
    if (!light) this.stepRows.forEach((r, i) => { r.style.outline = i === p.step ? '2px solid var(--accent)' : ''; });
    this.drawCurveMark();
  }

  drawCurve() {
    const r = this.run, P = this.protocol;
    const series = P.elements.map((e, i) => {
      const c = r.curve.conc[i];
      const mx = Math.max(...c, 1e-30);
      return { name: ELEMENTS[e]?.name ?? e, color: this.colors[i], x: r.curve.vol, y: c.map((v) => v / mx), width: 1.6 };
    }).filter((s, i) => r.input[i] > 0);
    this.curveSeries = series;
    // collected cuts shaded
    this.cutMarks = [];
    r.steps.forEach((s) => {
      if (s.collect && s.collect !== 'waste' && s.med) this.cutMarks.push({ x0: s.v0, x1: s.v1, color: '#10b981', alpha: 0.1 });
    });
    this.curveChart.setSeries(series);
    this.drawCurveMark();
  }
  drawCurveMark() {
    const r = this.run, p = this.player;
    const s = r.steps[p.step];
    const v = s ? s.v0 + (s.v1 - s.v0) * (s.med ? p.t : 1) : 0;
    this.curveChart?.setMarks([...this.cutMarks, { x: v, color: '#ef4444', dash: [3, 3], label: 'now' }]);
  }

  drawD() {
    const P = this.protocol;
    const med = this.dMedium;
    const xs = [];
    for (let m = 0.05; m <= 12.001; m += 0.05) xs.push(+m.toFixed(2));
    const kind = RESINS[P.resin].kind;
    const series = P.elements.filter((e) => DTABLE[P.resin]?.[med]?.[e]).map((e) => ({
      name: ELEMENTS[e]?.name ?? e, color: ELEMENTS[e]?.color ?? '#888', x: xs,
      y: xs.map((m) => distribution(P.resin, e, med === 'HCl-HF' ? { acid: med, M: 6, HF: m / 30 } : { acid: med, M: m })),
    }));
    this.dChart.setOptions({ yLabel: kind === 'ion-exchange' ? 'D (mL g⁻¹)' : 'k′', xLabel: med === 'HCl-HF' ? 'HF (M ×30) in 6 M HCl' : 'acid molarity (M)' });
    this.dChart.setSeries(series);
  }

  drawRecovery() {
    const r = this.run, P = this.protocol;
    const cuts = Object.keys(r.recovery);
    const rows = P.elements.map((e, i) => [
      `<span style="color:${this.colors[i]}">■</span> ${ELEMENTS[e]?.name ?? e}`,
      ...cuts.map((k) => { const v = r.recovery[k][i]; return v > 0.005 ? `${(v * 100).toFixed(0)} %` : '—'; }),
      r.input[i] > 0 && r.retained[i] / r.input[i] > 0.005 ? `${((r.retained[i] / r.input[i]) * 100).toFixed(0)} %` : '—',
    ]);
    this.recBox.replaceChildren(h('h4', {}, 'Where each element ends up (model)'),
      table(['Element', ...cuts.map((k) => P.collectLabels?.[k] ?? k), 'Left on resin'], rows, { numCols: cuts.map((_, i) => i + 1).concat([cuts.length + 1]) }));
  }

  dispose() { this.charts?.forEach((c) => c.dispose()); }
}
